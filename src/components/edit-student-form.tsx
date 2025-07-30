
"use client";

import { type FC, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";
import { UserCog } from "lucide-react";


const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  class: z.string().min(1, "Class is required"),
  mobile: z.string().max(15, "Mobile number is too long").optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface EditStudentFormProps {
    studentId: string;
}

export const EditStudentForm: FC<EditStudentFormProps> = ({ studentId }) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      class: "",
      mobile: "",
    },
  });

  useEffect(() => {
    const fetchStudentData = async () => {
        try {
            const studentRef = doc(db, "students", studentId);
            const studentSnap = await getDoc(studentRef);

            if (studentSnap.exists()) {
                const studentData = studentSnap.data();
                form.reset({
                    name: studentData.name,
                    class: studentData.class,
                    mobile: studentData.mobile || "",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Student not found.",
                    variant: "destructive",
                });
                router.push('/manage-students');
            }
        } catch (error) {
             toast({
                title: "Error",
                description: "Failed to fetch student details.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };
    fetchStudentData();
  }, [studentId, form, toast, router]);

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    try {
      const studentRef = doc(db, "students", studentId);
      
      await updateDoc(studentRef, {
        ...data,
      });

      toast({
        title: "Student Updated",
        description: `${data.name}'s details have been updated successfully.`,
      });
      router.push('/manage-students');
    } catch (error) {
      console.error("Error updating student: ", error);
      toast({
        title: "Error",
        description: "Failed to update student. Please try again.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
        <Card className="shadow-sm w-full">
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-11 w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-sm w-full">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Edit Student</CardTitle>
            <CardDescription>
              Update the student's details below.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="class"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 10th Grade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile No. (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 9876543210" type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
