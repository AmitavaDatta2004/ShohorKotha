
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInDays, format } from 'date-fns';

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
import type { Ticket } from '@/types';
import { 
  BadgeHelp, 
  CheckCircle, 
  Clock, 
  FileText, 
  LineChart as LineChartIcon, 
  Activity, 
  TrendingUp, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const COLORS = {
  High: '#ef4444', // red-500
  Medium: '#4f46e5', // indigo-600
  Low: '#10b981', // emerald-500
};

const STATUS_COLORS: { [key: string]: string } = {
    Submitted: '#fde047', // yellow-300
    'In Progress': '#6366f1', // indigo-500
    'Pending Approval': '#f97316', // orange-500
    Resolved: '#10b981', // emerald-500
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [municipalUser, setMunicipalUser] = React.useState<any>(null);

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
            deadlineDate
          } as Ticket;
        });
        setTickets(ticketsData);
        setDataLoading(false);
      });
      return () => unsubscribe();
    }
  }, [municipalUser]);

  const stats = React.useMemo(() => {
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved');
    const totalResolutionDays = resolvedTickets.reduce((acc, ticket) => {
        if (ticket.deadlineDate) {
            return acc + differenceInDays(ticket.deadlineDate, ticket.submittedDate);
        }
        return acc;
    }, 0);

    return {
        totalTickets: tickets.length,
        resolvedTickets: resolvedTickets.length,
        pendingTickets: tickets.length - resolvedTickets.length,
        avgResolutionTime: resolvedTickets.length > 0 ? (totalResolutionDays / resolvedTickets.length).toFixed(1) : 0,
    }
  }, [tickets]);

  const insights = React.useMemo(() => {
    if (tickets.length === 0) return null;
    
    // Find top category
    const categoryCounts = tickets.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const sortedCategories = Object.entries(categoryCounts).sort((a,b) => b[1] - a[1]);
    const topCategory = sortedCategories[0];

    // Find peak activity day
    const dayCounts = tickets.reduce((acc, t) => {
        const day = format(t.submittedDate, 'EEEE');
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const peakDay = Object.entries(dayCounts).sort((a,b) => b[1] - a[1])[0];

    return { topCategory, peakDay };
  }, [tickets]);


  const priorityData = React.useMemo(() => {
    const counts = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  const statusData = React.useMemo(() => {
    const counts = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: STATUS_COLORS[name] }));
  }, [tickets]);

  const categoryData = React.useMemo(() => {
    const counts = tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [tickets]);

  const resolutionTimeData = React.useMemo(() => {
      const resolvedTickets = tickets.filter(t => t.status === 'Resolved' && t.deadlineDate);
      const averageTimes = resolvedTickets.reduce((acc, ticket) => {
          if (!acc[ticket.category]) {
              acc[ticket.category] = { totalDays: 0, count: 0 };
          }
          const resolutionDays = differenceInDays(ticket.deadlineDate!, ticket.submittedDate);
          acc[ticket.category].totalDays += resolutionDays;
          acc[ticket.category].count += 1;
          return acc;
      }, {} as Record<string, { totalDays: number, count: number }>);

      return Object.entries(averageTimes).map(([category, data]) => ({
          name: category,
          avgDays: parseFloat((data.totalDays / data.count).toFixed(1)),
      }));
  }, [tickets]);

   const issuesOverTimeData = React.useMemo(() => {
    const counts = tickets.reduce((acc, ticket) => {
        const date = format(ticket.submittedDate, 'MMM dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
        .map(([date, count]) => ({ date, count }))
        .slice(-7); // Last 7 days
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

  if (dataLoading || !municipalUser) {
    return (
      <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-10">
        <Skeleton className="h-20 w-1/2 rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
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
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">City Insights</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
            Insights & Data.
          </h1>
          <p className="text-slate-500 font-medium text-sm italic">
            Viewing city activity, staff efficiency, and reporting trends.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest bg-slate-950 text-white border-slate-900 shadow-xl shadow-indigo-900/10">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mr-2 animate-pulse" />
            Live Sync
          </Badge>
        </div>
      </header>

      {insights && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 rounded-[2.5rem] bg-indigo-600 p-8 text-white relative overflow-hidden group border-none shadow-2xl shadow-indigo-600/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Sparkles className="h-4 w-4 text-indigo-200" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100">System Trends</span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tight leading-tight italic">
                            Most issues are currently reported in <br className="hidden lg:block"/>
                            <span className="text-indigo-200">"{insights.topCategory?.[0]}"</span> categories.
                        </h3>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shrink-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mb-1">Peak Activity Day</p>
                        <p className="text-xl font-black text-white">{insights.peakDay?.[0]}</p>
                    </div>
                </div>
            </Card>
            <Card className="rounded-[2.5rem] border-slate-100 bg-white p-8 flex flex-col justify-center items-center text-center group hover:shadow-2xl transition-all duration-500">
                <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                    <Activity className="h-6 w-6" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Fixing Rate</p>
                <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">94.2%</div>
                <div className="flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase mt-2">
                    <ArrowUpRight className="h-3 w-3" /> +2.4% Improvement
                </div>
            </Card>
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Reports", value: stats.totalTickets, icon: FileText, color: "text-slate-400", bg: "bg-slate-50", trend: "+12%", trendUp: true, isNegative: true },
          { label: "Resolved Reports", value: stats.resolvedTickets, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50", trend: "+8%", trendUp: true, isNegative: false },
          { label: "Pending Queue", value: stats.pendingTickets, icon: BadgeHelp, color: "text-indigo-600", bg: "bg-indigo-50", trend: "-4%", trendUp: false, isNegative: true },
          { label: "Avg Fix Time", value: `${stats.avgResolutionTime}d`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", trend: "0.2d faster", trendUp: false, isNegative: true },
        ].map((item, i) => (
          <Card key={i} className="rounded-[2.25rem] border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</CardTitle>
              <div className={`${item.bg} p-2.5 rounded-xl ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{item.value}</div>
              <div className={cn(
                "flex items-center gap-1 font-black text-[10px] uppercase mt-2",
                item.isNegative 
                  ? (item.trendUp ? "text-red-600" : "text-emerald-600")
                  : (item.trendUp ? "text-emerald-600" : "text-red-600")
              )}>
                {item.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {item.trend} vs last period
              </div>
            </CardContent>
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
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Priority Breakdown</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Severity of reported issues</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie 
                        data={priorityData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={100} 
                        innerRadius={65} 
                        paddingAngle={8}
                        stroke="none"
                    >
                    {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                        iconType="circle" 
                        verticalAlign="bottom" 
                        height={36} 
                        formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{value}</span>}
                    />
                </PieChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                <Activity className="h-5 w-5"/>
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Status Overview</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Reports across the resolution cycle</CardDescription>
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
                    <Legend 
                        iconType="circle" 
                        verticalAlign="bottom" 
                        height={36} 
                        formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{value}</span>}
                    />
                </PieChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white lg:col-span-2">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="bg-slate-950 p-3 rounded-2xl text-white shadow-lg">
                <LayoutGrid className="h-5 w-5"/>
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Category Breakdown</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Volume of reports by issue type</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#475569' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" name="Total Count" fill="#4f46e5" barSize={24} radius={[0, 12, 12, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
                    <Clock className="h-5 w-5"/>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Average Fix Time</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Days taken to resolve issues by type</CardDescription>
                  </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={resolutionTimeData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey="avgDays" name="Avg. Days to Fix" fill="#10b981" radius={[12, 12, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                    <Activity className="h-5 w-5"/>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Activity Trends</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">New reports logged over the last 7 days</CardDescription>
                  </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={issuesOverTimeData}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="count" name="New Reports" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
