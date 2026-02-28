
"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "@/types";
import { cn } from "@/lib/utils";
import { allBadges } from "@/lib/badges.tsx";
import { CheckCircle2, Star } from "lucide-react";

export default function BadgesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
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
            return () => unsubscribeUser();
        }
    }, [user]);

    if (loading || !user || dataLoading) {
        return (
             <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-10 w-1/2 mb-6" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </div>
        )
    }

    if (!userProfile) {
        // A default profile for users who might not have one in Firestore yet
        setUserProfile({
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            utilityPoints: 0,
            trustPoints: 100,
            joinedDate: new Date() as any,
            badges: [],
        });
    }

    const achievedBadges = userProfile?.badges || [];
    const achievedBadgeCount = achievedBadges.length;

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">Badges</h1>
                <p className="text-muted-foreground mt-1">
                    You've unlocked {achievedBadgeCount} of {allBadges.length} badges. Keep up the great work!
                </p>
            </div>
            
            <Card>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {allBadges.map((badge) => {
                        const isAchieved = achievedBadges.includes(badge.id);
                        return (
                            <div key={badge.id} className={cn(
                                "flex flex-col items-center text-center gap-4 p-6 rounded-lg border", 
                                isAchieved ? "bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800" : "bg-muted/30"
                            )}>
                                <div className={cn(
                                    "relative flex-shrink-0 h-20 w-20 flex items-center justify-center rounded-full", 
                                    isAchieved ? "bg-amber-100 dark:bg-amber-900" : "bg-muted"
                                )}>
                                    {isAchieved && (
                                        <CheckCircle2 className="absolute -top-1 -right-1 h-6 w-6 text-white bg-green-500 rounded-full p-0.5" />
                                    )}
                                    {React.cloneElement(badge.icon, {
                                        className: cn("h-10 w-10", isAchieved ? "text-amber-500" : "text-muted-foreground")
                                    })}
                                </div>
                                <div className="space-y-1">
                                    <p className={cn("font-semibold text-lg", isAchieved ? "text-amber-900 dark:text-amber-200" : "text-foreground")}>{badge.title}</p>
                                    <p className={cn("text-sm", isAchieved ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>{badge.description}</p>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
