
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { collection, query, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Star, Shield, Gift, Coffee, UtensilsCrossed, Ticket as TicketIcon, Zap, ChevronRight, Sparkles, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { allBadges } from "@/lib/badges";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const sampleVouchers = [
  {
    id: 1,
    title: "Free Coffee & Donut",
    partner: "The Local Grind Cafe",
    points: 25,
    icon: <Coffee className="h-5 w-5 text-amber-800" />,
    color: "bg-amber-100"
  },
  {
    id: 2,
    title: "10% Off Your Next Meal",
    partner: "Main Street Eatery",
    points: 50,
    icon: <UtensilsCrossed className="h-5 w-5 text-red-500" />,
    color: "bg-red-100"
  },
  {
    id: 3,
    title: "$5 Off Movie Ticket",
    partner: "Community Cinema",
    points: 75,
    icon: <TicketIcon className="h-5 w-5 text-indigo-500" />,
    color: "bg-indigo-100"
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
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data() as UserProfile);
                }
                setDataLoading(false);
            });

            const usersCollection = collection(db, 'users');
            const q = query(usersCollection, orderBy("utilityPoints", "desc"), limit(10));
            const unsubscribeLeaderboard = onSnapshot(q, (snapshot) => {
                const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
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
             <div className="min-h-screen bg-slate-50/50 p-4 md:p-12 lg:p-20">
                <div className="max-w-5xl mx-auto space-y-12">
                    <Skeleton className="h-16 w-1/2 rounded-3xl" />
                    <div className="grid gap-6 md:grid-cols-3">
                        <Skeleton className="h-40 w-full rounded-[2rem]" />
                        <Skeleton className="h-40 w-full rounded-[2rem]" />
                        <Skeleton className="h-40 w-full rounded-[2rem]" />
                    </div>
                    <Skeleton className="h-[400px] w-full rounded-[3rem]" />
                </div>
            </div>
        )
    }

    if (!userProfile) return null;

    const rank = leaderboard.findIndex(p => p.id === userProfile.id) + 1;
    const chartData = leaderboard.map(p => ({ 
        name: p.displayName?.split(' ')[0] || 'User', 
        points: p.utilityPoints,
        isSelf: p.id === user.uid
    }));
    const achievedBadgeCount = userProfile.badges?.length || 0;

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-12 lg:p-16">
            <div className="max-w-5xl mx-auto space-y-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-white">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loyalty Protocol</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">My Rewards.</h1>
                        <p className="text-slate-500 font-medium text-sm mt-2 italic max-w-xl">Your civic contributions are translated into tangible benefits for you and your community.</p>
                    </div>
                </header>

                {/* Status Grid - 2 Col Mobile, 3 Col Desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <Card className="col-span-2 lg:col-span-1 rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 border-none overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <CardHeader className="pb-2 relative z-10">
                            <div className="flex justify-between items-center">
                                <Trophy className="h-5 w-5 text-indigo-200" />
                                <Badge variant="outline" className="text-white border-white/20 text-[8px] uppercase font-black">Active Capital</Badge>
                            </div>
                            <CardTitle className="text-[9px] font-black uppercase tracking-widest text-indigo-200 pt-4">Utility Points</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl md:text-4xl font-black">{userProfile.utilityPoints}</div>
                            <p className="text-indigo-100 text-[8px] font-black uppercase tracking-widest mt-2">{rank > 0 ? `Ranked #${rank} in City`: 'Rank: Unranked'}</p>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 rounded-[2rem] bg-white border-slate-100 shadow-xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <Shield className="h-5 w-5 text-emerald-500" />
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none uppercase text-[8px] font-black tracking-widest hidden sm:inline-flex">Universal Metric</Badge>
                            </div>
                            <CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-400 pt-4">Trust Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-slate-900">{userProfile.trustPoints}%</div>
                            <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-2 truncate">Integrity Verification: High</p>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 rounded-[2rem] bg-white border-slate-100 shadow-xl overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <FileText className="h-5 w-5 text-indigo-600" />
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none uppercase text-[8px] font-black tracking-widest hidden sm:inline-flex">Total Output</Badge>
                            </div>
                            <CardTitle className="text-[9px] font-black uppercase tracking-widest text-slate-400 pt-4">Reports Filed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl md:text-3xl font-black text-slate-900">{userProfile.reportCount || 0}</div>
                            <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-2 truncate">System Contributions</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Competitive Landscape</CardTitle>
                                        <CardDescription className="font-medium text-slate-500 text-xs">Your position relative to the city's top contributors.</CardDescription>
                                    </div>
                                    <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                                        <Star className="h-5 w-5 fill-indigo-600"/>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-0">
                                <div className="h-[260px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 40 }}>
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                dataKey="name" 
                                                type="category" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                width={80}
                                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest">
                                                                {payload[0].value} Points
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="points" radius={[0, 12, 12, 0]} barSize={16}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.isSelf ? '#4f46e5' : '#f1f5f9'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid md:grid-cols-2 gap-8">
                            <Card className="rounded-[2.5rem] border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white group">
                                <CardHeader className="p-8 pb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <Star className="h-5 w-5 text-amber-600 fill-amber-600" />
                                    </div>
                                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Milestone Badges</CardTitle>
                                    <CardDescription className="font-medium text-slate-500 text-xs">You've unlocked {achievedBadgeCount} of {allBadges.length} protocols.</CardDescription>
                                </CardHeader>
                                <CardContent className="px-8 pb-8">
                                    <Button asChild variant="outline" className="w-full rounded-2xl h-12 font-black border-2 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all text-xs">
                                        <Link href="/rewards/badges">View Achievement Log</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2.5rem] border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white group">
                                <CardHeader className="p-8 pb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <Gift className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Voucher Store</CardTitle>
                                    <CardDescription className="font-medium text-slate-500 text-xs">Redeem points for localized community benefits.</CardDescription>
                                </CardHeader>
                                <CardContent className="px-8 pb-8">
                                    <Button disabled className="w-full rounded-2xl h-12 font-black bg-slate-900 text-xs">Store Offline</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg shadow-red-600/20">
                                <Zap className="h-4 w-4 fill-white" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Voucher Protocol.</h2>
                        </div>

                        <div className="space-y-4">
                            {sampleVouchers.map((voucher) => (
                                <div key={voucher.id} className="group relative">
                                    <div className="absolute inset-0 bg-indigo-600/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <Card className="rounded-[2rem] border-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-500 bg-white relative z-10">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-inner", voucher.color)}>
                                                    {voucher.icon}
                                                </div>
                                                <Badge variant="secondary" className="bg-slate-50 text-slate-900 font-black h-9 px-3 rounded-lg border border-slate-100 text-[10px]">
                                                    {voucher.points} PTS
                                                </Badge>
                                            </div>
                                            <div className="space-y-1 mb-6">
                                                <h4 className="font-black text-slate-900 text-base leading-tight">{voucher.title}</h4>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{voucher.partner}</p>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                disabled={userProfile.utilityPoints < voucher.points}
                                                className={cn(
                                                    "w-full h-10 rounded-lg font-black uppercase tracking-widest text-[9px]",
                                                    userProfile.utilityPoints >= voucher.points ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20" : "bg-slate-100 text-slate-400"
                                                )}
                                            >
                                                {userProfile.utilityPoints >= voucher.points ? 'Redeem Voucher' : 'Insufficient Points'}
                                                <ChevronRight className="ml-2 h-3 w-3" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>

                        <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-[60px] -mr-16 -mt-16"></div>
                            <div className="relative z-10">
                                <h4 className="font-black text-base mb-2">Build Trust.</h4>
                                <p className="text-slate-400 text-[10px] font-medium leading-relaxed">Your Trust Score increases with every verified report. High scores unlock exclusive tier-3 vouchers.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
