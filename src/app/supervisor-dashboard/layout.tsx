
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  LogOut,
  Megaphone,
  LayoutGrid,
  LineChart,
  Trophy,
} from 'lucide-react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Supervisor } from '@/types';

export default function SupervisorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [supervisorUser, setSupervisorUser] = React.useState<Supervisor | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('supervisorUser');
    if (!storedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setSupervisorUser(parsedUser);
      
      const unsubscribe = onSnapshot(doc(db, 'supervisors', parsedUser.id), (doc) => {
        if (doc.exists()) {
          setSupervisorUser({ id: doc.id, ...doc.data() } as Supervisor);
        }
      });
      return () => unsubscribe();
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('supervisorUser');
    router.push('/');
  };
  
  if (!supervisorUser) {
    return null;
  }

  const navLinks = [
    { href: '/supervisor-dashboard', label: 'Dispatch', icon: LayoutGrid },
    { href: '/supervisor-dashboard/analytics', label: 'Insights', icon: LineChart },
    { href: '/supervisor-dashboard/leaderboard', label: 'Rankings', icon: Trophy },
  ];

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className={cn(
      "items-center",
      isMobile ? "flex flex-col space-y-2 pt-4" : "hidden lg:flex space-x-1 xl:space-x-2"
    )}>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => isMobile && setMobileMenuOpen(false)}
          className={cn(
            "text-[11px] xl:text-xs font-black uppercase tracking-[0.1em] transition-all px-3 xl:px-4 py-2 rounded-xl whitespace-nowrap",
            isMobile ? "text-lg w-full p-4 normal-case tracking-normal font-bold" : "",
            pathname === link.href 
              ? "text-indigo-600 bg-indigo-600/5 shadow-sm" 
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          <div className="flex items-center gap-2">
            {isMobile && <link.icon className="h-4 w-4" />}
            <span>{link.label}</span>
          </div>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50/50 max-w-full overflow-x-hidden">
      <div className="fixed top-4 md:top-6 left-0 right-0 z-[1000] flex justify-center px-4 md:px-6 lg:px-8 pointer-events-none">
        <header className="w-full max-w-7xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] rounded-[2rem] md:rounded-[2.5rem] h-14 md:h-16 flex items-center px-4 md:px-6 transition-all duration-500 group pointer-events-auto hover:bg-white/85 hover:border-white/60">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4 xl:gap-8 shrink-0">
              <Link href="/supervisor-dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="bg-slate-950 p-1.5 rounded-lg shadow-lg">
                  <Megaphone className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-black tracking-tighter uppercase italic text-slate-950 block">
                  Shohor Kotha
                </h1>
              </Link>
              <NavLinks />
            </div>

            <div className="flex items-center gap-2 md:gap-3 lg:gap-6 shrink-0">
              <div className="hidden sm:flex flex-col items-end mr-2 max-w-[120px] md:max-w-none">
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none truncate w-full text-right">{supervisorUser.department}</p>
                <p className="text-[10px] md:text-xs font-bold text-slate-900 truncate w-full text-right">{supervisorUser.name}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout} 
                className="hidden lg:flex rounded-full px-6 h-10 font-black bg-slate-950 text-white hover:bg-destructive shadow-xl shadow-slate-950/10 transition-all text-[10px] uppercase tracking-widest"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Exit
              </Button>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden rounded-xl border border-slate-100 hover:bg-slate-50 h-9 w-9">
                    <Menu className="h-5 w-5 text-slate-950" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="z-[2000] w-[300px] sm:w-[400px] rounded-r-[3rem] border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Supervisor Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col h-full py-6">
                    <Link href="/supervisor-dashboard" className="flex items-center gap-2 mb-10 px-4" onClick={() => setMobileMenuOpen(false)}>
                      <div className="bg-slate-950 p-1.5 rounded-lg shadow-md">
                        <Megaphone className="h-5 w-5 text-white" />
                      </div>
                      <h1 className="text-xl font-black tracking-tighter uppercase italic text-slate-950">
                        Shohor Kotha
                      </h1>
                    </Link>
                    <NavLinks isMobile />
                    <div className="mt-auto p-4">
                      <Button size="lg" variant="destructive" className="w-full rounded-2xl font-black h-14" onClick={handleLogout}>
                        <LogOut className="mr-2 h-5 w-5" />
                        Log Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
      </div>
      <main className="flex-1 flex flex-col pt-24 md:pt-32 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
