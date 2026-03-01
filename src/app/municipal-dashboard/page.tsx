
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  collection, 
  onSnapshot, 
  Timestamp, 
  query, 
  where,
  doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { 
  ShieldAlert, 
  Activity, 
  Clock, 
  TrendingUp, 
  Zap, 
  Navigation, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  Briefcase,
  Trophy,
  ArrowRight,
  GanttChartSquare,
  Mic,
  Phone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ViewTickets from "@/components/view-tickets";
import type { Ticket, Supervisor } from "@/types";

const MunicipalMapView = dynamic(() => import("@/components/municipal-map-view"), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-[3rem]" />,
});

export default function MunicipalDashboardPage() {
  const router = useRouter();
  const [allTickets, setAllTickets] = React.useState<Ticket[]>([]);
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [municipalUser, setMunicipalUser] = React.useState<any>(null);
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
    const storedUser = localStorage.getItem('municipalUser');
    if (!storedUser) {
      router.push('/login');
    } else {
      setMunicipalUser(JSON.parse(storedUser));
    }
  }, [router]);

  React.useEffect(() => {
    if (municipalUser) {
      setDataLoading(true);
      const ticketsCollection = collection(db, 'tickets');
      const unsubscribeTickets = onSnapshot(ticketsCollection, (snapshot) => {
        const ticketsData = snapshot.docs.map(doc => {
          const data = doc.data();
          const submittedDate = data.submittedDate instanceof Timestamp ? data.submittedDate.toDate() : new Date();
          const estimatedResolutionDate = data.estimatedResolutionDate instanceof Timestamp ? data.estimatedResolutionDate.toDate() : new Date();
          const deadlineDate = data.deadlineDate instanceof Timestamp ? data.deadlineDate.toDate() : undefined;
          return { ...data, id: doc.id, submittedDate, estimatedResolutionDate, deadlineDate } as Ticket;
        });
        setAllTickets(ticketsData);
        setDataLoading(false);
      });

      const supervisorsQuery = query(collection(db, 'supervisors'), where("municipalId", "==", municipalUser.id));
      const unsubscribeSupervisors = onSnapshot(supervisorsQuery, (snapshot) => {
        const supervisorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supervisor));
        setSupervisors(supervisorsData);
      });

      return () => {
        unsubscribeTickets();
        unsubscribeSupervisors();
      };
    }
  }, [municipalUser]);

  if (!municipalUser || dataLoading) {
    return (
      <div className="p-6 md:p-10 lg:p-14 max-w-7xl mx-auto space-y-14">
        <Skeleton className="h-24 w-1/2 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-8 h-80 rounded-[3rem]" />
          <Skeleton className="lg:col-span-4 h-80 rounded-[3rem]" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-[3.5rem]" />
      </div>
    );
  }

  const triageTickets = allTickets.filter(ticket => ticket.status === 'Submitted');
  const activeTickets = allTickets.filter(ticket => ticket.status !== 'Resolved' && ticket.status !== 'Submitted');
  const resolvedTickets = allTickets.filter(ticket => ticket.status === 'Resolved');
  const voiceTickets = allTickets.filter(ticket => ticket.isVoiceReport);
  const avgWorkforceTrust = supervisors.length > 0 
    ? Math.round(supervisors.reduce((acc, s) => acc + (s.trustPoints || 100), 0) / supervisors.length) 
    : 100;

  return (
    <div className="p-4 md:p-10 lg:p-14 max-w-7xl mx-auto space-y-10 md:space-y-14">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-slate-100 pb-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
            Operational Command. <br className="md:hidden" />
            <span className="text-indigo-600">{municipalUser.name || 'Official'}</span>
          </h1>
          <p className="text-slate-500 font-medium text-base md:text-lg italic">
            Monitoring city maintenance and team efficiency.
          </p>
        </div>
        <Button asChild size="lg" className="w-full md:w-auto rounded-3xl font-black bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 px-10 py-10 text-xl group h-auto">
          <Link href="/municipal-dashboard/analytics">
            <BarChart3 className="mr-3 h-7 w-7 group-hover:scale-110 transition-transform"/> 
            Insights & Data
          </Link>
        </Button>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-6 md:p-14 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full blur-[120px] -mr-40 -mt-40 group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
                  <Clock className="h-6 w-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Current Time</span>
              </div>
              <div className="space-y-2">
                <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter tabular-nums">
                  {currentTime || '--:--:--'}
                </p>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{currentDate}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row md:flex-col gap-8 md:gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-10 md:pt-0 md:pl-16 w-full md:w-auto">
              <div className="space-y-3 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-3">Operational Load</p>
                <div className="flex items-center gap-4 bg-emerald-50 px-6 py-3 rounded-full border border-emerald-100 w-fit">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] md:text-xs font-black text-emerald-700 uppercase tracking-widest whitespace-nowrap">{allTickets.length} Total Incidents</span>
                </div>
              </div>
              <div className="space-y-3 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-3">Fix Trajectory</p>
                <div className="flex items-center gap-4 bg-indigo-50 px-6 py-3 rounded-full border border-indigo-100 w-fit">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  <span className="text-[10px] md:text-xs font-black text-indigo-600 uppercase tracking-widest whitespace-nowrap">Active Phase</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-950 rounded-[2rem] md:rounded-[3rem] p-6 md:p-14 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
          <div className="absolute -bottom-16 -right-12 opacity-10">
            <Activity className="h-56 w-64 text-indigo-400" />
          </div>
          <div className="relative z-10 space-y-8 h-full flex flex-col">
            <div className="flex items-center gap-4">
              <Zap className="h-6 w-6 text-indigo-400 fill-indigo-400" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-200">New Reports</span>
            </div>
            
            {triageTickets.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-2xl font-black tracking-tight">{triageTickets.length} Pending Assignments</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">New reports require assignment to field staff for resolution.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-2xl font-black tracking-tight">Queue Empty</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">No new reports currently require immediate action.</p>
              </div>
            )}

            <div className="mt-auto pt-10">
              <Button asChild variant="outline" className="w-full rounded-2xl h-16 font-black border-2 border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-all text-sm uppercase tracking-widest group">
                <Link href="#triage-hub">
                  Review Queue <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Twilio Service Monitor Card */}
      <section className="bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl border-2 border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-6 flex-1">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
                <Mic className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Twilio Integration Node: Synchronized</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight italic">Universal Voice Triage active.</h2>
            <p className="text-slate-400 text-base font-medium leading-relaxed max-w-xl">
              Citizen reports arriving via voice signal are automatically transcribed and severity-scored. Ensure the webhook is correctly configured to point to your deployment endpoint.
            </p>
            <div className="flex flex-wrap gap-6 pt-4 border-t border-white/5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Signal Protocol</p>
                <p className="text-sm font-bold text-indigo-400">High-Fidelity Audio</p>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Active Listeners</p>
                <p className="text-sm font-bold text-indigo-400">{voiceTickets.length} Voice Nodes</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl text-center shrink-0 w-full md:w-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">Universal Dispatch Node</p>
            <div className="flex items-center justify-center gap-4 text-3xl font-black text-white mb-6">
              <Phone className="h-7 w-7 text-emerald-400 animate-pulse" />
              +13142716288
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-black text-[10px] uppercase tracking-widest px-6 py-2 rounded-full">
              System Online
            </Badge>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        <Card className="col-span-2 lg:col-span-1 rounded-[2rem] md:rounded-[2.5rem] bg-slate-900 text-white shadow-2xl border-none overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
          <CardHeader className="pb-4 relative z-10 p-6 md:p-10">
            <GanttChartSquare className="h-7 w-7 text-indigo-400 mb-4 md:mb-6" />
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">System Workload</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 px-6 md:px-10 pb-10">
            <div className="text-5xl md:text-6xl font-black">{activeTickets.length}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4">Active tasks being fixed</p>
          </CardContent>
        </Card>

        <Card className="col-span-1 rounded-[2rem] md:rounded-[2.5rem] bg-white border-slate-100 shadow-xl overflow-hidden relative group">
          <CardHeader className="pb-4 p-6 md:p-10">
            <CheckCircle2 className="h-7 w-7 text-emerald-500 mb-4 md:mb-6" />
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Resolution Output</CardTitle>
          </CardHeader>
          <CardContent className="px-6 md:px-10 pb-10">
            <div className="text-4xl md:text-5xl font-black text-slate-900">{resolvedTickets.length}</div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-4 truncate">Successfully fixed</p>
          </CardContent>
        </Card>

        <Card className="col-span-1 rounded-[2rem] md:rounded-[2.5rem] bg-indigo-50 border-indigo-100 shadow-inner overflow-hidden relative group">
          <CardHeader className="pb-4 p-6 md:p-10">
            <ShieldAlert className="h-7 w-7 text-indigo-600 mb-4 md:mb-6" />
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Staff Performance</CardTitle>
          </CardHeader>
          <CardContent className="px-6 md:px-10 pb-10">
            <div className="text-2xl md:text-4xl font-black text-indigo-900 uppercase tracking-tighter truncate">
              {avgWorkforceTrust >= 90 ? 'Elite' : avgWorkforceTrust >= 70 ? 'Optimal' : 'Low'}
            </div>
            <p className="text-indigo-600/60 text-xs font-bold uppercase tracking-widest mt-4">Trust: {avgWorkforceTrust}%</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-12 pt-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-10">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
            <Navigation className="h-6 w-6" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Issue Map.</h2>
        </div>

        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden p-6 md:p-10">
          <div className="rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner">
            <MunicipalMapView tickets={allTickets.filter(t => t.status !== 'Resolved')} />
          </div>
        </div>
      </section>

      <section id="triage-hub" className="space-y-12 pt-6 scroll-mt-28">
        <div className="flex items-center justify-between border-b border-slate-100 pb-10">
          <div className="flex items-center gap-4">
            <div className="bg-amber-600 p-3 rounded-2xl text-white shadow-lg shadow-amber-600/20">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">New Reports Queue.</h2>
          </div>
          <Badge variant="secondary" className="px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest bg-amber-50 text-amber-700 border-amber-100 border">
            {triageTickets.length} Unassigned
          </Badge>
        </div>

        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm p-6 md:p-10">
          <ViewTickets 
            tickets={triageTickets} 
            supervisors={supervisors} 
            isMunicipalView={true} 
          />
        </div>
      </section>
    </div>
  );
}
