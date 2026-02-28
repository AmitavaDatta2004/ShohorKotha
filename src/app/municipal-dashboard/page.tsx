
"use client";

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, Timestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ViewTickets from '@/components/view-tickets';
import type { Ticket, Supervisor } from '@/types';

const MunicipalMapView = dynamic(() => import('@/components/municipal-map-view'), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full rounded-lg" />,
});

export default function MunicipalDashboardPage() {
  const router = useRouter();
  const [allTickets, setAllTickets] = React.useState<Ticket[]>([]);
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>([]);
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
        // Fetch all tickets
        const ticketsCollection = collection(db, 'tickets');
        const unsubscribeTickets = onSnapshot(ticketsCollection, (snapshot) => {
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
                } as Ticket
            });
            setAllTickets(ticketsData);
            setDataLoading(false);
        });

        // Fetch supervisors for assignment
        const supervisorsQuery = query(collection(db, 'supervisors'), where("municipalId", "==", municipalUser.id));
        const unsubscribeSupervisors = onSnapshot(supervisorsQuery, (snapshot) => {
            const supervisorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supervisor));
            setSupervisors(supervisorsData);
        });

        return () => {
            unsubscribeTickets();
            unsubscribeSupervisors();
        }
    }
  }, [municipalUser]);

  const triageTickets = allTickets.filter(ticket => ticket.status === 'Submitted');

  if (!municipalUser || dataLoading) {
      return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[500px] w-full rounded-lg" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Issues Map</CardTitle>
          <CardDescription>All reported issues are plotted on the map below, colored by priority.</CardDescription>
        </CardHeader>
        <CardContent>
          <MunicipalMapView tickets={allTickets} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Triage Queue</CardTitle>
            <CardDescription>Review and assign new issues from the community.</CardDescription>
        </CardHeader>
        <CardContent>
            <ViewTickets tickets={triageTickets} supervisors={supervisors} isMunicipalView={true} />
        </CardContent>
      </Card>
    </div>
  );
}
