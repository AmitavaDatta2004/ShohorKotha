
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  FilePen, 
  Users, 
  Zap, 
  ShieldCheck, 
  BrainCircuit, 
  Cpu, 
  LucideIcon,
  ChevronRight,
  Sparkles,
  User,
  Building,
  Briefcase,
  LineChart,
  Navigation,
  Trophy,
  Shield,
  LayoutGrid,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const workflowSteps = [
    { 
        title: "Citizen Reporting", 
        description: "Capture issues with AI-assisted photo and audio analysis.", 
        icon: FilePen,
        color: "indigo"
    },
    { 
        title: "AI Intelligence", 
        description: "Automated severity scoring and priority routing.", 
        icon: BrainCircuit,
        color: "indigo"
    },
    { 
        title: "Smart Triage", 
        description: "Officials assign tasks to field staff with precise deadlines.", 
        icon: Cpu,
        color: "indigo"
    },
    { 
        title: "Resolution", 
        description: "Verified completion with AI-guarded authenticity checks.", 
        icon: CheckCircle2,
        color: "emerald"
    },
];

const UserNode = ({ title, active, icon: Icon, onClick }: { title: string, active?: boolean, icon: LucideIcon, onClick?: () => void }) => (
    <div 
        onClick={onClick}
        className={cn(
        "relative flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 transition-all duration-700 cursor-pointer group select-none",
        active 
            ? "bg-indigo-600/20 border-indigo-400 shadow-[0_0_50px_rgba(79,70,229,0.4)] scale-105 z-10 backdrop-blur-3xl" 
            : "bg-white/5 border-white/10 backdrop-blur-xl hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:scale-[1.02]"
    )}>
        <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 shadow-xl",
            active ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-500 group-hover:text-slate-300"
        )}>
            <Icon className="h-7 w-7" />
        </div>
        <h4 className={cn(
            "text-[11px] font-black uppercase tracking-[0.2em] text-center leading-tight",
            active ? "text-white" : "text-slate-400 group-hover:text-white"
        )}>
            {title}
        </h4>
        {active && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-indigo-400 rounded-full animate-pulse"></div>
        )}
    </div>
);

const ProtocolNode = ({ title, active, icon: Icon }: { title: string, active?: boolean, icon: LucideIcon }) => (
    <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-700 select-none",
        active 
            ? "bg-white/10 border-indigo-400/50 shadow-[0_0_25px_rgba(79,70,229,0.2)] scale-105 opacity-100" 
            : "bg-white/[0.02] border-white/5 opacity-30 grayscale"
    )}>
        <div className={cn(
            "p-2 rounded-lg",
            active ? "bg-indigo-600/20 text-indigo-400" : "bg-white/5 text-slate-600"
        )}>
            <Icon className="h-4 w-4" />
        </div>
        <span className={cn(
            "text-[9px] font-black uppercase tracking-widest",
            active ? "text-white" : "text-slate-600"
        )}>
            {title}
        </span>
    </div>
);

export default function PresentationPage() {
    const [activeUser, setActiveUser] = useState<'citizen' | 'official' | 'staff'>('citizen');

    // Mapping of which protocols are active for which user
    const protocolMapping = {
        citizen: ['reporting', 'gis', 'loyalty', 'reputation'],
        official: ['gis', 'triage', 'analytics', 'fraud', 'reputation'],
        staff: ['dispatch', 'fraud', 'reputation'],
    };

    const isProtocolActive = (id: string) => protocolMapping[activeUser].includes(id);

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Cinematic Header */}
            <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] -ml-24 -mb-24"></div>
                </div>
                
                <div className="container relative z-10 mx-auto px-4 text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">System Methodology v1.0</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        CivicPulse: <span className="text-gradient italic">The Engine.</span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed italic animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                        Bridging the gap between communities and local government through high-fidelity AI automation and verified trust protocols.
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 py-24 space-y-32">
                
                {/* Visual Workflow Section */}
                <section className="space-y-16">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <Badge variant="outline" className="px-6 py-1.5 rounded-full uppercase tracking-[0.3em] font-black text-[10px] bg-indigo-600/10 text-indigo-600 border-none">Operational Cycle</Badge>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">A Living Ecosystem.</h2>
                        <p className="text-slate-500 max-w-2xl font-medium text-lg">A closed-loop pipeline designed for maximum community impact and administrative precision.</p>
                    </div>

                    <div className="relative group">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                            {workflowSteps.map((step, index) => (
                                <div key={index} className="group/step">
                                    <div className={cn(
                                        "flex flex-col items-center text-center space-y-6 p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-4 hover:border-indigo-100",
                                        "group-hover/step:ring-2 group-hover/step:ring-indigo-100"
                                    )}>
                                        <div className={cn(
                                            "w-20 h-20 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-inner",
                                            step.color === 'emerald' ? "bg-emerald-50 text-emerald-600 group-hover/step:bg-emerald-600 group-hover/step:text-white" : "bg-indigo-50 text-indigo-600 group-hover/step:bg-indigo-600 group-hover/step:text-white"
                                        )}>
                                            <step.icon className="h-8 w-8" />
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px] italic">Step 0{index + 1}</h4>
                                            <h3 className="text-xl font-black tracking-tight text-slate-900">{step.title}</h3>
                                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Interactive User-Centric Flowchart */}
                    <div className="p-8 md:p-20 bg-slate-950 rounded-[4rem] relative overflow-hidden border-2 border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)]">
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-white/5 rounded-full animate-[spin_80s_linear_infinite]"></div>
                        </div>
                        
                        <div className="relative z-10 flex flex-col items-center space-y-16">
                            <div className="text-center space-y-4">
                                <Badge variant="outline" className="text-indigo-400 border-indigo-400/30 font-black text-[10px] uppercase tracking-[0.3em] px-6 py-1.5 rounded-full backdrop-blur-md">Stakeholder Interaction Map</Badge>
                                <h4 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter leading-none">Operational Intelligence</h4>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Select a user profile to visualize protocol connectivity</p>
                            </div>
                            
                            <div className="w-full max-w-6xl relative min-h-[650px] flex flex-col items-center">
                                {/* SVG Dynamic Pipelines */}
                                <svg className="absolute inset-0 w-full h-full -z-0 hidden md:block" viewBox="0 0 1000 650" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <filter id="glowPath">
                                            <feGaussianBlur stdDeviation="3" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                        <linearGradient id="activeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#6366f1" />
                                            <stop offset="100%" stopColor="#10b981" />
                                        </linearGradient>
                                    </defs>

                                    {/* Connectivity Paths - Mapped to Node Positions */}
                                    {/* CITIZEN PATHS */}
                                    <g opacity={activeUser === 'citizen' ? "1" : "0.05"} className="transition-all duration-700">
                                        <path d="M 200 150 C 200 250, 150 250, 150 450" stroke={activeUser === 'citizen' ? "url(#activeGradient)" : "white"} strokeWidth="2" strokeDasharray="4 8" />
                                        <path d="M 200 150 C 200 250, 250 250, 250 450" stroke={activeUser === 'citizen' ? "url(#activeGradient)" : "white"} strokeWidth="2" strokeDasharray="4 8" />
                                        <path d="M 200 150 C 200 250, 750 250, 750 450" stroke={activeUser === 'citizen' ? "url(#activeGradient)" : "white"} strokeWidth="2" strokeDasharray="4 8" />
                                        <path d="M 200 150 C 200 250, 850 250, 850 450" stroke={activeUser === 'citizen' ? "url(#activeGradient)" : "white"} strokeWidth="2" strokeDasharray="4 8" />
                                        
                                        {/* Animated Data Points */}
                                        {activeUser === 'citizen' && [150, 250, 750, 850].map((x, i) => (
                                            <circle key={i} r="4" fill="#6366f1" filter="url(#glowPath)">
                                                <animateMotion dur={`${2 + i*0.5}s`} repeatCount="indefinite" path={`M 200 150 C 200 250, ${x} 250, ${x} 450`} />
                                            </circle>
                                        ))}
                                    </g>

                                    {/* OFFICIAL PATHS */}
                                    <g opacity={activeUser === 'official' ? "1" : "0.05"} className="transition-all duration-700">
                                        <path d="M 500 150 C 500 250, 250 250, 250 450" stroke={activeUser === 'official' ? "url(#activeGradient)" : "white"} strokeWidth="2" strokeDasharray="4 8" />
                                        <path d="M 500 150 C 500 250, 350 250, 350 450" stroke={activeUser === 'official' ? "url(#activeGradient)" : "white"} strokeWidth="2" strokeDasharray="4 8" />
                                        <path d="M 500 150 C 500 250, 450 250, 450 450" stroke={activeUser === 'official' ? "url(#activeGradient)" : "white"} strokeWidth="2" strokeDasharray="4 8" />
                                        <path d="M 500 150 C 500 250, 650 250, 650 450" stroke={activeUser === 'official' ? "url(#activeGradient)" : "white"} strokeWidth="2" strokeDasharray="4 8" />
                                        <path d="M 500 150 C 500 250, 750 250, 750 450" stroke={activeUser === 'official' ? "url(#activeGradient)" : "white"} strokeWidth="2" strokeDasharray="4 8" />
                                        
                                        {/* Animated Data Points */}
                                        {activeUser === 'official' && [250, 350, 450, 650, 750].map((x, i) => (
                                            <circle key={i} r="4" fill="#6366f1" filter="url(#glowPath)">
                                                <animateMotion dur={`${2 + i*0.4}s`} repeatCount="indefinite" path={`M 500 150 C 500 250, ${x} 250, ${x} 450`} />
                                            </circle>
                                        ))}
                                    </g>

                                    {/* STAFF PATHS */}
                                    <g opacity={activeUser === 'staff' ? "1" : "0.05"} className="transition-all duration-700">
                                        <path d="M 800 150 C 800 250, 550 250, 550 450" stroke={activeUser === 'staff' ? "url(#activeGradient)" : "white"} strokeWidth="2" strokeDasharray="4 8" />
                                        <path d="M 800 150 C 800 250, 650 250, 650 450" stroke={activeUser === 'staff' ? "url(#activeGradient)" : "white"} strokeWidth="2" strokeDasharray="4 8" />
                                        <path d="M 800 150 C 800 250, 750 250, 750 450" stroke={activeUser === 'staff' ? "url(#activeGradient)" : "white"} strokeWidth="2" strokeDasharray="4 8" />
                                        
                                        {/* Animated Data Points */}
                                        {activeUser === 'staff' && [550, 650, 750].map((x, i) => (
                                            <circle key={i} r="4" fill="#6366f1" filter="url(#glowPath)">
                                                <animateMotion dur={`${2 + i*0.6}s`} repeatCount="indefinite" path={`M 800 150 C 800 250, ${x} 250, ${x} 450`} />
                                            </circle>
                                        ))}
                                    </g>
                                </svg>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-32 mb-40 relative z-10 mt-10">
                                    <UserNode 
                                        title="Citizen" 
                                        icon={User} 
                                        active={activeUser === 'citizen'} 
                                        onClick={() => setActiveUser('citizen')} 
                                    />
                                    <UserNode 
                                        title="Official" 
                                        icon={Building} 
                                        active={activeUser === 'official'} 
                                        onClick={() => setActiveUser('official')} 
                                    />
                                    <UserNode 
                                        title="Staff" 
                                        icon={Briefcase} 
                                        active={activeUser === 'staff'} 
                                        onClick={() => setActiveUser('staff')} 
                                    />
                                </div>

                                <div className="flex flex-wrap justify-center gap-4 md:gap-6 relative z-10 mt-20 max-w-5xl">
                                    <ProtocolNode title="Reporting Engine" icon={BrainCircuit} active={isProtocolActive('reporting')} />
                                    <ProtocolNode title="GIS Map" icon={Navigation} active={isProtocolActive('gis')} />
                                    <ProtocolNode title="Triage Core" icon={Cpu} active={isProtocolActive('triage')} />
                                    <ProtocolNode title="Analytics Hub" icon={LineChart} active={isProtocolActive('analytics')} />
                                    <ProtocolNode title="Field Dispatch" icon={Navigation} active={isProtocolActive('dispatch')} />
                                    <ProtocolNode title="Fraud Guard" icon={ShieldAlert} active={isProtocolActive('fraud')} />
                                    <ProtocolNode title="Reputation API" icon={Shield} active={isProtocolActive('reputation')} />
                                    <ProtocolNode title="Loyalty System" icon={Trophy} active={isProtocolActive('loyalty')} />
                                </div>
                            </div>

                            <div className="p-8 md:p-10 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-2xl max-w-3xl text-center shadow-2xl transition-all duration-1000 border-indigo-500/20">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-indigo-600/20 p-3 rounded-2xl">
                                        <Zap className="h-6 w-6 text-indigo-400 animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-slate-300 font-medium text-lg leading-relaxed italic">
                                    {activeUser === 'citizen' && "Mission Protocol: Citizens engage with automated validation logic to report community hazards, monitoring live health data via the GIS layer while accumulating loyalty capital."}
                                    {activeUser === 'official' && "Mission Protocol: Officials leverage the Triage Core to audit field-work authenticity, utilizing deep analytics to optimize urban resource allocation and infrastructure maintenance."}
                                    {activeUser === 'staff' && "Mission Protocol: Field Supervisors manage real-time task queues through the dispatch layer, submitting high-fidelity proof-of-work that impacts universal efficiency metrics."}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stakeholder Value Grid */}
                <section className="space-y-16">
                    <div className="text-center space-y-4">
                        <Badge variant="secondary" className="px-6 py-1.5 rounded-full uppercase tracking-[0.3em] font-black text-[10px] bg-indigo-600/10 text-indigo-600 border-none">Platform Stakeholders</Badge>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight text-center">Value Allocation.</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { 
                                icon: Users, 
                                title: "For Citizens", 
                                features: ["AI-Assisted Reporting", "Gamification & Points", "Live History Tracking", "Community Map View"],
                                color: "indigo"
                            },
                            { 
                                icon: ShieldCheck, 
                                title: "For Officials", 
                                features: ["Intelligent Triage", "Performance Analytics", "Staff Management", "Live GIS Overlays"],
                                color: "emerald"
                            },
                            { 
                                icon: Zap, 
                                title: "For Staff", 
                                features: ["Dynamic Work Queues", "Authenticity Guards", "Resolution Insights", "Leaderboard Ranking"],
                                color: "amber"
                            }
                        ].map((stakeholder, i) => (
                            <Card key={i} className="rounded-[3rem] border-slate-100 shadow-xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 group border-2">
                                <CardHeader className="p-10 pb-6">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm",
                                        stakeholder.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                                        stakeholder.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                                        "bg-amber-50 text-amber-600"
                                    )}>
                                        <stakeholder.icon className="h-8 w-8" />
                                    </div>
                                    <CardTitle className="text-2xl font-black tracking-tight text-slate-900 italic">{stakeholder.title}</CardTitle>
                                    <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Operational Protocol</CardDescription>
                                </CardHeader>
                                <CardContent className="p-10 pt-0 space-y-6">
                                    <ul className="space-y-4">
                                        {stakeholder.features.map((f, j) => (
                                            <li key={j} className="flex items-center gap-4 text-sm font-bold text-slate-600 group/item">
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full transition-all duration-300 group-hover/item:scale-150",
                                                    stakeholder.color === 'indigo' ? "bg-indigo-600" :
                                                    stakeholder.color === 'emerald' ? "bg-emerald-600" :
                                                    "bg-amber-600"
                                                )}></div>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-12">
                    <div className="bg-slate-950 rounded-[4rem] p-16 md:p-24 text-center text-white relative overflow-hidden shadow-2xl border-2 border-white/5">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-[80px] -ml-24 -mb-24"></div>
                        
                        <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">Ready to build a <br/><span className="text-gradient">Smarter City?</span></h2>
                            <p className="text-slate-400 text-xl font-medium max-w-xl mx-auto">Join the movement making civic engagement simple, transparent, and rewarding for everyone.</p>
                            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
                                <Link href="/login" className="w-full sm:w-auto">
                                    <Button size="lg" className="w-full sm:w-auto h-16 px-12 rounded-full bg-indigo-600 hover:bg-indigo-700 font-black text-xl shadow-2xl shadow-indigo-600/30 group transition-all hover:scale-105 active:scale-95">
                                        Access Portal <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="/" className="w-full sm:w-auto">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-12 rounded-full border-white/10 bg-white/5 backdrop-blur-md font-black text-xl hover:bg-white/10 transition-colors text-white">
                                        Explore Map
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <footer className="py-16 border-t border-slate-100 text-center bg-white">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="bg-slate-950 p-2 rounded-xl shadow-lg">
                        <Zap className="h-6 w-6 text-white fill-white" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter uppercase italic text-slate-950">CivicPulse</span>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Built for Urban Impact &bull; 2024</p>
                <p className="text-slate-300 text-[9px] font-bold uppercase tracking-widest">Advanced Civic Intelligence System</p>
            </footer>
        </div>
    );
}
