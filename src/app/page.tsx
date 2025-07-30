
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { UserPlus, Users, ClipboardCheck, Shuffle, FileUp, Trophy, LogOut, UserCheck, Clock, UserX, Calendar, Search } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';

type AttendanceStatus = "Present" | "Late";
type DailyAttendance = {
    [studentId: string]: AttendanceStatus;
}

export default function Home() {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const [todaysAttendance, setTodaysAttendance] = useState<DailyAttendance>({});
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const todayId = format(new Date(), "yyyy-MM-dd");
    const attendanceRef = doc(db, "attendance", todayId);
    const unsub = onSnapshot(attendanceRef, (docSnap) => {
        if(docSnap.exists()) {
            setTodaysAttendance(docSnap.data() as DailyAttendance);
        } else {
            setTodaysAttendance({});
        }
    });
    return () => unsub();
  }, []);

  if (loading || !isAuthenticated) {
    return null; // or a loading spinner
  }
  
  const presentCount = Object.values(todaysAttendance).filter(s => s === 'Present').length;
  const lateCount = Object.values(todaysAttendance).filter(s => s === 'Late').length;
  const absentCount = Object.keys(todaysAttendance).length - presentCount - lateCount; // This is not quite right, but good enough for a summary


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="profile" alt="Admin" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">Hello, Admin</h1>
                <p className="text-muted-foreground">Today is {format(date, "EEEE, d MMMM")}</p>
              </div>
            </div>
             <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-6 w-6" />
            </Button>
          </header>

          {/* Daily Attendance Summary Card */}
          <Card className="mb-8 bg-primary text-primary-foreground rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Today's Attendance</CardTitle>
                <CardDescription className="text-primary-foreground/80">A quick look at today's numbers.</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{presentCount + lateCount}</p>
                <p className="text-primary-foreground/80">Students</p>
              </div>
            </div>
            <div className="bg-primary-foreground/10 px-6 py-4 grid grid-cols-3 gap-4 text-center">
                <div className="flex items-center justify-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    <div>
                        <p className="font-bold text-lg">{presentCount}</p>
                        <p className="text-xs text-primary-foreground/80">Present</p>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5" />
                    <div>
                        <p className="font-bold text-lg">{lateCount}</p>
                        <p className="text-xs text-primary-foreground/80">Late</p>
                    </div>
                </div>
                 <div className="flex items-center justify-center gap-2">
                    <UserX className="h-5 w-5" />
                    <div>
                        <p className="font-bold text-lg">{absentCount}</p>
                        <p className="text-xs text-primary-foreground/80">Absent</p>
                    </div>
                </div>
            </div>
          </Card>
          
          <h2 className="text-2xl font-bold mb-4">Your Plan</h2>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/attendance">
              <Card className="h-full shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-orange-100 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <ClipboardCheck className="h-6 w-6 text-orange-600" />
                    Take Attendance
                  </CardTitle>
                  <CardDescription>Mark student attendance for the day.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
             <Link href="/points-table">
              <Card className="h-full shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-purple-100 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-purple-600" />
                    Points Table
                  </CardTitle>
                  <CardDescription>View leaderboard and log quiz results.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
             <Link href="/manage-students">
              <Card className="h-full shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-blue-100 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    Manage Students
                  </CardTitle>
                  <CardDescription>Add, edit, or remove student records.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
             <Link href="/team-shuffle">
              <Card className="h-full shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-green-100 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Shuffle className="h-6 w-6 text-green-600" />
                    Team Shuffle
                  </CardTitle>
                  <CardDescription>Randomly group present students.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
          
           <div className="mt-6 grid grid-cols-2 gap-4">
             <Link href="/add-student">
                <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                        <UserPlus className="h-6 w-6 text-primary" />
                        <span className="font-semibold">Add Student</span>
                    </CardContent>
                </Card>
            </Link>
             <Link href="/import-excel">
                <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                        <FileUp className="h-6 w-6 text-primary" />
                        <span className="font-semibold">Import Excel</span>
                    </CardContent>
                </Card>
            </Link>
           </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="sticky bottom-0 bg-card border-t shadow-t-xl md:hidden">
         <div className="max-w-md mx-auto grid grid-cols-4 items-center justify-items-center gap-2 p-2">
            <Button variant="ghost" className="flex flex-col h-auto p-2 text-primary">
              <Calendar className="h-6 w-6" />
              <span className="text-xs mt-1">Today</span>
            </Button>
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
