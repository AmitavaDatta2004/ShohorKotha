
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
  CardDescription,
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
import { MapPin, Calendar, BrainCircuit, Star, FileText, Briefcase, ChevronDown, Users, ThumbsUp, ThumbsDown, MessageSquareQuote, XCircle, UserPlus, Hash, Timer, Waves, Image as ImageIcon, Camera, Upload, ShieldAlert, X, Navigation, CalendarPlus } from "lucide-react";
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

import type { Ticket, Supervisor } from "@/types";

interface TicketCardProps {
  ticket: Ticket;
  supervisors?: Supervisor[];
  isMunicipalView?: boolean;
  isSupervisorView?: boolean;
isNearbyView?: boolean;
  onJoinReport?: (ticketId: string) => void;
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

export default function TicketCard({ ticket, supervisors, isMunicipalView = false, isSupervisorView = false, isNearbyView = false, onJoinReport }: TicketCardProps) {
  const { user } = useAuth();
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
            const { analysis } = await analyzeCompletionReport({
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
                completionAnalysis: analysis,
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
  const assignedSupervisorDetails = supervisors?.find(s => s.id === ticket.assignedSupervisorId);
  const deadlineDateAsDate = ticket.deadlineDate instanceof Timestamp ? ticket.deadlineDate.toDate() : ticket.deadlineDate;
  
  const canProvideFeedback = user && ticket.status === 'Resolved' && ticket.reportedBy.includes(user.uid) && !ticket.feedback?.[user.uid];
  
  const generateCalendarLink = () => {
    if (!deadlineDateAsDate) return '#';
    const formattedDate = format(deadlineDateAsDate, 'yyyyMMdd');
    const text = encodeURIComponent(`Resolve: ${ticket.title}`);
    const details = encodeURIComponent(`Address: ${ticket.address}\nTicket ID: ${ticket.id}`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${formattedDate}/${formattedDate}&details=${details}&location=${encodeURIComponent(ticket.address)}`;
  };

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
                    title: 'Limit Reached',
                    description: 'You can only add up to 5 images.',
                });
            }
            setIsCameraModalOpen(false);
        }}
    />
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline">{ticket.title || ticket.category}</CardTitle>
                <CardDescription>
                    {ticket.category} &bull; Submitted {formatDistanceToNow(new Date(ticket.submittedDate), { addSuffix: true })}
                </CardDescription>
            </div>
            <Badge variant={priorityVariantMap[ticket.priority]}>{ticket.priority} Priority</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
            <StatusTimeline currentStatus={ticket.status} />
        </div>

        {isSupervisorView && deadlineDateAsDate && (
          <div className="flex items-center justify-between p-3 my-4 bg-secondary/50 rounded-lg border">
            <div className="flex items-center">
              <Timer className="h-5 w-5 mr-3 flex-shrink-0 text-foreground" />
              <div>
                <p className="font-semibold text-sm">Deadline</p>
                <p className="text-sm text-muted-foreground">{format(deadlineDateAsDate, "PPP")}</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href={generateCalendarLink()} target="_blank" rel="noopener noreferrer">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Add to Calendar
                </Link>
            </Button>
          </div>
        )}
        
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>View Details</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <Separator />

              {ticket.imageUrls && ticket.imageUrls.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm font-semibold">
                      <ImageIcon className="h-4 w-4 mr-3 flex-shrink-0 text-muted-foreground"/>
                      <span>Submitted Photos</span>
                    </div>
                    <Carousel className="w-full">
                      <CarouselContent>
                        {ticket.imageUrls.map((url, index) => (
                          <CarouselItem key={index}>
                            <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                              <Image src={url} alt={`Image for ticket ${ticket.id} - ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {ticket.imageUrls.length > 1 && <>
                        <CarouselPrevious className="-left-4" />
                        <CarouselNext className="-right-4" />
                      </>}
                    </Carousel>
                  </div>
              )}

              <div className="space-y-3 text-sm">
                 <div className="flex items-start">
                  <Hash className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Ticket ID</p>
                    <p className="text-muted-foreground">{ticket.id}</p>
                  </div>
                </div>
                 <div className="flex items-start">
                  <Users className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Report Count</p>
                    <p className="text-muted-foreground">{ticket.reportCount || 1}</p>
                  </div>
                </div>
                {ticket.notes && (
                  <div className="flex items-start">
                    <FileText className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">User Notes</p>
                      <p className="text-muted-foreground">{ticket.notes}</p>
                    </div>
                  </div>
                )}
                {ticket.audioTranscription && (
                  <div className="flex items-start">
                    <Waves className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">Audio Transcription</p>
                        <p className="text-muted-foreground italic">"{ticket.audioTranscription}"</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                    <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Location</p>
                            <p className="text-muted-foreground">{ticket.address}</p>
                        </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href={`https://www.google.com/maps/dir/?api=1&destination=${ticket.location.latitude},${ticket.location.longitude}`} target="_blank" rel="noopener noreferrer">
                            <Navigation className="mr-2 h-4 w-4" />
                            Get Directions
                        </Link>
                    </Button>
                </div>
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                   <div>
                    <p className="font-semibold">Timeline</p>
                    <p className="text-muted-foreground">Est. Resolution: {format(new Date(ticket.estimatedResolutionDate), "PPP")}</p>
                  </div>
                </div>

                {deadlineDateAsDate && !isSupervisorView && (
                  <div className="flex items-start">
                    <Timer className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Deadline</p>
                      <p className="text-muted-foreground">{format(deadlineDateAsDate, "PPP")}</p>
                    </div>
                  </div>
                )}
                
                {ticket.assignedSupervisorName && (
                  <div className="flex items-start">
                    <Briefcase className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Assigned Supervisor</p>
                      <div className="flex items-center gap-2">
                        <p className="text-muted-foreground">{ticket.assignedSupervisorName}</p>
                        {isMunicipalView && assignedSupervisorDetails && (assignedSupervisorDetails.aiImageWarningCount || 0) > 0 && (
                           <Badge variant="destructive" className="flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" />
                                {assignedSupervisorDetails.aiImageWarningCount} AI Warning(s)
                            </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                 
                {isSupervisorView && ticket.rejectionReason && (
                   <div className="flex items-start p-3 bg-destructive/10 rounded-md">
                    <XCircle className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-destructive" />
                    <div>
                      <p className="font-semibold text-destructive">Reason for Prior Rejection</p>
                      <p className="text-destructive/80">{ticket.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>

              {ticket.severityScore && ticket.severityReasoning && (
                <>
                  <Separator />
                  <div className="space-y-3 text-sm p-3 bg-secondary/50 rounded-md">
                     <div className="flex items-start">
                        <BrainCircuit className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">AI Image Analysis (Original)</p>
                            <p className="text-muted-foreground">{ticket.severityReasoning}</p>
                        </div>
                    </div>
                     <div className="flex items-start">
                        <Star className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">AI Severity Score</p>
                            <p className="text-muted-foreground">{ticket.severityScore} / 10</p>
                        </div>
                    </div>
                  </div>
                </>
              )}

              {ticket.completionNotes && (
                <>
                  <Separator />
                  <div className="space-y-3 pt-4">
                    <div className="flex items-start">
                      <MessageSquareQuote className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-sm">Supervisor's Completion Report</p>
                        <p className="text-muted-foreground text-sm">{ticket.completionNotes}</p>
                      </div>
                    </div>
                    {ticket.completionImageUrls && ticket.completionImageUrls.length > 0 && (
                      <div className="space-y-2">
                         <div className="flex items-center text-sm font-semibold">
                            <ImageIcon className="h-4 w-4 mr-3 flex-shrink-0 text-muted-foreground"/>
                            <span>Completion Photos</span>
                         </div>
                        <Carousel className="w-full">
                          <CarouselContent>
                            {ticket.completionImageUrls.map((url, index) => (
                              <CarouselItem key={index}>
                                <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                  <Image src={url} alt={`Completion photo ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          {ticket.completionImageUrls.length > 1 && <>
                            <CarouselPrevious className="-left-4" />
                            <CarouselNext className="-right-4" />
                          </>}
                        </Carousel>
                      </div>
                    )}
                  </div>
                </>
              )}

            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {isMunicipalView && ticket.status === 'Submitted' && supervisors && (
          <div className="mt-4 flex flex-col md:flex-row items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedSupervisorName}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                <DropdownMenuRadioGroup value={assignedSupervisor} onValueChange={setAssignedSupervisor}>
                  <DropdownMenuRadioItem value="unassigned">Unassigned</DropdownMenuRadioItem>
                  <DropdownMenuSeparator />
                  {filteredSupervisors.length > 0 ? (
                    filteredSupervisors.map((supervisor) => (
                      <DropdownMenuRadioItem key={supervisor.id} value={supervisor.id}>
                        {supervisor.name} ({supervisor.department})
                      </DropdownMenuRadioItem>
                    ))
                  ) : (
                     <div className="px-2 py-1.5 text-sm text-muted-foreground">No relevant supervisors found.</div>
                  )}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadlineDate && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadlineDate ? format(deadlineDate, "PPP") : <span>Pick a deadline</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                        mode="single"
                        selected={deadlineDate}
                        onSelect={setDeadlineDate}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>

            <Button onClick={handleSupervisorAssignment} disabled={isSubmitting} className="w-full md:w-auto">
              {isSubmitting ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        )}

        {isMunicipalView && ticket.status === 'Pending Approval' && (
            <div className="mt-4 space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-semibold mb-2">Review Supervisor's Report</h4>
                    
                    {ticket.completionAnalysis && (
                        <div className="space-y-2 text-sm p-3 mb-4 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-start">
                                <BrainCircuit className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-blue-600" />
                                <div>
                                    <p className="font-semibold text-blue-800">AI Completion Analysis</p>
                                    <p className="text-blue-700">{ticket.completionAnalysis}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                        <Button onClick={handleApproval} disabled={isSubmitting} className="flex-1 bg-green-600 hover:bg-green-700">
                           <ThumbsUp className="mr-2 h-4 w-4"/> Approve
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="flex-1" disabled={isSubmitting}><ThumbsDown className="mr-2 h-4 w-4"/> Reject</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Reject Completion Report?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will penalize the supervisor's trust score. Please provide a reason for rejecting this report. The supervisor will be notified and asked to resubmit.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                    <Label htmlFor="rejectionReason">Rejection Reason</Label>
                                    <Textarea id="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g., The issue is still visible..." />
                                </div>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRejection} disabled={isSubmitting || !rejectionReason}>Submit Rejection</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>
        )}

        {isSupervisorView && ticket.status === 'In Progress' && (
            <div className="mt-4 space-y-4">
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Authenticity Notice</AlertTitle>
                    <AlertDescription>
                        Do not upload AI-generated images. Submitting inauthentic photos of completed work will result in a trust score penalty.
                    </AlertDescription>
                </Alert>

                {ticket.rejectionReason && (
                     <div className="flex items-start p-3 bg-destructive/10 rounded-md border border-destructive/20">
                        <XCircle className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0 text-destructive" />
                        <div>
                        <p className="font-semibold text-destructive text-sm">Reason for Prior Rejection:</p>
                        <p className="text-sm text-destructive/90">{ticket.rejectionReason}</p>
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Completion Photos (1-5)</Label>
                    {completionPhotoDataUris.length > 0 ? (
                        <Carousel>
                            <CarouselContent>
                                {completionPhotoDataUris.map((uri, index) => (
                                    <CarouselItem key={index}>
                                        <div className="relative aspect-video w-full">
                                            <Image src={uri} alt={`Completion Preview ${index + 1}`} fill style={{ objectFit: 'cover' }} className="rounded-md" />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 h-7 w-7 z-10"
                                                onClick={() => removeCompletionPhoto(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {completionPhotoDataUris.length > 1 && <>
                                <CarouselPrevious className="-left-4" />
                                <CarouselNext className="-right-4" />
                            </>}
                        </Carousel>
                    ) : (
                        <div className="relative aspect-video w-full bg-muted rounded-md overflow-hidden border flex items-center justify-center">
                            <div className="text-center text-muted-foreground p-4">
                                <ImageIcon className="mx-auto h-12 w-12" />
                                <p>Upload 1-5 photos of the completed work</p>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-center gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => setIsCameraModalOpen(true)} disabled={completionPhotoDataUris.length >= 5}>
                            <Camera className="mr-2" /> Capture
                        </Button>
                        <Input ref={completionFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleCompletionFileSelect} />
                        <Button type="button" size="sm" variant="outline" onClick={() => completionFileInputRef.current?.click()} disabled={completionPhotoDataUris.length >= 5}>
                            <Upload className="mr-2" /> Upload
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`completion-notes-${ticket.id}`}>Completion Report</Label>
                    <Textarea 
                        id={`completion-notes-${ticket.id}`} 
                        placeholder="Describe the work you completed..."
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                    />
                </div>
                <Button onClick={handleReportSubmission} disabled={isSubmitting || completionPhotoDataUris.length < 1 || completionPhotoDataUris.length > 5} className="w-full">
                    {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                </Button>
            </div>
        )}
      </CardContent>
       {isNearbyView && ticket.status !== 'Resolved' && onJoinReport && (
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => onJoinReport(ticket.id)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Join Report
          </Button>
        </CardFooter>
      )}

      {user && ticket.status === 'Resolved' && (
        <CardFooter className="flex-col items-start gap-4">
            <Separator />
            {canProvideFeedback ? (
                <div className="w-full space-y-4">
                    <Label className="font-medium">Was this issue resolved to your satisfaction? Please rate the work and leave a comment.</Label>
                     <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <Slider
                                value={[feedbackRating]}
                                onValueChange={(value) => setFeedbackRating(value[0])}
                                max={10}
                                min={1}
                                step={1}
                                className="flex-1"
                            />
                            <Badge variant="secondary" className="w-12 h-8 flex items-center justify-center text-lg">
                                {feedbackRating}
                            </Badge>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Textarea
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            placeholder="e.g., The pothole was filled, but the road is still uneven. (Optional)"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button className="w-full" onClick={handleFeedback} disabled={isSubmitting}>
                           Submit Feedback
                        </Button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground w-full text-center">Thank you for your feedback!</p>
            )}
        </CardFooter>
       )}
    </Card>
    </>
  );
}

    