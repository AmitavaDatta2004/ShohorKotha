
"use client";

import * as React from "react";
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Shield, Medal, Award, User, Briefcase, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserProfile, Supervisor } from "@/types";
import { Badge } from "@/components/ui/badge";

function getRankBadge(rank: number) {
    if (rank === 1) return <Medal className="h-5 w-5 text-amber-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-medium text-sm">{rank}</span>;
}

export default function LeaderboardPage() {
    const [userLeaderboard, setUserLeaderboard] = React.useState<UserProfile[]>([]);
    const [supervisorLeaderboard, setSupervisorLeaderboard] = React.useState<Supervisor[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);

    React.useEffect(() => {
        setDataLoading(true);

        const usersQuery = query(collection(db, 'users'), orderBy("utilityPoints", "desc"), limit(10));
        const supervisorsQuery = query(collection(db, 'supervisors'), orderBy("efficiencyPoints", "desc"), limit(10));

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
             <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
                <Skeleton className="h-10 w-1/3 mb-6" />
                <div className="grid gap-6 md:grid-cols-2">
                    <Card><CardHeader><Skeleton className="h-8 w-1/2 mb-2"/><Skeleton className="h-4 w-3/4"/></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-8 w-1/2 mb-2"/><Skeleton className="h-4 w-3/4"/></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
            <div className="text-center">
                <Trophy className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight font-headline mt-2">Community Leaderboard</h1>
                <p className="mt-2 text-lg text-muted-foreground">Celebrating top contributors and performers in our community.</p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="text-primary"/> Top Community Contributors</CardTitle>
                        <CardDescription>Users with the most utility points from reporting issues.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Rank</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userLeaderboard.map((user, index) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium text-center">{getRankBadge(index + 1)}</TableCell>
                                        <TableCell>{user.displayName || "Anonymous User"}</TableCell>
                                        <TableCell className="text-right">
                                             <Badge variant="secondary" className="flex items-center gap-1.5 w-fit ml-auto">
                                                <Star className="h-3.5 w-3.5 text-amber-500" />
                                                <span>{user.utilityPoints}</span>
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Briefcase className="text-primary"/> Top Performing Supervisors</CardTitle>
                        <CardDescription>Supervisors with the highest efficiency points from resolving issues.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Rank</TableHead>
                                    <TableHead>Supervisor</TableHead>
                                    <TableHead className="text-right">Efficiency Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {supervisorLeaderboard.map((supervisor, index) => (
                                     <TableRow key={supervisor.id}>
                                        <TableCell className="font-medium text-center">{getRankBadge(index + 1)}</TableCell>
                                        <TableCell>{supervisor.name}</TableCell>
                                        <TableCell className="text-right">
                                             <Badge variant="secondary" className="flex items-center gap-1.5 w-fit ml-auto">
                                                <Zap className="h-3.5 w-3.5 text-green-500" />
                                                <span>{supervisor.efficiencyPoints || 0}</span>
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
    );
}
