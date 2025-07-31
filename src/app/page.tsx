
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { UserPlus, Users, ClipboardCheck, Shuffle, FileUp, Trophy, LogOut, UserCheck, Clock, UserX, Calendar, Search, CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useDate } from '@/context/DateContext';
import { cn } from '@/lib/utils';

type AttendanceStatus = "Present" | "Late" | "Absent";
type DailyAttendance = {
    [studentId: string]: "Present" | "Late";
}
type Student = {
    id: string;
    name: string;
    class: string;
    status?: AttendanceStatus;
}

export default function Home() {
  const { isAuthenticated, loading, logout } = useAuth();
  const { selectedDate, setSelectedDate } = useDate();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [todaysAttendance, setTodaysAttendance] = useState<DailyAttendance>({});
  
  const dateId = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  useEffect(() => {
    // Listener for all students
    const studentsCollection = db.collection("students");
    const unsubStudents = studentsCollection.onSnapshot((querySnapshot) => {
        const studentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Student[];
        setAllStudents(studentsList);
    });

    // Listener for today's attendance
    const unsubAttendance = db.collection("attendance").doc(dateId).onSnapshot((docSnap) => {
        if(docSnap.exists) {
            const data = docSnap.data() as DailyAttendance;
            setTodaysAttendance(data);
        } else {
            setTodaysAttendance({});
        }
    });

    return () => {
        unsubStudents();
        unsubAttendance();
    };
  }, [dateId]);


  if (loading || !isAuthenticated) {
    return null; // or a loading spinner
  }
  
  const presentCount = Object.values(todaysAttendance).filter(s => s === 'Present').length;
  const lateCount = Object.values(todaysAttendance).filter(s => s === 'Late').length;
  const totalStudents = allStudents.length;
  const absentCount = totalStudents > 0 ? totalStudents - presentCount - lateCount : 0;
  const attendancePercentage = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;

  const quickLinks = [
    { href: "/attendance", icon: ClipboardCheck, title: "Full Attendance", description: "Go to detailed view.", bg: "bg-teal-100", text: "text-teal-700" },
    { href: "/points-table", icon: Trophy, title: "Points Table", description: "View student leaderboard.", bg: "bg-amber-100", text: "text-amber-700" },
    { href: "/manage-students", icon: Users, title: "Manage Students", description: "Add, edit, or remove students.", bg: "bg-sky-100", text: "text-sky-700" },
    { href: "/team-shuffle", icon: Shuffle, title: "Team Shuffle", description: "Create random student teams.", bg: "bg-rose-100", text: "text-rose-700" },
    { href: "/add-student", icon: UserPlus, title: "Add Student", description: "Quickly add a new student.", bg: "bg-indigo-100", text: "text-indigo-700" },
    { href: "/import-excel", icon: FileUp, title: "Import from Excel", description: "Bulk upload student data.", bg: "bg-slate-100", text: "text-slate-700" },
  ];
  
  const isDayDisabled = (day: Date) => day.getDay() !== 6; // Disable all days except Saturday

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="bg-card border-b p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="profile" alt="Admin" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold font-headline">Hello, Admin</h1>
            <p className="text-muted-foreground text-sm">Today is {format(new Date(), "EEEE, d MMMM yyyy")}</p>
          </div>
        </div>
         <Button variant="ghost" size="icon" onClick={logout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </header>
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/40">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Daily Challenge / Attendance Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Attendance Summary for {format(selectedDate, "PPP")}</CardTitle>
              <CardDescription>A summary of student attendance for the selected date.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-5xl font-bold text-primary">{attendancePercentage}%</span>
                    <div className="w-full">
                        <p className="text-sm text-muted-foreground mb-1">Overall Attendance</p>
                        <Progress value={attendancePercentage} className="h-3" />
                    </div>
                </div>
                <Separator className="my-6" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-slate-100 rounded-lg">
                        <p className="text-2xl font-bold">{totalStudents}</p>
                        <p className="text-sm text-muted-foreground">Total Students</p>
                    </div>
                    <div className="p-4 bg-green-100 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{presentCount}</p>
                        <p className="text-sm text-muted-foreground">Present</p>
                    </div>
                    <div className="p-4 bg-amber-100 rounded-lg">
                        <p className="text-2xl font-bold text-amber-700">{lateCount}</p>
                        <p className="text-sm text-muted-foreground">Late</p>
                    </div>
                    <div className="p-4 bg-red-100 rounded-lg">
                        <p className="text-2xl font-bold text-red-700">{absentCount}</p>
                        <p className="text-sm text-muted-foreground">Absent</p>
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Global Date Selector</CardTitle>
                <CardDescription>Select a date to view attendance and points for that day across the app.</CardDescription>
            </CardHeader>
            <CardContent>
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
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={isDayDisabled}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
          
          <h2 className="text-2xl font-bold font-headline">Quick Actions</h2>

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((link) => (
                <Link href={link.href} key={link.href}>
                    <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className={`p-3 rounded-lg ${link.bg}`}>
                                <link.icon className={`h-6 w-6 ${link.text}`} />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{link.title}</CardTitle>
                                <CardDescription className="text-sm">{link.description}</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="sticky bottom-0 bg-card border-t shadow-t-xl md:hidden">
         <div className="max-w-md mx-auto grid grid-cols-4 items-center justify-items-center gap-2 p-2">
            <Link href="/" passHref>
                <Button variant="ghost" className="flex flex-col h-auto p-2 text-primary">
                    <Calendar className="h-6 w-6" />
                    <span className="text-xs mt-1">Today</span>
                </Button>
            </Link>
             <Link href="/manage-students" passHref>
                <Button variant="ghost" className="flex flex-col h-auto p-2 text-muted-foreground">
                    <Users className="h-6 w-6" />
                    <span className="text-xs mt-1">Students</span>
                </Button>
            </Link>
             <Link href="/points-table" passHref>
                <Button variant="ghost" className="flex flex-col h-auto p-2 text-muted-foreground">
                    <Trophy className="h-6 w-6" />
                    <span className="text-xs mt-1">Points</span>
                </Button>
            </Link>
            <Button variant="ghost" className="flex flex-col h-auto p-2 text-muted-foreground" onClick={logout}>
              <Avatar className="h-6 w-6">
                <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="profile" alt="Admin" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <span className="text-xs mt-1">Logout</span>
            </Button>
         </div>
      </footer>
    </div>
  );
}
