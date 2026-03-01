
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Supervisor } from '@/types';
import ManageSupervisors from '@/components/manage-supervisors';
import { Users, ShieldCheck, Activity, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManageSupervisorsPage() {
  const router = useRouter();
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [municipalUser, setMunicipalUser] = React.useState<any>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('municipalUser');
    if (!storedUser) {
      router.push('/login');
    } else {
        const parsedUser = JSON.parse(storedUser);
        setMunicipalUser(parsedUser);

        const supervisorsCollection = collection(db, 'supervisors');
        const q = query(supervisorsCollection, where("municipalId", "==", parsedUser.id));
        const unsubscribeSupervisors = onSnapshot(q, (snapshot) => {
            const supervisorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supervisor));
            setSupervisors(supervisorsData);
            setDataLoading(false);
        });

        return () => {
            unsubscribeSupervisors();
        }
    }
  }, [router]);

  if (!municipalUser || dataLoading) {
    return (
      <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-10">
        <Skeleton className="h-20 w-1/2 rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-white">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Staff Management</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
            Team Management.
          </h1>
          <p className="text-slate-500 font-medium text-sm italic">
            Managing staff accounts, department assignments, and performance.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Active Staff</p>
                <p className="text-sm font-black text-slate-900 leading-none">{supervisors.length}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Success Rate</p>
                <p className="text-sm font-black text-slate-900 leading-none">Optimal</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <ManageSupervisors municipalId={municipalUser?.id} supervisors={supervisors} />
      </div>
    </div>
  );
}
