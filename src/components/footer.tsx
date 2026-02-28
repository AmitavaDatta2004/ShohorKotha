
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, Github, Linkedin, Twitter } from 'lucide-react';
import { Button } from './ui/button';

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/municipal-dashboard') || pathname.startsWith('/supervisor-dashboard') || pathname === '/login') {
    return null;
  }

  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start">
                 <Link href="/" className="flex items-center gap-2 mb-4">
                    <Megaphone className="h-7 w-7 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight font-headline text-foreground">
                        ShohorKotha
                    </h1>
                </Link>
                <p className="text-sm text-muted-foreground">Empowering Communities, One Report at a Time.</p>
                 <div className="flex space-x-2 mt-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="#"><Github className="h-5 w-5" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="#"><Linkedin className="h-5 w-5" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="#"><Twitter className="h-5 w-5" /></Link>
                    </Button>
                </div>
            </div>
             <div className="space-y-2">
                <h4 className="font-semibold">Quick Links</h4>
                <nav className="flex flex-col space-y-1 text-sm text-muted-foreground">
                    <Link href="/report-issue" className="hover:text-primary transition-colors">Report Issue</Link>
                    <Link href="/my-tickets" className="hover:text-primary transition-colors">My Tickets</Link>
                    <Link href="/map-view" className="hover:text-primary transition-colors">Map View</Link>
                </nav>
            </div>
             <div className="space-y-2">
                <h4 className="font-semibold">Company</h4>
                <nav className="flex flex-col space-y-1 text-sm text-muted-foreground">
                    <Link href="/about-us" className="hover:text-primary transition-colors">About Us</Link>
                    <Link href="/presentation" className="hover:text-primary transition-colors">Project Details</Link>
                </nav>
            </div>
        </div>
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ShohorKotha. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
