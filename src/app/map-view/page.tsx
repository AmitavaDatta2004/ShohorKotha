
"use client";

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, Timestamp, doc, runTransaction, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Ticket, UserProfile } from '@/types';
import ViewTickets from '@/components/view-tickets';
import { useToast } from '@/hooks/use-toast';
import { allBadges } from '@/lib/badges';
import { Map as MapIcon, LocateFixed, Users, ShieldAlert, Navigation } from "lucide-react";

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-slate-50 animate-pulse rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-slate-400">
      <MapIcon className="h-10 w-10" />
      <span className="font-black uppercase tracking-widest text-[10px]">Initializing Map...</span>
    </div>
  </div>,
});

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

export default function MapViewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [userLocation, setUserLocation] = React.useState<{latitude: number; longitude: number} | null>(null);
  const [nearbyTickets, setNearbyTickets] = React.useState<Ticket[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => {
                toast({
                    variant: 'destructive',
                    title: 'Location Error',
                    description: 'Unable to retrieve your location. Nearby issues will not be shown.',
                });
            }
        );
    }
  }, [toast]);

  React.useEffect(() => {
    if (user) {
      setDataLoading(true);
      const ticketsCollection = collection(db, 'tickets');
      const unsubscribe = onSnapshot(ticketsCollection, (snapshot) => {
        const ticketsData = snapshot.docs.map(doc => {
            const data = doc.data();
            const submittedDate = data.submittedDate instanceof Timestamp ? data.submittedDate.toDate() : new Date();
            const estimatedResolutionDate = data.estimatedResolutionDate instanceof Timestamp ? data.estimatedResolutionDate.toDate() : new Date();
            const deadlineDate = data.deadlineDate instanceof Timestamp ? data.deadlineDate.toDate() : undefined;
            return {
                ...data,
                id: doc.id,
                submittedDate,
                estimatedResolutionDate,
                deadlineDate,
            } as Ticket
        });
        setTickets(ticketsData);
        setDataLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);

  React.useEffect(() => {
    if (userLocation && tickets.length > 0) {
        const nearby = tickets.filter(ticket => {
            if (ticket.location && ticket.status !== 'Resolved') {
                const distance = getDistanceFromLatLonInKm(
                    userLocation.latitude,
                    userLocation.longitude,
                    ticket.location.latitude,
                    ticket.location.longitude
                );
                return distance <= 0.5;
            }
            return false;
        });
        setNearbyTickets(nearby);
    }
  }, [userLocation, tickets]);

  const handleJoinReport = async (ticketId: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to join a report.' });
      return;
    }

    try {
        await runTransaction(db, async (transaction) => {
            const ticketRef = doc(db, 'tickets', ticketId);
            const ticketDoc = await transaction.get(ticketRef);
            if (!ticketDoc.exists()) {
                throw new Error('Ticket not found.');
            }

            const ticketData = ticketDoc.data() as Ticket;
            if (Array.isArray(ticketData.reportedBy) && ticketData.reportedBy.includes(user.uid)) {
                toast({ variant: 'default', title: 'Already Reported', description: 'You have already joined or created this report.' });
                return;
            }

            const userProfileRef = doc(db, 'users', user.uid);
            const userProfileDoc = await transaction.get(userProfileRef);
            const userProfile = userProfileDoc.data() as UserProfile;
            const userBadges = userProfile?.badges || [];

            if (!userBadges.includes('team-player')) {
                const joinedTicketsQuery = query(collection(db, 'tickets'), where('reportedBy', 'array-contains', user.uid));
                const joinedTicketsSnapshot = await getDocs(joinedTicketsQuery);
                if (joinedTicketsSnapshot.docs.filter(d => d.data().userId !== user.uid).length === 4) {
                    const badge = allBadges.find(b => b.id === 'team-player');
                    transaction.update(userProfileRef, { badges: arrayUnion('team-player') });
                    toast({
                        title: 'Badge Unlocked!',
                        description: `You've earned the "${badge?.title}" badge.`,
                    });
                }
            }
            
            const currentReportCount = ticketData.reportCount || 0;
            let newPriority = ticketData.priority;
            if (currentReportCount + 1 > 5) {
                if (ticketData.priority === 'Low') newPriority = 'Medium';
                else if (ticketData.priority === 'Medium') newPriority = 'High';
            }

            transaction.update(ticketRef, {
                reportCount: (currentReportCount || 1) + 1,
                reportedBy: arrayUnion(user.uid),
                priority: newPriority,
            });
        });

      toast({ title: 'Report Joined', description: 'Thank you for supporting this report!' });

    } catch (error: any) {
      console.error("Error joining report: ", error);
      if (error.message !== 'Ticket not found.') {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not join the report. Please try again.' });
      }
    }
  };

  if (loading || !user) {
    return null;
  }

  const unresolvedTickets = tickets.filter(ticket => ticket.status !== 'Resolved');

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-12 lg:p-16">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-white">
                <MapIcon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Map Interface</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Community Map.</h1>
            <p className="text-slate-500 font-medium text-base mt-2 italic max-w-xl">Explore active reports across your community. Your location helps identify nearby priorities.</p>
          </div>
          <div className="hidden lg:flex bg-white p-4 rounded-3xl border border-slate-100 shadow-sm items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Active Alerts</p>
                <p className="text-sm font-black text-slate-900 leading-none">{unresolvedTickets.length}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Impact Level</p>
                <p className="text-sm font-black text-slate-900 leading-none">High</p>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <div className="p-8 pb-4">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Navigation className="h-5 w-5 text-indigo-600" />
              Live Visualization
            </h3>
          </div>
          <div className="p-8 pt-0">
            {dataLoading ? (
              <Skeleton className="h-[600px] w-full rounded-[2rem]" />
            ) : (
              <div className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner">
                <MapView 
                    tickets={unresolvedTickets} 
                    onJoinReport={handleJoinReport} 
                    userLocation={userLocation}
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-600/20">
              <LocateFixed className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Issues Within 500m.</h2>
          </div>
          
          {userLocation ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <ViewTickets tickets={nearbyTickets} onJoinReport={handleJoinReport} isNearbyView={true} />
            </div>
          ) : (
            <Card className="rounded-[2.5rem] border-slate-100 bg-slate-50 p-12 text-center">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-white mx-auto flex items-center justify-center border border-slate-100">
                  <LocateFixed className="h-8 w-8 text-slate-300 animate-pulse" />
                </div>
                <p className="text-slate-500 font-medium">Using GPS to find nearby reports...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
