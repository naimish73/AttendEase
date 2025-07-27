
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
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { CameraCapture } from "./camera-capture";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { User } from "lucide-react";

const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  class: z.string().min(1, "Class is required"),
  mobile: z.string().max(15, "Mobile number is too long").optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export const AddStudentForm: FC = () => {
  const { toast } = useToast();
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
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

      let imageUrl = `https://placehold.co/100x100.png`;

      if (imageDataUrl) {
        const storage = getStorage();
        const storageRef = ref(storage, `student_photos/${data.name.replace(/\s+/g, '_')}_${Date.now()}.png`);
        await uploadString(storageRef, imageDataUrl, 'data_url');
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "students"), {
        ...data,
        imageUrl,
        status: null, // Initial status
      });
      toast({
        title: "Student Added",
        description: `${data.name} has been added to the roster.`,
      });
      form.reset();
      setImageDataUrl(null);
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
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-3xl">Add New Student</CardTitle>
        <CardDescription>
          Enter the details below and capture a photo to enroll a new student.
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
                  <FormLabel>Mobile No. (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 9876543210" type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
                <FormLabel>Profile Photo</FormLabel>
                <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={imageDataUrl ?? undefined} data-ai-hint="person" />
                        <AvatarFallback>
                            <User className="h-12 w-12 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                    <CameraCapture onCapture={setImageDataUrl} />
                </div>
            </FormItem>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Adding Student...' : 'Add Student'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
