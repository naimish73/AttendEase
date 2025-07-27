
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
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { CameraCapture } from "./camera-capture";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { User } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";


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
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
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
                setExistingImageUrl(studentData.imageUrl);
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
      let newImageUrl = existingImageUrl;

      if (imageDataUrl) {
        // If there was an old image and it wasn't a placeholder, delete it
        if (existingImageUrl && !existingImageUrl.includes('placehold.co')) {
            try {
                const oldImageRef = ref(storage, existingImageUrl);
                await deleteObject(oldImageRef);
            } catch (error) {
                console.warn("Old image deletion failed, might not exist:", error)
            }
        }
        
        // Upload the new image
        const newStorageRef = ref(storage, `student_photos/${data.name.replace(/\s+/g, '_')}_${Date.now()}.png`);
        await uploadString(newStorageRef, imageDataUrl, 'data_url');
        newImageUrl = await getDownloadURL(newStorageRef);
      }

      await updateDoc(studentRef, {
        ...data,
        imageUrl: newImageUrl,
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
        <Card className="shadow-lg w-full">
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-6">
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
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-10 w-36" />
                    </div>
                </div>
                <Skeleton className="h-11 w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-3xl">Edit Student</CardTitle>
        <CardDescription>
          Update the student's details and profile photo below.
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
                        <AvatarImage src={imageDataUrl ?? existingImageUrl ?? undefined} data-ai-hint="person" />
                        <AvatarFallback className="bg-muted">
                            <User className="h-12 w-12 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                    <CameraCapture onCapture={setImageDataUrl} />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Capture a new photo to replace the existing one.</p>
            </FormItem>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
