"use client";

import * as React from "react";
import { collection, query, where, onSnapshot, Timestamp, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ViewTickets from "@/components/view-tickets";
import type { Ticket, Supervisor } from "@/types";
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  CheckCircle2, 
  Zap, 
  Clock, 
  TrendingUp, 
  Activity, 
  ShieldCheck
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupervisorDashboardPage() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [supervisorUser, setSupervisorUser] = React.useState<Supervisor | null>(null);
  const [dataLoading, setDataLoading] = React.useState(true);
  const router = useRouter();
  const [currentTime, setCurrentTime] = React.useState<string | null>(null);
  const [currentDate, setCurrentDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('supervisorUser');
    if (!storedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setSupervisorUser(parsedUser);
    }
  }, [router]);
  
  React.useEffect(() => {
    if (supervisorUser) {
      setDataLoading(true);
      const ticketsCollection = collection(db, 'tickets');
      const q = query(ticketsCollection, where("assignedSupervisorId", "==", supervisorUser.id));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
        });
        setTickets(ticketsData);
        setDataLoading(false);
      });

      const supervisorDocRef = doc(db, 'supervisors', supervisorUser.id);
      const unsubscribeSup = onSnapshot(supervisorDocRef, (doc) => {
        if (doc.exists()) {
          setSupervisorUser({ id: doc.id, ...doc.data() } as Supervisor);
        }
      });

      return () => {
        unsubscribe();
        unsubscribeSup();
      };
    }
  }, [supervisorUser?.id]);

  if (!supervisorUser || dataLoading) {
    return (
      <div className="p-6 md:p-10 lg:p-14 max-w-7xl mx-auto space-y-14 overflow-hidden">
        <Skeleton className="h-24 w-1/2 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-8 h-80 rounded-[3rem]" />
          <Skeleton className="lg:col-span-4 h-80 rounded-[3rem]" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-[3.5rem]" />
      </div>
    );
  }

  const activeTickets = tickets.filter(t => t.status === 'In Progress' || t.status === 'Pending Approval');
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved');

  return (
    <div className="p-6 md:p-10 lg:p-14 max-w-7xl mx-auto space-y-10 md:space-y-14 overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-slate-100 pb-10 md:pb-12">
        <div className="space-y-4 max-w-full">
          <h1 className="text-3xl md:text-6xl font-black text-indigo-600 tracking-tight leading-none truncate">
            {supervisorUser.name}
          </h1>
          <p className="text-slate-500 font-medium text-base md:text-lg italic">
            Active field missions and resolution documentation.
          </p>
        </div>
        <Button asChild size="lg" className="w-full md:w-auto rounded-3xl font-black bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 px-10 py-8 md:py-10 text-lg md:text-xl group">
          <Link href="/supervisor-dashboard/analytics">
            <Zap className="mr-3 h-7 w-7 group-hover:scale-110 transition-transform"/> 
            Performance Data
          </Link>
        </Button>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-10 md:p-14 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full blur-[120px] -mr-40 -mt-40 group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
                  <Clock className="h-6 w-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Dispatch Time</span>
              </div>
              <div className="space-y-2">
                <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
                  {currentTime || '--:--:--'}
                </p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{currentDate}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row md:flex-col gap-10 md:gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-10 md:pt-0 md:pl-16 w-full md:w-auto">
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 leading-none mb-3">Assignment Load</p>
                <div className="flex items-center gap-4 bg-emerald-50 px-6 py-3 rounded-full border border-emerald-100 w-fit">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">{tickets.length} Active Missions</span>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 leading-none mb-3">Service Status</p>
                <div className="flex items-center gap-4 bg-indigo-50 px-6 py-3 rounded-full border border-indigo-100 w-fit">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Optimal Phase</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-950 rounded-[2.5rem] md:rounded-[3.5rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
          <div className="absolute -bottom-16 -right-12 opacity-10">
            <Activity className="h-56 w-64 text-indigo-400" />
          </div>
          <div className="relative z-10 space-y-10 h-full flex flex-col">
            <div className="flex items-center gap-4">
              <ShieldCheck className="h-6 w-6 text-indigo-400 fill-indigo-400" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-200">Integrity Protocol</span>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-black tracking-tight italic">Trust Level: {supervisorUser.trustPoints || 100}%</h3>
              <p className="text-slate-400 text-base font-medium leading-relaxed">Maintaining a high trust score ensures rapid approval of resolution reports.</p>
            </div>

            <div className="mt-auto pt-10">
              <div className="flex justify-between items-end mb-4">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Current Standing</p>
                <p className="text-xs font-black text-white/60">Ranked Superior</p>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${supervisorUser.trustPoints || 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        <Card className="rounded-[2rem] md:rounded-[3rem] bg-slate-900 text-white shadow-2xl border-none overflow-hidden relative group p-10 col-span-1">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
          <div className="relative z-10">
            <Briefcase className="h-7 w-7 text-indigo-400 mb-6" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pending Actions</p>
            <div className="text-5xl md:text-6xl font-black mt-2">{activeTickets.length}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4">Field attention required</p>
          </div>
        </Card>

        <Card className="rounded-[2rem] md:rounded-[3rem] bg-white border-slate-100 shadow-xl overflow-hidden relative group p-10 col-span-1">
          <CheckCircle2 className="h-7 w-7 text-emerald-500 mb-6" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Resolved Output</p>
          <div className="text-5xl md:text-6xl font-black text-slate-900 mt-2">{resolvedTickets.length}</div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-4 truncate">Successfully closed</p>
        </Card>

        <Card className="rounded-[2rem] md:rounded-[3rem] bg-indigo-50 border-indigo-100 shadow-inner overflow-hidden relative group p-10 col-span-2 lg:col-span-1">
          <Zap className="h-7 w-7 text-indigo-600 mb-6" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Efficiency Score</p>
          <div className="text-4xl md:text-5xl font-black text-indigo-900 uppercase tracking-tighter mt-2">
            Level {Math.floor((supervisorUser.efficiencyPoints || 0) / 100) + 1}
          </div>
          <p className="text-indigo-600/60 text-xs font-bold uppercase tracking-widest mt-4">Total Points: {supervisorUser.efficiencyPoints || 0}</p>
        </Card>
      </section>

      <section className="space-y-10 md:space-y-14 pt-6">
        <div className="flex items-end justify-between border-b border-slate-100 pb-10">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Resolution Hub.</h2>
            <p className="text-slate-500 font-medium text-base md:text-lg italic">Coordinate and document field fixes.</p>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-[2rem] p-2 h-16 md:h-20 bg-white shadow-sm border border-slate-100 mb-10 md:mb-14">
                  <TabsTrigger value="active" className="rounded-2xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-xs md:text-sm uppercase tracking-widest transition-all">
                    <Briefcase className="mr-3 h-5 w-5 md:h-6 md:w-6" /> Active Work
                  </TabsTrigger>
                  <TabsTrigger value="resolved" className="rounded-2xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-xs md:text-sm uppercase tracking-widest transition-all">
                    <CheckCircle2 className="mr-3 h-5 w-5 md:h-6 md:w-6" /> History
                  </TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="mt-0 focus-visible:outline-none">
                  <ViewTickets tickets={activeTickets} isSupervisorView={true} />
              </TabsContent>
              <TabsContent value="resolved" className="mt-0 focus-visible:outline-none">
                  <ViewTickets tickets={resolvedTickets} isSupervisorView={true} />
              </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
