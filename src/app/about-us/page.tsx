
"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Code, Bot, Brush, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const teamMembers = [
    {
        name: "Amitava Datta",
        role: "Project Lead & Full-Stack Developer",
        icon: <Code className="h-4 w-4" />,
        image: "/AmitavaDatta.jpg"
    },
    {
        name: "Pranay De",
        role: "AI/ML Specialist",
        icon: <Bot className="h-4 w-4" />,
        image: "/PranayDe.jpg"
    },
    {
        name: "Srinjinee Mitra",
        role: "UI/UX Designer",
        icon: <Brush className="h-4 w-4" />,
        image: "/SrinjineeMitra.jpg"
    },
    {
        name: "Shreya Paladhi",
        role: "Data Analyst",
        icon: <Database className="h-4 w-4" />,
        image: "/ShreyaPaladhi.jpg"
    }
];

export default function AboutUsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return null; // Or a loading spinner
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
            <header className="text-center space-y-2">
                <Users className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight font-headline text-primary">About Us</h1>
                <p className="text-lg text-muted-foreground">Meet the passionate team behind ShohorKotha.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => (
                    <Card key={member.name} className="flex flex-col items-center text-center p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="relative h-32 w-32 mb-4">
                            <Image
                                src={member.image}
                                alt={`Photo of ${member.name}`}
                                width={200}
                                height={200}
                                className="rounded-full object-cover border-4 border-primary/20"
                            />
                        </div>
                        <CardHeader className="p-0">
                            <CardTitle className="text-xl">{member.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 mt-2">
                            <Badge variant="secondary" className="flex items-center gap-1.5">
                                {member.icon}
                                <span>{member.role}</span>
                            </Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
