"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, Github, Linkedin, Twitter, Globe, ShieldCheck, Cpu } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export default function Footer() {
  const pathname = usePathname();

  // Don't render footer on special dashboards or login to keep focus on tools
  if (pathname.startsWith('/municipal-dashboard') || pathname.startsWith('/supervisor-dashboard') || pathname === '/login') {
    return null;
  }

  const isLandingPage = pathname === '/';

  return (
    <footer className={cn(
      "bg-white border-t border-slate-100 py-12",
      !isLandingPage && "hidden md:block"
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-6">
                 <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="bg-slate-950 p-2 rounded-xl shadow-xl shadow-slate-950/20">
                      <Megaphone className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase italic text-slate-950">
                        ShohorKotha
                    </h1>
                </Link>
                <p className="text-lg text-slate-500 font-medium max-w-sm leading-relaxed">
                  Empowering communities through transparency and AI-powered efficiency.
                </p>
                 <div className="flex space-x-3 mt-4">
                    <Button variant="outline" size="icon" className="rounded-xl border-slate-100 hover:bg-slate-50 h-10 w-10" asChild>
                        <Link href="#"><Github className="h-4 w-4 text-slate-900" /></Link>
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl border-slate-100 hover:bg-slate-50 h-10 w-10" asChild>
                        <Link href="#"><Linkedin className="h-4 w-4 text-slate-900" /></Link>
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl border-slate-100 hover:bg-slate-50 h-10 w-10" asChild>
                        <Link href="#"><Twitter className="h-4 w-4 text-slate-900" /></Link>
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Features</h4>
                <nav className="flex flex-col space-y-3 text-base font-bold text-slate-900">
                    <Link href="/report-issue" className="hover:text-indigo-600 transition-colors flex items-center gap-2"><Cpu className="h-4 w-4 opacity-40"/> Report Issue</Link>
                    <Link href="/my-tickets" className="hover:text-indigo-600 transition-colors flex items-center gap-2"><Globe className="h-4 w-4 opacity-40"/> My History</Link>
                    <Link href="/map-view" className="hover:text-indigo-600 transition-colors flex items-center gap-2"><ShieldCheck className="h-4 w-4 opacity-40"/> GIS Map</Link>
                </nav>
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Resources</h4>
                <nav className="flex flex-col space-y-3 text-base font-bold text-slate-900">
                    <Link href="/about-us" className="hover:text-indigo-600 transition-colors">Team Members</Link>
                    <Link href="/presentation" className="hover:text-indigo-600 transition-colors">How It Works</Link>
                    <Link href="/leaderboard" className="hover:text-indigo-600 transition-colors">Leaderboard</Link>
                </nav>
            </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span>Version 1.0.0</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Network Online</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              &copy; {new Date().getFullYear()} ShohorKotha. All rights reserved.
            </p>
        </div>
      </div>
    </footer>
  );
}