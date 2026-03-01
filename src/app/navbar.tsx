
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
import { Megaphone, LogOut, LayoutGrid, Ticket, Map, Menu, Trophy } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

const mainNavLinks = [
  { href: "/", label: "Home", icon: <LayoutGrid className="h-4 w-4" /> },
  { href: "/report-issue", label: "Report Issue", icon: <Ticket className="h-4 w-4" /> },
  { href: "/my-tickets", label: "My Tickets", icon: <Ticket className="h-4 w-4" /> },
  { href: "/map-view", label: "Map View", icon: <Map className="h-4 w-4" /> },
  { href: "/rewards", label: "Rewards", icon: <Trophy className="h-4 w-4" /> },
  { href: "/leaderboard", label: "Leaderboard", icon: <Trophy className="h-4 w-4" /> },
];

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
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };
  
  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <nav className={cn(
      "items-center space-x-4 lg:space-x-6",
      isMobile ? "flex flex-col space-x-0 space-y-2 pt-4" : "hidden md:flex"
    )}>
      {mainNavLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => isMobile && setMobileMenuOpen(false)}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
            isMobile ? "text-lg w-full p-2 rounded-md" : "",
            pathname === link.href ? "text-primary" : "text-muted-foreground",
            !isMobile && pathname.startsWith(link.href) && link.href !== '/' && "text-primary"
          )}
        >
          {isMobile && link.icon}
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
  

  return (
    <header className="bg-card border-b shadow-sm sticky top-0 z-[1000]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Megaphone className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight font-headline text-foreground">
                Shohor Kotha
              </h1>
            </Link>
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
                 {mainNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        pathname === link.href ? "text-primary" : "text-muted-foreground",
                        pathname.startsWith(link.href) && link.href !== '/' && "text-primary"
                      )}
                    >
                    {link.label}
                    </Link>
                ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                      <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                   <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="z-[2000]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Mobile Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <Link href="/" className="flex items-center gap-2 mb-6" onClick={() => setMobileMenuOpen(false)}>
                    <Megaphone className="h-7 w-7 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight font-headline text-foreground">
                      Shohor Kotha
                    </h1>
                  </Link>
                  <NavLinks isMobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
