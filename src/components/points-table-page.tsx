
"use client";

import { useState, useMemo, type FC, useEffect } from "react";
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
import { collection, onSnapshot, query, doc, writeBatch } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Crown, Medal, Award, RotateCcw } from "lucide-react";

type AttendanceStatus = "Present" | "Absent" | "Late";
type Student = {
  id: string;
  name: string;
  class: string;
  status: AttendanceStatus | null;
  imageUrl?: string;
  quizPoints?: number;
};

export const PointsTablePage: FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [firstPlace, setFirstPlace] = useState<string | undefined>();
  const [secondPlace, setSecondPlace] = useState<string | undefined>();
  const [thirdPlace, setThirdPlace] = useState<string | undefined>();

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

  const availableForQuiz = useMemo(() => {
    return students.filter(s => s.status === 'Present' || s.status === 'Late');
  }, [students]);

  const studentPoints = useMemo(() => {
    return students.map(student => {
      let attendancePoints = 0;
      if (student.status === 'Present' || student.status === 'Late') {
        attendancePoints = 2;
      }
      const quizPoints = student.quizPoints || 0;
      const totalPoints = attendancePoints + quizPoints;
      return { ...student, attendancePoints, totalPoints };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [students]);
  
  const handleLogQuizResults = async () => {
    const winners = [firstPlace, secondPlace, thirdPlace].filter(Boolean);
    if (new Set(winners).size !== winners.length) {
        toast({
            title: "Invalid Selection",
            description: "Please select unique students for each position.",
            variant: "destructive"
        });
        return;
    }

    try {
        const batch = writeBatch(db);
        
        // Reset existing quiz points first
        students.forEach(s => {
            if (s.quizPoints && s.quizPoints > 0) {
                const studentRef = doc(db, "students", s.id);
                batch.update(studentRef, { quizPoints: 0 });
            }
        });

        if (firstPlace) {
            batch.update(doc(db, "students", firstPlace), { quizPoints: 3 });
        }
        if (secondPlace) {
            batch.update(doc(db, "students", secondPlace), { quizPoints: 2 });
        }
        if (thirdPlace) {
            batch.update(doc(db, "students", thirdPlace), { quizPoints: 1 });
        }
        
        await batch.commit();

        toast({
            title: "Quiz Results Logged",
            description: "Points have been awarded to the winners."
        });

        setFirstPlace(undefined);
        setSecondPlace(undefined);
        setThirdPlace(undefined);

    } catch (error) {
        console.error("Error logging quiz results:", error);
        toast({
            title: "Error",
            description: "Failed to log quiz results. Please try again.",
            variant: "destructive"
        });
    }
  };
  
  const handleResetAllPoints = async () => {
    try {
        const batch = writeBatch(db);
        students.forEach(s => {
            const studentRef = doc(db, "students", s.id);
            batch.update(studentRef, { quizPoints: 0 });
        });
        await batch.commit();
        toast({
            title: "Success",
            description: "All quiz points have been reset."
        });
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to reset quiz points.",
            variant: "destructive"
        })
    }
  }


  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
                <CardTitle>Points Table</CardTitle>
                <CardDescription>
                View student leaderboard and log quiz results. Attendance gives 2 points.
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleResetAllPoints}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Quiz Points
                </Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Medal className="mr-2 h-4 w-4" />
                            Log Quiz Results
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Log Quiz Winners</DialogTitle>
                            <DialogDescription>
                                Select the top 3 performers from the available students. Points will be awarded accordingly.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="first-place" className="text-right">1st Place (+3)</Label>
                                <Select value={firstPlace} onValueChange={setFirstPlace}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Winner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableForQuiz.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="second-place" className="text-right">2nd Place (+2)</Label>
                                 <Select value={secondPlace} onValueChange={setSecondPlace}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Runner-up" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableForQuiz.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="third-place" className="text-right">3rd Place (+1)</Label>
                                 <Select value={thirdPlace} onValueChange={setThirdPlace}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Third Place" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableForQuiz.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button onClick={handleLogQuizResults}>Award Points</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Attendance Pts</TableHead>
                <TableHead>Quiz Pts</TableHead>
                <TableHead className="text-right">Total Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading points table...
                  </TableCell>
                </TableRow>
              ) : studentPoints.length > 0 ? (
                studentPoints.map((student, index) => (
                  <TableRow key={student.id} className={
                    index < 3 ? 'bg-accent/20 hover:bg-accent/30' : 'hover:bg-muted/20'
                  }>
                    <TableCell className="font-bold text-lg text-muted-foreground flex items-center justify-center">
                      {index === 0 && <Crown className="h-6 w-6 text-yellow-500" />}
                      {index === 1 && <Medal className="h-6 w-6 text-slate-400" />}
                      {index === 2 && <Award className="h-6 w-6 text-yellow-700" />}
                      {index > 2 && (index + 1)}
                    </TableCell>
                    <TableCell className="font-medium flex items-center gap-3">
                      <Avatar>
                          <AvatarImage src={student.imageUrl} alt={student.name} data-ai-hint="person" />
                          <AvatarFallback>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {student.name}
                    </TableCell>
                    <TableCell>{student.attendancePoints}</TableCell>
                    <TableCell>{student.quizPoints || 0}</TableCell>
                    <TableCell className="text-right font-bold text-primary text-lg">{student.totalPoints}</TableCell>
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
  );
};
