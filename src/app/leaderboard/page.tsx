
"use client";

import * as React from "react";
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Shield, Medal, User, Briefcase, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserProfile, Supervisor } from "@/types";
import { Badge } from "@/components/ui/badge";

function getRankBadge(rank: number) {
    if (rank === 1) return <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center border-2 border-amber-200 shadow-lg shadow-amber-500/20"><Medal className="h-6 w-6 text-amber-600" /></div>;
    if (rank === 2) return <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-slate-200 shadow-lg shadow-slate-500/20"><Medal className="h-6 w-6 text-slate-600" /></div>;
    if (rank === 3) return <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center border-2 border-orange-200 shadow-lg shadow-orange-500/20"><Medal className="h-6 w-6 text-orange-600" /></div>;
    return <span className="text-slate-400 font-black text-base ml-4">{rank}</span>;
}

export default function LeaderboardPage() {
    const [userLeaderboard, setUserLeaderboard] = React.useState<UserProfile[]>([]);
    const [supervisorLeaderboard, setSupervisorLeaderboard] = React.useState<Supervisor[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);

    React.useEffect(() => {
        setDataLoading(true);

        const usersQuery = query(collection(db, 'users'), orderBy("utilityPoints", "desc"), limit(10));
        const supervisorsQuery = query(collection(db, 'supervisors'), orderBy("trustPoints", "desc"), limit(10));

        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
            setUserLeaderboard(usersData);
            if (!supervisorLeaderboard.length) setDataLoading(false);
        });

        const unsubscribeSupervisors = onSnapshot(supervisorsQuery, (snapshot) => {
            const supervisorsData = snapshot.docs.map(doc => doc.data() as Supervisor);
            setSupervisorLeaderboard(supervisorsData);
            setDataLoading(false);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeSupervisors();
        };
    }, [supervisorLeaderboard.length]);

    if (dataLoading) {
        return (
             <div className="min-h-screen bg-slate-50/50 p-4 md:p-12 lg:p-20">
                <div className="max-w-6xl mx-auto space-y-12">
                    <Skeleton className="h-20 w-1/2 rounded-3xl" />
                    <div className="grid gap-8 md:grid-cols-2">
                        <Skeleton className="h-[600px] w-full rounded-[3rem]" />
                        <Skeleton className="h-[600px] w-full rounded-[3rem]" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-12 lg:p-16">
            <div className="max-w-6xl mx-auto space-y-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-white">
                                <Trophy className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Hall of Fame</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Community Impact.</h1>
                        <p className="text-slate-500 font-medium text-base mt-2 italic max-w-xl">Celebrating the citizens and staff who make our neighborhoods cleaner and safer every day.</p>
                    </div>
                </header>
                
                <div className="grid gap-10 md:grid-cols-2">
                    <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                                    <User className="h-5 w-5"/>
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Top Contributors</CardTitle>
                                    <CardDescription className="font-medium text-slate-500 text-xs">Ranked by utility points earned from reporting.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-50 hover:bg-transparent">
                                        <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-widest text-slate-400">Rank</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Citizen</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userLeaderboard.map((user, index) => (
                                        <TableRow key={user.id} className="border-slate-50 hover:bg-slate-50/50 group transition-colors">
                                            <TableCell className="py-5">{getRankBadge(index + 1)}</TableCell>
                                            <TableCell>
                                                <p className="font-black text-slate-900 text-base">{user.displayName || "Anonymous Citizen"}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.reportCount || 0} Issues Fixed</p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <Badge variant="secondary" className="h-9 px-3 rounded-xl font-black gap-2 bg-indigo-50 text-indigo-600 border-indigo-100 text-[10px]">
                                                    <Zap className="h-3 w-3 fill-indigo-600" />
                                                    {user.utilityPoints}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                                    <Briefcase className="h-5 w-5"/>
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Elite Staff</CardTitle>
                                    <CardDescription className="font-medium text-slate-500 text-xs">Supervisors ranked by resolution trust scores.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-50 hover:bg-transparent">
                                        <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-widest text-slate-400">Rank</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supervisor</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Trust</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {supervisorLeaderboard.map((supervisor, index) => (
                                         <TableRow key={supervisor.id} className="border-slate-50 hover:bg-slate-50/50 group transition-colors">
                                            <TableCell className="py-5">{getRankBadge(index + 1)}</TableCell>
                                            <TableCell>
                                                <p className="font-black text-slate-900 text-base">{supervisor.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{supervisor.department}</p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                 <Badge variant="secondary" className="h-9 px-3 rounded-xl font-black gap-2 bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px]">
                                                    <Shield className="h-3 w-3 fill-emerald-600" />
                                                    {supervisor.trustPoints}%
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
