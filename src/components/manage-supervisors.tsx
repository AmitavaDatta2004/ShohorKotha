
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldAlert, Star, Pencil, UserPlus, Fingerprint, Phone, LayoutList } from "lucide-react";
import type { Supervisor } from "@/types";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { cn } from "@/lib/utils";

const createFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  userId: z.string().min(3, "User ID must be at least 3 characters."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  department: z.string({ required_error: "Please select a department."}),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits."),
});

const editFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  userId: z.string().min(3, "User ID must be at least 3 characters."),
  password: z.string().optional(),
  department: z.string({ required_error: "Please select a department." }),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits."),
});

const departments = [
    "Public Works",
    "Sanitation",
    "Parks and Recreation",
    "Code Enforcement",
    "Water Department",
    "Animal Control",
    "Traffic & Signals",
    "Roads & Highways",
    "Other"
];

interface ManageSupervisorsProps {
  municipalId: string;
  supervisors: Supervisor[];
}

export default function ManageSupervisors({ municipalId, supervisors }: ManageSupervisorsProps) {
  const { toast } = useToast();
  const [isCreateLoading, setIsCreateLoading] = React.useState(false);
  const [isEditLoading, setIsEditLoading] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingSupervisor, setEditingSupervisor] = React.useState<Supervisor | null>(null);

  const createForm = useForm<z.infer<typeof createFormSchema>>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      name: "",
      userId: "",
      password: "",
      department: "",
      phoneNumber: "",
    },
  });

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
  });

  React.useEffect(() => {
    if (editingSupervisor) {
      editForm.reset({
        name: editingSupervisor.name,
        userId: editingSupervisor.userId,
        password: "", // Keep password blank for security
        department: editingSupervisor.department,
        phoneNumber: editingSupervisor.phoneNumber,
      });
    }
  }, [editingSupervisor, editForm]);

  async function onCreateSubmit(values: z.infer<typeof createFormSchema>) {
    if (!municipalId) {
        toast({ variant: "destructive", title: "Error", description: "Municipal ID not found." });
        return;
    }

    setIsCreateLoading(true);
    try {
      const supervisorData = {
        ...values,
        municipalId,
        aiImageWarningCount: 0,
        trustPoints: 100,
        efficiencyPoints: 0,
      }
      
      await addDoc(collection(db, 'supervisors'), supervisorData);
      
      toast({
        title: "Staff Account Created",
        description: `The account for ${values.name} is now active.`,
      });
      createForm.reset();
    } catch (error) {
      console.error("Error creating supervisor: ", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "There was an error creating the account.",
      });
    } finally {
      setIsCreateLoading(false);
    }
  }

  async function onEditSubmit(values: z.infer<typeof editFormSchema>) {
    if (!editingSupervisor) return;

    setIsEditLoading(true);
    try {
      const supervisorRef = doc(db, 'supervisors', editingSupervisor.id);

      const dataToUpdate: Partial<Supervisor> = {
        name: values.name,
        userId: values.userId,
        department: values.department,
        phoneNumber: values.phoneNumber,
      };

      if (values.password) {
        if (values.password.length < 6) {
          editForm.setError("password", { message: "Minimum 6 characters required."});
          setIsEditLoading(false);
          return;
        }
        dataToUpdate.password = values.password;
      }
      
      await updateDoc(supervisorRef, dataToUpdate);

      toast({
        title: "Staff Info Updated",
        description: `Account details for ${values.name} have been modified.`,
      });
      setIsEditDialogOpen(false);
      setEditingSupervisor(null);
    } catch (error) {
      console.error("Error updating supervisor: ", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Error modifying staff data.",
      });
    } finally {
      setIsEditLoading(false);
    }
  }
  
  const handleEditClick = (supervisor: Supervisor) => {
    setEditingSupervisor(supervisor);
    setIsEditDialogOpen(true);
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      <Card className="lg:col-span-4 rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white group">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform duration-500">
              <UserPlus className="h-5 w-5"/>
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Add New Staff</CardTitle>
              <CardDescription className="font-medium text-slate-500 text-xs">Create a new field supervisor account.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" className="h-12 rounded-xl border-2 font-bold px-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Login ID</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe" className="h-12 rounded-xl border-2 font-bold px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-2 font-bold px-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={createForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-2 font-bold px-4">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-2">
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept} className="font-bold">{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="555-0123" className="h-12 rounded-xl border-2 font-bold px-4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isCreateLoading} className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-xl shadow-indigo-600/20 text-xs uppercase tracking-widest transition-all">
                {isCreateLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-8 rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white group">
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-slate-950 p-3 rounded-2xl text-white">
              <LayoutList className="h-5 w-5"/>
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Current Staff</CardTitle>
              <CardDescription className="font-medium text-slate-500 text-xs">A list of all active field supervisors.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-50 hover:bg-transparent">
                <TableHead className="pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</TableHead>
                <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Trust Score</TableHead>
                <TableHead className="text-right pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supervisors.length > 0 ? (
                supervisors.map(s => (
                  <TableRow key={s.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group/row">
                    <TableCell className="pl-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover/row:bg-indigo-600 group-hover/row:text-white transition-colors">
                          <Fingerprint className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{s.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {s.userId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-lg border-none text-[10px]">
                        {s.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={(s.trustPoints || 100) < 90 ? 'destructive' : 'secondary'} className={cn(
                        "font-black text-[10px] uppercase gap-1.5 px-3 py-1 rounded-lg",
                        (s.trustPoints || 100) >= 90 ? "bg-emerald-50 text-emerald-700" : ""
                      )}>
                        <Star className={cn("h-3 w-3", (s.trustPoints || 100) >= 90 ? "fill-emerald-700" : "")} />
                        {s.trustPoints || 100}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-indigo-50 hover:text-indigo-600" onClick={() => handleEditClick(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-slate-400 font-medium">No staff members found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-[3rem] p-10 border-none shadow-2xl max-w-lg">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                <Pencil className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Edit Staff Info</DialogTitle>
            </div>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Name</FormLabel>
                    <FormControl><Input className="h-12 rounded-xl border-2 font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID</FormLabel>
                      <FormControl><Input className="h-12 rounded-xl border-2 font-bold" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</FormLabel>
                      <FormControl><Input type="password" {...field} placeholder="Leave blank to keep" className="h-12 rounded-xl border-2 font-bold" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl border-2 font-bold"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="rounded-xl border-2">
                          {departments.map((dept) => (<SelectItem key={dept} value={dept} className="font-bold">{dept}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</FormLabel>
                      <FormControl><Input className="h-12 rounded-xl border-2 font-bold" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isEditLoading} className="w-full h-14 rounded-2xl bg-indigo-600 font-black shadow-xl uppercase tracking-widest">
                {isEditLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
