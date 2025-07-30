
"use client";

import { useState, type FC, useEffect, useMemo } from "react";
import { Trash2, Pencil, Search, Users } from "lucide-react";
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
import Link from "next/link";
import { Input } from "./ui/input";

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
  const [searchTerm, setSearchTerm] = useState("");

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
            try {
                const imageRef = ref(storage, imageUrl);
                await deleteObject(imageRef);
            } catch (error) {
                // image might not exist, so we can ignore this error
            }
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
        description: "All students have been deleted successfully.",
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

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const term = searchTerm.toLowerCase();
      return (
        student.name.toLowerCase().includes(term) ||
        student.class.toLowerCase().includes(term) ||
        (student.mobile && student.mobile.toLowerCase().includes(term))
      );
    });
  }, [students, searchTerm]);

  return (
    <Card className="shadow-sm w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-2xl">Manage Students</CardTitle>
                    <CardDescription>
                    View, edit, or delete student records.
                    </CardDescription>
                </div>
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
                    from the servers.
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
        <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, class, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-1/2 lg:w-1/3"
            />
          </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
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
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/5">
                    <TableCell className="font-medium">
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
