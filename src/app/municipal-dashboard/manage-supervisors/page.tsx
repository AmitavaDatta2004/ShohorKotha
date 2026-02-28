"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Supervisor } from '@/types';
import ManageSupervisors from '@/components/manage-supervisors';

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
  
  return (
    <ManageSupervisors municipalId={municipalUser?.id} supervisors={supervisors} />
  );
}
