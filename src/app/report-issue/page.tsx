
"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
import ReportIssueForm from "@/components/report-issue-form";
import type { Ticket } from "@/types";
import { useAuth } from "@/context/auth-context";
import { FilePen, ShieldAlert } from "lucide-react";

export default function ReportIssuePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const handleIssueSubmitted = (newTicket: Ticket) => {
    // No-op. The form itself handles showing the success message.
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-12 lg:p-16">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-white">
                <FilePen className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">New Report</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Report an Issue.</h1>
            <p className="text-slate-500 font-medium text-base mt-2 italic max-w-xl">Tell us what needs fixing. Our AI will analyze your report and route it to the right department.</p>
          </div>
          <div className="hidden lg:block bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">System Status</p>
              <p className="text-sm font-black text-slate-900 leading-none">AI Assistant Online</p>
            </div>
          </div>
        </header>

        {/* Main Form Container */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <ReportIssueForm onIssueSubmitted={handleIssueSubmitted} />
        </div>
      </div>
    </div>
  );
}
