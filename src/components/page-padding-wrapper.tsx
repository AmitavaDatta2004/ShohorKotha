"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * A wrapper component that conditionally applies top padding to accommodate
 * the floating navbar. It excludes routes where the navbar is hidden or 
 * where the page content is designed to be full-screen (e.g., cinematic heroes).
 */
export default function PagePaddingWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Routes that should NOT have the global top padding (Exact matches for cinematic heroes)
  const noPaddingRoutes = [
    '/',
    '/login',
    '/presentation',
    '/feed' // The main feed has its own large cinematic header
  ];
  
  // Dashboards handle their own internal layout and scrolling
  const isDashboard = pathname.startsWith('/municipal-dashboard') || pathname.startsWith('/supervisor-dashboard');
  
  // Apply padding if it's not a cinematic landing page or a dashboard
  const shouldHavePadding = !noPaddingRoutes.includes(pathname) && !isDashboard;

  return (
    <main className={cn("flex-1", shouldHavePadding && "pt-24 md:pt-28")}>
      {children}
    </main>
  );
}
