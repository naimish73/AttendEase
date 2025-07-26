"use client";

import { useState, useMemo, type FC } from "react";
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

type AttendanceStatus = "Present" | "Absent" | "Late";
type Student = {
  id: string;
  name: string;
  status: AttendanceStatus | null;
};

const initialStudents: Student[] = [
    { id: '1', name: 'Aarav Sharma', status: 'Present' },
    { id: '2', name: 'Vivaan Singh', status: 'Absent' },
    { id: '3', name: 'Aditya Kumar', status: null },
    { id: '4', name: 'Diya Patel', status: 'Late' },
    { id: '5', name: 'Ishaan Gupta', status: 'Present' },
    { id: '6', name: 'Saanvi Reddy', status: null },
];

export const AttendancePage: FC = () => {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const { toast } = useToast();

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(
      students.map((student) =>
        student.id === studentId ? { ...student, status } : student
      )
    );
  };

  const handleAddStudent = () => {
    if (newStudentName.trim() === "") {
        toast({
            title: "Error",
            description: "Student name cannot be empty.",
            variant: "destructive"
        })
        return;
    }
    const newStudent: Student = {
      id: (students.length + 1).toString(),
      name: newStudentName,
      status: null,
    };
    setStudents([...students, newStudent]);
    setNewStudentName("");
    setAddStudentOpen(false);
    toast({
        title: "Student Added",
        description: `${newStudentName} has been successfully added.`,
    })
  };

  const handleExport = () => {
    const csvHeader = "ID,Name,Status\n";
    const csvRows = students
      .map((s) => `${s.id},"${s.name}",${s.status || "Unmarked"}`)
      .join("\n");
    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const date = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `attendance-report-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="container mx-auto p-4 md:p-8">
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
                  Enter the name of the new student to add them to the attendance list.
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

      <Card>
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
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Student Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(student.status)}>
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
                    <TableCell colSpan={3} className="h-24 text-center">
                      No students found.
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
