
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, getDoc } from "firebase/firestore";
import { RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Label } from "./ui/label";
import { format } from "date-fns";


type AttendanceStatus = "Present" | "Absent" | "Late";
type Student = {
  id: string;
  name: string;
  class: string;
  mobile: string;
  imageUrl?: string;
};

type DailyAttendance = {
    [studentId: string]: AttendanceStatus;
}


export const TeamShufflePage: FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [teamSize, setTeamSize] = useState<number>(2);
  const [shuffledTeams, setShuffledTeams] = useState<Student[][]>([]);
  const [todaysAttendance, setTodaysAttendance] = useState<DailyAttendance>({});

  useEffect(() => {
    const studentsCollection = collection(db, "students");
    const q = query(studentsCollection);

    const unsubStudents = onSnapshot(q, (querySnapshot) => {
      const studentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];
      setStudents(studentsList);
    }, (error) => {
      console.error("Error fetching students: ", error);
      toast({ title: "Error fetching students", variant: "destructive" });
    });
    
    const todayId = format(new Date(), "yyyy-MM-dd");
    const attendanceRef = doc(db, "attendance", todayId);
    const unsubAttendance = onSnapshot(attendanceRef, (docSnap) => {
        if(docSnap.exists()) {
            setTodaysAttendance(docSnap.data() as DailyAttendance);
        } else {
            setTodaysAttendance({});
        }
        setLoading(false);
    });

    return () => {
        unsubStudents();
        unsubAttendance();
    };
  }, [toast]);

  const availableStudents = useMemo(() => {
    return students.filter(s => todaysAttendance[s.id] === 'Present' || todaysAttendance[s.id] === 'Late');
  }, [students, todaysAttendance]);

  const handleShuffle = () => {
    if (availableStudents.length === 0) {
      toast({ title: "No Students Available", description: "No students are marked 'Present' or 'Late' for today.", variant: "destructive" });
      return;
    }
    
    if (teamSize <= 1) {
        toast({ title: "Invalid Team Size", description: "Team size must be greater than 1.", variant: "destructive" });
        return;
    }

    if (availableStudents.length < teamSize) {
        toast({ title: "Not Enough Students", description: `Not enough students to form a single team of size ${teamSize}.`, variant: "destructive" });
        return;
    }

    const shuffled = [...availableStudents].sort(() => Math.random() - 0.5);
    const teams: Student[][] = [];
    for (let i = 0; i < shuffled.length; i += teamSize) {
        teams.push(shuffled.slice(i, i + teamSize));
    }

    setShuffledTeams(teams);
     toast({ title: "Teams Shuffled!", description: `${availableStudents.length} students have been shuffled into ${teams.length} teams.` });
  };

  const handleReset = () => {
    setShuffledTeams([]);
    toast({ title: "Teams Reset", description: "Shuffled teams have been cleared." });
  };

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle>Team Shuffle</CardTitle>
        <CardDescription>Shuffle students present today into teams of a specific size.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center p-4 bg-muted/50 rounded-lg">
           <div className="flex-1">
                <p className="text-sm font-medium">Available Students Today</p>
                <p className="text-2xl font-bold text-primary">{availableStudents.length}</p>
                <p className="text-xs text-muted-foreground">Only students marked 'Present' or 'Late' today can be shuffled.</p>
           </div>
           <div className="flex items-end gap-4">
                <div>
                    <Label htmlFor="team-size" className="text-sm font-medium">Team Size</Label>
                    <Input id="team-size" type="number" value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value, 10) || 2)} className="w-[120px]" min="2" />
                </div>
                <Button onClick={handleShuffle} disabled={loading}>{loading ? 'Loading...' : 'Shuffle Teams'}</Button>
                {shuffledTeams.length > 0 && (<Button variant="outline" onClick={handleReset}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button>)}
           </div>
        </div>

        {shuffledTeams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {shuffledTeams.map((team, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">Team {index + 1}</CardTitle>
                  <CardDescription>{team.length} members</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <ul className="space-y-3">
                        {team.map(student => (
                            <li key={student.id} className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={student.imageUrl} alt={student.name} data-ai-hint="person" />
                                    <AvatarFallback>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{student.name}</span>
                                <span className="text-sm text-muted-foreground ml-auto">{student.class}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
