
"use client";

import { useState, type FC, useEffect } from "react";
import { Trash2 } from "lucide-react";
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
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, query } from "firebase/firestore";

type Student = {
  id: string;
  name: string;
  class: string;
  mobile: string;
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

  const handleDeleteStudent = async (studentId: string) => {
    try {
        const studentRef = doc(db, "students", studentId);
        await deleteDoc(studentRef);
        toast({
            title: "Success",
            description: "Student deleted successfully.",
        })
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to delete student.",
            variant: "destructive"
        })
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
                <TableHead className="text-right w-[90px]">Actions</TableHead>
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
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.mobile}</TableCell>
                    <TableCell className="text-right">
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
                            <AlertDialogAction onClick={() => handleDeleteStudent(student.id)}>
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
