
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, writeBatch, doc, getDocs, query, where, setDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import { Progress } from "./ui/progress";
import { FileUp, CheckCircle, AlertCircle } from "lucide-react";

type StudentData = {
    name: string;
    class: string;
    mobile?: string;
    quizPoints: number;
}

type AttendanceStatus = "Present" | "Late";

export const ImportExcelPage: FC = () => {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState<{success: number, failed: number, duplicates: number} | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
            setUploadResult(null);
            setUploadProgress(0);
        }
    }

    const isValidDateString = (str: string) => /^\d{4}-\d{2}-\d{2}$/.test(str);

    const handleImport = async () => {
        if (!file) {
            toast({
                title: "No file selected",
                description: "Please select an Excel file to import.",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setUploadResult(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    toast({ title: "Empty Sheet", description: "The selected Excel sheet is empty.", variant: "destructive" });
                    setIsUploading(false);
                    return;
                }

                let successCount = 0;
                let failedCount = 0;
                let duplicateCount = 0;
                
                const studentsRef = collection(db, "students");
                const existingStudentsSnap = await getDocs(studentsRef);
                const existingStudents = new Set(existingStudentsSnap.docs.map(d => {
                    const data = d.data();
                    return `${String(data.name).toLowerCase()}_${String(data.mobile || '')}`;
                }));
                
                const dateColumns = Object.keys(json[0] || {}).filter(key => isValidDateString(key));
                const attendanceUpdates: Record<string, Record<string, AttendanceStatus>> = {};
                
                const batch = writeBatch(db);
                const newStudentsForAttendance = new Map<string, string>(); // Maps unique key to new student ID

                for (const [index, row] of json.entries()) {
                    if (!row.name || !row.class) {
                        failedCount++;
                        continue;
                    }

                    const studentName = String(row.name);
                    const studentClass = String(row.class);
                    const studentMobile = row.mobile ? String(row.mobile) : '';
                    const quizPoints = (typeof row.quizPoints === 'number' && !isNaN(row.quizPoints)) ? row.quizPoints : 0;
                    
                    const uniqueKey = `${studentName.toLowerCase()}_${studentMobile}`;

                    if (existingStudents.has(uniqueKey)) {
                        duplicateCount++;
                        continue; // Skip this duplicate row
                    }

                    const newStudentRef = doc(studentsRef);
                    const studentId = newStudentRef.id;
                    const studentData = { name: studentName, class: studentClass, mobile: studentMobile, quizPoints };
                    batch.set(newStudentRef, studentData);
                    existingStudents.add(uniqueKey); // Add to set to prevent duplicates within the same file
                    newStudentsForAttendance.set(uniqueKey, studentId);

                    for (const date of dateColumns) {
                        const status = String(row[date] || '').toUpperCase();
                        if (status === 'P' || status === 'L') {
                            if (!attendanceUpdates[date]) attendanceUpdates[date] = {};
                            attendanceUpdates[date][studentId] = status === 'P' ? 'Present' : 'Late';
                        }
                    }
                    successCount++;
                    setUploadProgress(((index + 1) / json.length) * 100);
                }

                await batch.commit();
                
                // Fetch all students again to update attendance for existing ones not in this batch
                const allStudentsSnap = await getDocs(studentsRef);
                const allStudentsMap = new Map(allStudentsSnap.docs.map(d => {
                    const data = d.data();
                    const key = `${String(data.name).toLowerCase()}_${String(data.mobile || '')}`;
                    return [key, d.id];
                }));


                const finalAttendanceUpdates: Record<string, Record<string, AttendanceStatus>> = {};
                for (const row of json) {
                    const studentName = String(row.name);
                    const studentMobile = row.mobile ? String(row.mobile) : '';
                    const uniqueKey = `${studentName.toLowerCase()}_${studentMobile}`;
                    const studentId = allStudentsMap.get(uniqueKey);
                    
                    if (studentId) {
                        for (const date of dateColumns) {
                            const status = String(row[date] || '').toUpperCase();
                            if (status === 'P' || status === 'L') {
                                if (!finalAttendanceUpdates[date]) finalAttendanceUpdates[date] = {};
                                finalAttendanceUpdates[date][studentId] = status === 'P' ? 'Present' : 'Late';
                            }
                        }
                    }
                }

                const attendanceBatch = writeBatch(db);
                for(const [date, statuses] of Object.entries(finalAttendanceUpdates)) {
                    const attendanceRef = doc(db, 'attendance', date);
                    attendanceBatch.set(attendanceRef, statuses, { merge: true });
                }
                await attendanceBatch.commit();
                
                setUploadResult({ success: successCount, failed: failedCount, duplicates: duplicateCount });
                toast({
                    title: "Import Complete",
                    description: `${successCount} new students added. ${duplicateCount} duplicates skipped. ${failedCount > 0 ? `${failedCount} rows failed.` : ''} Attendance updated.`
                });

            } catch (error) {
                console.error("Error importing students: ", error);
                toast({
                    title: "Import Failed",
                    description: "An error occurred while importing the data. Please check the file format and try again.",
                    variant: "destructive"
                });
                 setUploadResult({ success: 0, failed: 0, duplicates: 0 });
            } finally {
                setIsUploading(false);
                setFile(null); // Clear file input
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <FileUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-headline">Import Students from Excel</CardTitle>
                        <CardDescription>
                            Upload an .xlsx or .xls file. Use columns 'name', 'class', 'mobile', 'quizPoints'. For attendance, add columns with date headers formatted as 'YYYY-MM-DD' (e.g., '2024-07-27') and use 'P' for Present or 'L' for Late as values.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2 max-w-2xl">
                    <Label htmlFor="excel-file">Excel File</Label>
                    <Input id="excel-file" type="file" onChange={handleFileChange} accept=".xlsx, .xls" disabled={isUploading} key={file ? 'file-selected' : 'no-file'} />
                </div>
                <Button onClick={handleImport} disabled={!file || isUploading} size="lg">
                    <FileUp className="mr-2 h-4 w-4" />
                    {isUploading ? `Importing... (${Math.round(uploadProgress)}%)` : "Import Data"}
                </Button>
                
                {isUploading && (
                    <Progress value={uploadProgress} className="w-full max-w-2xl" />
                )}

                {uploadResult && (
                    <div className="p-4 rounded-lg bg-muted max-w-2xl">
                        <h3 className="font-semibold text-lg mb-2">Import Summary</h3>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span>{uploadResult.success} Succeeded</span>
                            </div>
                             <div className="flex items-center gap-2 text-slate-600">
                                <AlertCircle className="h-5 w-5" />
                                <span>{uploadResult.duplicates} Duplicates</span>
                            </div>
                            {uploadResult.failed > 0 && (
                                <div className="flex items-center gap-2 text-destructive">
                                    <AlertCircle className="h-5 w-5" />
                                    <span>{uploadResult.failed} Failed</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    