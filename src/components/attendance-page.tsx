
"use client";

import { useState, useMemo, type FC, useEffect, useCallback } from "react";
import { Download, Search, RotateCcw, UserCheck, Clock, ClipboardCheck, UserX, Users, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useDate } from "@/context/DateContext";

type AttendanceStatus = "Present" | "Late" | "Absent";
type Student = {
  id: string;
  name: string;
  class: string;
  mobile: string;
  status?: AttendanceStatus;
};

type DailyAttendance = {
    [studentId: string]: "Present" | "Late";
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

        const getStatusAbbreviation = (status: AttendanceStatus | undefined) => {
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
        
        const columnWidths = Object.keys(worksheetData[0] || {}).map((key) => {
            const headerWidth = key.length;
            const dataWidths = worksheetData.map(row => String(row[key as keyof typeof row] || '').length);
            const maxWidth = Math.max(headerWidth, ...dataWidths);
            return { wch: maxWidth + 2 };
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
  const { selectedDate } = useDate();
  const [dailyStatus, setDailyStatus] = useState<DailyAttendance>({});
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  const dateId = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  const handleScroll = useCallback(() => {
    if (window.scrollY > 300) {
      setShowScrollButtons(true);
    } else {
      setShowScrollButtons(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);


  const fetchStudentsAndAttendance = useCallback(async () => {
    setLoading(true);

    const studentsCollection = db.collection("students");
    const studentsSnapshot = await studentsCollection.get();
    const studentsList = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[];
    setStudents(studentsList);

    const dateDocId = format(selectedDate, "yyyy-MM-dd");
    const attendanceRef = db.collection("attendance").doc(dateDocId);
    const unsubAttendance = attendanceRef.onSnapshot((docSnap) => {
      if (docSnap.exists) {
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

    return () => unsubAttendance();
  }, [selectedDate, toast]);
  
  useEffect(() => {
    const unsubscribePromise = fetchStudentsAndAttendance();
    return () => {
      unsubscribePromise.then(unsub => unsub && unsub());
    };
  }, [fetchStudentsAndAttendance]);

  const studentsWithStatus = useMemo(() => {
    return students.map(student => ({
      ...student,
      status: dailyStatus[student.id] || "Absent",
    }));
  }, [students, dailyStatus]);
  
  const presentCount = useMemo(() => Object.values(dailyStatus).filter(s => s === 'Present').length, [dailyStatus]);
  const lateCount = useMemo(() => Object.values(dailyStatus).filter(s => s === 'Late').length, [dailyStatus]);
  const absentCount = students.length - presentCount - lateCount;

  const handleStatusChange = async (studentId: string, status: "Present" | "Late" | "Absent") => {
    const newStatus = { ...dailyStatus };
    
    if (status === 'Absent') {
        delete newStatus[studentId];
    } else {
        newStatus[studentId] = status;
    }
    
    setDailyStatus(newStatus);
    try {
        const attendanceRef = db.collection("attendance").doc(dateId);
        await attendanceRef.set(newStatus);
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
      const attendanceRef = db.collection("attendance").doc(dateId);
      await attendanceRef.set({});
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
  
  const groupedAndSortedStudents = useMemo(() => {
    const filtered = studentsWithStatus.filter((student) => {
      const term = searchTerm.toLowerCase();
      return (
        student.name.toLowerCase().includes(term) ||
        student.class.toLowerCase().includes(term) ||
        (student.mobile && student.mobile.toLowerCase().includes(term))
      );
    });

    if (!filtered) return {};

    const grouped: { [key: string]: Student[] } = filtered.reduce((acc, student) => {
      const { class: studentClass } = student;
      if (!acc[studentClass]) {
        acc[studentClass] = [];
      }
      acc[studentClass].push(student);
      return acc;
    }, {} as { [key: string]: Student[] });

    // Sort students within each group by name
    for (const studentClass in grouped) {
      grouped[studentClass].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Sort the class groups by class name
    const sortedGrouped = Object.keys(grouped).sort().reduce(
      (obj, key) => { 
        obj[key] = grouped[key]; 
        return obj;
      }, 
      {} as {[key: string]: Student[]}
    );

    return sortedGrouped;
  }, [studentsWithStatus, searchTerm]);
  
  const getStatusClasses = (currentStatus?: AttendanceStatus, buttonStatus?: AttendanceStatus) => {
    if (currentStatus === buttonStatus) {
        switch(buttonStatus) {
            case 'Present': return 'bg-teal-500 text-white hover:bg-teal-600';
            case 'Late': return 'bg-amber-500 text-white hover:bg-amber-600';
            case 'Absent': return 'bg-red-500 text-white hover:bg-red-600';
        }
    }
    return 'bg-gray-200 text-gray-700 hover:bg-gray-300';
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    <>
      <Card className="w-full max-w-7xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
                <CardTitle className="text-3xl font-bold flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <ClipboardCheck className="h-6 w-6 text-primary" />
                    </div>
                    <span>Take Attendance</span>
                </CardTitle>
                <CardDescription className="mt-2">
                    Viewing and marking attendance for <span className="font-semibold text-primary">{format(selectedDate, "PPP")}</span>.
                </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
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
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-lg bg-slate-100 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                <div className="px-3 py-1">
                    <p className="font-bold text-lg text-teal-600">{presentCount}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="px-3 py-1">
                    <p className="font-bold text-lg text-amber-600">{lateCount}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                </div>
                <div className="px-3 py-1">
                    <p className="font-bold text-lg text-red-600">{absentCount}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-right">Actions for {format(selectedDate, "MMM d")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={2} className="h-24 text-center">Loading...</TableCell></TableRow>
                ) : Object.keys(groupedAndSortedStudents).length > 0 ? (
                  Object.entries(groupedAndSortedStudents).map(([className, students]) => (
                    <>
                      <TableRow key={`header-${className}`} className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={2} className="font-bold text-primary text-base py-3">
                          Class: {className}
                        </TableCell>
                      </TableRow>
                      {students.map((student) => (
                        <TableRow key={student.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" className={cn('px-2 sm:px-4', getStatusClasses(student.status, 'Present'))} onClick={() => handleStatusChange(student.id, 'Present')}>
                                <UserCheck className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Present</span>
                            </Button>
                            <Button size="sm" className={cn('px-2 sm:px-4', getStatusClasses(student.status, 'Late'))} onClick={() => handleStatusChange(student.id, 'Late')}>
                                <Clock className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Late</span>
                            </Button>
                            <Button size="sm" className={cn('px-2 sm:px-4', getStatusClasses(student.status, 'Absent'))} onClick={() => handleStatusChange(student.id, 'Absent')}>
                                <UserX className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Absent</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={2} className="h-24 text-center">No students found. Add a student to get started.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {showScrollButtons && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-2">
          <Button size="icon" onClick={scrollToTop} variant="outline" className="rounded-full shadow-lg">
            <ArrowUp className="h-5 w-5" />
          </Button>
          <Button size="icon" onClick={scrollToBottom} variant="outline" className="rounded-full shadow-lg">
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
      )}
    </>
  );
};
