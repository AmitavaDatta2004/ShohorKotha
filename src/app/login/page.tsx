
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Zap, Loader2, Building, User, Briefcase, Eye, EyeOff, Globe, ArrowLeft } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast({
        title: 'Sign in successful',
        description: `Welcome back, ${result.user.displayName || 'Citizen'}.`,
      });
      router.push('/citizen-dashboard');
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  }

  const handleCredentialLogin = async (role: 'municipality' | 'supervisor') => {
    setIsLoading(true);
    try {
        const collectionName = role === 'municipality' ? "municipality" : "supervisors";
        const q = query(collection(db, collectionName), where("userId", "==", loginId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Invalid ID or Password.");
        }

        let userData;
        querySnapshot.forEach(doc => {
            if (doc.data().password === password) {
                userData = { id: doc.id, ...doc.data()};
            }
        });

        if (userData) {
            const storageKey = role === 'municipality' ? 'municipalUser' : 'supervisorUser';
            const redirectPath = role === 'municipality' ? '/municipal-dashboard' : '/supervisor-dashboard';
            
            localStorage.setItem(storageKey, JSON.stringify(userData));
            toast({
                title: 'Sign in successful',
                description: `Welcome back, ${(userData as any).name || (userData as any).userId}.`,
            });
            router.push(redirectPath);
        } else {
            throw new Error("Invalid ID or Password.");
        }
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Authorization Failed',
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md mb-8">
        <Button variant="ghost" asChild className="rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary p-4 rounded-[1.5rem] shadow-xl shadow-primary/20">
              <Zap className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Shohor Kotha</h1>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Identity Portal</p>
        </div>

        <Tabs defaultValue="citizen" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-[1.25rem] p-1 h-14 bg-white shadow-sm border border-slate-100">
            <TabsTrigger value="citizen" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black text-xs uppercase tracking-widest transition-all">Citizen</TabsTrigger>
            <TabsTrigger value="official" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black text-xs uppercase tracking-widest transition-all">Official</TabsTrigger>
            <TabsTrigger value="supervisor" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black text-xs uppercase tracking-widest transition-all">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="citizen" className="mt-6">
            <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl p-4">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-black">Citizen Access</CardTitle>
                <CardDescription className="font-medium">Sign in to manage reports and rewards.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleGoogleSignIn} 
                  disabled={isLoading}
                  className="w-full h-16 rounded-2xl gap-3 text-lg font-black bg-white border-2 border-slate-100 text-slate-900 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Globe className="h-6 w-6 text-primary" />}
                  Continue with Google
                </Button>
              </CardContent>
              <CardFooter>
                <p className="text-[10px] text-center w-full text-slate-400 font-bold uppercase tracking-widest">
                  Secure SSO &bull; 256-bit Encryption
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="official" className="mt-6">
            <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl p-4">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-black">Official Portal</CardTitle>
                <CardDescription className="font-medium">Enter your credentials to sign in.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="m-id" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ID Number</Label>
                  <Input 
                    id="m-id" 
                    placeholder="Enter your ID" 
                    className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white transition-all font-bold px-6"
                    value={loginId} 
                    onChange={(e) => setLoginId(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-pass" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</Label>
                  <div className="relative">
                    <Input 
                      id="m-pass" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white transition-all font-bold px-6"
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  className="w-full h-16 rounded-2xl text-lg font-black shadow-xl shadow-primary/20" 
                  disabled={isLoading} 
                  onClick={() => handleCredentialLogin('municipality')}
                >
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Log In
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supervisor" className="mt-6">
            <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl p-4">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-black">Staff Access</CardTitle>
                <CardDescription className="font-medium">Enter your credentials to access field work.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="s-id" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Staff ID</Label>
                  <Input 
                    id="s-id" 
                    placeholder="Enter your ID" 
                    className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white transition-all font-bold px-6"
                    value={loginId} 
                    onChange={(e) => setLoginId(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-pass" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</Label>
                  <div className="relative">
                    <Input 
                      id="s-pass" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="h-14 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white transition-all font-bold px-6"
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  className="w-full h-16 rounded-2xl text-lg font-black shadow-xl shadow-primary/20" 
                  disabled={isLoading} 
                  onClick={() => handleCredentialLogin('supervisor')}
                >
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Log In
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
