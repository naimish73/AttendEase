
"use client";

import { type FC, useState } from "react";
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
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { UserPlus } from "lucide-react";

const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  class: z.string().min(1, "Class is required"),
  mobile: z.string().max(15, "Mobile number is too long").optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export const AddStudentForm: FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      class: "",
      mobile: "",
    },
  });

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    try {
      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("name", "==", data.name));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          title: "Error",
          description: "A student with this name already exists.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, "students"), {
        ...data,
        quizPoints: 0, // Initial quiz points
      });
      toast({
        title: "Student Added",
        description: `${data.name} has been added to the roster.`,
      });
      form.reset();
    } catch (error) {
      console.error("Error adding student: ", error);
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Add New Student</CardTitle>
            <CardDescription>
              Enter the details below to enroll a new student.
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
              {isSubmitting ? 'Adding Student...' : 'Add Student'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
