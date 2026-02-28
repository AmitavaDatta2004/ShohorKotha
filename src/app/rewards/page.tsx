
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Shield, Gift, Coffee, UtensilsCrossed, Ticket as TicketIcon, ArrowRight, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import type { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { allBadges } from "@/lib/badges.tsx";

const sampleVouchers = [
  {
    id: 1,
    title: "Free Coffee & Donut",
    partner: "The Local Grind Cafe",
    points: 25,
    icon: <Coffee className="h-8 w-8 text-amber-800" />,
  },
  {
    id: 2,
    title: "10% Off Your Next Meal",
    partner: "Main Street Eatery",
    points: 50,
    icon: <UtensilsCrossed className="h-8 w-8 text-red-500" />,
  },
  {
    id: 3,
    title: "$5 Off Movie Ticket",
    partner: "Community Cinema",
    points: 75,
    icon: <TicketIcon className="h-8 w-8 text-indigo-500" />,
  },
];


export default function RewardsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
    const [leaderboard, setLeaderboard] = React.useState<UserProfile[]>([]);
    const [dataLoading, setDataLoading] = React.useState(true);

    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    React.useEffect(() => {
        if (user) {
            // Fetch user profile
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data() as UserProfile);
                }
                setDataLoading(false);
            });

            // Fetch leaderboard data
            const usersCollection = collection(db, 'users');
            const q = query(usersCollection, orderBy("utilityPoints", "desc"), limit(10));
            const unsubscribeLeaderboard = onSnapshot(q, (snapshot) => {
                const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
                setLeaderboard(usersData);
            });

            return () => {
                unsubscribeUser();
                unsubscribeLeaderboard();
            };
        }
    }, [user]);

    if (loading || !user || dataLoading) {
        return (
             <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-8 w-1/3 mb-6" />
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <div className="grid gap-6">
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    if (!userProfile) {
        return <p>Could not load user profile.</p>
    }

    const rank = leaderboard.findIndex(p => p.id === userProfile.id) + 1;
    const chartData = leaderboard.map(p => ({ name: p.displayName?.split(' ')[0] || 'User', points: p.utilityPoints }));
    const achievedBadgeCount = userProfile.badges?.length || 0;

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight font-headline">My Rewards</h1>
            
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Utility Points</CardTitle>
                        <Trophy className="h-5 w-5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-amber-500">{userProfile.utilityPoints}</div>
                        <p className="text-xs text-muted-foreground">Your rank: {rank > 0 ? `#${rank}`: 'Unranked'}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
                        <Shield className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-blue-500">{userProfile.trustPoints}</div>
                        <p className="text-xs text-muted-foreground">Reputation score for all users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Issues Reported</CardTitle>
                        <FileText className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-500">{userProfile.reportCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Total issues you've submitted</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Leaderboard</CardTitle>
                    <CardDescription>See how you stack up against other community contributors.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                width={80}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                             />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--secondary))' }}
                                contentStyle={{
                                    background: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                            />
                            <Bar dataKey="points" radius={[0, 4, 4, 0]} barSize={30} fill="hsl(var(--primary))">
                               <LabelList dataKey="points" position="right" offset={10} className="fill-foreground font-medium" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Star className="text-yellow-400"/> My Badges</CardTitle>
                        <CardDescription>Unlock badges by completing challenges and reporting issues.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center p-10">
                        <h3 className="text-5xl font-bold">{achievedBadgeCount} <span className="text-2xl text-muted-foreground">/ {allBadges.length}</span></h3>
                        <p className="text-muted-foreground mt-1">Badges Unlocked</p>
                         <Button asChild className="mt-4">
                            <Link href="/rewards/badges">
                                View All Badges <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Gift className="text-red-400" /> Vouchers</CardTitle>
                        <CardDescription>Redeem your utility points for exclusive vouchers from local businesses.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {sampleVouchers.map((voucher) => (
                            <div key={voucher.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 flex items-center justify-center rounded-md bg-muted">
                                        {voucher.icon}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{voucher.title}</p>
                                        <p className="text-sm text-muted-foreground">{voucher.partner}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Button size="sm" disabled={userProfile.utilityPoints < voucher.points}>
                                        <Star className="mr-2 h-4 w-4" />
                                        {voucher.points}
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-1">Redeem</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
