
"use client";

import { useState, type FC } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import { Database, Loader } from "lucide-react";
import { Progress } from "./ui/progress";

const firstNames = ["Liam", "Olivia", "Noah", "Emma", "Oliver", "Ava", "Elijah", "Charlotte", "William", "Sophia", "James", "Amelia", "Benjamin", "Isabella", "Lucas", "Mia", "Henry", "Evelyn", "Alexander", "Harper"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const classes = ["1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade"];


export const SeedDatabasePage: FC = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleSeed = async () => {
        setLoading(true);
        setProgress(0);
        try {
            const batch = writeBatch(db);
            const studentsCollection = collection(db, "students");

            for (let i = 0; i < 100; i++) {
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const student = {
                    name: `${firstName} ${lastName}`,
                    class: classes[Math.floor(Math.random() * classes.length)],
                    mobile: Math.random() > 0.3 ? `9${Math.floor(100000000 + Math.random() * 900000000)}` : "",
                    status: null,
                };
                const studentRef = doc(studentsCollection);
                batch.set(studentRef, student);

                // Update progress every 10 students
                if ((i + 1) % 10 === 0) {
                   setProgress(((i + 1) / 100) * 100);
                }
            }
            await batch.commit();
            setProgress(100);
            toast({
                title: "Database Seeded!",
                description: "Successfully added 100 random students.",
            });
        } catch (error) {
            console.error("Error seeding database: ", error);
            toast({
                title: "Error",
                description: "Failed to seed database. Check console for details.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Seed Database</CardTitle>
            <CardDescription>
            Click the button below to add 100 random student records to your Firestore database. This is a developer tool and should be used with caution.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-6 p-12">
            <Database className="h-24 w-24 text-primary/50" />
            <Button onClick={handleSeed} disabled={loading} size="lg">
                {loading ? (
                    <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Seeding...
                    </>
                ) : (
                    "Seed 100 Students"
                )}
            </Button>
            {loading && (
                <div className="w-full max-w-md">
                    <Progress value={progress} />
                    <p className="text-center text-sm text-muted-foreground mt-2">{Math.round(progress)}% complete</p>
                </div>
            )}
        </CardContent>
        </Card>
    );
};
