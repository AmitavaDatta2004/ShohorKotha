

"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from "next/image";
import { Camera, MapPin, Loader2, PartyPopper, Upload, LocateFixed, Pin, ImagePlus, BrainCircuit, Star, FileText, Calendar, Edit, ShieldAlert, Mic, StopCircle, Waves, X } from "lucide-react";
import { collection, addDoc, serverTimestamp, GeoPoint, writeBatch, doc, runTransaction, query, where, getDocs, arrayUnion, getDoc, increment } from "firebase/firestore"; 
import { ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import dynamic from 'next/dynamic';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { analyzeImageSeverity } from "@/ai/flows/analyze-image-severity";
import { determineIssuePriority } from "@/ai/flows/determine-issue-priority";
import { generateIssueTitle } from "@/ai/flows/generate-issue-title";
import { transcribeAudio } from "@/ai/flows/transcribe-audio";
import { estimateResolutionTime } from "@/ai/flows/estimate-resolution-time";
import type { Ticket, UserProfile } from "@/types";
import { Skeleton } from "./ui/skeleton";
import CameraModal from "./camera-modal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { allBadges } from "@/lib/badges.tsx";

const LocationPickerMap = dynamic(() => import('@/components/location-picker-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
});


const issueCategories = [
  "Pothole",
  "Graffiti",
  "Waste Management",
  "Broken Streetlight",
  "Safety Hazard",
  "Tree Maintenance",
  "Animal Control",
  "Traffic & Signals",
  "Other",
];

const formSchema = z.object({
  category: z.string({ required_error: "Please select a category." }),
  notes: z.string().optional(),
}).refine(data => {
    // This will be checked manually along with audio state
    return true;
});

interface ReportIssueFormProps {
    onIssueSubmitted: (ticket: Ticket) => void;
}

type AnalysisResult = {
    title: string;
    priority: "Low" | "Medium" | "High";
    severityScore: number;
    severityReasoning: string;
    audioTranscription?: string;
};

const priorityVariantMap: Record<Ticket['priority'], "destructive" | "secondary" | "default"> = {
  High: 'destructive',
  Medium: 'secondary',
  Low: 'default',
};

export default function ReportIssueForm({ onIssueSubmitted }: ReportIssueFormProps) {
  const { user } = useAuth();
  const [photoDataUris, setPhotoDataUris] = React.useState<string[]>([]);
  const [location, setLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = React.useState("Fetching location...");
  const [locationType, setLocationType] = React.useState<"current" | "manual">("current");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [newTicketId, setNewTicketId] = React.useState("");
  const { toast } = useToast();
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = React.useState(false);

  const [formStep, setFormStep] = React.useState<'form' | 'preview'>('form');
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  
  // Audio recording state
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioDataUri, setAudioDataUri] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
    },
  });
  
  const fetchAddress = React.useCallback(async (lat: number, lng: number) => {
    setAddress("Fetching address...");
    try {
        const response = await fetch(`/api/geocode?lat=${lat}&lon=${lng}`);
        const data = await response.json();
        if (data.address) {
            setAddress(data.address);
        } else {
            setAddress("Address not found.");
        }
    } catch (error) {
        console.error("Error fetching address:", error);
        setAddress("Could not fetch address.");
    }
  }, []);

  const handleLocationSelect = React.useCallback((latlng: { lat: number; lng: number }) => {
      setLocation(latlng);
      fetchAddress(latlng.lat, latlng.lng);
  }, [fetchAddress]);


  const getCurrentLocation = React.useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userLocation = { lat: latitude, lng: longitude };
          setCurrentUserLocation(userLocation);
          if (locationType === 'current') {
            setLocation(userLocation);
            fetchAddress(latitude, longitude);
          }
        },
        () => {
          setAddress("Unable to retrieve location. Please grant permission.");
          toast({ variant: 'destructive', title: 'Location Error', description: 'Could not retrieve location.' });
        }
      );
    } else {
      setAddress("Geolocation is not supported by your browser.");
    }
  }, [locationType, fetchAddress, toast]);


  React.useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]); 

  React.useEffect(() => {
    if (locationType === 'current' && currentUserLocation) {
        setLocation(currentUserLocation);
        fetchAddress(currentUserLocation.lat, currentUserLocation.lng);
    } else if (locationType === 'manual') {
        setLocation(null); 
        setAddress("Select a location on the map.");
    }
  }, [locationType, currentUserLocation, fetchAddress]);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        const currentCount = photoDataUris.length;
        const remainingSlots = 5 - currentCount;
        if (files.length > remainingSlots) {
            toast({
                variant: 'destructive',
                title: 'Too many images',
                description: `You can only upload ${remainingSlots} more images.`,
            });
        }

        const newFiles = Array.from(files).slice(0, remainingSlots);

        newFiles.forEach(file => {
             const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoDataUris(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    }
  };

  const removePhoto = (index: number) => {
    setPhotoDataUris(prev => prev.filter((_, i) => i !== index));
  };


  const handleStartRecording = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          const chunks: Blob[] = [];

          mediaRecorderRef.current.ondataavailable = (e) => {
            chunks.push(e.data);
          };

          mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            setAudioBlob(blob);
            const reader = new FileReader();
            reader.onload = (e) => {
                setAudioDataUri(e.target?.result as string);
            };
            reader.readAsDataURL(blob);
          };

          mediaRecorderRef.current.start();
          setIsRecording(true);
        } catch (err) {
          console.error('Error accessing microphone:', err);
          toast({ variant: 'destructive', title: 'Microphone Error', description: 'Could not access the microphone.' });
        }
      }
  };

  const handleStopRecording = () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
  };

  async function handleAnalyze(values: z.infer<typeof formSchema>) {
    if (!values.notes && !audioBlob) {
        form.setError("notes", { type: "manual", message: "Please provide either written notes or an audio recording." });
        return;
    }
    if (!location || !user || photoDataUris.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "At least one photo and a location are required to analyze an issue.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Analyze Image
      const { isRelevant, rejectionReason, severityScore, reasoning } = await analyzeImageSeverity({ photoDataUris });
      
      if (!isRelevant) {
        await runTransaction(db, async (transaction) => {
            const userProfileRef = doc(db, 'users', user.uid);
            const userProfileDoc = await transaction.get(userProfileRef);
            let currentTrust = 100;
            if (userProfileDoc.exists()) {
                currentTrust = userProfileDoc.data().trustPoints || 100;
            }
            
            const newTrustPoints = Math.max(0, currentTrust - 5);

            if (userProfileDoc.exists()) {
                transaction.update(userProfileRef, { trustPoints: newTrustPoints });
            } else {
                 transaction.set(userProfileRef, {
                    id: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    utilityPoints: 0,
                    trustPoints: newTrustPoints,
                    reportCount: 0,
                    joinedDate: serverTimestamp(),
                    badges: [],
                });
            }
        });

        toast({
            variant: "destructive",
            title: "Warning: Report Rejected",
            description: `Your submission was rejected as irrelevant. Your trust score has been reduced by 5 points. Reason: ${rejectionReason}`,
            duration: 7000
        });
        setIsLoading(false);
        return;
      }
      
      if (severityScore === undefined || reasoning === undefined) {
         toast({ variant: "destructive", title: "Analysis Error", description: "Could not determine severity. Please try again." });
         setIsLoading(false);
         return;
      }

      // 2. Transcribe Audio (if present)
      let audioTranscription: string | undefined;
      if (audioDataUri) {
          const { transcription } = await transcribeAudio({ audioDataUri });
          audioTranscription = transcription;
      }

      // 3. Determine Priority
      const { priorityLevel } = await determineIssuePriority({
        imageAnalysisScore: severityScore,
        category: values.category,
        notes: values.notes,
        audioTranscription,
      });

      // 4. Generate Title
      const { title } = await generateIssueTitle({
        category: values.category,
        notes: values.notes,
        audioTranscription,
        severityReasoning: reasoning,
      });
      
      setAnalysisResult({ title, priority: priorityLevel, severityScore, severityReasoning: reasoning, audioTranscription });
      setFormStep('preview');

    } catch (error) {
      console.error("Error during analysis: ", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "There was an error analyzing your report. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFinalSubmit() {
    if (!location || !user || !analysisResult || photoDataUris.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Missing data to submit.' });
        return;
    }

    setIsLoading(true);
    try {
        const values = form.getValues();
        
        await runTransaction(db, async (transaction) => {
            const userProfileRef = doc(db, 'users', user.uid);
            const userProfileDoc = await transaction.get(userProfileRef);

            const newBadges: string[] = [];
            let currentReportCount = 0;
            let currentTrustPoints = 100;
            let userBadges: string[] = [];

            if (!userProfileDoc.exists()) {
                // This is a brand new user
                transaction.set(userProfileRef, {
                    id: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    utilityPoints: 0,
                    trustPoints: 100,
                    reportCount: 0,
                    joinedDate: serverTimestamp(),
                    badges: [],
                });
            } else {
                const data = userProfileDoc.data();
                currentReportCount = data.reportCount || 0;
                currentTrustPoints = data.trustPoints || 100;
                userBadges = data.badges || [];
            }

            const updatedReportCount = currentReportCount + 1;

            // Badge Unlocking Logic
            const reporterBadges = [
                { count: 1, id: 'reporter-1' },
                { count: 10, id: 'reporter-10' },
                { count: 50, id: 'reporter-50' },
                { count: 100, id: 'reporter-100' },
            ];
            
            reporterBadges.forEach(badge => {
                if (updatedReportCount >= badge.count && !userBadges.includes(badge.id)) {
                    newBadges.push(badge.id);
                }
            });
            
            // Special category-based badges
            if (values.category === 'Pothole') {
                const potholeQuery = query(collection(db, 'tickets'), where("userId", "==", user.uid), where("category", "==", "Pothole"));
                const potholeSnapshot = await getDocs(potholeQuery);
                if (potholeSnapshot.size === 2 && !userBadges.includes('pothole-pro')) newBadges.push('pothole-pro');
            }

            if (values.category === 'Broken Streetlight') {
                const streetlightQuery = query(collection(db, 'tickets'), where("userId", "==", user.uid), where("category", "==", "Broken Streetlight"));
                const streetlightSnapshot = await getDocs(streetlightQuery);
                if (streetlightSnapshot.size === 4 && !userBadges.includes('street-guardian')) newBadges.push('street-guardian');
            }
            
            // Severity badge
            if (analysisResult.severityScore >= 8 && !userBadges.includes('sharp-eye')) {
                newBadges.push('sharp-eye');
            }

            const pendingTicketsQuery = query(collection(db, 'tickets'), where("status", "in", ["Submitted", "In Progress"]));
            const pendingTicketsSnapshot = await getDocs(pendingTicketsQuery);
            const pendingTicketsCount = pendingTicketsSnapshot.size;

            const { resolutionDays } = await estimateResolutionTime({
              priority: analysisResult.priority,
              pendingTicketsCount: pendingTicketsCount
            });
            
            const ticketCollection = collection(db, "tickets");
            const ticketRef = doc(ticketCollection);
            const ticketId = ticketRef.id;

            const imageUrls = await Promise.all(
              photoDataUris.map(async (uri, index) => {
                const imageRef = storageRef(storage, `tickets/${ticketId}_${index}.jpg`);
                await uploadString(imageRef, uri, 'data_url');
                return getDownloadURL(imageRef);
              })
            );

            const estimatedResolutionDate = new Date();
            estimatedResolutionDate.setDate(estimatedResolutionDate.getDate() + resolutionDays);
            
            const ticketData: Omit<Ticket, 'id' | 'submittedDate'> = {
                userId: user.uid,
                title: analysisResult.title,
                category: values.category,
                notes: values.notes || '',
                audioTranscription: analysisResult.audioTranscription || '',
                imageUrls: imageUrls,
                location: new GeoPoint(location.lat, location.lng),
                address: address,
                status: 'Submitted' as const,
                priority: analysisResult.priority,
                estimatedResolutionDate: estimatedResolutionDate,
                severityScore: analysisResult.severityScore,
                severityReasoning: analysisResult.severityReasoning,
                reportCount: 1,
                reportedBy: [user.uid],
            };

            transaction.set(ticketRef, {
                ...ticketData,
                id: ticketId,
                submittedDate: serverTimestamp(),
            });

            // Update user profile with utility points and badges
            const pointsToAdd = analysisResult.severityScore || 0;
            const newTrustPoints = Math.min(100, currentTrustPoints + 3);
            
            transaction.update(userProfileRef, { 
                utilityPoints: increment(pointsToAdd),
                reportCount: increment(1),
                trustPoints: newTrustPoints,
                badges: arrayUnion(...newBadges),
            });
            
            const newBadgeAwards = newBadges.map(bId => allBadges.find(b => b.id === bId)).filter(Boolean);
            newBadgeAwards.forEach(badge => {
                if (badge) {
                    toast({
                        title: "Badge Unlocked!",
                        description: `You've earned the "${badge.title}" badge.`,
                    });
                }
            });

            const finalTicket: Ticket = {
                ...ticketData,
                id: ticketId,
                submittedDate: new Date(),
            };

            onIssueSubmitted(finalTicket);
            setNewTicketId(ticketId);
        });

        setShowSuccessDialog(true);
        setFormStep('form');
        form.reset();
        setPhotoDataUris([]);
        setAudioBlob(null);
        setAudioDataUri(null);
        setAnalysisResult(null);

    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error saving your report. Please try again.",
      });
    } finally {
        setIsLoading(false);
    }
  }
  
  if (formStep === 'preview' && analysisResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis complete. Please review.</CardTitle>
          <CardDescription>Our AI has analyzed your report. Please review the details below before submitting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {analysisResult.severityScore === 1 && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Low Severity Warning</AlertTitle>
              <AlertDescription>
                Our AI has determined this to be a very minor issue. While you can still report it, please consider if it truly requires municipal attention.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4 rounded-lg border p-4">
             <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg">{analysisResult.title}</h3>
                    <p className="text-sm text-muted-foreground">{form.getValues('category')}</p>
                </div>
                <Badge variant={priorityVariantMap[analysisResult.priority]}>{analysisResult.priority} Priority</Badge>
            </div>
            
            <Separator />

            <div className="space-y-3 text-sm">
                 {form.getValues('notes') && (<div className="flex items-start">
                  <FileText className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Your Notes</p>
                    <p className="text-muted-foreground">{form.getValues('notes')}</p>
                  </div>
                </div>)}
                {analysisResult.audioTranscription && (
                <div className="flex items-start">
                    <Waves className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Audio Transcription</p>
                        <p className="text-muted-foreground italic">"{analysisResult.audioTranscription}"</p>
                    </div>
                </div>
                )}
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Location</p>
                    <p className="text-muted-foreground">{address}</p>
                  </div>
                </div>
            </div>

            <div className="space-y-3 text-sm p-3 bg-secondary/50 rounded-md">
                <div className="flex items-start">
                    <BrainCircuit className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">AI Image Analysis</p>
                        <p className="text-muted-foreground">{analysisResult.severityReasoning}</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <Star className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">AI Severity Score</p>
                        <p className="text-muted-foreground">{analysisResult.severityScore} / 10</p>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setFormStep('form')} disabled={isLoading} className="w-full">
              <Edit className="mr-2 h-4 w-4" /> Edit Report
            </Button>
            <Button onClick={handleFinalSubmit} disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                'Confirm & Submit Report'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <CameraModal 
        open={isCameraModalOpen}
        onOpenChange={setIsCameraModalOpen}
        onPhotoCapture={(dataUri) => {
             if (photoDataUris.length < 5) {
                setPhotoDataUris(prev => [...prev, dataUri]);
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Limit Reached',
                    description: 'You can only add up to 5 images.',
                });
            }
            setIsCameraModalOpen(false);
        }}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAnalyze)} className="space-y-8">
           <FormItem>
              <FormLabel>Photos for AI Analysis (up to 5)</FormLabel>
                {photoDataUris.length > 0 ? (
                    <Carousel className="w-full">
                        <CarouselContent>
                            {photoDataUris.map((uri, index) => (
                                <CarouselItem key={index}>
                                    <div className="relative aspect-video w-full">
                                        <Image src={uri} alt={`Preview ${index + 1}`} fill style={{ objectFit: 'cover' }} className="rounded-md" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-7 w-7 z-10"
                                            onClick={() => removePhoto(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                         {photoDataUris.length > 1 && (
                            <>
                                <CarouselPrevious className="-left-4" />
                                <CarouselNext className="-right-4" />
                            </>
                         )}
                    </Carousel>
                ) : (
                    <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden border flex items-center justify-center">
                        <div className="text-center text-muted-foreground p-4">
                           <ImagePlus className="mx-auto h-12 w-12" />
                           <p>Click buttons below to add photos</p>
                        </div>
                    </div>
                )}
                <div className="flex justify-center mt-2 gap-2">
                    <Button type="button" onClick={() => setIsCameraModalOpen(true)} disabled={photoDataUris.length >= 5}>
                        <Camera className="mr-2" />
                        Capture
                    </Button>
                    <Input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                     <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading || photoDataUris.length >= 5}>
                          <Upload className="mr-2" />
                          Upload
                      </Button>
                </div>
               <FormDescription>
                  Provide at least one photo for AI analysis.
                </FormDescription>
           </FormItem>

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an issue category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {issueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Written Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the issue in detail..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide written details or record an audio note below.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormItem>
             <FormLabel>Audio Note (Optional)</FormLabel>
             <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                {audioDataUri && !isRecording && (
                    <audio src={audioDataUri} controls className="w-full" />
                )}
                {isRecording && (
                    <div className="flex items-center justify-center text-primary gap-2">
                        <Waves className="animate-pulse" />
                        <span>Recording...</span>
                    </div>
                )}
                <div className="flex justify-center gap-2">
                    {!isRecording ? (
                        <Button type="button" onClick={handleStartRecording}>
                            <Mic className="mr-2" /> {audioBlob ? 'Re-record' : 'Record Audio'}
                        </Button>
                    ) : (
                        <Button type="button" variant="destructive" onClick={handleStopRecording}>
                            <StopCircle className="mr-2" /> Stop Recording
                        </Button>
                    )}
                </div>
             </div>
             <FormDescription>
                You must provide either written notes or an audio note.
             </FormDescription>
          </FormItem>

           <FormItem>
                <FormLabel>Location</FormLabel>
                <RadioGroup
                    value={locationType}
                    onValueChange={(value: "current" | "manual") => setLocationType(value)}
                    className="flex space-x-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="current" id="current" />
                        <Label htmlFor="current" className="flex items-center gap-2"><LocateFixed/> Use current location</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <Label htmlFor="manual" className="flex items-center gap-2"><Pin /> Select on map</Label>
                    </div>
                </RadioGroup>
            </FormItem>

            {locationType === 'manual' && (
                <div>
                   <LocationPickerMap onLocationSelect={handleLocationSelect} initialCenter={currentUserLocation}/>
                   <FormDescription className="mt-2">Click on the map to place a pin at the issue location.</FormDescription>
                </div>
            )}

            <div className="flex items-center space-x-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{address}</span>
            </div>
            
          <Button type="submit" disabled={isLoading || photoDataUris.length === 0 || !location} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Issue'
            )}
          </Button>
        </form>
      </Form>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
               <PartyPopper className="h-6 w-6 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center">Submission Successful!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Thank you for your report! Your ticket ID is <span className="font-bold text-primary">{newTicketId}</span>. You can track its status in the "My Tickets" tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)} className="w-full">
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    