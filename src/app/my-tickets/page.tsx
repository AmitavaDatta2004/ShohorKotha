
"use client";

import * as React from "react";
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ViewTickets from "@/components/view-tickets";
import type { Ticket } from "@/types";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePen, UserPlus, CheckCircle2, History, ShieldCheck } from "lucide-react";

export default function MyTicketsPage() {
  const [createdTickets, setCreatedTickets] = React.useState<Ticket[]>([]);
  const [joinedTickets, setJoinedTickets] = React.useState<Ticket[]>([]);
  const { user, loading } = useAuth();
  const [dataLoading, setDataLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  React.useEffect(() => {
    if (user) {
      setDataLoading(true);

      // Query for tickets CREATED by the user
      const createdTicketsQuery = query(
        collection(db, 'tickets'), 
        where("userId", "==", user.uid), 
        orderBy("submittedDate", "desc")
      );
      
      const unsubscribeCreated = onSnapshot(createdTicketsQuery, (querySnapshot) => {
        const ticketsData = querySnapshot.docs.map(doc => {
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
            } as Ticket;
        });
        setCreatedTickets(ticketsData);
        setDataLoading(false);
      }, (error) => {
        console.error("Error fetching created tickets: ", error);
        setDataLoading(false);
      });

      // Query for tickets JOINED by the user
      const joinedTicketsQuery = query(
          collection(db, 'tickets'),
          where("reportedBy", "array-contains", user.uid)
      );

      const unsubscribeJoined = onSnapshot(joinedTicketsQuery, (querySnapshot) => {
          const ticketsData = querySnapshot.docs.map(doc => {
              const data = doc.data();
              const submittedDate = data.submittedDate instanceof Timestamp ? data.submittedDate.toDate() : new Date();
            const estimatedResolutionDate = data.estimatedResolutionDate instanceof Timestamp ? data.estimatedResolutionDate.toDate() : new Date();
            const deadlineDate = data.deadlineDate instanceof Timestamp ? data.deadlineDate.toDate() : undefined;
              return {
                  ...data,
                  id: doc.id,
                  submittedDate,
                  estimatedResolutionDate,
                  deadlineDate
              } as Ticket;
          }).filter(ticket => ticket.userId !== user.uid); // Exclude tickets they created themselves
          setJoinedTickets(ticketsData);
      }, (error) => {
          console.error("Error fetching joined tickets: ", error);
      });


      return () => {
        unsubscribeCreated();
        unsubscribeJoined();
      }
    }
  }, [user]);

  if (loading || !user) {
    return null;
  }

  const activeCreatedTickets = createdTickets.filter(t => t.status !== 'Resolved');
  const resolvedCreatedTickets = createdTickets.filter(t => t.status === 'Resolved');
  const activeJoinedTickets = joinedTickets.filter(t => t.status !== 'Resolved');
  const resolvedJoinedTickets = joinedTickets.filter(t => t.status === 'Resolved');
  
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-12 lg:p-16">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-white">
                <History className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Activity Log</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">My History.</h1>
            <p className="text-slate-500 font-medium text-base mt-2 italic max-w-xl">Track the progress of your reported issues and collaborative contributions.</p>
          </div>
          <div className="hidden lg:block bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Impact Verified</p>
              <p className="text-sm font-black text-slate-900 leading-none">{createdTickets.length + joinedTickets.length} Total Contributions</p>
            </div>
          </div>
        </header>

        {dataLoading ? (
            <div className="space-y-8">
                <Skeleton className="h-[300px] w-full rounded-[2.5rem]" />
                <Skeleton className="h-[300px] w-full rounded-[2.5rem]" />
            </div>
        ) : (
          <Tabs defaultValue="created" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1.5 h-14 bg-white shadow-sm border border-slate-100 mb-8">
              <TabsTrigger value="created" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all">
                <FilePen className="mr-2 h-4 w-4" /> My Reports
              </TabsTrigger>
              <TabsTrigger value="joined" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all">
                <UserPlus className="mr-2 h-4 w-4" /> Joined Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="created" className="mt-0 focus-visible:outline-none">
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="inline-flex gap-4 bg-transparent p-0 mb-6">
                        <TabsTrigger value="active" className="rounded-full px-6 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none font-bold text-sm border-2 border-transparent data-[state=active]:border-indigo-100">Active</TabsTrigger>
                        <TabsTrigger value="resolved" className="rounded-full px-6 py-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none font-bold text-sm border-2 border-transparent data-[state=active]:border-emerald-100">Resolved</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="mt-0 focus-visible:outline-none">
                         <ViewTickets tickets={activeCreatedTickets} />
                    </TabsContent>
                    <TabsContent value="resolved" className="mt-0 focus-visible:outline-none">
                         <ViewTickets tickets={resolvedCreatedTickets} />
                    </TabsContent>
                </Tabs>
            </TabsContent>

            <TabsContent value="joined" className="mt-0 focus-visible:outline-none">
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="inline-flex gap-4 bg-transparent p-0 mb-6">
                        <TabsTrigger value="active" className="rounded-full px-6 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none font-bold text-sm border-2 border-transparent data-[state=active]:border-indigo-100">Active</TabsTrigger>
                        <TabsTrigger value="resolved" className="rounded-full px-6 py-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 data-[state=active]:shadow-none font-bold text-sm border-2 border-transparent data-[state=active]:border-emerald-100">Resolved</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="mt-0 focus-visible:outline-none">
                        <ViewTickets tickets={activeJoinedTickets} />
                    </TabsContent>
                    <TabsContent value="resolved" className="mt-0 focus-visible:outline-none">
                        <ViewTickets tickets={resolvedJoinedTickets} />
                    </TabsContent>
                </Tabs>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
