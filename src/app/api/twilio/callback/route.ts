import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { processVoiceReport } from '@/ai/flows/process-voice-report';

/**
 * Optimized Resolution Estimator (Deterministic).
 */
function calculateResolutionDays(priority: 'Low' | 'Medium' | 'High', pendingCount: number) {
  let baseline = priority === 'High' ? 3 : priority === 'Medium' ? 7 : 14;
  let adjustment = Math.floor(pendingCount / 10);
  if (priority === 'High') adjustment = Math.floor(adjustment / 2);
  return baseline + adjustment;
}

/**
 * Twilio Multimodal Recording Callback.
 * Uses Gemini 2.5 Flash for direct acoustic analysis and archives audio to Storage.
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dtmfPincode = searchParams.get('pincode');
    
    const formData = await req.formData();
    const rawRecordingUrl = formData.get('RecordingUrl') as string;
    const fromNumber = (formData.get('From') as string) || 'unknown';

    if (!rawRecordingUrl) {
      throw new Error("No signal detected.");
    }

    // 1. Signal Stabilization: Wait for Twilio to finalize the WAV file
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. Multimodal Data Preparation
    const audioUrl = rawRecordingUrl.startsWith('http') ? `${rawRecordingUrl}.wav` : `https://${rawRecordingUrl}.wav`;
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) throw new Error(`Acoustic Signal Fetch Failure: ${audioResponse.statusText}`);

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioDataUri = `data:audio/wav;base64,${Buffer.from(audioBuffer).toString('base64')}`;

    // 3. Parallel Dispatch (Neural Analysis + State Discovery)
    const pendingQuery = query(collection(db, 'tickets'), where("status", "in", ["Submitted", "In Progress"]));
    const userQuery = query(collection(db, 'users'), where('phoneNumber', '==', fromNumber));

    let analysis = null;
    let pendingCount = 0;
    let userExists = false;
    let existingUserId = "";

    try {
      // Execute heavy IO and neural inference in parallel
      const [pendingSnapshot, userSnapshot, aiResult] = await Promise.all([
        getDocs(pendingQuery),
        getDocs(userQuery),
        processVoiceReport({ audioDataUri }).catch(err => {
          console.error('[Neural] Signal Processing Failure:', err);
          return null; 
        })
      ]);
      
      analysis = aiResult;
      pendingCount = pendingSnapshot.size;
      if (!userSnapshot.empty) {
        userExists = true;
        existingUserId = userSnapshot.docs[0].id;
      }
    } catch (err) {
      console.error('[System] Parallel Discovery Failure:', err);
    }

    // 4. Data Recovery & Triage
    const finalPriority = analysis?.priority || "Medium";
    const resolutionDays = calculateResolutionDays(finalPriority, pendingCount);
    const estimatedResolutionDate = new Date();
    estimatedResolutionDate.setDate(estimatedResolutionDate.getDate() + resolutionDays);

    const finalPincode = (dtmfPincode && dtmfPincode !== "unknown") ? dtmfPincode : (analysis?.pincode || "000000");
    const userId = userExists ? existingUserId : `voice_${fromNumber.replace(/\+/g, '')}`;
    const userPhotoURL = `https://picsum.photos/seed/${userId}/200`;
    
    // 5. High-Fidelity Archival
    const ticketRef = doc(collection(db, "tickets"));
    let finalAudioStorageUrl = "";
    
    try {
      const audioRef = storageRef(storage, `voice_reports/${ticketRef.id}.wav`);
      const uploadResult = await uploadBytes(audioRef, new Uint8Array(audioBuffer), {
        contentType: 'audio/wav',
      });
      finalAudioStorageUrl = await getDownloadURL(uploadResult.ref);
    } catch (err) {
      console.error('[Archival] Signal Storage Failure:', err);
    }

    // 6. Atomic Synchronization
    const userProfileRef = doc(db, 'users', userId);

    await runTransaction(db, async (transaction) => {
      // Identity Sync
      if (!userExists) {
        transaction.set(userProfileRef, {
          id: userId,
          phoneNumber: fromNumber,
          displayName: `Voice Node ${fromNumber.slice(-4)}`,
          photoURL: userPhotoURL,
          utilityPoints: 0,
          trustPoints: 100,
          reportCount: 0,
          joinedDate: serverTimestamp(),
          badges: ['voice-reporter'],
        }, { merge: true });
      }

      // Incident Sync (Ensuring data is logged even if AI fails partially)
      transaction.set(ticketRef, {
        id: ticketRef.id,
        userId: userId,
        userPhotoURL: userPhotoURL,
        title: analysis?.title || "Voice Signal Log",
        category: analysis?.category || "Other",
        notes: analysis?.transcription || "Audio recording received. Processing transcript...",
        audioTranscription: analysis?.transcription || "",
        audioUrl: finalAudioStorageUrl, // Store archived signal URL
        imageUrls: [], 
        location: null,
        address: analysis?.address || "Location extracted from audio signal",
        pincode: finalPincode,
        status: 'Submitted',
        priority: finalPriority,
        estimatedResolutionDate,
        severityScore: analysis?.severityScore || 5,
        severityReasoning: analysis?.reasoning || "Automatic triage based on signal frequency.",
        reportCount: 1,
        reportedBy: [userId],
        submittedDate: serverTimestamp(),
        isVoiceReport: true,
        callerNumber: fromNumber,
        isPublicFeed: true,
        likes: [],
        comments: [],
      });
      
      // Points Allocation
      transaction.update(userProfileRef, {
        utilityPoints: increment(analysis?.severityScore || 5),
        reportCount: increment(1)
      });
    });

    const successTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Amy">Signal synchronized. Report for grid ${finalPincode} is now live. Resolution estimated in ${resolutionDays} days. Goodbye.</Say></Response>`;

    return new NextResponse(successTwiml.trim(), {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('[Telephony] Critical Error:', error);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Amy">Signal interference detected. Your broadcast could not be synchronized with the community grid.</Say></Response>`;
    return new NextResponse(errorTwiml.trim(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
