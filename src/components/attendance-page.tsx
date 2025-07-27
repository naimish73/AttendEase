
"use client";

import { useState, useMemo, type FC, useEffect } from "react";
import { Download, Search, RotateCcw, UserCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, writeBatch } from "firebase/firestore";
import * as XLSX from 'xlsx';
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type AttendanceStatus = "Present" | "Absent" | "Late";
type Student = {
  id: string;
  name: string;
  class: string;
  mobile: string;
  status: AttendanceStatus | null;
  imageUrl?: string;
};

export const AttendancePage: FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exportFileName, setExportFileName] = useState("");

  useEffect(() => {
    const studentsCollection = collection(db, "students");
    const q = query(studentsCollection);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];

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
  
  const presentCount = useMemo(() => students.filter(s => s.status === 'Present').length, [students]);
  const lateCount = useMemo(() => students.filter(s => s.status === 'Late').length, [students]);


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

  const handleResetAll = async () => {
    if (students.length === 0) {
      toast({
        title: "No Students",
        description: "There are no students to reset.",
      });
      return;
    }
    try {
      const batch = writeBatch(db);
      students.forEach(student => {
        const studentRef = doc(db, "students", student.id);
        batch.update(studentRef, { status: null });
      });
      await batch.commit();
      toast({
        title: "Success",
        description: "All student attendance has been reset.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset attendance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (!exportFileName.trim()) {
        toast({
            title: "Error",
            description: "Please enter a valid file name.",
            variant: "destructive",
        });
        return;
    }

    const worksheetData = students.map(s => ({
      ID: s.id,
      Name: s.name,
      Class: s.class,
      "Mobile No.": s.mobile || '',
      Status: s.status || 'Unmarked'
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    XLSX.writeFile(workbook, `${exportFileName.trim()}.xlsx`);

    toast({
        title: "Export Successful",
        description: `Attendance report "${exportFileName.trim()}.xlsx" has been downloaded.`,
    })

    setExportFileName(""); // Reset for next time
  };

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const term = searchTerm.toLowerCase();
        return (
          student.name.toLowerCase().includes(term) ||
          student.class.toLowerCase().includes(term) ||
          (student.mobile && student.mobile.toLowerCase().includes(term))
        );
      }),
    [students, searchTerm]
  );
  
  const getStatusBadgeVariant = (status: AttendanceStatus | null) => {
    if (status === 'Present') return 'default';
    if (status === 'Absent') return 'destructive';
    if (status === 'Late') return 'secondary';
    return 'outline';
  }

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1.5">
                <CardTitle>Attendance List</CardTitle>
                <CardDescription>
                Mark and view student attendance.
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset All
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reset the attendance status for all students to 'Unmarked'. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetAll}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export XLS
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Export Attendance</DialogTitle>
                            <DialogDescription>
                                Please enter a name for the export file.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="fileName" className="text-right">
                                    File Name
                                </Label>
                                <Input
                                    id="fileName"
                                    value={exportFileName}
                                    onChange={(e) => setExportFileName(e.target.value)}
                                    placeholder="e.g., Attendance-Report-2024"
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button onClick={handleExport}>Download</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-4">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, class, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex gap-4 items-center p-2 rounded-lg bg-muted/50 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-bold text-lg">{presentCount}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-bold text-lg">{lateCount}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
            </div>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[160px]">Actions</TableHead>
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
                  <TableRow key={student.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={student.imageUrl} alt={student.name} data-ai-hint="person" />
                            <AvatarFallback>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {student.name}
                    </TableCell>
                    <TableCell>{student.class}</TableCell>
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
                  <TableCell colSpan={4} className="h-24 text-center">
                    No students found. Add a student to get started.
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
