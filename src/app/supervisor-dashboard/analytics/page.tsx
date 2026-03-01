
"use client";

import * as React from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Pie, 
  PieChart, 
  Cell, 
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import type { Supervisor, Ticket } from '@/types';
import { 
  BadgeHelp, 
  CheckCircle, 
  LineChart as LineChartIcon, 
  Shield, 
  ShieldAlert, 
  Zap, 
  Sparkles,
  Activity,
  ArrowUpRight,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_COLORS: { [key: string]: string } = {
    'In Progress': '#6366f1', // indigo-500
    'Pending Approval': '#f97316', // orange-500
    Resolved: '#10b981', // emerald-500
};

export default function SupervisorAnalyticsPage() {
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);
    const [supervisorUser, setSupervisorUser] = React.useState<Supervisor | null>(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('supervisorUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setSupervisorUser(parsedUser);

            const ticketsQuery = query(collection(db, 'tickets'), where("assignedSupervisorId", "==", parsedUser.id));
            const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
                const ticketsData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const submittedDate = data.submittedDate instanceof Timestamp ? data.submittedDate.toDate() : new Date();
                    const deadlineDate = data.deadlineDate instanceof Timestamp ? data.deadlineDate.toDate() : undefined;
                    return { ...data, id: doc.id, submittedDate, deadlineDate } as Ticket;
                });
                setTickets(ticketsData);
                setDataLoading(false);
            });

            return () => unsubscribe();
        }
    }, []);

    const stats = React.useMemo(() => {
        const resolvedTickets = tickets.filter(t => t.status === 'Resolved');
        const pendingTickets = tickets.length - resolvedTickets.length;
        return { resolvedTickets: resolvedTickets.length, pendingTickets };
    }, [tickets]);

    const statusData = React.useMemo(() => {
        const counts = tickets.reduce((acc, ticket) => {
            if (ticket.status !== 'Submitted') {
                 acc[ticket.status] = (acc[ticket.status] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] }));
    }, [tickets]);

    const categoryData = React.useMemo(() => {
        const resolvedTickets = tickets.filter(t => t.status === 'Resolved');
        const counts = resolvedTickets.reduce((acc, ticket) => {
            acc[ticket.category] = (acc[ticket.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [tickets]);

    const resolvedOverTimeData = React.useMemo(() => {
        const resolvedTickets = tickets.filter(t => t.status === 'Resolved' && t.deadlineDate);
        const counts = resolvedTickets.reduce((acc, ticket) => {
            const date = format(ticket.deadlineDate!, 'MMM dd');
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts)
            .map(([date, count]) => ({ date, count }))
            .slice(-7);
    }, [tickets]);

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{label}</p>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].fill }} />
              <p className="text-sm font-black italic">{`${payload[0].name}: ${payload[0].value}`}</p>
            </div>
          </div>
        );
      }
      return null;
    };

     if (dataLoading || !supervisorUser) {
        return (
            <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-10">
                <Skeleton className="h-20 w-1/2 rounded-2xl" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-32 rounded-[2rem]" />
                    ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-[400px] rounded-[2.5rem]" />
                    <Skeleton className="h-[400px] rounded-[2.5rem]" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-white">
                            <LineChartIcon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Personal Performance</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
                        My Insights.
                    </h1>
                    <p className="text-slate-500 font-medium text-sm italic">
                        Tracking resolution efficiency and trust score trajectory.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest bg-slate-950 text-white border-slate-900 shadow-xl">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                        Active Duty
                    </Badge>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 rounded-[2.5rem] bg-indigo-600 p-8 text-white relative overflow-hidden group border-none shadow-2xl shadow-indigo-600/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-4 w-4 text-indigo-200" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100">Performance Trend</span>
                            </div>
                            <h3 className="text-2xl font-black tracking-tight leading-tight italic">
                                Your resolution rate has improved by <br className="hidden lg:block"/>
                                <span className="text-indigo-200">12.4% over the last week.</span>
                            </h3>
                        </div>
                        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shrink-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mb-1">Efficiency Tier</p>
                            <p className="text-xl font-black text-white">Elite Status</p>
                        </div>
                    </div>
                </Card>
                <Card className="rounded-[2.5rem] border-slate-100 bg-white p-8 flex flex-col justify-center items-center text-center group hover:shadow-2xl transition-all duration-500">
                    <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                        <Activity className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fix Velocity</p>
                    <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">High</div>
                    <div className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase mt-2">
                        <ArrowUpRight className="h-3 w-3" /> +2 Active Jobs
                    </div>
                </Card>
            </section>

            <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                {[
                    { label: "Efficiency Pts", value: supervisorUser.efficiencyPoints || 0, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Trust Score", value: `${supervisorUser.trustPoints || 100}%`, icon: Shield, color: "text-emerald-500", bg: "bg-emerald-50" },
                    { label: "AI Warnings", value: supervisorUser.aiImageWarningCount || 0, icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50" },
                    { label: "Resolved", value: stats.resolvedTickets, icon: CheckCircle, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Pending", value: stats.pendingTickets, icon: BadgeHelp, color: "text-slate-400", bg: "bg-slate-50", span: true },
                ].map((item, i) => (
                    <Card key={i} className={cn(
                        "rounded-[2rem] border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 bg-white p-6",
                        item.span ? "col-span-2 lg:col-span-1" : "col-span-1"
                    )}>
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                            <div className={`${item.bg} p-2.5 rounded-xl ${item.color}`}>
                                <item.icon className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-2">
                            <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{item.value}</div>
                        </div>
                    </Card>
                ))}
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                                <TrendingUp className="h-5 w-5"/>
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Workload Distribution</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Current status of your assigned missions</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-4">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={statusData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        outerRadius={100} 
                                        innerRadius={65} 
                                        paddingAngle={8}
                                        stroke="none"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-950 p-3 rounded-2xl text-white">
                                <LayoutGrid className="h-5 w-5"/>
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Resolution Categories</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Breakdown of issues you have successfully resolved</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-4">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#475569' }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" name="Resolved" fill="#4f46e5" barSize={20} radius={[0, 10, 10, 0]} />
                            </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white lg:col-span-2">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                                <Activity className="h-5 w-5"/>
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Resolution Velocity</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Tickets resolved per day over the last week</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-4">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={resolvedOverTimeData}>
                                    <defs>
                                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="count" name="Tickets Fixed" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorResolved)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
