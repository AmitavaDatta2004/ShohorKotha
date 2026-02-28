
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, Timestamp, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, PieChart, Cell, Line, LineChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import type { Supervisor, Ticket } from '@/types';
import { BadgeHelp, CheckCircle, LineChart as LineChartIcon, Shield, ShieldAlert, Zap, ArrowLeft, LogOut, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const STATUS_COLORS: { [key: string]: string } = {
    'In Progress': '#60a5fa', // blue-400
    'Pending Approval': '#f97316', // orange-500
    Resolved: '#22c55e', // green-500
};

export default function SupervisorAnalyticsPage() {
    const router = useRouter();
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);
    const [supervisorUser, setSupervisorUser] = React.useState<Supervisor | null>(null);

    const handleLogout = () => {
        localStorage.removeItem('supervisorUser');
        router.push('/login');
    }

    React.useEffect(() => {
        const storedUser = localStorage.getItem('supervisorUser');
        if (!storedUser) {
            router.push('/login');
        } else {
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

            // Also listen for changes to the supervisor document itself
            const supervisorDocRef = doc(db, 'supervisors', parsedUser.id);
            const unsubscribeSupervisor = onSnapshot(supervisorDocRef, (doc) => {
                if (doc.exists()) {
                    setSupervisorUser(doc.data() as Supervisor);
                }
            });


            return () => {
                unsubscribe();
                unsubscribeSupervisor();
            };
        }
    }, [router]);

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
            const date = format(ticket.deadlineDate!, 'yyyy-MM-dd');
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [tickets]);


     if (dataLoading || !supervisorUser) {
        return (
            <div className="p-4 md:p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Efficiency Points</CardTitle><Zap className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Trust Score</CardTitle><Shield className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">AI Warnings</CardTitle><ShieldAlert className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Resolved</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><BadgeHelp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /></CardContent></Card>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                    <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
                    <Card className="md:col-span-2"><CardHeader><Skeleton className="h-6 w-1/2 mb-2" /><Skeleton className="h-4 w-3/4" /></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                 <Link href="/supervisor-dashboard" className="hidden items-center gap-2 sm:flex">
                    <Megaphone className="h-7 w-7 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight font-headline text-foreground">
                        ShohorKotha
                    </h1>
                </Link>
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="sm" asChild>
                        <Link href="/supervisor-dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex">
                        <LogOut className="mr-2 h-4 w-4"/>
                        Logout
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="sm:hidden">
                        <LogOut className="h-5 w-5"/>
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0">
                <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2 pt-6"><LineChartIcon className="h-8 w-8 text-primary"/> My Analytics</h1>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Efficiency Points</CardTitle>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{supervisorUser.efficiencyPoints || 0}</div>
                            <p className="text-xs text-muted-foreground">From approved reports</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{supervisorUser.trustPoints || 100}</div>
                            <p className="text-xs text-muted-foreground">Based on report quality</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">AI Image Warnings</CardTitle>
                            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{supervisorUser.aiImageWarningCount || 0}</div>
                            <p className="text-xs text-muted-foreground">For inauthentic image uploads</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Resolved Tickets</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.resolvedTickets}</div>
                            <p className="text-xs text-muted-foreground">Total completed jobs</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Tickets</CardTitle>
                            <BadgeHelp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingTickets}</div>
                            <p className="text-xs text-muted-foreground">Jobs currently in progress</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Workload by Status</CardTitle>
                            <CardDescription>Distribution of your assigned tickets.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Resolved Issues by Category</CardTitle>
                            <CardDescription>Breakdown of your completed work.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="value" name="Resolved Count" fill="hsl(var(--primary))" barSize={20} />
                            </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Resolution Over Time</CardTitle>
                            <CardDescription>Number of tickets you resolved per day.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={resolvedOverTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="count" name="Tickets Resolved" stroke="hsl(var(--accent))" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
            </main>
        </div>
    );
}

    
    