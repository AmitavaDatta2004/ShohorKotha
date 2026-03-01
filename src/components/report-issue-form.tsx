
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from "next/image";
import { Camera, MapPin, Loader2, PartyPopper, Upload, LocateFixed, Pin, ImagePlus, BrainCircuit, Star, FileText, Calendar, Edit, ShieldAlert, Mic, StopCircle, Waves, X, Check, Zap, Info, Rss } from "lucide-react";
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
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { allBadges } from "@/lib/badges.tsx";
import { cn } from "@/lib/utils";

const LocationPickerMap = dynamic(() => import('@/components/location-picker-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-[2rem]" />,
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
  const [pincode, setPincode] = React.useState("");
  const [locationType, setLocationType] = React.useState<"current" | "manual">("current");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  const [newTicketId, setNewTicketId] = React.useState("");
  const { toast } = useToast();
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = React.useState(false);

  const [formStep, setFormStep] = React.useState<'form' | 'preview'>('form');
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  
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
            setPincode(data.pincode || "");
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
          setAddress("Unable to retrieve location.");
          toast({ variant: 'destructive', title: 'Location Error', description: 'Could not retrieve location.' });
        }
      );
    } else {
      setAddress("Geolocation not supported.");
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
        setAddress("Select location on map.");
        setPincode("");
    }
  }, [locationType, currentUserLocation, fetchAddress]);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        const currentCount = photoDataUris.length;
        const remainingSlots = 5 - currentCount;
        if (files.length > remainingSlots) {
            toast({ variant: 'destructive', title: 'Limit Reached', description: `Only ${remainingSlots} slots remaining.` });
        }
        const newFiles = Array.from(files).slice(0, remainingSlots);
        newFiles.forEach(file => {
             const reader = new FileReader();
            reader.onload = (e) => setPhotoDataUris(prev => [...prev, e.target?.result as string]);
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
          mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
          mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            setAudioBlob(blob);
            const reader = new FileReader();
            reader.onload = (e) => setAudioDataUri(e.target?.result as string);
            reader.readAsDataURL(blob);
          };
          mediaRecorderRef.current.start();
          setIsRecording(true);
        } catch (err) {
          toast({ variant: 'destructive', title: 'Mic Error', description: 'Could not access microphone.' });
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
        form.setError("notes", { type: "manual", message: "Notes or audio recording required." });
        return;
    }
    if (!location || !user || photoDataUris.length === 0) {
      toast({ variant: "destructive", title: "Incomplete Data", description: "Photo and location are mandatory." });
      return;
    }
    
    setIsLoading(true);
    try {
      const { isRelevant, rejectionReason, severityScore, reasoning } = await analyzeImageSeverity({ photoDataUris });
      
      if (!isRelevant) {
        await runTransaction(db, async (transaction) => {
            const userProfileRef = doc(db, 'users', user.uid);
            const userProfileDoc = await transaction.get(userProfileRef);
            let currentTrust = 100;
            if (userProfileDoc.exists()) currentTrust = userProfileDoc.data().trustPoints || 100;
            const newTrustPoints = Math.max(0, currentTrust - 5);
            if (userProfileDoc.exists()) {
                transaction.update(userProfileRef, { trustPoints: newTrustPoints });
            } else {
                 transaction.set(userProfileRef, {
                    id: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL,
                    utilityPoints: 0, trustPoints: newTrustPoints, reportCount: 0, joinedDate: serverTimestamp(), badges: [],
                });
            }
        });
        toast({ variant: "destructive", title: "Irrelevant Report", description: `This photo doesn't seem to show a civic issue. Reason: ${rejectionReason}`, duration: 7000 });
        setIsLoading(false);
        return;
      }
      
      let audioTranscription: string | undefined;
      if (audioDataUri) {
          const { transcription } = await transcribeAudio({ audioDataUri });
          audioTranscription = transcription;
      }

      const { priorityLevel } = await determineIssuePriority({
        imageAnalysisScore: severityScore!,
        category: values.category,
        notes: values.notes,
        audioTranscription,
      });

      const { title } = await generateIssueTitle({
        category: values.category,
        notes: values.notes,
        audioTranscription,
        severityReasoning: reasoning!,
      });
      
      setAnalysisResult({ title, priority: priorityLevel, severityScore: severityScore!, severityReasoning: reasoning!, audioTranscription });
      setFormStep('preview');
    } catch (error) {
      toast({ variant: "destructive", title: "Analysis Failed", description: "The AI system encountered an error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFinalSubmit() {
    if (!location || !user || !analysisResult || photoDataUris.length === 0) return;
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
                transaction.set(userProfileRef, {
                    id: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL,
                    utilityPoints: 0, trustPoints: 100, reportCount: 0, joinedDate: serverTimestamp(), badges: [],
                });
            } else {
                const data = userProfileDoc.data();
                currentReportCount = data.reportCount || 0;
                currentTrustPoints = data.trustPoints || 100;
                userBadges = data.badges || [];
            }

            const updatedReportCount = currentReportCount + 1;
            [{ count: 1, id: 'reporter-1' }, { count: 10, id: 'reporter-10' }, { count: 50, id: 'reporter-50' }, { count: 100, id: 'reporter-100' }].forEach(badge => {
                if (updatedReportCount >= badge.count && !userBadges.includes(badge.id)) newBadges.push(badge.id);
            });
            
            const pendingTicketsQuery = query(collection(db, 'tickets'), where("status", "in", ["Submitted", "In Progress"]));
            const pendingTicketsSnapshot = await getDocs(pendingTicketsQuery);
            const { resolutionDays } = await estimateResolutionTime({ priority: analysisResult.priority, pendingTicketsCount: pendingTicketsSnapshot.size });
            
            const ticketRef = doc(collection(db, "tickets"));
            const imageUrls = await Promise.all(photoDataUris.map(async (uri, i) => {
                const imgRef = storageRef(storage, `tickets/${ticketRef.id}_${i}.jpg`);
                await uploadString(imgRef, uri, 'data_url');
                return getDownloadURL(imgRef);
            }));

            const estimatedResolutionDate = new Date();
            estimatedResolutionDate.setDate(estimatedResolutionDate.getDate() + resolutionDays);
            
            const ticketData = {
                id: ticketRef.id, 
                userId: user.uid, 
                userPhotoURL: user.photoURL || undefined, 
                title: analysisResult.title, 
                category: values.category,
                notes: values.notes || '', audioTranscription: analysisResult.audioTranscription || '',
                imageUrls, location: new GeoPoint(location.lat, location.lng), address, pincode: pincode || "",
                status: 'Submitted', priority: analysisResult.priority, estimatedResolutionDate, severityScore: analysisResult.severityScore,
                severityReasoning: analysisResult.severityReasoning, reportCount: 1, reportedBy: [user.uid],
                submittedDate: serverTimestamp(),
                isPublicFeed: true, 
                likes: [],
                comments: [],
            };

            transaction.set(ticketRef, ticketData);
            transaction.update(userProfileRef, { 
                utilityPoints: increment(analysisResult.severityScore),
                reportCount: increment(1),
                trustPoints: Math.min(100, currentTrustPoints + 3),
                badges: arrayUnion(...newBadges),
            });
            
            newBadges.forEach(bId => {
                const badge = allBadges.find(b => b.id === bId);
                if (badge) toast({ title: "Badge Unlocked!", description: `Earned "${badge.title}" badge.` });
            });
            onIssueSubmitted({ ...ticketData, submittedDate: new Date() } as any);
            setNewTicketId(ticketRef.id);
        });
        setShowSuccessDialog(true);
        setFormStep('form');
        form.reset();
        setPhotoDataUris([]);
        setAudioBlob(null);
        setAudioDataUri(null);
        setAnalysisResult(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Submission Failed", description: "Could not save your report. Please try again." });
    } finally {
        setIsLoading(false);
    }
  }
  
  if (formStep === 'preview' && analysisResult) {
    return (
      <div className="p-8 md:p-12 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-1 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-white">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Review Analysis</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">AI Analysis Results.</h3>
              <p className="text-slate-500 font-medium">Verify the details generated by our AI before submission.</p>
            </div>

            <div className={cn(
              "rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl transition-colors duration-500",
              analysisResult.severityScore >= 8 ? "bg-red-600 shadow-red-900/20" : 
              analysisResult.severityScore >= 4 ? "bg-orange-600 shadow-orange-900/20" : 
              "bg-slate-900 shadow-slate-900/20"
            )}>
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[100px] -mr-24 -mt-24"></div>
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Suggested Title</p>
                    <h4 className="text-2xl font-black tracking-tight">{analysisResult.title}</h4>
                  </div>
                  <Badge variant={priorityVariantMap[analysisResult.priority]} className="rounded-full px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">
                    {analysisResult.priority} Priority
                  </Badge>
                </div>
                <Separator className="bg-white/10" />
                <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-white/70">Severity Score</p>
                    <div className="text-3xl sm:text-4xl font-black flex items-baseline gap-1">
                      {analysisResult.severityScore}<span className="text-base sm:text-lg opacity-40">/10</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-white/70">Category</p>
                    <div className="text-base sm:text-lg font-black truncate">{form.getValues('category')}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70">AI Reasoning</p>
                  <p className="text-sm text-white/90 font-medium leading-relaxed">{analysisResult.severityReasoning}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <MapPin className="h-5 w-5 text-indigo-600 shrink-0 mt-1" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Confirmed Location</p>
                  <p className="text-sm font-bold text-slate-700">{address}</p>
                  {pincode && <p className="text-[10px] font-black text-indigo-600 uppercase mt-1">Locality Code: {pincode}</p>}
                </div>
              </div>
              <div className="flex items-start gap-4 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <Rss className="h-5 w-5 text-emerald-600 shrink-0 mt-1" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Public Broadcast</p>
                  <p className="text-sm font-bold text-emerald-900">Synchronizing with Public Community Feed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-80 space-y-4">
            <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 mb-8">
              <div className="flex items-center gap-3 mb-4 text-indigo-600">
                <Info className="h-5 w-5" />
                <p className="text-xs font-black uppercase tracking-widest">Final Step</p>
              </div>
              <p className="text-sm text-indigo-900/70 font-medium leading-relaxed">Your submission earns <span className="font-black text-indigo-600">{analysisResult.severityScore} Utility Points</span> and impacts local resource allocation.</p>
            </div>
            <Button onClick={handleFinalSubmit} disabled={isLoading} className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-xl shadow-indigo-600/20 text-lg">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Check className="mr-2 h-6 w-6" /> Confirm Submission</>}
            </Button>
            <Button variant="outline" onClick={() => setFormStep('form')} disabled={isLoading} className="w-full h-16 rounded-2xl border-2 font-black text-slate-600 hover:bg-slate-50">
              <Edit className="mr-2 h-5 w-5" /> Edit Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12">
      <CameraModal 
        open={isCameraModalOpen}
        onOpenChange={setIsCameraModalOpen}
        onPhotoCapture={(dataUri) => {
             if (photoDataUris.length < 5) setPhotoDataUris(prev => [...prev, dataUri]);
             setIsCameraModalOpen(false);
        }}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAnalyze)} className="space-y-12">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <FormItem>
                  <div className="flex items-center gap-2 mb-4">
                    <Camera className="h-4 w-4 text-indigo-600" />
                    <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Photos (Up to 5)</FormLabel>
                  </div>
                  {photoDataUris.length > 0 ? (
                      <div className="relative">
                        <Carousel className="w-full">
                            <CarouselContent>
                                {photoDataUris.map((uri, index) => (
                                    <CarouselItem key={index}>
                                        <div className="relative aspect-video w-full">
                                            <Image src={uri} alt={`Preview ${index + 1}`} fill className="rounded-[2.5rem] object-cover" />
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4 h-10 w-10 z-10 rounded-2xl shadow-xl" onClick={() => removePhoto(index)}>
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {photoDataUris.length > 1 && (
                                <div className="flex justify-center gap-2 mt-4">
                                    <CarouselPrevious className="static translate-y-0" />
                                    <CarouselNext className="static translate-y-0" />
                                </div>
                            )}
                        </Carousel>
                      </div>
                  ) : (
                      <div className="relative min-h-[200px] py-12 w-full bg-slate-50 rounded-[2.5rem] overflow-hidden border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group hover:border-indigo-300 transition-colors">
                          <ImagePlus className="h-16 w-16 text-slate-300 group-hover:scale-110 transition-transform duration-500 mb-4" />
                          <p className="text-sm font-bold text-slate-400 px-6 text-center">Capture or upload visual evidence.</p>
                      </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-6">
                      <Button type="button" variant="outline" className="h-14 rounded-2xl font-black border-2 hover:bg-indigo-50 hover:border-indigo-200 px-2 text-[9px] sm:text-xs" onClick={() => setIsCameraModalOpen(true)} disabled={photoDataUris.length >= 5}>
                          <Camera className="mr-1 h-4 w-4" /> Take Photo
                      </Button>
                      <Button type="button" variant="outline" className="h-14 rounded-2xl font-black border-2 hover:bg-emerald-50 hover:border-emerald-200 px-2 text-[9px] sm:text-xs" onClick={() => fileInputRef.current?.click()} disabled={isLoading || photoDataUris.length >= 5}>
                          <Upload className="mr-1 h-4 w-4" /> Upload
                      </Button>
                      <Input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                  </div>
                </FormItem>

                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-indigo-600" />
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Voice Note</Label>
                  </div>
                  {audioDataUri && !isRecording && <audio src={audioDataUri} controls className="w-full rounded-2xl overflow-hidden" />}
                  {isRecording && (
                      <div className="flex items-center justify-center text-indigo-600 gap-3 py-4">
                          <Waves className="animate-pulse h-8 w-8" />
                          <span className="font-black uppercase tracking-widest text-xs">Capturing Audio...</span>
                      </div>
                  )}
                  <Button type="button" variant={isRecording ? "destructive" : "outline"} className={cn("w-full h-14 rounded-2xl font-black border-2", !isRecording && "bg-white")} onClick={isRecording ? handleStopRecording : handleStartRecording}>
                      {isRecording ? <><StopCircle className="mr-2 h-5 w-5" /> Stop Recording</> : <><Mic className="mr-2 h-5 w-5" /> {audioBlob ? 'Record Again' : 'Record Voice'}</>}
                  </Button>
                </div>
              </div>

              <div className="space-y-8">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="h-4 w-4 text-indigo-600" />
                        <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Issue Category</FormLabel>
                      </div>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 rounded-2xl border-2 font-black px-6">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-2">
                          {issueCategories.map((category) => (
                            <SelectItem key={category} value={category} className="font-bold py-3 rounded-xl">{category}</SelectItem>
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
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="h-4 w-4 text-indigo-600" />
                        <FormLabel className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Contextual Details</FormLabel>
                      </div>
                      <FormControl>
                        <Textarea placeholder="Describe the issue in detail..." className="rounded-[2rem] border-2 font-medium p-6 min-h-[160px] resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <LocateFixed className="h-4 w-4 text-indigo-600" />
                    <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Deployment Coordinates</Label>
                  </div>
                  <RadioGroup value={locationType} onValueChange={(value: "current" | "manual") => setLocationType(value)} className="flex gap-2">
                      <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-50 px-2 sm:px-4 py-3 rounded-2xl border border-slate-100 flex-1 overflow-hidden">
                          <RadioGroupItem value="current" id="current" />
                          <Label htmlFor="current" className="font-black text-[9px] sm:text-xs uppercase tracking-widest cursor-pointer truncate">Live GPS</Label>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-50 px-2 sm:px-4 py-3 rounded-2xl border border-slate-100 flex-1 overflow-hidden">
                          <RadioGroupItem value="manual" id="manual" />
                          <Label htmlFor="manual" className="font-black text-[9px] sm:text-xs uppercase tracking-widest cursor-pointer truncate">Manual Pin</Label>
                      </div>
                  </RadioGroup>
                  {locationType === 'manual' && <div className="overflow-hidden rounded-[2.5rem] border-2 border-slate-100 shadow-xl"><LocationPickerMap onLocationSelect={handleLocationSelect} initialCenter={currentUserLocation}/></div>}
                  <div className="flex items-center gap-4 px-6 py-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <MapPin className="h-5 w-5 text-indigo-600 shrink-0" />
                      <div className="flex-1 overflow-hidden">
                        <span className="text-sm font-black text-indigo-900 truncate block">{address}</span>
                        {pincode && <span className="text-[10px] font-black text-indigo-400 uppercase">PIN: {pincode}</span>}
                      </div>
                  </div>
                </div>
              </div>
           </div>
            
          <Button type="submit" disabled={isLoading || photoDataUris.length === 0 || !location} className="w-full h-20 rounded-[2.5rem] bg-indigo-600 hover:bg-indigo-700 font-black shadow-2xl shadow-indigo-600/20 text-xl transition-all hover:scale-[1.01] active:scale-[0.98]">
            {isLoading ? <><Loader2 className="mr-2 h-8 w-8 animate-spin" /> Running Intelligence Audit...</> : 'Analyze & Broadcast Report'}
          </Button>
        </form>
      </Form>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="rounded-[3rem] p-12 border-none shadow-2xl">
          <AlertDialogHeader className="items-center text-center space-y-6">
            <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-500/20">
               <PartyPopper className="h-12 w-12 text-emerald-600" />
            </div>
            <AlertDialogTitle className="text-4xl font-black tracking-tighter text-slate-900">Broadcast Successful.</AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-medium text-slate-500">
              Report <span className="font-black text-indigo-600">#{newTicketId.substring(0, 8).toUpperCase()}</span> is now live in the community feed. Monitoring for official triage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10">
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)} className="w-full h-16 rounded-3xl bg-slate-900 font-black text-lg">
              Confirm & Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
