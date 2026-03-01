
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { 
  BrainCircuit, 
  Zap, 
  Globe, 
  Cpu, 
  Activity, 
  ShieldAlert, 
  Database,
  Megaphone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const UrbanIntelligenceCore = () => {
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {/* Outer Rotating Ring */}
      <div className="absolute inset-0 border-2 border-dashed border-indigo-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
      
      {/* Middle Pulse Ring */}
      <div className="absolute inset-2 border-2 border-indigo-500/50 rounded-full animate-pulse"></div>
      
      {/* Inner Technical Core */}
      <div className="relative z-10 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.6)]">
        <Cpu className="h-6 w-6 text-white" />
      </div>

      {/* Orbital Data Nodes */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-900 border border-white/10 rounded-lg flex items-center justify-center animate-bounce shadow-xl">
        <BrainCircuit className="h-3 w-3 text-indigo-400" />
      </div>
      <div className="absolute bottom-2 -right-2 w-6 h-6 bg-slate-900 border border-white/10 rounded-lg flex items-center justify-center animate-pulse shadow-xl">
        <ShieldAlert className="h-3 w-3 text-emerald-400" />
      </div>
    </div>
  );
};

const NeuralPulseTicker = () => {
  const activities = [
    "AI Severity Analysis: Completed in Sector 4",
    "New Pothole Logged: Node ID #8821",
    "Trust Points Awarded: User 'Citizen_X'",
    "Official Audit: Resolution Verified",
    "GIS Layer Sync: All systems operational",
    "Priority Triage: High Severity Alert in Core District",
    "Fraud Guard: Synthetic image detected and flagged",
    "Community Pulse: Participation up 14% this month"
  ];

  return (
    <div className="w-full bg-slate-950 border-y border-white/5 py-4 overflow-hidden select-none">
      <div className="flex animate-ticker whitespace-nowrap">
        {[...activities, ...activities].map((text, i) => (
          <div key={i} className="flex items-center mx-10">
            <div className="h-2 w-2 rounded-full bg-indigo-500 mr-4 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200/60 font-mono">
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = React.useState(true);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isMounted, setIsMounted] = React.useState(false);

  const heroImageUrl = "/landing.jpg";

  React.useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const progress = Math.min(Math.max(scrollY / (viewportHeight * 1.5), 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    const checkSessionAndRedirect = () => {
      if (user) {
        router.replace('/citizen-dashboard');
        return true;
      }
      if (typeof window !== 'undefined') {
        if (localStorage.getItem('municipalUser')) {
          router.replace('/municipal-dashboard');
          return true;
        }
        if (localStorage.getItem('supervisorUser')) {
          router.replace('/supervisor-dashboard');
          return true;
        }
      }
      return false;
    };

    if (!loading) {
      const redirected = checkSessionAndRedirect();
      if (!redirected) {
        setIsRedirecting(false);
      }
    }
  }, [user, loading, router]);

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-slate-950">
        <div className="relative">
          <div className="h-28 w-28 rounded-3xl bg-indigo-50 border border-indigo-100 animate-pulse flex items-center justify-center">
            <Globe className="h-12 w-12 text-indigo-600 animate-spin [animation-duration:3s]" />
          </div>
          <div className="absolute -inset-6 bg-indigo-500/5 blur-3xl -z-10 animate-pulse"></div>
        </div>
        <div className="mt-10 text-center space-y-3">
          <h2 className="text-2xl font-black tracking-tighter uppercase italic text-indigo-600">Shohor Kotha</h2>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Initializing Core...</p>
        </div>
      </div>
    );
  }

  const curtainTranslate = -(scrollProgress * 100);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Scroll Track for Hero Reveal */}
      <section className="relative w-full h-[250vh] z-0">
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-slate-950">
          
          {/* Background Image (Revealed Layer) */}
          <div className="absolute inset-0 z-0 scale-110">
            <Image
              src={heroImageUrl}
              alt="Smart City Backdrop"
              fill
              className="object-cover opacity-60"
              priority
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* Foreground White Deck (The Curtain) - 50% on mobile, 75% on desktop */}
          <div 
            className="absolute top-0 left-0 w-full h-[50vh] md:h-[75vh] z-10 bg-transparent transition-transform duration-75 ease-out flex flex-col pointer-events-none"
            style={{ 
              transform: `translateY(${curtainTranslate}%)`,
            }}
          >
            {/* SVG Mask Container */}
            <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
              <svg width="100%" height="100%" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                  <mask id="hero-mask" x="0" y="0" width="100%" height="100%">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    <text 
                      x="50%" 
                      y="50%" 
                      textAnchor="middle" 
                      dy=".35em" 
                      fill="black" 
                      className="font-black"
                      style={{ fontSize: 'min(11vw, 170px)', letterSpacing: '-0.05em' }}
                    >
                     SHOHOR KOTHA
                    </text>
                  </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="white" mask="url(#hero-mask)" />
              </svg>
            </div>
          </div>

          {/* Subtitles & CTAs (Revealed with Background) */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end pb-12 md:pb-20 pointer-events-none">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                <div className="space-y-2">
                  <p className="text-white font-black uppercase tracking-[0.4em] text-xs md:text-sm">Welcome To</p>
                  <h2 className="text-white font-black uppercase tracking-widest text-xl md:text-2xl italic">The Community Pulse.</h2>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto pointer-events-auto">
                  <Button size="lg" className="h-16 px-10 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black uppercase tracking-widest text-sm shadow-2xl whitespace-nowrap" asChild>
                    <Link href="/login">Initialize Citizen ID</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-white/20 bg-black/20 backdrop-blur-xl text-white hover:bg-white/10 font-black uppercase tracking-widest text-sm whitespace-nowrap" asChild>
                    <Link href="/presentation">Operational Method</Link>
                  </Button>
                </div>

                <div className="hidden lg:block text-right">
                  <p className="text-white font-black uppercase tracking-[0.4em] text-xs">V1.0.0 Stable</p>
                  <p className="text-white/60 font-black uppercase tracking-widest text-[10px]">Active Node Registry</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <NeuralPulseTicker />

      {/* Intelligence Engine Section */}
      <section className="py-40 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.03]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <Badge variant="secondary" className="px-8 py-2 rounded-full uppercase tracking-[0.3em] font-black text-xs bg-indigo-600/10 text-indigo-600 border-none">Intelligence Engine</Badge>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-950 leading-[0.9]">Autonomous <br /><span className="italic text-indigo-600">Decision Logic.</span></h2>
                <p className="text-slate-500 text-xl font-medium leading-relaxed">Our neural pipeline eliminates the friction of manual bureaucracy. From the moment an image is captured, the system initiates a multi-stage audit.</p>
              </div>

              <div className="space-y-8">
                {[
                  { icon: BrainCircuit, title: "Severity Quantization", desc: "AI models score incident severity from 1-10, determining budget and urgency automatically." },
                  { icon: ShieldAlert, title: "Fraud Guard API", desc: "Integrated computer vision identifies AI-generated or synthetic media to preserve system integrity." },
                  { icon: Cpu, title: "Intelligent Dispatch", desc: "Automated routing to precise municipal departments based on NLP context from user notes." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-8 p-8 rounded-3xl hover:bg-slate-50 transition-colors group">
                    <div className="shrink-0 w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                      <item.icon className="h-8 w-8 text-indigo-600 group-hover:text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 mb-2 uppercase italic tracking-tight">{item.title}</h4>
                      <p className="text-base text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-indigo-600/10 blur-[150px] rounded-full scale-150"></div>
              <div className="relative z-10 bg-slate-950 rounded-[3.5rem] p-6 md:p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border border-white/5 group">
                <div className="absolute top-10 left-10 z-20 flex items-center gap-4">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-xs font-black uppercase tracking-widest text-white/60">Target: ID_8821 // SCANNING</span>
                </div>
                
                <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden">
                  <Image src="https://picsum.photos/seed/scan/800/800" alt="Scanning" fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" data-ai-hint="city infrastructure" />
                  <div className="absolute inset-0 border-2 border-indigo-500/20 pointer-events-none"></div>
                  <div className="absolute w-full h-[3px] bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-scan z-20"></div>
                  
                  <div className="absolute bottom-10 right-10 z-20 space-y-3">
                    <Badge className="bg-indigo-600 border-none font-black text-xs uppercase tracking-widest px-6 py-2 block">Severity: 8.4</Badge>
                    <Badge className="bg-slate-900 border-white/10 font-black text-xs uppercase tracking-widest px-6 py-2 block">Class: Pothole_High</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Final CTA */}
      <section className="py-40 px-4 relative overflow-hidden">
        <div className="absolute inset-0 neural-grid opacity-[0.03]"></div>
        <div className="container mx-auto">
          <div className="bg-slate-950 rounded-[4.5rem] p-16 md:p-32 text-center text-white relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] border-2 border-white/5">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] -mr-64 -mt-64"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] -ml-48 -mb-48"></div>
            
            <div className="relative z-10 max-w-4xl mx-auto space-y-12">
              <div className="flex justify-center">
                <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-2xl">
                  <UrbanIntelligenceCore />
                </div>
              </div>
              <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85]">Ready to Secure your <br/><span className="text-indigo-600 italic">Neighborhood?</span></h2>
              <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto">Join the movement making cities smarter, safer, and more transparent through the power of collective intelligence.</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 pt-8">
                <Button size="lg" variant="default" className="h-20 sm:h-24 px-8 sm:px-16 rounded-full text-xl sm:text-2xl font-black shadow-2xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 bg-indigo-600 hover:bg-indigo-700 uppercase tracking-widest whitespace-nowrap" asChild>
                  <Link href="/login">Create Citizen ID</Link>
                </Button>
              </div>

              <div className="pt-16 flex items-center justify-center gap-10 text-slate-500 font-black text-xs uppercase tracking-[0.3em]">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  System Status: Active
                </div>
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4" />
                  Grid Verified
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}