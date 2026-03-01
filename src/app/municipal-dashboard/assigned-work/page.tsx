"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ticket, Supervisor } from '@/types';
import ViewTickets from '@/components/view-tickets';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, ShieldAlert, Activity, Filter, LayoutGrid, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AssignedWorkPage() {
  const router = useRouter();
  const [assignedTickets, setAssignedTickets] = React.useState<Ticket[]>([]);
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [municipalUser, setMunicipalUser] = React.useState<any>(null);

  // Sorting State
  const [sortBy, setSortBy] = React.useState<'priority' | 'time'>('time');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  React.useEffect(() => {
    const storedUser = localStorage.getItem('municipalUser');
    if (!storedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setMunicipalUser(parsedUser);
      
      const ticketsQuery = query(
        collection(db, 'tickets'), 
        where("status", "in", ["In Progress", "Pending Approval"])
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
        setAssignedTickets(ticketsData);
        setDataLoading(false);
      });

      const supervisorsQuery = query(collection(db, 'supervisors'), where("municipalId", "==", parsedUser.id));
      const unsubscribeSupervisors = onSnapshot(supervisorsQuery, (snapshot) => {
        const supervisorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supervisor));
        setSupervisors(supervisorsData);
      });
      
      return () => {
        unsubscribe();
        unsubscribeSupervisors();
      };
    }
  }, [router]);

  // Derived sorted data
  const sortedTickets = React.useMemo(() => {
    const result = [...assignedTickets];
    result.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityMap = { Low: 1, Medium: 2, High: 3 };
        const valA = priorityMap[a.priority as keyof typeof priorityMap] || 0;
        const valB = priorityMap[b.priority as keyof typeof priorityMap] || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else {
        const valA = a.submittedDate.getTime();
        const valB = b.submittedDate.getTime();
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
    });
    return result;
  }, [assignedTickets, sortBy, sortOrder]);

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

  const inProgressCount = assignedTickets.filter(t => t.status === 'In Progress').length;
  const pendingApprovalCount = assignedTickets.filter(t => t.status === 'Pending Approval').length;

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-white">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Active Work</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
            Active Reports.
          </h1>
          <p className="text-slate-500 font-medium text-sm italic">
            Tracking current fixes and reports awaiting official approval.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">In Progress</p>
                <p className="text-sm font-black text-slate-900 leading-none">{inProgressCount}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            
            {pendingApprovalCount > 0 ? (
              <Link href="#pending-approval-anchor" className="flex items-center gap-3 hover:opacity-70 transition-all group">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 group-hover:scale-110 transition-all">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Awaiting Approval</p>
                  <p className="text-sm font-black text-slate-900 leading-none">{pendingApprovalCount}</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Awaiting Approval</p>
                  <p className="text-sm font-black text-slate-900 leading-none">{pendingApprovalCount}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 p-2 rounded-xl text-white shadow-lg shadow-slate-900/20">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Tasks.</h2>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full px-4 h-9 font-black text-[10px] uppercase tracking-widest gap-2 bg-white border-slate-200 hover:border-indigo-600 transition-colors">
                  <Filter className="h-3 w-3 text-indigo-600" />
                  Sort: {sortBy === 'priority' ? 'Priority' : 'Time'} 
                  {sortOrder === 'asc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl border-2 p-2 w-48 shadow-2xl bg-white">
                <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 p-2">Ordering Logic</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => { setSortBy('priority'); setSortOrder('asc'); }} className="rounded-xl font-bold text-[10px] uppercase tracking-widest p-3 flex justify-between cursor-pointer focus:bg-indigo-600 focus:text-white transition-colors">
                  Priority <ArrowDown className="h-3 w-3" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('priority'); setSortOrder('desc'); }} className="rounded-xl font-bold text-[10px] uppercase tracking-widest p-3 flex justify-between cursor-pointer focus:bg-indigo-600 focus:text-white transition-colors">
                  Priority <ArrowUp className="h-3 w-3" />
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-slate-100" />
                <DropdownMenuItem onClick={() => { setSortBy('time'); setSortOrder('asc'); }} className="rounded-xl font-bold text-[10px] uppercase tracking-widest p-3 flex justify-between cursor-pointer focus:bg-indigo-600 focus:text-white transition-colors">
                  Log Time <ArrowDown className="h-3 w-3" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('time'); setSortOrder('desc'); }} className="rounded-xl font-bold text-[10px] uppercase tracking-widest p-3 flex justify-between cursor-pointer focus:bg-indigo-600 focus:text-white transition-colors">
                  Log Time <ArrowUp className="h-3 w-3" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge variant="secondary" className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest bg-slate-50 text-slate-600 border-slate-100 border h-9 flex items-center">
              Total assigned: {assignedTickets.length}
            </Badge>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <ViewTickets 
            tickets={sortedTickets} 
            supervisors={supervisors}
            isMunicipalView={true} 
          />
        </div>
      </section>
    </div>
  );
}
