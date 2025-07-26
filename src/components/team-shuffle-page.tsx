
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { User } from "lucide-react";


type AttendanceStatus = "Present" | "Absent" | "Late";
type Student = {
  id: string;
  name: string;
  class: string;
  mobile: string;
  status: AttendanceStatus | null;
};

export const TeamShufflePage: FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [numberOfTeams, setNumberOfTeams] = useState<number>(2);
  const [shuffledTeams, setShuffledTeams] = useState<Student[][]>([]);

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

  const availableStudents = useMemo(() => {
    return students.filter(s => s.status === 'Present' || s.status === 'Late');
  }, [students]);

  const handleShuffle = () => {
    if (availableStudents.length === 0) {
      toast({
        title: "No Students Available",
        description: "There are no present or late students to shuffle.",
        variant: "destructive",
      });
      return;
    }

    if (availableStudents.length < numberOfTeams) {
        toast({
            title: "Not Enough Students",
            description: "There are not enough students to form the selected number of teams.",
            variant: "destructive",
        });
        return;
    }

    const shuffled = [...availableStudents].sort(() => Math.random() - 0.5);
    const teams: Student[][] = Array.from({ length: numberOfTeams }, () => []);
    
    shuffled.forEach((student, index) => {
      teams[index % numberOfTeams].push(student);
    });

    setShuffledTeams(teams);
     toast({
        title: "Teams Shuffled!",
        description: `${availableStudents.length} students have been shuffled into ${numberOfTeams} teams.`,
      });
  };

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle>Team Shuffle</CardTitle>
        <CardDescription>
          Shuffle present and late students into teams for an activity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center p-4 bg-muted/50 rounded-lg">
           <div className="flex-1">
                <p className="text-sm font-medium">Available Students</p>
                <p className="text-2xl font-bold text-primary">{availableStudents.length}</p>
                <p className="text-xs text-muted-foreground">Only students marked 'Present' or 'Late' can be shuffled.</p>
           </div>
           <div className="flex items-center gap-4">
            <Select onValueChange={(value) => setNumberOfTeams(Number(value))} defaultValue="2">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select number of teams" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(9)].map((_, i) => (
                  <SelectItem key={i + 2} value={(i + 2).toString()}>
                    {i + 2} Teams
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleShuffle} disabled={loading}>
                {loading ? 'Loading...' : 'Shuffle Teams'}
            </Button>
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
                                <User className="h-5 w-5 text-muted-foreground" />
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
