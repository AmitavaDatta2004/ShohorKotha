"use client";

import * as React from "react";
import Link from "next/link";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from "@/context/auth-context";
import FeedCard from "@/components/feed-card";
import type { Ticket } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rss, Plus, Activity, Zap, Sparkles, MapPin, Search, ArrowRight, LocateFixed, Loader2, Navigation, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PublicFeedPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  const [localityPincode, setLocalityPincode] = React.useState<string | null>(null);
  const [pincodeInput, setPincodeInput] = React.useState("");

  // Initialize locality from cache or defaults
  React.useEffect(() => {
    const savedPin = localStorage.getItem('shohorkotha_saved_pin');
    if (savedPin) {
      setLocalityPincode(savedPin);
    }
  }, []);

  React.useEffect(() => {
    if (!localityPincode) return;

    setLoading(true);
    const ticketsCollection = collection(db, 'tickets');
    const q = query(
      ticketsCollection, 
      where("isPublicFeed", "==", true),
      where("pincode", "==", localityPincode),
      orderBy("submittedDate", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const submittedDate = data.submittedDate instanceof Timestamp ? data.submittedDate.toDate() : new Date();
        const estimatedResolutionDate = data.estimatedResolutionDate instanceof Timestamp ? data.estimatedResolutionDate.toDate() : new Date();
        return {
          ...data,
          id: doc.id,
          submittedDate,
          estimatedResolutionDate,
        } as Ticket;
      });
      setTickets(ticketsData);
      setLoading(false);
    }, (error) => {
      console.error("Feed Query Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [localityPincode]);

  const handlePincodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pincodeInput.length >= 4) {
      setLocalityPincode(pincodeInput);
      localStorage.setItem('shohorkotha_saved_pin', pincodeInput);
    }
  };

  const handleAutoLocate = () => {
    setIsLocating(true);
    if (!("geolocation" in navigator)) {
      toast({ variant: 'destructive', title: 'GPS Unavailable', description: 'Your browser does not support geolocation.' });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          if (data.pincode) {
            setPincodeInput(data.pincode);
            setLocalityPincode(data.pincode);
            localStorage.setItem('shohorkotha_saved_pin', data.pincode);
            toast({ title: 'Grid Located', description: `Synchronized with locality: ${data.pincode}` });
          } else {
            throw new Error("Pincode not found in geocode data.");
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Localization Failed', description: 'Could not resolve PIN from your coordinates.' });
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Please enable location permissions to use auto-locate.' });
        setIsLocating(false);
      }
    );
  };

  const clearLocality = () => {
    setLocalityPincode(null);
    setPincodeInput("");
    localStorage.removeItem('shohorkotha_saved_pin');
  };

  if (!localityPincode) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Visuals */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] -ml-24 -mb-24"></div>
          <div className="absolute inset-0 neural-grid opacity-[0.03]"></div>
        </div>

        <div className="relative z-10 w-full max-w-xl text-center space-y-12 animate-in fade-in zoom-in-95 duration-1000">
          <div className="flex justify-center">
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl">
              <div className="relative flex items-center justify-center w-20 h-20">
                <div className="absolute inset-0 border-2 border-dashed border-indigo-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-2 border-2 border-indigo-500/50 rounded-full animate-pulse"></div>
                <div className="relative z-10 w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.6)]">
                  {isLocating ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <MapPin className="h-5 w-5 text-white" />}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">Locality Lock.</h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md mx-auto">Access the community feed for your specific grid using your PIN code.</p>
          </div>

          <div className="max-w-xs mx-auto space-y-6">
            <form onSubmit={handlePincodeSubmit} className="relative group">
              <Input 
                type="text" 
                placeholder="Enter PIN..." 
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-20 w-full rounded-3xl bg-white/5 border-2 border-white/10 text-white text-center text-2xl font-black tracking-[0.3em] placeholder:text-white/10 focus:border-indigo-500 transition-all shadow-2xl"
              />
              <Button 
                type="submit"
                disabled={pincodeInput.length < 4 || isLocating}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-14 w-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 disabled:opacity-0 transition-all"
              >
                <ArrowRight className="h-6 w-6" />
              </Button>
            </form>

            <div className="flex flex-col gap-4">
              <Button 
                variant="ghost" 
                onClick={handleAutoLocate} 
                disabled={isLocating}
                className="h-14 rounded-2xl bg-white/5 border border-white/10 text-indigo-400 hover:text-white hover:bg-indigo-600 font-black uppercase tracking-widest text-[10px] w-full transition-all"
              >
                {isLocating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resolving Coordinates...</>
                ) : (
                  <><LocateFixed className="mr-2 h-4 w-4" /> Use Current Location</>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
            <span>Verified Grid</span>
            <span>Local Access</span>
            <span>Neural Sync</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Cinematic Header with Massive PIN */}
      <section className="bg-slate-950 pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden text-white">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] -ml-24 -mb-24"></div>
        </div>
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="space-y-8 text-center md:text-left max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Locality: Synchronized</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">Active Grid Identification</p>
                <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none italic uppercase text-indigo-600 drop-shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                  {localityPincode}
                </h1>
              </div>

              <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed italic max-w-2xl">
                A real-time social stream of verified incidents within your immediate locality. All reports are AI-audited for community safety.
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <Button variant="ghost" onClick={clearLocality} className="text-indigo-400 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] px-6 h-12 rounded-2xl border border-indigo-400/20">
                  <Search className="mr-2 h-4 w-4" /> Switch Grid Location
                </Button>
                <Button asChild variant="outline" className="text-white border-white/10 bg-white/5 font-black uppercase tracking-widest text-[10px] px-6 h-12 rounded-2xl hover:bg-indigo-600 transition-colors">
                  <Link href="/map-view">
                    <Navigation className="mr-2 h-4 w-4" /> Explore Map View
                  </Link>
                </Button>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-6 w-full md:w-80 shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Status</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Feed</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                  <span className="text-xs font-bold text-slate-500">Local Activity</span>
                  <span className="text-2xl font-black text-white">{tickets.length} Posts</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                  <span className="text-xs font-bold text-slate-500">Security Tier</span>
                  <span className="text-xl font-black text-indigo-400 flex items-center gap-2"><Star className="h-4 w-4 fill-indigo-400" /> High</span>
                </div>
              </div>
              <Button asChild className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-xl shadow-indigo-600/20 text-xs uppercase tracking-widest">
                <Link href={user ? "/report-issue" : "/login"}>
                  <Plus className="mr-2 h-4 w-4" /> {user ? "Create Broadcast" : "Login to Post"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {loading ? (
          <div className="space-y-12">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[600px] w-full rounded-[2.5rem]" />
            ))}
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-12">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <FeedCard ticket={ticket} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-white rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
              <Rss className="h-10 w-10 text-slate-300" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Locality Silent.</h3>
              <p className="text-slate-500 font-medium">No social broadcasts found in PIN {localityPincode}.</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-16 px-10 rounded-2xl bg-indigo-600 font-black shadow-xl">
                <Link href="/report-issue">Be the First to Report</Link>
              </Button>
              <Button variant="outline" size="lg" onClick={clearLocality} className="h-16 px-10 rounded-2xl border-2 font-black">
                Switch Locality
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-white py-20 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-slate-950 p-2 rounded-xl shadow-lg">
            <Zap className="h-6 w-6 text-white fill-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic text-slate-950">Shohor Kotha</span>
        </div>
        <div className="flex justify-center gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">
          <span>Social Sync</span>
          <span>Verified Intel</span>
          <span>Local Logic</span>
        </div>
      </footer>
    </div>
  );
}
