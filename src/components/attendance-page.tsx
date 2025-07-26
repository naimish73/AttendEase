
"use client";

import { useState, useMemo, type FC, useEffect } from "react";
import { ClipboardCheck, Download, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, doc, updateDoc, query } from "firebase/firestore";
import * as XLSX from 'xlsx';


type AttendanceStatus = "Present" | "Absent" | "Late";
type Student = {
  id: string;
  name: string;
  class: string;
  mobile: string;
  status: AttendanceStatus | null;
};

export const AttendancePage: FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentClass, setNewStudentClass] = useState("");
  const [newStudentMobile, setNewStudentMobile] = useState("");
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

  const handleStatusChange = async (studentId: string, status: AttendanceStatus) => {
    try {
        const studentRef = doc(db, "students", studentId);
        await updateDoc(studentRef, { status });
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to update student status.",
            variant: "destructive"
        })
    }
  };

  const handleAddStudent = async () => {
    if (newStudentName.trim() === "" || newStudentClass.trim() === "" || newStudentMobile.trim() === "") {
        toast({
            title: "Error",
            description: "All student fields are required.",
            variant: "destructive"
        })
        return;
    }
    try {
        const newStudent = {
            name: newStudentName,
            class: newStudentClass,
            mobile: newStudentMobile,
            status: null,
        };
        await addDoc(collection(db, "students"), newStudent);
        setNewStudentName("");
        setNewStudentClass("");
        setNewStudentMobile("");
        setAddStudentOpen(false);
        toast({
            title: "Success",
            description: "Student added successfully.",
        })
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to add student.",
            variant: "destructive"
        })
    }
  };

  const handleExport = () => {
    const worksheetData = students.map(s => ({
      ID: s.id,
      Name: s.name,
      Class: s.class,
      "Mobile No.": s.mobile,
      Status: s.status || 'Unmarked'
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `attendance-report-${date}.xlsx`);

    toast({
        title: "Export Successful",
        description: "Attendance report has been downloaded.",
    })
  };

  const filteredStudents = useMemo(
    () =>
      students.filter((student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [students, searchTerm]
  );
  
  const getStatusBadgeVariant = (status: AttendanceStatus | null) => {
    if (status === 'Present') return 'default';
    if (status === 'Absent') return 'destructive';
    if (status === 'Late') return 'secondary';
    return 'outline';
  }

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background min-h-screen">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-foreground">
            AttendEase
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isAddStudentOpen} onOpenChange={setAddStudentOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter the details of the new student to add them to the attendance list.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="class" className="text-right">
                    Class
                  </Label>
                  <Input
                    id="class"
                    value={newStudentClass}
                    onChange={(e) => setNewStudentClass(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g. 10A"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="mobile" className="text-right">
                    Mobile No.
                  </Label>
                  <Input
                    id="mobile"
                    value={newStudentMobile}
                    onChange={(e) => setNewStudentMobile(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g. 123-456-7890"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddStudent}>Save Student</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export XLS
          </Button>
        </div>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Attendance List</CardTitle>
          <CardDescription>
            Mark and view student attendance. Use the search bar to filter students.
          </CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-1/3"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Mobile No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>{student.mobile}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(student.status)} className="capitalize">
                            {student.status || 'Unmarked'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={student.status ?? ""}
                          onValueChange={(value: AttendanceStatus) =>
                            handleStatusChange(student.id, value)
                          }
                        >
                          <SelectTrigger className="w-[140px] ml-auto">
                            <SelectValue placeholder="Set Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Present">Present</SelectItem>
                            <SelectItem value="Absent">Absent</SelectItem>
                            <SelectItem value="Late">Late</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No students found. Add a student to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
