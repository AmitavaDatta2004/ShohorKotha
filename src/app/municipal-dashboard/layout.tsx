
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Home,
  Users,
  Menu,
  LogOut,
  Megaphone,
  Briefcase,
  CheckCircle2,
  LineChart,
  Trophy,
} from 'lucide-react';

const navLinks = [
  { href: '/municipal-dashboard', label: 'Dashboard', icon: Home },
  { href: '/municipal-dashboard/analytics', label: 'Analytics', icon: LineChart },
  { href: '/municipal-dashboard/assigned-work', label: 'Assigned', icon: Briefcase },
  { href: '/municipal-dashboard/resolved-work', label: 'Resolved', icon: CheckCircle2 },
  { href: '/municipal-dashboard/manage-supervisors', label: 'Supervisors', icon: Users },
  { href: '/municipal-dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function MunicipalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [municipalUser, setMunicipalUser] = React.useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('municipalUser');
    if (!storedUser) {
      router.push('/login');
    } else {
      setMunicipalUser(JSON.parse(storedUser));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('municipalUser');
    router.push('/login');
  };
  
  if (!municipalUser) {
    return null; // Or a loading spinner
  }

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className={cn(
      "items-center space-x-2 lg:space-x-4",
      isMobile ? "flex flex-col space-x-0 space-y-2 pt-4" : "hidden md:flex"
    )}>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => isMobile && setMobileMenuOpen(false)}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 px-2 py-1 rounded-md",
            pathname === link.href ? "text-primary bg-primary/10" : "text-muted-foreground",
            isMobile && "text-lg w-full p-2"
          )}
        >
          <link.icon className="h-4 w-4" />
          {link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="bg-card border-b shadow-sm sticky top-0 z-[1000]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/municipal-dashboard" className="flex items-center gap-2">
                        <Megaphone className="h-7 w-7 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight font-headline text-foreground">
                            ShohorKotha
                        </h1>
                    </Link>
                    <NavLinks />
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:flex">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                     <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Municipal Menu</SheetTitle>
                            </SheetHeader>
                             <div className="flex flex-col h-full">
                                <Link href="/municipal-dashboard" className="flex items-center gap-2 mb-6" onClick={() => setMobileMenuOpen(false)}>
                                    <Megaphone className="h-7 w-7 text-primary" />
                                    <h1 className="text-2xl font-bold tracking-tight font-headline text-foreground">
                                        ShohorKotha
                                    </h1>
                                </Link>
                                <NavLinks isMobile />
                                <div className="mt-auto">
                                    <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </Button>
                                </div>
                             </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </div>
      </header>
       <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          {children}
        </main>
    </div>
  );
}
