
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ticket } from '@/types';
import ViewTickets from '@/components/view-tickets';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, History, Star, LayoutGrid } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ResolvedWorkPage() {
  const router = useRouter();
  const [resolvedTickets, setResolvedTickets] = React.useState<Ticket[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [municipalUser, setMunicipalUser] = React.useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('municipalUser');
    if (!storedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setMunicipalUser(parsedUser);
      
      const ticketsQuery = query(
        collection(db, 'tickets'), 
        where("status", "==", "Resolved")
      );

      const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
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
                deadlineDate,
            } as Ticket;
        });
        setResolvedTickets(ticketsData);
        setDataLoading(false);
      });
      
      return () => unsubscribe();
    }
  }, [router]);

  const totalImpactScore = React.useMemo(() => {
    return resolvedTickets.reduce((acc, t) => acc + (t.severityScore || 0), 0);
  }, [resolvedTickets]);

  if (!municipalUser || dataLoading) {
    return (
      <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-10">
        <Skeleton className="h-20 w-1/2 rounded-2xl" />
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-[2.5rem]" />
          <Skeleton className="h-[200px] w-full rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-600 p-2.5 rounded-xl shadow-lg shadow-emerald-600/20 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">History</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
            Completed Issues.
          </h1>
          <p className="text-slate-500 font-medium text-sm italic">
            Viewing all finished reports and successfully resolved community issues.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <History className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Total Resolved</p>
                <p className="text-sm font-black text-slate-900 leading-none">{resolvedTickets.length}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Impact Score</p>
                <p className="text-sm font-black text-slate-900 leading-none">{totalImpactScore} Fixed weight</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 p-2 rounded-xl text-white shadow-lg shadow-slate-900/20">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Resolved List.</h2>
          </div>
          <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest bg-slate-50 text-slate-600 border-slate-100 border">
            Total count: {resolvedTickets.length}
          </Badge>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <ViewTickets 
            tickets={resolvedTickets} 
            isMunicipalView={true} 
          />
        </div>
      </section>
    </div>
  );
}
