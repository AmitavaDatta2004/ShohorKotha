
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Loader2, Building, User, Briefcase, Eye, EyeOff } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Image from 'next/image';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.136,44,30.025,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export default function LoginPage() {
  const [municipalId, setMunicipalId] = useState('');
  const [municipalPassword, setMunicipalPassword] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [supervisorPassword, setSupervisorPassword] = useState('');

  const [showMunicipalPassword, setShowMunicipalPassword] = useState(false);
  const [showSupervisorPassword, setShowSupervisorPassword] = useState(false);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMunicipalLoading, setIsMunicipalLoading] = useState(false);
  const [isSupervisorLoading, setIsSupervisorLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast({
        title: 'Login Successful',
        description: `Welcome, ${result.user.displayName || 'Citizen'}!`,
      });
      router.push('/');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message,
      });
    } finally {
        setIsGoogleLoading(false);
    }
  }

  const handleMunicipalLogin = async () => {
    setIsMunicipalLoading(true);
    try {
        const q = query(collection(db, "municipality"), where("userId", "==", municipalId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Invalid User ID or Password.");
        }

        let municipalData;
        querySnapshot.forEach(doc => {
            if (doc.data().password === municipalPassword) {
                municipalData = { id: doc.id, ...doc.data()};
            }
        });

        if (municipalData) {
            localStorage.setItem('municipalUser', JSON.stringify(municipalData));
            toast({
                title: 'Login Successful',
                description: `Welcome, ${municipalData.userId}.`,
            });
            router.push('/municipal-dashboard');
        } else {
            throw new Error("Invalid User ID or Password.");
        }
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: error.message,
        });
    } finally {
        setIsMunicipalLoading(false);
    }
  }

  const handleSupervisorLogin = async () => {
    setIsSupervisorLoading(true);
    try {
        const q = query(collection(db, "supervisors"), where("userId", "==", supervisorId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Invalid User ID or Password.");
        }

        let supervisorData;
        querySnapshot.forEach(doc => {
            if (doc.data().password === supervisorPassword) {
                supervisorData = { id: doc.id, ...doc.data() };
            }
        });

        if (supervisorData) {
            localStorage.setItem('supervisorUser', JSON.stringify(supervisorData));
             toast({
                title: 'Login Successful',
                description: `Welcome, ${supervisorData.userId}.`,
            });
            router.push('/supervisor-dashboard');
        } else {
            throw new Error("Invalid User ID or Password.");
        }
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: error.message,
        });
    } finally {
        setIsSupervisorLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md space-y-6">
            <div className="flex items-center justify-center gap-2 mb-6">
                <Megaphone className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight font-headline text-foreground">
                ShohorKotha
                </h1>
            </div>
            <p className="text-center text-muted-foreground">Select your role to sign in and continue.</p>

            <Tabs defaultValue="citizen" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="citizen">
                    <User className="mr-2 h-4 w-4" />
                    Citizen
                </TabsTrigger>
                <TabsTrigger value="municipality">
                    <Building className="mr-2 h-4 w-4" />
                    Official
                </TabsTrigger>
                <TabsTrigger value="supervisor">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Supervisor
                </TabsTrigger>
            </TabsList>
            <TabsContent value="citizen">
                <Card>
                    <CardHeader>
                        <CardTitle>Citizen Login</CardTitle>
                        <CardDescription>Sign in with your Google account to report issues and track progress.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                            Sign in with Google
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="municipality">
                <Card>
                    <CardHeader>
                        <CardTitle>Municipal Login</CardTitle>
                        <CardDescription>Enter your official credentials to access the dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="municipal-id">User ID</Label>
                            <Input id="municipal-id" type="text" placeholder="Enter your User ID" value={municipalId} onChange={(e) => setMunicipalId(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="municipal-password">Password</Label>
                            <div className="relative">
                                <Input id="municipal-password" type={showMunicipalPassword ? "text" : "password"} value={municipalPassword} onChange={(e) => setMunicipalPassword(e.target.value)} />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute inset-y-0 right-0 h-full px-3"
                                    onClick={() => setShowMunicipalPassword(!showMunicipalPassword)}
                                >
                                    {showMunicipalPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleMunicipalLogin} disabled={isMunicipalLoading}>
                            {isMunicipalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Login
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
            <TabsContent value="supervisor">
                <Card>
                    <CardHeader>
                        <CardTitle>Supervisor Login</CardTitle>
                        <CardDescription>Enter your credentials to access your assigned tasks.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="supervisor-id">User ID</Label>
                            <Input id="supervisor-id" type="text" placeholder="Enter your User ID" value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supervisor-password">Password</Label>
                            <div className="relative">
                                <Input id="supervisor-password" type={showSupervisorPassword ? "text" : "password"} value={supervisorPassword} onChange={(e) => setSupervisorPassword(e.target.value)} />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute inset-y-0 right-0 h-full px-3"
                                    onClick={() => setShowSupervisorPassword(!showSupervisorPassword)}
                                >
                                    {showSupervisorPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleSupervisorLogin} disabled={isSupervisorLoading}>
                            {isSupervisorLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Login
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
            </Tabs>
        </div>
      </div>
      <div className="hidden bg-muted md:block relative">
        <Image
          src="https://picsum.photos/seed/login/1200/1800"
          alt="Image of a city"
          data-ai-hint="city community"
          fill
          style={{objectFit: "cover"}}
          quality={100}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-10 left-10 text-white">
            <h2 className="text-4xl font-bold font-headline">Empowering Communities.</h2>
            <p className="text-lg mt-2">One report at a time.</p>
        </div>
      </div>
    </div>
  );
}
