
"use client";

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Code, Bot, Brush, Zap, Fingerprint, Sparkles, Globe, Shield, Mic, Phone, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const teamMembers = [
    {
        name: "Amitava Datta",
        role: "Project Lead & Full-Stack Developer",
        id: "LEAD-AD",
        icon: <Code className="h-5 w-5" />,
        image: "/AmitavaDatta.jpg",
        color: "indigo"
    },
    {
        name: "Pranay De",
        role: "AI/ML Specialist",
        id: "AI-PD",
        icon: <Bot className="h-5 w-5" />,
        image: "/PranayDe.jpg",
        color: "emerald"
    },
    {
        name: "Srinjinee Mitra",
        role: "UI/UX Designer",
        id: "DES-SM",
        icon: <Brush className="h-5 w-5" />,
        image: "/SrinjineeMitra.jpg",
        color: "amber"
    },
    {
        name: "Shreya Paladhi",
        role: "UI/UX Designer",
        id: "DES-SP",
        icon: <Brush className="h-5 w-5" />,
        image: "/ShreyaPaladhi.jpg",
        color: "red"
    }
];

export default function AboutUsPage() {
    const { loading } = useAuth();

    if (loading) {
        return null; 
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Cinematic Header */}
            <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[150px] -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] -ml-24 -mb-24"></div>
                </div>
                
                <div className="container relative z-10 mx-auto px-4 text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Personnel Dossier v1.0</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        The Minds behind <br/> <span className="text-indigo-600 italic">CivicPulse.</span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed italic animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                        Meet the team of visionaries engineering the future of collaborative community governance and urban intelligence.
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 py-24 space-y-24">
                {/* Vision Statement */}
                <div className="grid md:grid-cols-2 gap-12 items-center bg-white rounded-[3rem] p-8 md:p-16 border border-slate-100 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                    </div>
                    <div className="space-y-6 relative z-10">
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 font-black px-4 py-1 rounded-full uppercase tracking-widest text-[10px] border-none">Our Core Mission</Badge>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight italic">Engineering transparency.</h2>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed">
                            CivicPulse was founded on the belief that technology should serve as a high-fidelity bridge between citizens and local authorities. Our goal is to eliminate friction in civic engagement through automated intelligence and verified trust protocols.
                        </p>
                        <div className="flex flex-col gap-6 pt-4">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-slate-900 leading-none">100%</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Audit Transparency</span>
                                </div>
                                <div className="w-px h-8 bg-slate-100"></div>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-slate-900 leading-none">AI-First</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Resolution Logic</span>
                                </div>
                            </div>
                            
                            {/* Voice Node Feature Highlight */}
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mic className="h-5 w-5 text-indigo-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Universal Accessibility Node</span>
                                </div>
                                <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                    "Our ecosystem now includes an AI-powered Twilio voice gateway, allowing every citizen to report issues via natural language, regardless of internet connectivity."
                                </p>
                                <div className="flex items-center gap-3 text-indigo-600">
                                    <Phone className="h-4 w-4" />
                                    <span className="text-xs font-black tabular-nums">+13142716288</span>
                                    <Activity className="h-3 w-3 animate-pulse text-emerald-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900">
                        <div className="absolute inset-0 bg-indigo-600/20 mix-blend-overlay"></div>
                        <Image
                            src="https://picsum.photos/seed/team-vision/800/800"
                            alt="Team Vision"
                            fill
                            className="object-cover opacity-60"
                            data-ai-hint="innovation team"
                        />
                        <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <Zap className="h-5 w-5 text-indigo-400" />
                                <span className="text-xs font-black text-white uppercase tracking-widest">Protocol Active: Community Pulse</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Grid */}
                <div className="space-y-16">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <Badge variant="outline" className="px-6 py-1.5 rounded-full uppercase tracking-[0.3em] font-black text-[10px] bg-indigo-600/10 text-indigo-600 border-none"> PERSONNEL_REGISTRY </Badge>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">Elite Operatives.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {teamMembers.map((member) => (
                            <Card key={member.name} className="flex flex-col items-center text-center p-8 rounded-[3rem] border-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-4 group bg-white border-2">
                                <div className="relative h-48 w-48 mb-8 group">
                                    <div className="absolute inset-0 bg-indigo-600/10 rounded-full blur-[40px] group-hover:blur-[60px] transition-all duration-500"></div>
                                    <div className="relative h-full w-full rounded-full overflow-hidden border-4 border-white shadow-2xl z-10 transition-transform duration-500 group-hover:scale-105">
                                        <Image
                                            src={member.image}
                                            alt={`Photo of ${member.name}`}
                                            width={250}
                                            height={250}
                                            className="object-cover h-full w-full grayscale group-hover:grayscale-0 transition-all duration-700"
                                        />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 h-14 w-14 rounded-2xl bg-white shadow-xl flex items-center justify-center z-20 border border-slate-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                        {member.icon}
                                    </div>
                                </div>
                                <CardHeader className="p-0 space-y-2">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Fingerprint className="h-3.5 w-3.5 text-slate-300" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{member.id}</span>
                                    </div>
                                    <CardTitle className="text-2xl font-black text-slate-900 italic">{member.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 mt-4 space-y-6">
                                    <Badge variant="secondary" className="bg-slate-50 text-slate-600 font-bold px-4 py-1.5 rounded-xl border-none text-[11px] uppercase tracking-wide">
                                        {member.role}
                                    </Badge>
                                    <div className="pt-4 border-t border-slate-50 flex justify-center gap-4">
                                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors">
                                            <Globe className="h-4 w-4" />
                                        </div>
                                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors">
                                            <Shield className="h-4 w-4" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* System Status Footer */}
                <div className="flex justify-center pt-12">
                    <div className="bg-slate-950 p-10 rounded-[3rem] text-center space-y-4 max-w-2xl w-full relative overflow-hidden shadow-2xl border-2 border-white/5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl"></div>
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Development Status: Active</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                            "Built for the community, powered by intelligence. Our team remains committed to the continuous evolution of urban infrastructure management."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
