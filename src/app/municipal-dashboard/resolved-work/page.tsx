
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ticket } from '@/types';
import ViewTickets from '@/components/view-tickets';
import { Skeleton } from '@/components/ui/skeleton';

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

  if (dataLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
        </div>
    );
  }

  return (
    <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Resolved Work</h1>
        <ViewTickets tickets={resolvedTickets} isMunicipalView={true} />
    </div>
  );
}
