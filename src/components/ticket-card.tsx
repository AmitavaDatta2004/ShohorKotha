
"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { format, formatDistanceToNow } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import StatusTimeline from "./status-timeline";
import { MapPin, Calendar, BrainCircuit, Star, Users, ChevronDown, ThumbsUp, ThumbsDown, Hash, Timer, Waves, Image as ImageIcon, Camera, Upload, ShieldAlert, X, Navigation, CalendarPlus, Info, Check, Loader2, AlertCircle, Sparkles, XCircle, UserPlus, CheckCircle2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { doc, updateDoc, Timestamp, increment, runTransaction } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { analyzeCompletionReport } from '@/ai/flows/analyze-completion-report';
import { detectAiImage } from '@/ai/flows/detect-ai-image';
import { analyzeImageSeverity } from '@/ai/flows/analyze-image-severity';
import CameraModal from './camera-modal';
import { Input } from './ui/input';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { useAuth } from '@/context/auth-context';
import { Slider } from './ui/slider';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { ImageComparison } from "@/components/ui/image-comparison";

import type { Ticket, Supervisor } from "@/types";

interface TicketCardProps {
  ticket: Ticket;
  supervisors?: Supervisor[];
  isMunicipalView?: boolean;
  isSupervisorView?: boolean;
  isNearbyView?: boolean;
  onJoinReport?: (ticketId: string) => void;
  id?: string;
}

const priorityVariantMap: Record<Ticket['priority'], "destructive" | "secondary" | "default"> = {
  High: 'destructive',
  Medium: 'secondary',
  Low: 'default',
};

const categoryToDepartmentMap: Record<string, string[]> = {
  "Pothole": ["Public Works", "Roads & Highways"],
  "Graffiti": ["Public Works", "Code Enforcement"],
  "Waste Management": ["Sanitation"],
  "Broken Streetlight": ["Public Works", "Traffic & Signals"],
  "Safety Hazard": ["Public Works", "Code Enforcement", "Water Department", "Parks and Recreation"],
  "Tree Maintenance": ["Parks and Recreation"],
  "Animal Control": ["Animal Control"],
  "Traffic & Signals": ["Traffic & Signals"],
  "Other": ["Other"],
};

export default function TicketCard({ ticket, supervisors, isMunicipalView = false, isSupervisorView = false, isNearbyView = false, onJoinReport, id }: TicketCardProps) {
  const { user } = useAuth();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [assignedSupervisor, setAssignedSupervisor] = useState(ticket.assignedSupervisorId || 'unassigned');
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(ticket.deadlineDate);
  const [completionNotes, setCompletionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [completionPhotoDataUris, setCompletionPhotoDataUris] = useState<string[]>([]);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const completionFileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(8);
  const { toast } = useToast();

  const handleSupervisorAssignment = async () => {
    if (assignedSupervisor === 'unassigned') {
        toast({ variant: 'destructive', title: 'No supervisor selected', description: 'Please select a supervisor to assign this ticket.' });
        return;
    }
     if (!deadlineDate) {
        toast({ variant: 'destructive', title: 'No deadline set', description: 'Please select a deadline for this ticket.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const ticketRef = doc(db, 'tickets', ticket.id);
      const selectedSupervisor = supervisors?.find(s => s.id === assignedSupervisor);
      
      await updateDoc(ticketRef, {
        assignedSupervisorId: selectedSupervisor?.id,
        assignedSupervisorName: selectedSupervisor?.name || null,
        status: 'In Progress',
        deadlineDate: Timestamp.fromDate(deadlineDate)
      });

      toast({
        title: "Ticket Assigned",
        description: `Ticket ${ticket.id} has been assigned to ${selectedSupervisor?.name}.`,
      });
    } catch (error) {
      console.error("Error assigning ticket: ", error);
      toast({
        variant: 'destructive',
        title: "Assignment Failed",
        description: "There was an error assigning the ticket.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompletionFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        const currentCount = completionPhotoDataUris.length;
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
                setCompletionPhotoDataUris(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    }
  };

  const removeCompletionPhoto = (index: number) => {
    setCompletionPhotoDataUris(prev => prev.filter((_, i) => i !== index));
  };


  const handleReportSubmission = async () => {
    if (completionNotes.trim() === '') {
        toast({ variant: 'destructive', title: 'Error', description: 'Completion notes cannot be empty.' });
        return;
    }
    if (completionPhotoDataUris.length < 1) {
        toast({ variant: 'destructive', title: 'Error', description: 'A minimum of 1 completion photo is required.' });
        return;
    }
    if (!ticket.imageUrls || ticket.imageUrls.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Original image URL is missing.' });
        return;
    }

    setIsSubmitting(true);
    try {
        await runTransaction(db, async (transaction) => {
            if (!ticket.assignedSupervisorId) return;

            const supervisorRef = doc(db, 'supervisors', ticket.assignedSupervisorId);
            const supervisorDoc = await transaction.get(supervisorRef);
            if (!supervisorDoc.exists()) throw new Error("Supervisor not found");
            const supervisorData = supervisorDoc.data() as Supervisor;

            // 1. Detect if image is AI-generated
            const { isAiGenerated } = await detectAiImage({ photoDataUris: completionPhotoDataUris });

            if (isAiGenerated) {
                toast({
                    variant: 'destructive',
                    title: 'AI-Generated Image Detected',
                    description: 'Your trust score has been penalized by 10 points. Please upload authentic photos.',
                    duration: 5000,
                });
                
                const currentTrust = supervisorData.trustPoints || 100;
                const newTrustPoints = Math.max(0, currentTrust - 10);
                transaction.update(supervisorRef, {
                    aiImageWarningCount: increment(1),
                    trustPoints: newTrustPoints
                });
                return; // Stop the process
            }
            
            // 2. Check if the image is relevant
            const imageAnalysis = await analyzeImageSeverity({ photoDataUris: completionPhotoDataUris });
            if (!imageAnalysis.isRelevant) {
                toast({
                    variant: "destructive",
                    title: "Irrelevant Photo Submitted",
                    description: imageAnalysis.rejectionReason || "The submitted photos do not seem relevant to a civic issue. Please upload photos of the completed work.",
                    duration: 5000,
                });
                return; // Stop the process
            }

            // 3. Analyze Completion
            const completionResult = await analyzeCompletionReport({
                originalPhotoUrls: ticket.imageUrls,
                originalNotes: ticket.notes,
                originalAudioTranscription: ticket.audioTranscription,
                completionPhotoDataUris: completionPhotoDataUris,
                completionNotes: completionNotes,
            });
            
            const imageUrls = await Promise.all(
            completionPhotoDataUris.map(async (uri, index) => {
                const imageRef = storageRef(storage, `tickets/${ticket.id}_completion_${index}.jpg`);
                await uploadString(imageRef, uri, 'data_url');
                return getDownloadURL(imageRef);
            })
            );
            
            const ticketRef = doc(db, 'tickets', ticket.id);
            transaction.update(ticketRef, {
                status: 'Pending Approval',
                completionNotes: completionNotes,
                completionImageUrls: imageUrls,
                completionAnalysis: completionResult,
                rejectionReason: null, // Clear previous rejection reason
            });

            toast({ title: 'Report Submitted', description: 'Your completion report is awaiting approval.' });
            setCompletionNotes('');
            setCompletionPhotoDataUris([]);
        });
    } catch (error) {
        console.error("Error submitting report: ", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit your report.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleApproval = async () => {
    setIsSubmitting(true);
    try {
        await runTransaction(db, async (transaction) => {
            const ticketRef = doc(db, 'tickets', ticket.id);

            // READ operations first
            let supervisorDoc;
            let supervisorRef;
            if (ticket.assignedSupervisorId) {
                supervisorRef = doc(db, 'supervisors', ticket.assignedSupervisorId);
                supervisorDoc = await transaction.get(supervisorRef);
            }
            
            // WRITE operations
            transaction.update(ticketRef, {
                status: 'Resolved',
                rejectionReason: null,
            });

            if (supervisorRef && supervisorDoc && supervisorDoc.exists()) {
                const supervisorData = supervisorDoc.data();
                
                const pointsToAdd = ticket.severityScore || 1;
                const currentTrust = supervisorData.trustPoints || 100;
                const newTrustPoints = Math.min(100, currentTrust + 5);

                transaction.update(supervisorRef, {
                    efficiencyPoints: increment(pointsToAdd),
                    trustPoints: newTrustPoints
                });
            }
        });
        
        toast({ title: 'Work Approved', description: 'The ticket has been marked as resolved.' });
    } catch (error) {
        console.error("Error approving work: ", error);
        toast({ variant: 'destructive', title: 'Approval Failed', description: 'Could not approve the work.' });
    } finally {
        setIsSubmitting(false);
    }
};

  const handleRejection = async () => {
      if (rejectionReason.trim() === '') {
        toast({ variant: 'destructive', title: 'Error', description: 'Rejection reason cannot be empty.' });
        return;
      }
      setIsSubmitting(true);
      try {
        await runTransaction(db, async (transaction) => {
          const ticketRef = doc(db, 'tickets', ticket.id);
          
          // READ operation first
          let supervisorDoc;
          let supervisorRef;
          if (ticket.assignedSupervisorId) {
              supervisorRef = doc(db, 'supervisors', ticket.assignedSupervisorId);
              supervisorDoc = await transaction.get(supervisorRef);
          }

          // WRITE operations last
          transaction.update(ticketRef, {
              status: 'In Progress',
              rejectionReason: rejectionReason,
          });
          
          if (supervisorRef && supervisorDoc && supervisorDoc.exists()) {
              const currentTrust = supervisorDoc.data().trustPoints || 100;
              const newTrustPoints = Math.max(0, currentTrust - 5);
              transaction.update(supervisorRef, { trustPoints: newTrustPoints });
          }
        });

        toast({ title: 'Work Rejected', description: 'The report has been sent back to the supervisor. Their trust score was penalized.' });
        setRejectionReason('');
      } catch (error) {
          console.error("Error rejecting work: ", error);
          toast({ variant: 'destructive', title: 'Rejection Failed', description: 'Could not reject the work.' });
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleFeedback = async () => {
    if (!user || !ticket.assignedSupervisorId) return;

    setIsSubmitting(true);
    try {
        await runTransaction(db, async (transaction) => {
            const ticketRef = doc(db, 'tickets', ticket.id);
            const supervisorRef = doc(db, 'supervisors', ticket.assignedSupervisorId!);
            const supervisorDoc = await transaction.get(supervisorRef);
            if (!supervisorDoc.exists()) return;

            const feedbackField = `feedback.${user.uid}`;
            transaction.update(ticketRef, { 
                [feedbackField]: {
                    rating: feedbackRating,
                    comment: feedbackComment
                }
            });

            const trustPointChange = feedbackRating - 5;
            const currentTrust = supervisorDoc.data().trustPoints || 100;
            const newTrustPoints = Math.max(0, Math.min(100, currentTrust + trustPointChange));
            
            transaction.update(supervisorRef, { trustPoints: newTrustPoints });
        });

        toast({
            title: 'Feedback Submitted',
            description: 'Thank you for helping improve our community services!',
        });
    } catch (error) {
        console.error("Error submitting feedback: ", error);
        toast({
            variant: 'destructive',
            title: 'Feedback Failed',
            description: 'Could not submit your feedback. Please try again.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const relevantDepartments = categoryToDepartmentMap[ticket.category] || ['Other'];
  const filteredSupervisors = supervisors?.filter(s => relevantDepartments.includes(s.department) || s.department === "Other") || [];
  
  const selectedSupervisorName = supervisors?.find(s => s.id === assignedSupervisor)?.name || "Unassigned";
  const deadlineDateAsDate = ticket.deadlineDate instanceof Timestamp ? ticket.deadlineDate.toDate() : ticket.deadlineDate;
  
  const canProvideFeedback = user && ticket.status === 'Resolved' && ticket.reportedBy.includes(user.uid) && !ticket.feedback?.[user.uid];
  
  const generateCalendarLink = () => {
    if (!deadlineDateAsDate) return '#';
    const formattedDate = format(deadlineDateAsDate, 'yyyyMMdd');
    const text = encodeURIComponent(`Resolve: ${ticket.title}`);
    const details = encodeURIComponent(`Address: ${ticket.address}\nTicket ID: ${ticket.id}`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${formattedDate}/${formattedDate}/${formattedDate}/${formattedDate}&details=${details}&location=${encodeURIComponent(ticket.address)}`;
  };

  const completionAnalysisData = (ticket.completionAnalysis && typeof ticket.completionAnalysis === 'object' && 'summary' in ticket.completionAnalysis) ? ticket.completionAnalysis : null;
  const completionAnalysisText = typeof ticket.completionAnalysis === 'string' ? ticket.completionAnalysis : (completionAnalysisData as any)?.analysis;

  return (
    <>
    <CameraModal 
        open={isCameraModalOpen}
        onOpenChange={setIsCameraModalOpen}
        onPhotoCapture={(dataUri) => {
            if (completionPhotoDataUris.length < 5) {
                setCompletionPhotoDataUris(prev => [...prev, dataUri]);
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Too many images',
                    description: 'You can only add up to 5 images.',
                });
            }
            setIsCameraModalOpen(false);
        }}
    />
    <Card id={id} className={cn(
      "relative rounded-[2rem] md:rounded-[3rem] border-slate-100 shadow-xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-500",
      id && "scroll-mt-32"
    )}>
      {ticket.status === 'Pending Approval' && (
        <div className="absolute top-6 right-6 md:top-8 md:right-8 z-30 pointer-events-none">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"></span>
          </span>
        </div>
      )}
      <CardHeader className="p-8 md:p-10 pb-6">
        <div className="flex flex-row justify-between items-start gap-6 md:gap-10">
            <div className="space-y-3 flex-1 w-full overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <Badge variant="outline" className="rounded-full px-3 md:px-4 py-1 text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 border-slate-200">
                    {ticket.category}
                  </Badge>
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-widest hidden sm:inline">•</span>
                  <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">Logged {formatDistanceToNow(new Date(ticket.submittedDate), { addSuffix: true })}</span>
                </div>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight line-clamp-2">{ticket.title || ticket.category}</CardTitle>
            </div>

            {/* Thumbnail Box */}
            {ticket.imageUrls && ticket.imageUrls.length > 0 && (
              <div 
                onClick={() => setIsDetailsOpen(true)}
                className={cn(
                  "relative rounded-[1.25rem] md:rounded-[2rem] overflow-hidden border-4 md:border-6 border-white shadow-xl bg-slate-50 cursor-pointer transition-all duration-500 ease-in-out shrink-0",
                  isDetailsOpen ? "w-0 h-0 opacity-0 scale-50" : "w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 opacity-100 scale-100 hover:scale-105 hover:shadow-2xl"
                )}
              >
                <Image src={ticket.imageUrls[0]} alt="Preview" fill className="object-cover" />
                {ticket.imageUrls.length > 1 && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="text-white font-black text-xs sm:text-sm">+{ticket.imageUrls.length - 1}</span>
                  </div>
                )}
              </div>
            )}
        </div>
        <div className="mt-6">
            <Badge variant={priorityVariantMap[ticket.priority]} className="rounded-full px-4 md:px-6 py-2 md:py-2.5 font-black uppercase tracking-widest text-xs md:text-sm">
              {ticket.priority} Priority
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-8 md:px-10 pb-8 md:pb-10 space-y-8 md:space-y-12">
        <div className="bg-slate-50/50 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 overflow-x-auto scrollbar-hide">
            <StatusTimeline currentStatus={ticket.status} />
        </div>

        {isSupervisorView && deadlineDateAsDate && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 md:p-10 bg-indigo-50/50 rounded-[2rem] md:rounded-[3rem] border border-indigo-100 gap-6">
            <div className="flex items-center gap-6 w-full sm:w-auto">
              <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm text-indigo-600">
                <Timer className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 leading-none mb-2">Resolution Deadline</p>
                <p className="text-xl md:text-2xl font-black text-slate-900 leading-none">{format(deadlineDateAsDate, "PPP")}</p>
              </div>
            </div>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-2xl border-2 font-black text-xs md:text-sm uppercase tracking-widest h-14 px-8">
                <Link href={generateCalendarLink()} target="_blank" rel="noopener noreferrer">
                    <CalendarPlus className="mr-3 h-5 w-5" />
                    Sync Calendar
                </Link>
            </Button>
          </div>
        )}
        
        <Accordion 
          type="single" 
          collapsible 
          className="w-full border-none"
          value={isDetailsOpen ? "item-1" : ""}
          onValueChange={(value) => setIsDetailsOpen(!!value)}
        >
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="hover:no-underline py-0 group">
              <div className="flex items-center gap-3 text-indigo-600 font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-opacity">
                <Info className="h-4 w-4 md:h-5 md:w-5" />
                {isDetailsOpen ? 'Hide Details' : 'Inspect Details'}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-10 md:space-y-14 pt-10 md:pt-14">
              <Separator className="bg-slate-100" />

              {ticket.status === 'Resolved' && ticket.completionImageUrls && ticket.completionImageUrls.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-indigo-600"/>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Interactive Resolution Audit</span>
                  </div>
                  <div className="relative aspect-video w-full rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden border-4 md:border-8 border-white shadow-2xl bg-slate-950">
                    <ImageComparison 
                      before={ticket.imageUrls[0]} 
                      after={ticket.completionImageUrls[0]} 
                      beforeOverlay={
                        <div className="absolute bottom-10 left-10 z-30 pointer-events-none">
                          <div className="bg-slate-950/80 backdrop-blur-2xl px-6 py-3 rounded-2xl text-white flex items-center gap-3 border border-white/10 shadow-2xl">
                            <BrainCircuit className="h-5 w-5 text-indigo-400" />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Verified Score: {ticket.severityScore}/10</span>
                          </div>
                        </div>
                      }
                      afterOverlay={
                        <div className="absolute bottom-10 right-10 z-30 pointer-events-none">
                          <div className="bg-emerald-600/80 backdrop-blur-2xl px-6 py-3 rounded-2xl text-white flex items-center gap-3 border border-white/10 shadow-2xl">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Resolution Verified</span>
                          </div>
                        </div>
                      }
                    />
                  </div>
                </div>
              ) : ticket.imageUrls && ticket.imageUrls.length > 0 && (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-5 w-5 text-slate-400"/>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Incident Documentation</span>
                    </div>
                    <Carousel className="w-full">
                      <CarouselContent>
                        {ticket.imageUrls.map((url, index) => (
                          <CarouselItem key={index}>
                            <div className="relative aspect-video w-full rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden border border-slate-100 shadow-inner bg-slate-50">
                              <Image src={url} alt={`Documentation ${index + 1}`} fill className="object-cover" />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {ticket.imageUrls.length > 1 && <>
                        <CarouselPrevious className="static translate-y-0 h-12 w-12 mt-6 mr-3" />
                        <CarouselNext className="static translate-y-0 h-12 w-12 mt-6" />
                      </>}
                    </Carousel>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
                <div className="space-y-8">
                  <div className="flex items-start gap-6">
                    <div className="bg-slate-50 p-3 rounded-2xl text-slate-400">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Incident ID</p>
                      <p className="text-sm md:text-base font-bold text-slate-700">#{ticket.id.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="bg-slate-50 p-3 rounded-2xl text-slate-400">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Location Map</p>
                      <p className="text-sm md:text-base font-bold text-slate-700 leading-tight mb-4 line-clamp-2">{ticket.address}</p>
                      {ticket.location && (
                        <Button asChild variant="outline" size="lg" className="rounded-2xl border-2 font-black text-xs md:text-sm uppercase tracking-widest h-12 px-6">
                            <Link href={`https://www.google.com/maps/dir/?api=1&destination=${ticket.location.latitude},${ticket.location.longitude}`} target="_blank" rel="noopener noreferrer">
                                <Navigation className="mr-3 h-4 w-4" />
                                Directions
                            </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-start gap-6">
                    <div className="bg-slate-50 p-3 rounded-2xl text-slate-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Community Weight</p>
                      <p className="text-sm md:text-base font-bold text-slate-700">{ticket.reportCount || 1} Citizens Active</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="bg-slate-50 p-3 rounded-2xl text-slate-400">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 mb-2">Projected Resolution</p>
                      <p className="text-sm md:text-base font-bold text-slate-700">{format(new Date(ticket.estimatedResolutionDate), "PPP")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {(ticket.notes || ticket.audioTranscription) && (
                <div className="bg-slate-50 p-10 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 space-y-10">
                  {ticket.notes && (
                    <div className="space-y-4">
                      <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400">Written Context</p>
                      <p className="text-base md:text-lg font-medium text-slate-600 leading-relaxed italic">"{ticket.notes}"</p>
                    </div>
                  )}
                  {ticket.audioTranscription && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Waves className="h-5 w-5 text-indigo-600" />
                        <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400">Audio Transcription</p>
                      </div>
                      <p className="text-base md:text-lg font-medium text-slate-600 italic">"{ticket.audioTranscription}"</p>
                    </div>
                  )}
                </div>
              )}

              {ticket.severityScore && (
                <div className={cn(
                  "rounded-[2.5rem] md:rounded-[3.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl transition-colors duration-500",
                  ticket.severityScore >= 8 ? "bg-red-600 shadow-red-900/20" : 
                  ticket.severityScore >= 4 ? "bg-orange-600 shadow-orange-900/20" : 
                  "bg-slate-900 shadow-slate-900/20"
                )}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                  <div className="relative z-10 space-y-10">
                    <div className="grid grid-cols-2 gap-10">
                      <div>
                        <p className={cn(
                          "text-xs md:text-sm font-black uppercase tracking-widest mb-4",
                          ticket.severityScore >= 4 ? "text-white/70" : "text-indigo-400"
                        )}>Severity Analysis</p>
                        <div className="text-5xl md:text-6xl font-black flex items-baseline gap-2">
                          {ticket.severityScore}<span className="text-2xl opacity-40">/10</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <div className={cn(
                          "p-4 md:p-6 rounded-3xl shadow-xl text-white",
                          ticket.severityScore >= 4 ? "bg-white/20 backdrop-blur-md" : "bg-indigo-600"
                        )}>
                          <BrainCircuit className="h-8 w-8 md:h-10 md:w-10" />
                        </div>
                      </div>
                    </div>
                    {ticket.severityReasoning && (
                      <div className="space-y-4">
                        <p className={cn(
                          "text-xs md:text-sm font-black uppercase tracking-widest",
                          ticket.severityScore >= 4 ? "text-white/70" : "text-indigo-400"
                        )}>AI Reasoning</p>
                        <p className="text-base md:text-xl text-white/90 font-medium leading-relaxed">{ticket.severityReasoning}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {ticket.completionNotes && (
                <div className="space-y-10 pt-10 border-t border-slate-100">
                  <div className="flex items-start gap-6">
                    <div className="bg-emerald-50 p-3 md:p-4 rounded-2xl text-emerald-600 shadow-sm">
                      <Check className="h-6 w-6 md:h-8 md:w-8" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 mb-3">Resolution Report</p>
                      <p className="text-base md:text-lg font-bold text-slate-700 leading-relaxed">{ticket.completionNotes}</p>
                    </div>
                  </div>
                </div>
              )}

            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {isMunicipalView && ticket.status === 'Submitted' && supervisors && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-14 md:h-16 rounded-2xl border-2 font-black justify-between px-6 md:px-8 text-sm md:text-base">
                  <span className="truncate">{selectedSupervisorName}</span>
                  <ChevronDown className="h-5 w-5 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-[2rem] p-3 border-2 shadow-2xl">
                <DropdownMenuRadioGroup value={assignedSupervisor} onValueChange={setAssignedSupervisor}>
                  <DropdownMenuRadioItem value="unassigned" className="rounded-xl font-bold py-3">Unassigned</DropdownMenuRadioItem>
                  <DropdownMenuSeparator className="my-3" />
                  {filteredSupervisors.length > 0 ? (
                    filteredSupervisors.map((supervisor) => (
                      <DropdownMenuRadioItem key={supervisor.id} value={supervisor.id} className="rounded-xl font-bold py-4">
                        {supervisor.name} ({supervisor.department})
                      </DropdownMenuRadioItem>
                    ))
                  ) : (
                     <div className="px-6 py-4 text-sm font-bold text-slate-400 uppercase tracking-widest">No relevant staff found.</div>
                  )}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-full h-14 md:h-16 rounded-2xl border-2 font-black justify-start px-6 md:px-8 text-sm md:text-base",
                        !deadlineDate && "text-slate-400"
                    )}
                    >
                    <CalendarIcon className="mr-3 h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
                    {deadlineDate ? format(deadlineDate, "PPP") : <span>Set Deadline</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[2.5rem] border-2 shadow-2xl overflow-hidden" align="start">
                    <CalendarComponent
                        mode="single"
                        selected={deadlineDate}
                        onSelect={setDeadlineDate}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            <Button onClick={handleSupervisorAssignment} disabled={isSubmitting} className="w-full h-14 md:h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-xl shadow-indigo-600/20 text-base md:text-xl">
              {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Assign Task'}
            </Button>
          </div>
        )}

        {isMunicipalView && ticket.status === 'Pending Approval' && (
            <div className="mt-8 p-8 md:p-12 bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] md:rounded-[3.5rem] space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <h4 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-slate-900 italic">Audit Verification</h4>
                  </div>
                  <Badge variant="outline" className="bg-white border-indigo-100 text-indigo-600 font-black text-[10px] uppercase px-4 py-1">Intelligence v2.0</Badge>
                </div>
                
                {completionAnalysisData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-950 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl border border-white/5">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl"></div>
                          <div className="relative z-10 space-y-4">
                              <div className="flex items-center gap-3">
                                  <Sparkles className="h-5 w-5 text-indigo-400" />
                                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Findings Highlight</p>
                              </div>
                              <p className="text-base font-bold italic leading-relaxed text-indigo-50">
                                  "{completionAnalysisData.summary}"
                              </p>
                          </div>
                      </div>

                      <div className={cn(
                          "p-8 rounded-[2rem] border-2 shadow-sm flex flex-col justify-center",
                          completionAnalysisData.isSatisfactory 
                              ? "bg-emerald-50 border-emerald-100" 
                              : "bg-red-50 border-red-100"
                      )}>
                          <div className="flex items-center gap-3 mb-2">
                              {completionAnalysisData.isSatisfactory 
                                  ? <Check className="h-6 w-6 text-emerald-600" /> 
                                  : <AlertCircle className="h-6 w-6 text-red-600" />
                              }
                              <p className={cn(
                                  "text-xs font-black uppercase tracking-widest",
                                  completionAnalysisData.isSatisfactory ? "text-emerald-700" : "text-red-700"
                              )}>Recommended Action</p>
                          </div>
                          <p className={cn(
                              "text-xl font-black tracking-tight",
                              completionAnalysisData.isSatisfactory ? "text-emerald-900" : "text-red-900"
                          )}>
                              {completionAnalysisData.isSatisfactory 
                                  ? "Confirm Resolution" 
                                  : "Request Correction"
                              }
                          </p>
                      </div>
                  </div>
                )}

                {completionAnalysisText && (
                    <div className="bg-white/60 p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-inner space-y-5">
                        <div className="flex items-center gap-3">
                            <BrainCircuit className="h-5 w-5 text-indigo-600" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Detailed Review</p>
                        </div>
                        <p className="text-base md:text-lg font-medium text-slate-600 leading-relaxed italic border-l-4 border-slate-100 pl-6 py-2">
                            {completionAnalysisText}
                        </p>
                    </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-5 pt-4">
                    <Button onClick={handleApproval} disabled={isSubmitting} className="flex-1 h-14 md:h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black shadow-lg shadow-emerald-600/20 text-xs md:text-sm uppercase tracking-widest">
                       <ThumbsUp className="mr-3 h-5 w-5"/> Confirm Resolution
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="flex-1 h-14 md:h-16 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 font-black text-xs md:text-sm uppercase tracking-widest" disabled={isSubmitting}><ThumbsDown className="mr-3 h-5 w-5"/> Reject Work</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[3rem] md:rounded-[4rem] p-10 md:p-14 border-none shadow-2xl w-[90vw] md:w-full">
                            <AlertDialogHeader className="space-y-5">
                            <AlertDialogTitle className="text-2xl md:text-4xl font-black tracking-tighter">Confirm Rejection?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm md:text-base font-medium text-slate-500 leading-relaxed">
                                This will penalize the staff trust score. Please provide a clear reason to guide their resubmission.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-5 my-8">
                                <Label htmlFor="rejectionReason" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Refusal Context</Label>
                                <Textarea id="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="What is missing or incorrect..." className="rounded-2xl border-2 min-h-[140px] p-6 text-base" />
                            </div>
                            <AlertDialogFooter className="flex flex-col sm:flex-row gap-4">
                            <AlertDialogCancel className="h-14 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest border-2 w-full sm:w-auto">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRejection} disabled={isSubmitting || !rejectionReason} className="h-14 rounded-2xl bg-destructive font-black text-xs md:text-sm uppercase tracking-widest px-8 w-full sm:w-auto">Reject Report</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        )}

        {isSupervisorView && ticket.status === 'In Progress' && (
            <div className="mt-8 p-8 md:p-12 bg-slate-50 border border-slate-100 rounded-[2.5rem] md:rounded-[3.5rem] space-y-10 md:space-y-14">
                <Alert className="bg-indigo-600 border-none text-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 shadow-xl shadow-indigo-600/20">
                    <ShieldAlert className="h-8 w-8 text-white" />
                    <AlertTitle className="font-black uppercase tracking-widest text-xs md:text-sm mb-4">Authenticity Guard</AlertTitle>
                    <AlertDescription className="font-medium text-indigo-50/80 text-sm md:text-base leading-relaxed">
                        Our AI monitors all submissions. Uploading fake media will result in an immediate Trust Score penalty.
                    </AlertDescription>
                </Alert>

                {ticket.rejectionReason && (
                     <div className="p-8 md:p-10 bg-destructive/5 rounded-[2rem] md:rounded-[3rem] border border-destructive/10 space-y-4">
                        <div className="flex items-center gap-3 text-destructive">
                          <XCircle className="h-6 w-6" />
                          <p className="text-xs md:text-sm font-black uppercase tracking-widest">Correction Required</p>
                        </div>
                        <p className="text-sm md:text-base font-bold text-slate-700 leading-relaxed italic">"{ticket.rejectionReason}"</p>
                    </div>
                )}

                <div className="space-y-8">
                    <Label className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400">Resolution Evidence (1-5 Photos)</Label>
                    {completionPhotoDataUris.length > 0 ? (
                        <Carousel>
                            <CarouselContent>
                                {completionPhotoDataUris.map((uri, index) => (
                                    <CarouselItem key={index}>
                                        <div className="relative aspect-video w-full">
                                            <Image src={uri} alt={`Resolution ${index + 1}`} fill className="object-cover rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-4 right-4 md:top-6 md:right-6 h-10 w-10 md:h-12 md:w-12 z-10 rounded-2xl md:rounded-3xl shadow-xl"
                                                onClick={() => removeCompletionPhoto(index)}
                                            >
                                                <X className="h-6 w-6 md:h-7 md:w-7" />
                                            </Button>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {completionPhotoDataUris.length > 1 && <>
                                <CarouselPrevious className="static translate-y-0 h-12 w-12 mt-6 mr-3" />
                                <CarouselNext className="static translate-y-0 h-12 w-12 mt-6" />
                            </>}
                        </Carousel>
                    ) : (
                        <div className="relative min-h-[200px] py-12 w-full bg-white rounded-[2.5rem] md:rounded-[3.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group hover:border-indigo-300 transition-colors">
                            <ImageIcon className="h-16 w-16 md:h-24 md:w-24 text-slate-200 group-hover:scale-110 transition-transform duration-500 mb-6" />
                            <p className="text-sm md:text-lg font-bold text-slate-400 text-center px-8">Capture or upload evidence of completion.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 md:gap-6">
                        <Button type="button" variant="outline" className="h-14 md:h-16 rounded-2xl font-black border-2 hover:bg-slate-50 text-[9px] md:text-sm px-2" onClick={() => setIsCameraModalOpen(true)} disabled={completionPhotoDataUris.length >= 5}>
                            <Camera className="mr-1 h-4 w-4 md:h-6 md:w-6" /> Capture
                        </Button>
                        <Button type="button" variant="outline" className="h-14 md:h-16 rounded-2xl font-black border-2 hover:bg-slate-50 text-[9px] md:text-sm px-2" onClick={() => completionFileInputRef.current?.click()} disabled={completionPhotoDataUris.length >= 5}>
                            <Upload className="mr-1 h-4 w-4 md:h-6 md:w-6" /> Upload
                        </Button>
                        <Input ref={completionFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleCompletionFileSelect} />
                    </div>
                </div>

                <div className="space-y-6">
                    <Label htmlFor={`completion-notes-${ticket.id}`} className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400">Resolution Summary</Label>
                    <Textarea 
                        id={`completion-notes-${ticket.id}`} 
                        placeholder="Detail the actions taken to resolve this incident..."
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        className="rounded-[2rem] md:rounded-[2.5rem] border-2 font-medium p-8 md:p-10 min-h-[160px] md:min-h-[200px] resize-none text-base md:text-lg"
                    />
                </div>
                <Button onClick={handleReportSubmission} disabled={isSubmitting || completionPhotoDataUris.length < 1 || completionPhotoDataUris.length > 5} className="w-full h-16 md:h-20 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-xl shadow-indigo-600/20 text-base md:text-xl">
                    {isSubmitting ? <Loader2 className="h-8 w-8 animate-spin" /> : 'Submit Verification'}
                </Button>
            </div>
        )}
      </CardContent>

       {isNearbyView && ticket.status !== 'Resolved' && onJoinReport && (
        <CardFooter className="px-8 md:px-10 pb-8 md:pb-10 pt-0">
          <Button variant="outline" className="w-full h-14 md:h-16 rounded-2xl border-2 font-black hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all text-lg md:text-xl shadow-sm" onClick={() => onJoinReport(ticket.id)}>
            <UserPlus className="mr-3 h-5 w-5 md:h-6 md:w-6" />
            Join This Report
          </Button>
        </CardFooter>
      )}

      {user && ticket.status === 'Resolved' && (
        <CardFooter className="flex-col items-start gap-10 md:gap-14 px-8 md:px-10 pb-8 md:pb-10 pt-0">
            <Separator className="bg-slate-100" />
            {canProvideFeedback ? (
                <div className="w-full space-y-10 md:space-y-14 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <Star className="h-6 w-6 text-amber-500" />
                        <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-900">Final Feedback</h4>
                      </div>
                      <p className="text-sm md:text-base font-medium text-slate-500">How was the resolution quality? Your feedback impacts staff scores.</p>
                    </div>

                     <div className="bg-slate-50 p-10 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 space-y-10 md:space-y-14">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-4">
                              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400">Rating</span>
                              <Badge variant="secondary" className="w-14 h-10 md:w-16 md:h-12 flex items-center justify-center text-xl md:text-2xl font-black rounded-xl md:rounded-2xl bg-white shadow-sm border-2 border-indigo-100 text-indigo-600">
                                {feedbackRating}
                              </Badge>
                            </div>
                            <Slider
                                value={[feedbackRating]}
                                onValueChange={(value) => setFeedbackRating(value[0])}
                                max={10}
                                min={1}
                                step={1}
                                className="px-4"
                            />
                        </div>
                        <div className="space-y-6">
                            <Label className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-400 ml-4">Comments (Optional)</Label>
                            <Textarea
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                                placeholder="Details about the work performed..."
                                className="rounded-2xl md:rounded-3xl border-2 font-medium bg-white p-8 text-base md:text-lg"
                            />
                        </div>
                    </div>
                    <Button className="w-full h-16 md:h-20 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-xl shadow-indigo-600/20 text-base md:text-xl" onClick={handleFeedback} disabled={isSubmitting}>
                       {isSubmitting ? <Loader2 className="h-8 w-8 animate-spin" /> : 'Submit Feedback'}
                    </Button>
                </div>
            ) : (
                <div className="w-full flex items-center justify-center p-10 md:p-14 bg-emerald-50 rounded-[2.5rem] md:rounded-[3.5rem] border border-emerald-100">
                  <p className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-3">
                    <Check className="h-6 w-6" /> Thank you for your feedback!
                  </p>
                </div>
            )}
        </CardFooter>
       )}
    </Card>
    </>
  );
}
