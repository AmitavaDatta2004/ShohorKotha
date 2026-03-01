
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { 
  FilePen, 
  CheckCircle2,
  Shield,
  Clock,
  ArrowRight,
  Zap,
  Star,
  Activity,
  Navigation,
  TrendingUp,
  Phone,
  Mic
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { onSnapshot, doc, collection, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile, Ticket } from "@/types";
import { formatDistanceToNow } from "date-fns";

export default function CitizenDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [activeCount, setActiveCount] = React.useState(0);
  const [resolvedCount, setResolvedCount] = React.useState(0);
  const [totalSystemReports, setTotalSystemReports] = React.useState(0);
  const [latestTicket, setLatestTicket] = React.useState<Ticket | null>(null);
  const [currentTime, setCurrentTime] = React.useState<string | null>(null);
  const [currentDate, setCurrentDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
    if (user) {
      const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          setProfile(doc.data() as UserProfile);
        }
      });

      const q = query(collection(db, "tickets"), where("userId", "==", user.uid));
      const unsubscribeTickets = onSnapshot(q, (snapshot) => {
        const ticketsData = snapshot.docs.map(d => d.data());
        setActiveCount(ticketsData.filter(t => t.status !== 'Resolved').length);
        setResolvedCount(ticketsData.filter(t => t.status === 'Resolved').length);
      });

      const qLatest = query(
        collection(db, "tickets"), 
        where("userId", "==", user.uid), 
        orderBy("submittedDate", "desc"), 
        limit(1)
      );
      const unsubscribeLatest = onSnapshot(qLatest, (snapshot) => {
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          const submittedDate = docData.submittedDate instanceof Timestamp 
            ? docData.submittedDate.toDate() 
            : new Date();
          
          setLatestTicket({ 
            ...docData, 
            id: snapshot.docs[0].id, 
            submittedDate 
          } as Ticket);
        }
      });

      const unsubscribeGlobal = onSnapshot(collection(db, "tickets"), (snapshot) => {
        setTotalSystemReports(snapshot.size);
      });

      return () => {
        unsubscribe();
        unsubscribeTickets();
        unsubscribeLatest();
        unsubscribeGlobal();
      };
    }
  }, [user]);

  if (loading || !user) {
    return null;
  }

  const nextMilestone = profile?.utilityPoints ? (Math.floor(profile.utilityPoints / 100) + 1) * 100 : 100;
  const milestoneProgress = profile?.utilityPoints ? (profile.utilityPoints % 100) : 0;

  return (
    <div className="p-4 md:p-10 lg:p-14 max-w-7xl mx-auto space-y-10 md:space-y-14">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-slate-100 pb-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
            Welcome back, <br className="md:hidden" />
            <span className="text-indigo-600">{user.displayName?.split(' ')[0]}</span>.
          </h1>
          <p className="text-slate-500 font-medium text-lg italic">
            Active since {profile?.joinedDate ? (profile.joinedDate instanceof Timestamp ? profile.joinedDate.toDate().getFullYear() : '2024') : '2024'}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Button asChild size="lg" className="w-full md:w-auto rounded-3xl font-black bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 px-10 py-10 text-xl group h-auto">
            <Link href="/report-issue">
              <FilePen className="mr-3 h-7 w-7 group-hover:rotate-12 transition-transform"/> 
              File New Report
            </Link>
          </Button>
        </div>
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
                <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Local Operational Time</span>
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
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-3">Global Activity</p>
                <div className="flex items-center gap-4 bg-emerald-50 px-6 py-3 rounded-full border border-emerald-100 w-fit">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] md:text-xs font-black text-emerald-700 uppercase tracking-widest whitespace-nowrap">{totalSystemReports} Reports Logged</span>
                </div>
              </div>
              <div className="space-y-3 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-3">Community Pulse</p>
                <div className="flex items-center gap-4 bg-indigo-50 px-6 py-3 rounded-full border border-indigo-100 w-fit">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  <span className="text-[10px] md:text-xs font-black text-indigo-600 uppercase tracking-widest whitespace-nowrap">Growth Phase</span>
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
              <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-200">Latest Mission</span>
            </div>
            
            {latestTicket ? (
              <div className="space-y-4">
                <h3 className="text-2xl font-black tracking-tight line-clamp-1">{latestTicket.title}</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border-none font-black text-xs uppercase tracking-widest px-4 py-1">
                    {latestTicket.status}
                  </Badge>
                  <span className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                    Updated {formatDistanceToNow(latestTicket.submittedDate, { addSuffix: true })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-2xl font-black tracking-tight">No Active Missions</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">Report your first issue to start tracking your community impact.</p>
              </div>
            )}

            <div className="mt-auto pt-10">
              <div className="flex justify-between items-end mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Impact Milestone</p>
                <p className="text-[10px] font-black text-white/60">{profile?.utilityPoints || 0} / {nextMilestone} PTS</p>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${milestoneProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Twilio Service Status Card */}
      <section className="bg-indigo-600 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl">
              <Mic className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Twilio Intelligence Node: Active</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight italic">
              Report via Voice Signal.
            </h2>
            <p className="text-indigo-100 text-lg font-medium leading-relaxed opacity-80">
              No internet? No problem. Use our high-fidelity voice reporting channel. Simply call our node, describe the issue, and mention your PIN code.
            </p>
          </div>
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] text-slate-950 shadow-2xl space-y-4 text-center shrink-0 w-full md:w-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Dial Universal Dispatch</p>
            <div className="flex items-center justify-center gap-4 text-3xl md:text-4xl font-black tracking-tighter tabular-nums text-indigo-600">
              <Phone className="h-8 w-8" />
              +13142716288
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-none font-black uppercase text-[10px] tracking-widest px-4 py-1 rounded-full">
              Verified Voice Identity
            </Badge>
          </div>
        </div>
      </section>

      {/* Grid Snapshot Section */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        <Card className="col-span-2 lg:col-span-1 rounded-[2rem] md:rounded-[2.5rem] bg-slate-900 text-white shadow-2xl border-none overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
          <CardHeader className="pb-4 relative z-10 p-6 md:p-10">
            <Activity className="h-7 w-7 text-indigo-400 mb-4 md:mb-6" />
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Active Tracking</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 px-6 md:px-10 pb-10">
            <div className="text-5xl md:text-6xl font-black">{activeCount}</div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4">Reports in resolution cycle</p>
          </CardContent>
        </Card>

        <Card className="col-span-1 rounded-[2rem] md:rounded-[2.5rem] bg-white border-slate-100 shadow-xl overflow-hidden relative group">
          <CardHeader className="pb-4 p-6 md:p-10">
            <CheckCircle2 className="h-7 w-7 text-emerald-500 mb-4 md:mb-6" />
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Verified</CardTitle>
          </CardHeader>
          <CardContent className="px-6 md:px-10 pb-10">
            <div className="text-4xl md:text-5xl font-black text-slate-900">{resolvedCount}</div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-4 truncate">Successfully closed</p>
          </CardContent>
        </Card>

        <Card className="col-span-1 rounded-[2rem] md:rounded-[2.5rem] bg-indigo-50 border-indigo-100 shadow-inner overflow-hidden relative group">
          <CardHeader className="pb-4 p-6 md:p-10">
            <Shield className="h-7 w-7 text-indigo-600 mb-4 md:mb-6" />
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Trust Index</CardTitle>
          </CardHeader>
          <CardContent className="px-6 md:px-10 pb-10">
            <div className="text-2xl md:text-4xl font-black text-indigo-900 uppercase tracking-tighter truncate">
              { (profile?.trustPoints || 100) >= 90 ? 'Guardian' : (profile?.trustPoints || 100) >= 70 ? 'Pioneer' : 'Member' }
            </div>
            <p className="text-indigo-600/60 text-xs font-bold uppercase tracking-widest mt-4">Level: {profile?.trustPoints || 100}%</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-12 pt-6">
        <div className="flex items-end justify-between border-b border-slate-100 pb-10">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Command Center</h2>
            <p className="text-slate-500 font-medium text-base">Coordinate your community monitoring tasks.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          <Card className="rounded-[2.5rem] md:rounded-[3rem] border-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group overflow-hidden bg-white">
            <CardHeader className="p-8 md:p-10 pb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600/10 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                <FilePen className="h-7 w-7 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Report Issue</CardTitle>
              <CardDescription className="font-medium text-slate-500 text-sm mt-2">Log an incident for processing.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 md:px-10 pb-10">
              <Button asChild variant="outline" className="w-full rounded-2xl h-16 font-black border-2 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all text-sm uppercase tracking-widest">
                <Link href="/report-issue">Analyze Report</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] md:rounded-[3rem] border-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group overflow-hidden bg-white">
            <CardHeader className="p-8 md:p-10 pb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-600/10 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                <Navigation className="h-7 w-7 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Community Map</CardTitle>
              <CardDescription className="font-medium text-slate-500 text-sm mt-2">Monitor alerts across the city grid.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 md:px-10 pb-10">
              <Button asChild variant="outline" className="w-full rounded-2xl h-16 font-black border-2 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all text-sm uppercase tracking-widest">
                <Link href="/map-view">Enter Map View</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] md:rounded-[3rem] border-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group overflow-hidden bg-white">
            <CardHeader className="p-8 md:p-10 pb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-amber-600/10 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                <Star className="h-7 w-7 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Hall of Fame</CardTitle>
              <CardDescription className="font-medium text-slate-500 text-sm mt-2">Compare impact with top contributors.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 md:px-10 pb-10">
              <Button asChild variant="outline" className="w-full rounded-2xl h-16 font-black border-2 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all text-sm uppercase tracking-widest">
                <Link href="/leaderboard">Open Rankings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
