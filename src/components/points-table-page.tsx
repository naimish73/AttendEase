
"use client";

import { useState, useMemo, type FC, useEffect, useCallback } from "react";
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
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, writeBatch, getDoc } from "firebase/firestore";
import { Medal, RotateCcw, Calendar as CalendarIcon, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { Input } from "./ui/input";

type AttendanceStatus = "Present" | "Absent" | "Late";
type Student = {
  id: string;
  name: string;
  class: string;
  quizPoints?: number;
};

type DailyAttendance = {
    [studentId: string]: AttendanceStatus;
}

export const PointsTablePage: FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, DailyAttendance>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [firstPlace, setFirstPlace] = useState<string | undefined>();
  const [secondPlace, setSecondPlace] = useState<string | undefined>();
  const [thirdPlace, setThirdPlace] = useState<string | undefined>();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("overall");
  const [exportFileName, setExportFileName] = useState("");

  const fetchStudents = useCallback(() => {
    const studentsCollection = collection(db, "students");
    const studentsQuery = query(studentsCollection);
    return onSnapshot(studentsQuery, (querySnapshot) => {
      const studentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];
      setStudents(studentsList);
    }, (error) => {
      console.error("Error fetching students: ", error);
      toast({ title: "Error fetching students", variant: "destructive" });
    });
  }, [toast]);
  
  const fetchAttendance = useCallback(() => {
    const attendanceCollection = collection(db, "attendance");
    const attendanceQuery = query(attendanceCollection);
    return onSnapshot(attendanceQuery, (querySnapshot) => {
        const records: Record<string, DailyAttendance> = {};
        querySnapshot.forEach(doc => {
            records[doc.id] = doc.data() as DailyAttendance;
        });
        setAttendanceRecords(records);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching attendance: ", error);
        toast({ title: "Error fetching attendance records", variant: "destructive" });
        setLoading(false);
    });
  }, [toast]);


  useEffect(() => {
    setLoading(true);
    const unsubStudents = fetchStudents();
    const unsubAttendance = fetchAttendance();

    return () => {
        unsubStudents();
        unsubAttendance();
    };
  }, [fetchStudents, fetchAttendance]);
  
  const overallStudentPoints = useMemo(() => {
    return students.map(student => {
      let attendancePoints = 0;
      Object.values(attendanceRecords).forEach(dailyRecord => {
        const status = dailyRecord[student.id];
        if (status === 'Present') {
          attendancePoints += 100;
        } else if (status === 'Late') {
          attendancePoints += 50;
        }
      });
      
      const quizPoints = student.quizPoints || 0;
      const totalPoints = attendancePoints + quizPoints;
      return { ...student, attendancePoints, quizPoints, totalPoints };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [students, attendanceRecords]);
  
  const dailyStudentPoints = useMemo(() => {
    const dateId = format(selectedDate, "yyyy-MM-dd");
    const dailyRecord = attendanceRecords[dateId] || {};
    
    return students.map(student => {
      let attendancePoints = 0;
      const status = dailyRecord[student.id];
      if (status === 'Present') {
        attendancePoints = 100;
      } else if (status === 'Late') {
        attendancePoints = 50;
      }
      
      const quizPoints = student.quizPoints || 0;
      const totalPoints = attendancePoints + quizPoints;
      return { ...student, attendancePoints, quizPoints, totalPoints };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [students, attendanceRecords, selectedDate]);


  const availableForQuiz = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todaysAttendance = attendanceRecords[todayStr] || {};
    return students.filter(s => todaysAttendance[s.id] === 'Present' || todaysAttendance[s.id] === 'Late');
  }, [students, attendanceRecords]);
  
  const handleLogQuizResults = async () => {
    const winners = [firstPlace, secondPlace, thirdPlace].filter(Boolean);
    if (new Set(winners).size !== winners.length) {
        toast({ title: "Invalid Selection", description: "Please select unique students for each position.", variant: "destructive" });
        return;
    }

    try {
        const batch = writeBatch(db);
        const pointsToAdd = [
            { id: firstPlace, points: 100 },
            { id: secondPlace, points: 50 },
            { id: thirdPlace, points: 25 },
        ];

        for (const winner of pointsToAdd) {
            if (winner.id) {
                const studentRef = doc(db, "students", winner.id);
                const studentSnap = await getDoc(studentRef);
                if (studentSnap.exists()) {
                    const currentPoints = studentSnap.data().quizPoints || 0;
                    batch.update(studentRef, { quizPoints: currentPoints + winner.points });
                }
            }
        }
        
        await batch.commit();

        toast({ title: "Quiz Results Logged", description: "Points have been awarded to the winners." });
        setFirstPlace(undefined);
        setSecondPlace(undefined);
        setThirdPlace(undefined);
    } catch (error)
        {
        console.error("Error logging quiz results:", error);
        toast({ title: "Error", description: "Failed to log quiz results.", variant: "destructive" });
    }
  };
  
  const handleResetAllPoints = async () => {
    try {
        const batch = writeBatch(db);
        students.forEach(s => {
            if (s.quizPoints && s.quizPoints > 0) {
                const studentRef = doc(db, "students", s.id);
                batch.update(studentRef, { quizPoints: 0 });
            }
        });
        await batch.commit();
        toast({ title: "Success", description: "All quiz points have been reset." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to reset quiz points.", variant: "destructive" });
    }
  }

  const handleDownload = () => {
    if (!exportFileName.trim()) {
        toast({ title: "Error", description: "Please enter a valid file name.", variant: "destructive" });
        return;
    }

    let dataToExport;
    let fileNameSuffix;

    if (activeTab === 'overall') {
        dataToExport = overallStudentPoints.map((s, index) => ({
            'Sr. No.': index + 1,
            Name: s.name,
            Class: s.class,
            'Attendance Points': s.attendancePoints,
            'Quiz Points': s.quizPoints || 0,
            'Total Points': s.totalPoints
        }));
        fileNameSuffix = 'overall';
    } else {
        dataToExport = dailyStudentPoints.map((s, index) => ({
            'Sr. No.': index + 1,
            Name: s.name,
            Class: s.class,
            'Attendance Points': s.attendancePoints,
            'Quiz Points': s.quizPoints || 0,
            'Total Points': s.totalPoints
        }));
        fileNameSuffix = format(selectedDate, "yyyy-MM-dd");
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    const columnWidths = Object.keys(dataToExport[0] || {}).map((key) => {
        const headerWidth = key.length;
        const dataWidths = dataToExport.map(row => String((row as any)[key] || '').length);
        const maxWidth = Math.max(headerWidth, ...dataWidths);
        return { wch: maxWidth + 2 };
    });
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Points Table");
    XLSX.writeFile(workbook, `${exportFileName.trim()}-${fileNameSuffix}.xlsx`);
    toast({
        title: "Export Successful",
        description: `Points report has been downloaded.`,
    });
    setExportFileName("");
  };


  const isDayDisabled = (day: Date) => day.getDay() !== 6;

  const renderTable = (data: typeof overallStudentPoints, isDaily: boolean) => (
    <div className="border rounded-md overflow-hidden">
        <Table>
            <TableHeader className="bg-muted/50">
            <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Attendance Pts</TableHead>
                <TableHead>Quiz Pts</TableHead>
                <TableHead className="text-right">Total Points</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {loading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading points table...</TableCell></TableRow>
            ) : data.length > 0 ? (
                data.map((student) => (
                <TableRow key={student.id} className={'hover:bg-muted/20'}>
                    <TableCell className="font-medium">
                        {student.name}
                    </TableCell>
                    <TableCell>{student.attendancePoints}</TableCell>
                    <TableCell>{student.quizPoints || 0}</TableCell>
                    <TableCell className="text-right font-bold text-primary text-lg">{student.totalPoints}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">No students found. Add a student to get started.</TableCell></TableRow>
            )}
            </TableBody>
        </Table>
    </div>
  )

  const firstPlaceOptions = availableForQuiz.filter(s => s.id !== secondPlace && s.id !== thirdPlace);
  const secondPlaceOptions = availableForQuiz.filter(s => s.id !== firstPlace && s.id !== thirdPlace);
  const thirdPlaceOptions = availableForQuiz.filter(s => s.id !== firstPlace && s.id !== secondPlace);

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
                <CardTitle>Points Table</CardTitle>
                <CardDescription>Leaderboard based on attendance and quiz results. (Present: 100 pts, Late: 50 pts)</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline"><Download className="mr-2 h-4 w-4" />Download</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Download Points Report</DialogTitle>
                            <DialogDescription>
                                Enter a file name for the {activeTab === 'overall' ? 'overall' : `daily (${format(selectedDate, "PPP")})`} report.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="fileName" className="text-right">File Name</Label>
                                <Input id="fileName" value={exportFileName} onChange={(e) => setExportFileName(e.target.value)} placeholder="e.g., Points-Report" className="col-span-3"/>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <DialogClose asChild><Button onClick={handleDownload}>Download</Button></DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={handleResetAllPoints}><RotateCcw className="mr-2 h-4 w-4" />Reset Quiz Points</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overall" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                <TabsTrigger value="overall">Overall</TabsTrigger>
                <TabsTrigger value="daily">Daily</TabsTrigger>
            </TabsList>
            <TabsContent value="overall" className="mt-4">
                {renderTable(overallStudentPoints, false)}
            </TabsContent>
            <TabsContent value="daily" className="mt-4">
                 <div className="flex flex-wrap gap-4 mb-4">
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
                    <Dialog>
                        <DialogTrigger asChild><Button><Medal className="mr-2 h-4 w-4" />Log Quiz Results</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Log Quiz Winners</DialogTitle>
                                <DialogDescription>Select the top 3 performers. Only students present today are available.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="first-place" className="text-right">1st Place (+100)</Label>
                                    <Select value={firstPlace} onValueChange={setFirstPlace}>
                                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Winner" /></SelectTrigger>
                                        <SelectContent>{firstPlaceOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="second-place" className="text-right">2nd Place (+50)</Label>
                                     <Select value={secondPlace} onValueChange={setSecondPlace}>
                                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Runner-up" /></SelectTrigger>
                                        <SelectContent>{secondPlaceOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="third-place" className="text-right">3rd Place (+25)</Label>
                                     <Select value={thirdPlace} onValue-change={setThirdPlace}>
                                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Third Place" /></SelectTrigger>
                                        <SelectContent>{thirdPlaceOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                <DialogClose asChild><Button onClick={handleLogQuizResults} disabled={!firstPlace && !secondPlace && !thirdPlace}>Award Points</Button></DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                {renderTable(dailyStudentPoints, true)}
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
