
"use client";

import { useState, useMemo, type FC, useEffect, useCallback } from "react";
import { Download, Search, RotateCcw, UserCheck, Clock, CalendarIcon, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, query } from "firebase/firestore";
import * as XLSX from 'xlsx';
import { Separator } from "./ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type AttendanceStatus = "Present" | "Late";
type Student = {
  id: string;
  name: string;
  class: string;
  mobile: string;
  status?: AttendanceStatus | null;
};

type DailyAttendance = {
    [studentId: string]: AttendanceStatus;
}

interface ExportDialogProps {
  students: Student[];
  date: Date;
}

const ExportDialog: FC<ExportDialogProps> = ({ students, date }) => {
    const [fileName, setFileName] = useState("");
    const { toast } = useToast();
    const dateId = format(date, "yyyy-MM-dd");

    const handleExport = () => {
        if (!fileName.trim()) {
            toast({ title: "Error", description: "Please enter a valid file name.", variant: "destructive" });
            return;
        }

        const getStatusAbbreviation = (status: AttendanceStatus | null | undefined) => {
            if (status === 'Present') return 'P';
            if (status === 'Late') return 'L';
            return 'A';
        }

        const worksheetData = students.map((s, index) => ({
          'Sr. No.': index + 1,
          Name: s.name,
          Class: s.class,
          "Mobile No.": s.mobile || '',
          Status: getStatusAbbreviation(s.status)
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        
        // Auto-fit columns
        const columnWidths = Object.keys(worksheetData[0] || {}).map((key) => {
            const headerWidth = key.length;
            const dataWidths = worksheetData.map(row => String(row[key as keyof typeof row] || '').length);
            const maxWidth = Math.max(headerWidth, ...dataWidths);
            return { wch: maxWidth + 2 }; // +2 for a little padding
        });
        worksheet['!cols'] = columnWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
        XLSX.writeFile(workbook, `${fileName.trim()}-${dateId}.xlsx`);
        toast({
            title: "Export Successful",
            description: `Attendance report "${fileName.trim()}-${dateId}.xlsx" has been downloaded.`,
        });
        setFileName("");
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline"><Download className="mr-2 h-4 w-4" />Export XLS</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Export Attendance for {format(date, "PPP")}</DialogTitle>
                    <DialogDescription>Please enter a name for the export file.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fileName" className="text-right">File Name</Label>
                        <Input id="fileName" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g., Attendance-Report" className="col-span-3"/>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <DialogClose asChild><Button onClick={handleExport}>Download</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export const AttendancePage: FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyStatus, setDailyStatus] = useState<DailyAttendance>({});

  const dateId = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  const fetchStudents = useCallback(() => {
    const studentsCollection = collection(db, "students");
    const q = query(studentsCollection);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];

      studentsList.sort((a, b) => {
        const classComparison = a.class.localeCompare(b.class);
        if (classComparison !== 0) return classComparison;
        return a.name.localeCompare(b.name);
      });
      setStudents(studentsList);
    }, (error) => {
      console.error("Error fetching students: ", error);
      toast({
        title: "Error fetching students",
        description: "Could not retrieve student data from Firestore.",
        variant: "destructive",
      });
    });
    return unsubscribe;
  }, [toast]);

  const fetchAttendanceForDate = useCallback(async (date: Date) => {
    setLoading(true);
    const dateDocId = format(date, "yyyy-MM-dd");
    const attendanceRef = doc(db, "attendance", dateDocId);
    
    const unsubscribe = onSnapshot(attendanceRef, (docSnap) => {
      if (docSnap.exists()) {
          setDailyStatus(docSnap.data() as DailyAttendance);
      } else {
          setDailyStatus({});
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching attendance: ", error);
        toast({ title: "Error", description: "Could not load attendance data.", variant: "destructive" });
        setLoading(false);
    });

    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    const unsubscribe = fetchStudents();
    return () => unsubscribe();
  }, [fetchStudents]);
  
  useEffect(() => {
    const unsubscribePromise = fetchAttendanceForDate(selectedDate);
    return () => {
      unsubscribePromise.then(unsub => unsub());
    };
  }, [selectedDate, fetchAttendanceForDate]);

  const studentsWithStatus = useMemo(() => {
    return students.map(student => ({
      ...student,
      status: dailyStatus[student.id] || null,
    }));
  }, [students, dailyStatus]);
  
  const presentCount = useMemo(() => Object.values(dailyStatus).filter(s => s === 'Present').length, [dailyStatus]);
  const lateCount = useMemo(() => Object.values(dailyStatus).filter(s => s === 'Late').length, [dailyStatus]);

  const handleStatusChange = async (studentId: string, status: AttendanceStatus) => {
    const newStatus = { ...dailyStatus, [studentId]: status };
    setDailyStatus(newStatus);
    try {
        const attendanceRef = doc(db, "attendance", dateId);
        await setDoc(attendanceRef, newStatus, { merge: true });
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
      toast({ title: "No Students", description: "There are no students to reset." });
      return;
    }
    try {
      const attendanceRef = doc(db, "attendance", dateId);
      await setDoc(attendanceRef, {});
      setDailyStatus({});
      toast({
        title: "Success",
        description: `Attendance for ${format(selectedDate, "PPP")} has been reset.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset attendance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredStudents = useMemo(
    () =>
      studentsWithStatus.filter((student) => {
        const term = searchTerm.toLowerCase();
        return (
          student.name.toLowerCase().includes(term) ||
          student.class.toLowerCase().includes(term) ||
          (student.mobile && student.mobile.toLowerCase().includes(term))
        );
      }),
    [studentsWithStatus, searchTerm]
  );
  
  const getStatusBadgeVariant = (status: AttendanceStatus | null) => {
    if (status === 'Present') return 'default';
    if (status === 'Late') return 'secondary';
    return 'destructive';
  }

  const isDayDisabled = (day: Date) => day.getDay() !== 6;

  return (
    <Card className="shadow-sm w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <ClipboardCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                  <CardTitle className="text-2xl">Take Attendance</CardTitle>
                  <CardDescription>Mark and view student attendance for a specific date.</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline"><RotateCcw className="mr-2 h-4 w-4" />Reset Day</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will reset attendance for all students on {format(selectedDate, "PPP")}. This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetAll}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <ExportDialog students={studentsWithStatus} date={selectedDate} />
            </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-6">
            <div className="flex flex-col sm:flex-row flex-1 w-full md:w-auto gap-4 items-center">
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        disabled={isDayDisabled}
                        initialFocus
                      />
                    </PopoverContent>
                </Popover>
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
                </div>
            </div>
            <div className="flex gap-4 items-center p-2 rounded-lg bg-muted w-full md:w-auto shrink-0 mt-4 md:mt-0">
                <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <div><p className="font-bold text-lg">{presentCount}</p><p className="text-xs text-muted-foreground">Present</p></div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div><p className="font-bold text-lg">{lateCount}</p><p className="text-xs text-muted-foreground">Late</p></div>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status for {format(selectedDate, "MMM d")}</TableHead>
                <TableHead className="text-right w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/5">
                    <TableCell className="font-medium">
                        {student.name}
                    </TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(student.status)} className="capitalize">
                          {student.status || 'Absent'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select value={student.status ?? ""} onValueChange={(value: AttendanceStatus) => handleStatusChange(student.id, value)}>
                        <SelectTrigger className="w-[140px] ml-auto"><SelectValue placeholder="Set Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Present">Present</SelectItem>
                          <SelectItem value="Late">Late</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">No students found. Add a student to get started.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
