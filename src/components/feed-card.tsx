"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MapPin, BrainCircuit, Users, Heart, MessageSquare, Share2, MoreHorizontal, ArrowUpRight, Send, Loader2, Mic, Waves, Zap, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Ticket, TicketComment } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "@/context/auth-context";
import { doc, updateDoc, arrayUnion, arrayRemove, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { ImageComparison } from "@/components/ui/image-comparison";

interface FeedCardProps {
  ticket: Ticket;
}

const priorityVariantMap: Record<Ticket['priority'], string> = {
  High: 'bg-red-500',
  Medium: 'bg-indigo-600',
  Low: 'bg-slate-500',
};

export default function FeedCard({ ticket }: FeedCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = React.useState(false);
  const [commentText, setCommentText] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isLiked = user ? (ticket.likes?.includes(user.uid) || false) : false;

  const handleLike = async () => {
    if (!user) {
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
    const url = `${window.location.origin}/feed/${ticket.id}`;
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
    if (!user || !commentText.trim()) return;

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
      toast({ title: "Comment Sent", description: "Your message is now live." });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({ variant: "destructive", title: "Failed", description: "Could not post comment." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isResolved = ticket.status === 'Resolved';
  const hasCompletionImages = ticket.completionImageUrls && ticket.completionImageUrls.length > 0;

  return (
    <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden bg-white group transition-all duration-500 max-w-xl mx-auto">
      {/* Post Header */}
      <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-indigo-50 shadow-sm">
            <AvatarImage src={ticket.userPhotoURL} alt={ticket.id} />
            <AvatarFallback className="bg-indigo-600 text-white font-black text-xs">
              {ticket.isVoiceReport ? 'VO' : 'CN'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900 leading-none">
              {ticket.isVoiceReport ? `Voice Node #${ticket.id.slice(0, 4).toUpperCase()}` : `Citizen Node #${ticket.id.slice(0, 4).toUpperCase()}`}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {formatDistanceToNow(new Date(ticket.submittedDate), { addSuffix: true })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ticket.pincode && (
            <Badge className="bg-slate-950 text-white border-none font-black text-[10px] uppercase px-3 py-1 rounded-lg">
              GRID: {ticket.pincode}
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-400">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      {/* Visual Content Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 border-y border-slate-50">
        {isResolved && hasCompletionImages ? (
          <div className="w-full h-full relative">
            <ImageComparison 
              before={ticket.imageUrls[0]} 
              after={ticket.completionImageUrls![0]} 
              beforeOverlay={
                <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
                  <div className="bg-slate-950/80 backdrop-blur-xl px-4 py-2 rounded-2xl text-white flex items-center gap-2 shadow-2xl border border-white/10">
                    <BrainCircuit className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{ticket.severityScore || '?'}/10 Severity</span>
                  </div>
                </div>
              }
              afterOverlay={
                <div className="absolute bottom-4 right-4 z-30 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-xl p-2 rounded-xl shadow-2xl text-emerald-600 border border-white/20">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
              }
            />
          </div>
        ) : ticket.imageUrls && ticket.imageUrls.length > 0 ? (
          <Image 
            src={ticket.imageUrls[0]} 
            alt={ticket.title} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-1000" 
          />
        ) : ticket.isVoiceReport ? (
          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-12 text-center relative">
            <div className="absolute inset-0 neural-grid opacity-[0.05]"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex justify-center">
                <div className="bg-indigo-600/20 p-6 rounded-[2rem] border border-indigo-500/20 shadow-2xl animate-pulse">
                  <Mic className="h-12 w-12 text-indigo-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Voice Broadcast.</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">High-Fidelity Audio Signal</p>
              </div>
              <div className="flex items-center justify-center gap-1.5 h-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div 
                    key={i} 
                    className="w-1.5 bg-indigo-500 rounded-full animate-bounce" 
                    style={{ 
                      height: `${30 + Math.random() * 70}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s'
                    }} 
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <BrainCircuit className="h-12 w-12 opacity-20" />
          </div>
        )}
        
        <div className="absolute top-4 right-4 z-10">
          <Badge className={cn("rounded-full px-4 py-1.5 font-black uppercase tracking-widest text-[9px] shadow-2xl border-none", priorityVariantMap[ticket.priority])}>
            {ticket.priority}
          </Badge>
        </div>

        {!isResolved && ticket.imageUrls && ticket.imageUrls.length > 0 && (
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-slate-950/80 backdrop-blur-xl px-4 py-2 rounded-2xl text-white flex items-center gap-2 shadow-2xl border border-white/10">
              <BrainCircuit className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">{ticket.severityScore || '?'}/10 Severity</span>
            </div>
          </div>
        )}
      </div>

      {/* Interaction Bar */}
      <div className="p-4 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLike}
            className={cn(
              "rounded-full h-10 w-10 transition-colors", 
              isLiked ? "text-red-500 hover:bg-red-50" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            )}
          >
            <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowComments(!showComments)}
            className={cn(
              "rounded-full h-10 w-10 hover:text-indigo-600 hover:bg-indigo-50 transition-colors",
              showComments && "bg-indigo-50 text-indigo-600"
            )}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full h-10 w-10 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
            <Share2 className="h-6 w-6" />
          </Button>
        </div>
        <div className="flex gap-2">
          {ticket.likes && ticket.likes.length > 0 && (
            <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-100 px-3 py-1 font-black text-[10px] uppercase tracking-widest">
              {ticket.likes.length} Likes
            </Badge>
          )}
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 px-3 py-1 font-black text-[10px] uppercase tracking-widest">
            <Users className="h-3 w-3 mr-1.5" /> {ticket.reportCount || 1} Supports
          </Badge>
        </div>
      </div>

      {/* Caption Area */}
      <CardContent className="p-6 pt-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          {ticket.isVoiceReport && <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />}
          <h4 className="text-base font-black text-slate-900 leading-tight italic line-clamp-1">
            {ticket.title}
          </h4>
        </div>
        {ticket.notes && (
          <p className="text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed">
            <span className={cn(
              "font-black mr-2",
              isResolved ? "text-emerald-600" : "text-slate-900"
            )}>
              {isResolved ? "SOLVED" : `Status: ${ticket.status}`}
            </span>
            {ticket.notes}
          </p>
        )}
        <div className="flex items-center gap-2 text-indigo-600/60 mt-2">
          <MapPin className="h-3 w-3" />
          <span className="text-[10px] font-bold uppercase tracking-widest truncate">{ticket.address}</span>
        </div>
      </CardContent>

      {/* Inline Comments Section */}
      {showComments && (
        <CardContent className="p-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
          <Separator className="mb-6 bg-slate-50" />
          <div className="space-y-4 max-h-[240px] overflow-y-auto scrollbar-hide mb-6">
            {ticket.comments && ticket.comments.length > 0 ? (
              ticket.comments.map((comment, i) => (
                <div key={i} className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0 border border-slate-100">
                    <AvatarImage src={comment.userPhotoURL} alt={comment.userName} />
                    <AvatarFallback className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase">
                      {comment.userName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none flex-1">
                    <p className="text-[10px] font-black text-slate-900 mb-1">{comment.userName}</p>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-[10px] font-black uppercase tracking-widest text-slate-300">Be the first to coordinate.</p>
            )}
          </div>
          
          {user ? (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add contextual note..."
                className="h-12 rounded-xl border-2 bg-white px-4 text-xs font-bold"
              />
              <Button 
                type="submit" 
                disabled={isSubmitting || !commentText.trim()} 
                className="h-12 w-12 rounded-xl bg-indigo-600 shrink-0 shadow-lg shadow-indigo-600/20"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          ) : (
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Login to participate</p>
          )}
        </CardContent>
      )}

      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full h-14 rounded-2xl bg-slate-950 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest transition-all group shadow-xl shadow-slate-900/10">
          <Link href={`/feed/${ticket.id}`}>
            {isResolved ? "Verify Completion Audit" : "Review AI Audit"}
            <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
