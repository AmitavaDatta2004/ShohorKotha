
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Megaphone, LogOut, LayoutGrid, Ticket, Map, Menu, Trophy, Home as HomeIcon, Star, History, Users, ShieldCheck, Zap, Activity, Rss } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Don't render navbar on special dashboards or login
  if (pathname.startsWith('/municipal-dashboard') || pathname.startsWith('/supervisor-dashboard') || pathname === '/login') {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  const guestNavLinks = [
    { href: "/", label: "Home", icon: <HomeIcon className="h-6 w-6" /> },
    { href: "/feed", label: "Feed", icon: <Rss className="h-6 w-6" /> },
    { href: "/leaderboard", label: "Rankings", icon: <Trophy className="h-6 w-6" /> },
    { href: "/presentation", label: "Methodology", icon: <Star className="h-6 w-6" /> },
    { href: "/about-us", label: "About Us", icon: <Users className="h-6 w-6" /> },
  ];

  const authenticatedNavLinks = [
    { href: "/citizen-dashboard", label: "Dashboard", icon: <LayoutGrid className="h-6 w-6" /> },
    { href: "/feed", label: "Feed", icon: <Rss className="h-6 w-6" /> },
    { href: "/report-issue", label: "Report", icon: <Ticket className="h-6 w-6" /> },
    { href: "/my-tickets", label: "History", icon: <History className="h-6 w-6" /> },
    { href: "/map-view", label: "Map", icon: <Map className="h-6 w-6" /> },
    { href: "/rewards", label: "Rewards", icon: <Trophy className="h-6 w-6" /> },
    { href: "/leaderboard", label: "Rankings", icon: <Star className="h-6 w-6" /> },
    { href: "/about-us", label: "About Us", icon: <Users className="h-6 w-6" /> },
  ];

  const navLinks = user ? authenticatedNavLinks : guestNavLinks;
  
  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className={cn(
      "items-center",
      isMobile ? "flex flex-col space-y-2 pt-6" : "hidden lg:flex space-x-2 xl:space-x-4"
    )}>
      {navLinks
        .filter(link => isMobile || (link.href !== '/about-us'))
        .map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => isMobile && setMobileMenuOpen(false)}
          className={cn(
            "text-xs xl:text-sm font-black uppercase tracking-[0.1em] transition-all px-4 xl:px-5 py-3 rounded-xl whitespace-nowrap",
            isMobile ? "text-xl w-full p-5 normal-case tracking-normal font-bold flex items-center gap-4" : "",
            pathname === link.href 
              ? "text-indigo-600 bg-indigo-600/5 shadow-sm" 
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          )}
        >
          {isMobile ? (
            <>
              <div className={cn(
                "p-3 rounded-2xl shadow-sm transition-colors",
                pathname === link.href ? "bg-indigo-600 text-white shadow-indigo-600/20" : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50"
              )}>
                {link.icon}
              </div>
              <span className="flex-1">{link.label}</span>
            </>
          ) : (
            <span>{link.label}</span>
          )}
        </Link>
      ))}
    </nav>
  );
  

  return (
    <div className="fixed top-6 left-0 right-0 z-[1000] flex justify-center px-4 md:px-6 lg:px-8 pointer-events-none">
      <header className="w-full max-w-7xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] h-20 flex items-center px-8 transition-all duration-500 group pointer-events-auto hover:bg-white/85 hover:border-white/60">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-6 xl:gap-10 shrink-0">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="bg-slate-950 p-2 rounded-xl shadow-lg">
                <Megaphone className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tighter uppercase italic text-slate-950 block">
                Shohor Kotha
              </h1>
            </Link>
            <NavLinks />
          </div>

          <div className="flex items-center gap-4 lg:gap-8 shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-11 w-11 rounded-full border-2 border-white/50 hover:border-indigo-600/50 shadow-sm transition-colors focus:outline-none overflow-hidden group">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                      <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-sm">{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 rounded-[2rem] p-3 shadow-2xl border-slate-100 mt-4 backdrop-blur-xl bg-white/90" align="end" forceMount>
                   <DropdownMenuLabel className="font-normal p-5">
                    <div className="flex flex-col space-y-2">
                      <p className="text-base font-black text-slate-950 leading-none">{user.displayName || 'User'}</p>
                      <p className="text-sm font-medium text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-2xl p-4 text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer font-black text-xs uppercase tracking-widest">
                    <LogOut className="mr-3 h-5 w-5" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="lg" className="hidden lg:flex rounded-full px-8 h-12 font-black bg-slate-950 text-white hover:bg-indigo-600 shadow-xl shadow-slate-950/10 transition-all text-xs uppercase tracking-widest" asChild>
                <Link href="/login">Log In</Link>
              </Button>
            )}
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden rounded-xl border border-slate-100 hover:bg-slate-50 h-12 w-12">
                  <Menu className="h-7 w-7 text-slate-950" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="z-[2000] w-full sm:w-[440px] rounded-r-[3rem] border-none shadow-2xl bg-white/95 backdrop-blur-3xl p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Mobile Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  {/* High-Fidelity Menu Header */}
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <Link href="/" className="flex items-center gap-3 mb-8" onClick={() => setMobileMenuOpen(false)}>
                      <div className="bg-slate-950 p-2 rounded-lg shadow-md">
                        <Megaphone className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-2xl font-black tracking-tighter uppercase italic text-slate-950">
                        CivicPulse
                      </h1>
                    </Link>
                    
                    {user && (
                      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                          <AvatarImage src={user.photoURL ?? ''} />
                          <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">{getInitials(user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-black text-slate-950 truncate">{user.displayName || 'Citizen Account'}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified Citizen</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="px-4 mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Mission Navigation</span>
                    </div>
                    <NavLinks isMobile />
                  </div>
                  
                  {/* System Status Footer */}
                  <div className="mt-auto p-8 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Online</span>
                      </div>
                      <ShieldCheck className="h-4 w-4 text-indigo-600 opacity-40" />
                    </div>

                    {user ? (
                      <Button size="lg" variant="destructive" className="w-full rounded-2xl font-black h-16 text-lg shadow-xl shadow-red-900/10" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
                        <LogOut className="mr-3 h-5 w-5" />
                        Terminate Session
                      </Button>
                    ) : (
                      <Button size="lg" className="w-full rounded-2xl font-black h-16 text-lg bg-slate-950 text-white hover:bg-indigo-600 shadow-xl shadow-slate-950/20" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/login">Initialize Citizen ID</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </div>
  );
}
