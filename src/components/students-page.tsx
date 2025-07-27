
"use client";

import { useState, type FC, useEffect } from "react";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, query, getDocs, writeBatch } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  class: string;
  mobile: string;
  imageUrl?: string;
};

export const StudentsPage: FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentsCollection = collection(db, "students");
    const q = query(studentsCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];
      
      // Sort students by class, then by name
      studentsList.sort((a, b) => {
        const classComparison = a.class.localeCompare(b.class);
        if (classComparison !== 0) {
          return classComparison;
        }
        return a.name.localeCompare(b.name);
      });

      setStudents(studentsList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students: ", error);
      toast({
        title: "Error fetching students",
        description: "Could not retrieve student data from Firestore.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleDeleteStudent = async (studentId: string, imageUrl?: string) => {
    try {
        const studentRef = doc(db, "students", studentId);
        await deleteDoc(studentRef);

        if (imageUrl && !imageUrl.includes('placehold.co')) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        }

        toast({
            title: "Success",
            description: "Student deleted successfully.",
        })
    } catch (error) {
        console.error("Error deleting student: ", error);
        toast({
            title: "Error",
            description: "Failed to delete student.",
            variant: "destructive"
        })
    }
  };

  const handleDeleteAllStudents = async () => {
    if (students.length === 0) {
      toast({
        title: "No students to delete",
        description: "The student list is already empty.",
      });
      return;
    }
    try {
      const studentsCollection = collection(db, "students");
      const querySnapshot = await getDocs(studentsCollection);
      
      const batch = writeBatch(db);
      const deletePromises: Promise<void>[] = [];

      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        const studentData = doc.data() as Student;
        if (studentData.imageUrl && !studentData.imageUrl.includes('placehold.co')) {
            const imageRef = ref(storage, studentData.imageUrl);
            deletePromises.push(deleteObject(imageRef).catch(err => {
              // Log error if a single image fails to delete, but don't block the whole process
              console.error(`Failed to delete image for ${studentData.name}: ${studentData.imageUrl}`, err);
            }));
        }
      });

      await batch.commit();
      await Promise.all(deletePromises);

      toast({
        title: "Success",
        description: "All students and their photos have been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting all students: ", error);
      toast({
        title: "Error",
        description: "Failed to delete all students. Some data might still exist.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="text-3xl">Manage Students</CardTitle>
                <CardDescription>
                View and manage all student records.
                </CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All Students
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete ALL students
                    and their profile photos from the servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllStudents}>
                    Yes, delete all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Mobile No.</TableHead>
                <TableHead className="text-right w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium flex items-center gap-3">
                      <Avatar>
                          <AvatarImage src={student.imageUrl} alt={student.name} data-ai-hint="person" />
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {student.name}
                    </TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.mobile}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button asChild variant="outline" size="icon">
                        <Link href={`/edit-student/${student.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the student
                              and remove their data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteStudent(student.id, student.imageUrl)}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
