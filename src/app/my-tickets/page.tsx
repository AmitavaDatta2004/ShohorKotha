
"use client";

import * as React from "react";
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ViewTickets from "@/components/view-tickets";
import type { Ticket } from "@/types";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePen, UserPlus, CheckCircle2 } from "lucide-react";

export default function MyTicketsPage() {
  const [createdTickets, setCreatedTickets] = React.useState<Ticket[]>([]);
  const [joinedTickets, setJoinedTickets] = React.useState<Ticket[]>([]);
  const { user, loading } = useAuth();
  const [dataLoading, setDataLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  React.useEffect(() => {
    if (user) {
      setDataLoading(true);

      // Query for tickets CREATED by the user
      const createdTicketsQuery = query(
        collection(db, 'tickets'), 
        where("userId", "==", user.uid), 
        orderBy("submittedDate", "desc")
      );
      
      const unsubscribeCreated = onSnapshot(createdTicketsQuery, (querySnapshot) => {
        const ticketsData = querySnapshot.docs.map(doc => {
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
        setCreatedTickets(ticketsData);
        setDataLoading(false);
      }, (error) => {
        console.error("Error fetching created tickets: ", error);
        setDataLoading(false);
      });

      // Query for tickets JOINED by the user
      const joinedTicketsQuery = query(
          collection(db, 'tickets'),
          where("reportedBy", "array-contains", user.uid)
      );

      const unsubscribeJoined = onSnapshot(joinedTicketsQuery, (querySnapshot) => {
          const ticketsData = querySnapshot.docs.map(doc => {
              const data = doc.data();
              const submittedDate = data.submittedDate instanceof Timestamp ? data.submittedDate.toDate() : new Date();
            const estimatedResolutionDate = data.estimatedResolutionDate instanceof Timestamp ? data.estimatedResolutionDate.toDate() : new Date();
            const deadlineDate = data.deadlineDate instanceof Timestamp ? data.deadlineDate.toDate() : undefined;
              return {
                  ...data,
                  id: doc.id,
                  submittedDate,
                  estimatedResolutionDate,
                  deadlineDate
              } as Ticket;
          }).filter(ticket => ticket.userId !== user.uid); // Exclude tickets they created themselves
          setJoinedTickets(ticketsData);
      }, (error) => {
          console.error("Error fetching joined tickets: ", error);
      });


      return () => {
        unsubscribeCreated();
        unsubscribeJoined();
      }
    }
  }, [user]);

  if (loading || !user) {
    return null;
  }

  const activeCreatedTickets = createdTickets.filter(t => t.status !== 'Resolved');
  const resolvedCreatedTickets = createdTickets.filter(t => t.status === 'Resolved');
  const activeJoinedTickets = joinedTickets.filter(t => t.status !== 'Resolved');
  const resolvedJoinedTickets = joinedTickets.filter(t => t.status === 'Resolved');
  
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">My Tickets</h1>
        {dataLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[200px] w-full" />
            </div>
        ) : (
          <Tabs defaultValue="created" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="created">
                <FilePen className="mr-2" /> Created Reports
              </TabsTrigger>
              <TabsTrigger value="joined">
                <UserPlus className="mr-2" /> Joined Reports
              </TabsTrigger>
            </TabsList>
            <TabsContent value="created" className="mt-6">
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="resolved">Resolved</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="mt-6">
                         <ViewTickets tickets={activeCreatedTickets} />
                    </TabsContent>
                    <TabsContent value="resolved" className="mt-6">
                         <ViewTickets tickets={resolvedCreatedTickets} />
                    </TabsContent>
                </Tabs>
            </TabsContent>
            <TabsContent value="joined" className="mt-6">
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="resolved">Resolved</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="mt-6">
                        <ViewTickets tickets={activeJoinedTickets} />
                    </TabsContent>
                    <TabsContent value="resolved" className="mt-6">
                        <ViewTickets tickets={resolvedJoinedTickets} />
                    </TabsContent>
                </Tabs>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
