
"use client";

import { useState, useMemo, type FC, useEffect } from "react";
import { Download, Search } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query } from "firebase/firestore";
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
    <Card className="shadow-lg h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1.5">
                <CardTitle>Attendance List</CardTitle>
                <CardDescription>
                Mark and view student attendance.
                </CardDescription>
            </div>
            <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export XLS
            </Button>
        </div>
        <div className="relative pt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
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
                    <TableCell className="font-medium">{student.name}</TableCell>
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
