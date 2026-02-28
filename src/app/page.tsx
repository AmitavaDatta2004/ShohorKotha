

"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ArrowRight, FilePen, Map, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null; // Or a loading spinner
  }

  return (
    <>
      <section className="relative w-full h-[60vh] flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <Image
          src="https://picsum.photos/seed/1/1200/800"
          alt="Community background"
          data-ai-hint="city community"
          fill
          style={{ objectFit: 'cover' }}
          className="absolute inset-0"
        />
        <div className="relative z-20 text-center space-y-4 px-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-headline">
            Improve Your Community, Together.
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-white/90">
            ShohorKotha empowers you to report local issues, track their resolution, and contribute to a better neighborhood.
          </p>
          <Link href="/report-issue" passHref>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Report an Issue <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-12 md:py-20 px-4 bg-background">
        <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight font-headline mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-10">A simple, three-step process to make a real impact.</p>
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 font-headline">
                            <FilePen className="h-8 w-8 text-primary" />
                            Report
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Snap a photo, add details, and submit a report for any civic issue you encounter. Our AI helps categorize and prioritize it instantly.</p>
                    </CardContent>
                </Card>
                 <Card className="text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 font-headline">
                            <Map className="h-8 w-8 text-primary" />
                           Track
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Follow the progress of your submitted tickets and see updates as they happen. View all issues on an interactive map.</p>
                    </CardContent>
                </Card>
                 <Card className="text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 font-headline">
                             <CheckCircle2 className="h-8 w-8 text-primary" />
                            Resolve
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Local authorities are notified and can address problems efficiently. Get notified when your issue is resolved. Together, we make a difference.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>
    </>
  );
}
