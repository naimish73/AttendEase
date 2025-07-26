
"use client";

import { type FC } from "react";
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
import { collection, addDoc } from "firebase/firestore";

const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  class: z.string().min(1, "Class is required"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits").max(15, "Mobile number is too long"),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export const AddStudentForm: FC = () => {
  const { toast } = useToast();
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      class: "",
      mobile: "",
    },
  });

  const onSubmit = async (data: StudentFormValues) => {
    try {
      await addDoc(collection(db, "students"), {
        ...data,
        status: null, // Initial status
      });
      toast({
        title: "Student Added",
        description: `${data.name} has been added to the roster.`,
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-3xl">Add New Student</CardTitle>
        <CardDescription>
          Enter the details below to enroll a new student.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormLabel>Mobile No.</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 9876543210" type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" size="lg">
              Add Student
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
