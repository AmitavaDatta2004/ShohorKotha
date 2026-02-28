
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
import { Loader2, ShieldAlert, Star, Pencil } from "lucide-react";
import type { Supervisor } from "@/types";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

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
      // Note: We are writing to two locations for querying flexibility.
      // One is nested under the municipality for direct access, the other is a root collection for global queries.
      const supervisorData = {
        ...values,
        municipalId,
        aiImageWarningCount: 0,
        trustPoints: 100,
        efficiencyPoints: 0,
      }
      
      const supervisorDocRef = await addDoc(collection(db, 'supervisors'), supervisorData);
      
      // We can use the ID from the root collection doc to keep them in sync if needed,
      // but for this app structure, we'll keep them separate.
      await addDoc(collection(db, `municipality/${municipalId}/supervisors`), supervisorData);
      
      toast({
        title: "Supervisor Created",
        description: "The new supervisor account has been created successfully.",
      });
      createForm.reset();
    } catch (error) {
      console.error("Error creating supervisor: ", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "There was an error creating the supervisor.",
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
          editForm.setError("password", { message: "Password must be at least 6 characters."});
          setIsEditLoading(false);
          return;
        }
        dataToUpdate.password = values.password;
      }
      
      await updateDoc(supervisorRef, dataToUpdate);

      // Also update the nested document if it exists. This is brittle and ideally would be a Cloud Function.
      // For now, we assume the structure is consistent.
      const nestedSupervisorRef = doc(db, `municipality/${municipalId}/supervisors`, editingSupervisor.id);
      try {
        await updateDoc(nestedSupervisorRef, dataToUpdate);
      } catch (e) {
        console.warn("Could not update nested supervisor doc. It may not exist.", e)
      }


      toast({
        title: "Supervisor Updated",
        description: `${values.name}'s details have been updated.`,
      });
      setIsEditDialogOpen(false);
      setEditingSupervisor(null);
    } catch (error) {
      console.error("Error updating supervisor: ", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "There was an error updating the supervisor.",
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
    <>
    <Card>
      <CardHeader>
        <CardTitle>Create Supervisor</CardTitle>
        <CardDescription>Create a new supervisor account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...createForm}>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
            <FormField
              control={createForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="supervisor.one" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={createForm.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="123-456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isCreateLoading} className="w-full">
              {isCreateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Supervisor
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>

    <Card className="mt-8">
        <CardHeader>
            <CardTitle>Existing Supervisors</CardTitle>
            <CardDescription>View and manage all supervisors for this municipality.</CardDescription>
        </CardHeader>
        <CardContent>
             <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="text-center">Trust</TableHead>
                            <TableHead className="text-center">Warnings</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {supervisors.length > 0 ? (
                            supervisors.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.name}</TableCell>
                                    <TableCell>{s.userId}</TableCell>
                                    <TableCell>{s.department}</TableCell>
                                    <TableCell>{s.phoneNumber}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={(s.trustPoints || 100) < 100 ? 'destructive' : 'secondary'} className="flex items-center gap-1.5 w-fit mx-auto">
                                            <Star className="h-3.5 w-3.5" />
                                            <span>{s.trustPoints || 100}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={s.aiImageWarningCount && s.aiImageWarningCount > 0 ? 'destructive' : 'secondary'} className="flex items-center gap-1.5 w-fit mx-auto">
                                            <ShieldAlert className="h-3.5 w-3.5" />
                                            <span>{s.aiImageWarningCount || 0}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(s)}>
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">No supervisors created yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>

    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supervisor: {editingSupervisor?.name}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><Input type="password" {...field} placeholder="Leave blank to keep current password" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {departments.map((dept) => (<SelectItem key={dept} value={dept}>{dept}</SelectItem>))}
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isEditLoading} className="w-full">
                {isEditLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
