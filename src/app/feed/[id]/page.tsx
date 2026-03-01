"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { doc, onSnapshot, Timestamp, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import type { Ticket, TicketComment } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  BrainCircuit, 
  Users, 
  ShieldCheck, 
  Activity, 
  Navigation, 
  Hash,
  Sparkles,
  Info,
  Heart,
  Share2,
  MessageSquare,
  Send,
  Loader2,
  Mic,
  Waves,
  Zap,
  Building,
  UserCheck,
  LayoutGrid,
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import dynamic from "next/dynamic";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ImageComparison } from "@/components/ui/image-comparison";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />,
});

const getStatusContext = (status: Ticket['status']) => {
  switch (status) {
    case 'Submitted':
      return { label: "At Municipal End (Triage)", icon: Building, color: "text-amber-500", bg: "bg-amber-50" };
    case 'In Progress':
      return { label: "At Supervisor End (Fixing)", icon: LayoutGrid, color: "text-indigo-600", bg: "bg-indigo-50" };
    case 'Pending Approval':
      return { label: "At Municipal End (Approval)", icon: ShieldCheck, color: "text-orange-500", bg: "bg-orange-50" };
    case 'Resolved':
      return { label: "Successfully Resolved", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" };
    default:
      return { label: "Unknown Status", icon: Info, color: "text-slate-400", bg: "bg-slate-50" };
  }
};

export default function FeedDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticket, setTicket] = React.useState<Ticket | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [commentText, setCommentText] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, "tickets", id as string), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const submittedDate = data.submittedDate instanceof Timestamp ? data.submittedDate.toDate() : new Date();
        const estimatedResolutionDate = data.estimatedResolutionDate instanceof Timestamp ? data.estimatedResolutionDate.toDate() : new Date();
        setTicket({
          ...data,
          id: docSnap.id,
          submittedDate,
          estimatedResolutionDate,
        } as Ticket);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const isLiked = user && ticket?.likes?.includes(user.uid);

  const handleLike = async () => {
    if (!user || !ticket) {
      toast({ title: "Identification Required", description: "Please log in to support this report." });
      return;
    }

    const ticketRef = doc(db, "tickets", ticket.id);
    try {
      await updateDoc(ticketRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleShare = async () => {
    if (!ticket) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: ticket.title,
          text: `Check out this report on CivicPulse: ${ticket.title}`,
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link Cached", description: "Post URL copied to clipboard." });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticket || !commentText.trim()) return;

    setIsSubmitting(true);
    const ticketRef = doc(db, "tickets", ticket.id);
    const newComment: TicketComment = {
      userId: user.uid,
      userName: user.displayName || "Citizen",
      userPhotoURL: user.photoURL || undefined,
      text: commentText.trim(),
      createdAt: new Date(),
    };

    try {
      await updateDoc(ticketRef, {
        comments: arrayUnion(newComment)
      });
      setCommentText("");
      toast({ title: "Broadcast Received", description: "Your comment has been added to the stream." });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not post your comment." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-12 lg:p-20 pt-32">
        <div className="max-w-5xl mx-auto space-y-12">
          <Skeleton className="h-12 w-48 rounded-2xl" />
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="h-[600px] w-full rounded-[3rem]" />
            <Skeleton className="h-[600px] w-full rounded-[3rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Report Not Found.</h2>
          <Button asChild className="rounded-2xl h-14 px-8 font-black bg-indigo-600">
            <Link href="/feed">Return to Feed</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusContext = getStatusContext(ticket.status);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 pt-28 md:pt-36 space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <Button variant="ghost" onClick={() => router.back()} className="rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-white/50 border border-transparent hover:border-slate-100 transition-all">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Grid
          </Button>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full border shadow-sm", statusContext.bg)}>
              <statusContext.icon className={cn("h-4 w-4", statusContext.color)} />
              <span className={cn("text-[10px] font-black uppercase tracking-widest", statusContext.color)}>{statusContext.label}</span>
            </div>
            <Badge variant="outline" className="rounded-full px-4 py-1.5 font-black uppercase tracking-widest text-[10px] bg-indigo-600 border-none text-white shadow-xl shadow-indigo-600/20">
              PIN: {ticket.pincode}
            </Badge>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Main Visuals & Social Interaction */}
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                {ticket.isVoiceReport && <Zap className="h-6 w-6 text-amber-500 fill-amber-500 animate-pulse" />}
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
                  {ticket.title}
                </h1>
              </div>
              <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-indigo-50 shadow-md">
                    <AvatarImage src={ticket.userPhotoURL} alt={ticket.id} />
                    <AvatarFallback className="bg-slate-950 text-white font-black text-sm">
                      {ticket.isVoiceReport ? 'VO' : 'CN'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Authored By</p>
                    <p className="text-sm font-bold text-slate-900">
                      {ticket.isVoiceReport ? `Voice Node #${ticket.id.slice(0,4).toUpperCase()}` : `Citizen Node #${ticket.id.slice(0,4).toUpperCase()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleLike} className={cn("rounded-full h-12 w-12 transition-all", isLiked ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400")}>
                    <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full h-12 w-12 bg-slate-50 text-slate-400">
                    <Share2 className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>

            {ticket.status === 'Resolved' && ticket.completionImageUrls && ticket.completionImageUrls.length > 0 ? (
              <div className="relative aspect-[4/3] w-full rounded-[3rem] md:rounded-[4rem] overflow-hidden border-8 border-white shadow-2xl bg-slate-950 group">
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
            ) : ticket.imageUrls && ticket.imageUrls.length > 0 ? (
              <div className="relative aspect-[4/3] w-full rounded-[3rem] md:rounded-[4rem] overflow-hidden border-8 border-white shadow-2xl bg-slate-100 group">
                <Image src={ticket.imageUrls[0]} alt={ticket.title} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute bottom-10 right-10 z-10">
                  <div className="bg-slate-950/80 backdrop-blur-2xl px-6 py-3 rounded-2xl text-white flex items-center gap-3 border border-white/10 shadow-2xl">
                    <BrainCircuit className="h-5 w-5 text-indigo-400" />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Verified Score: {ticket.severityScore}/10</span>
                  </div>
                </div>
              </div>
            ) : ticket.isVoiceReport ? (
              <div className="relative aspect-[4/3] w-full rounded-[3rem] md:rounded-[4rem] overflow-hidden border-8 border-white shadow-2xl bg-slate-950 flex flex-col items-center justify-center text-center p-12">
                <div className="absolute inset-0 neural-grid opacity-10"></div>
                <div className="relative z-10 space-y-8">
                  <div className="bg-indigo-600/20 p-8 rounded-[2.5rem] border border-indigo-500/30 inline-block animate-pulse">
                    <Mic className="h-16 w-16 text-indigo-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">High-Fidelity Audio Log</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Signal Authenticity: Verified</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 h-12">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <div 
                        key={i} 
                        className="w-2 bg-indigo-500/60 rounded-full animate-bounce" 
                        style={{ 
                          height: `${30 + Math.random() * 70}%`,
                          animationDelay: `${i * 0.05}s`,
                          animationDuration: '0.6s'
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="bg-white p-10 md:p-14 rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-xl space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {ticket.isVoiceReport ? <Waves className="h-5 w-5 text-indigo-600" /> : <Info className="h-5 w-5 text-indigo-600" />}
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {ticket.isVoiceReport ? "Speech Analysis" : "Incident Narrative"}
                  </span>
                </div>
                <p className="text-lg md:text-xl font-medium text-slate-600 leading-relaxed italic">
                  "{ticket.notes || ticket.audioTranscription || "No additional context provided."}"
                </p>
              </div>

              <Separator className="bg-slate-50" />

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resolution Status</span>
                  <div className="flex items-center gap-3">
                    <div className={cn("h-3 w-3 rounded-full animate-pulse", ticket.status === 'Resolved' ? "bg-emerald-500" : "bg-indigo-500")}></div>
                    <p className="text-base font-black text-slate-900 uppercase italic tracking-tight">{ticket.status}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Citizen Support</span>
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Users className="h-5 w-5" />
                    <p className="text-base font-black text-slate-900">{ticket.reportCount || 1} Supports</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cinematic Comment Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Community Stream</h3>
              </div>

              <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
                {user ? (
                  <form onSubmit={handleAddComment} className="relative">
                    <Textarea 
                      placeholder="Contribute to the coordinate..." 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[120px] rounded-3xl border-2 p-6 pr-20 text-base font-medium resize-none focus:border-indigo-600 transition-colors"
                    />
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !commentText.trim()} 
                      className="absolute bottom-4 right-4 h-12 w-12 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/20"
                    >
                      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </form>
                ) : (
                  <div className="bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Initialize ID to participate</p>
                  </div>
                )}

                <div className="space-y-6">
                  {ticket.comments && ticket.comments.length > 0 ? (
                    ticket.comments.slice().reverse().map((comment, i) => (
                      <div key={i} className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <Avatar className="h-10 w-10 shrink-0 border border-slate-100 shadow-sm">
                          <AvatarImage src={comment.userPhotoURL} alt={comment.userName} />
                          <AvatarFallback className="bg-indigo-50 text-indigo-600 font-black text-xs">
                            {comment.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{comment.userName}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {comment.createdAt ? formatDistanceToNow(comment.createdAt instanceof Timestamp ? comment.createdAt.toDate() : new Date(comment.createdAt), { addSuffix: true }) : 'Just now'}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none text-sm font-medium text-slate-600 leading-relaxed shadow-sm">
                            {comment.text}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 opacity-40">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">No signals detected yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Geographical & AI Intel */}
          <div className="lg:col-span-5 space-y-12 sticky top-32">
            <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-2 border-white/5">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-[80px] -mr-24 -mt-24"></div>
              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Intelligence Audit</span>
                  </div>
                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 font-black text-[10px] uppercase">Stable v1.0</Badge>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-400/60">AI Severity Reasoning</p>
                  <p className="text-base md:text-lg font-medium leading-relaxed italic text-indigo-50/90">
                    {ticket.severityReasoning || "Analysis pending complete metadata synchronization."}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Grid Priority</p>
                    <p className="text-xl font-black italic uppercase tracking-tighter text-white">{ticket.priority}</p>
                  </div>
                  <BrainCircuit className="h-10 w-10 text-indigo-600 opacity-40" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Navigation className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Geospatial Lock</h3>
                </div>
                <Button variant="outline" size="sm" asChild className="rounded-xl border-2 font-black text-[10px] uppercase tracking-widest h-10">
                  <Link href={`https://www.google.com/maps/dir/?api=1&destination=${ticket.location?.latitude},${ticket.location?.longitude}`} target="_blank">
                    Navigate
                  </Link>
                </Button>
              </div>
              <div className="p-2">
                <div className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner">
                  {ticket.location && (
                    <MapView 
                      tickets={[ticket]} 
                      onJoinReport={() => {}} 
                      userLocation={{ latitude: ticket.location.latitude, longitude: ticket.location.longitude }} 
                    />
                  )}
                </div>
              </div>
              <div className="p-8 space-y-2 bg-slate-50/50">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-slate-400 mt-1" />
                  <p className="text-sm font-bold text-slate-600 leading-relaxed">{ticket.address}</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-600/20 group cursor-pointer hover:bg-indigo-700 transition-colors">
              <div className="flex justify-between items-center mb-6">
                <Users className="h-8 w-8" />
                <Badge className="bg-white/20 border-none text-white font-black text-[10px] uppercase">Collective Action</Badge>
              </div>
              <h4 className="text-2xl font-black tracking-tight mb-3">Support the Grid.</h4>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-8">Increase the visibility of this broadcast by adding your community weight to the report.</p>
              <Button disabled={!user} className="w-full h-14 rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 font-black uppercase tracking-widest text-xs">
                {user ? "Support Broadcast" : "Login to Support"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
