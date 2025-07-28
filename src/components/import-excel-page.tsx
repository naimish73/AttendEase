
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
import { collection, writeBatch, doc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import { Progress } from "./ui/progress";
import { FileUp, CheckCircle, AlertCircle } from "lucide-react";

type StudentData = {
    name: string;
    class: string;
    mobile?: string;
    imageUrl?: string;
    status: null;
    quizPoints: number;
}

export const ImportExcelPage: FC = () => {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState<{success: number, failed: number} | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
            setUploadResult(null);
            setUploadProgress(0);
        }
    }

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
                
                const batch = writeBatch(db);
                const studentsCollection = collection(db, "students");
                let successCount = 0;
                let failedCount = 0;

                json.forEach((row, index) => {
                    if (row.name && row.class) {
                        const studentRef = doc(studentsCollection);
                        const studentData: StudentData = {
                            name: String(row.name),
                            class: String(row.class),
                            mobile: row.mobile ? String(row.mobile) : '',
                            imageUrl: row.imageUrl || `https://placehold.co/100x100.png`,
                            status: null,
                            quizPoints: 0,
                        };
                        batch.set(studentRef, studentData);
                        successCount++;
                    } else {
                        failedCount++;
                    }
                    setUploadProgress(((index + 1) / json.length) * 100);
                });

                await batch.commit();

                setUploadResult({ success: successCount, failed: failedCount });
                toast({
                    title: "Import Complete",
                    description: `${successCount} students imported successfully. ${failedCount > 0 ? `${failedCount} rows failed.` : ''}`
                });

            } catch (error) {
                console.error("Error importing students: ", error);
                toast({
                    title: "Import Failed",
                    description: "An error occurred while importing the data. Please check the file format and try again.",
                    variant: "destructive"
                });
                 setUploadResult({ success: 0, failed: 0 });
            } finally {
                setIsUploading(false);
                setFile(null);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-3xl">Import Students from Excel</CardTitle>
                <CardDescription>
                    Upload an .xlsx or .xls file with student data. Ensure the columns are named 'name', 'class', 'mobile', and 'imageUrl'.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="excel-file">Excel File</Label>
                    <Input id="excel-file" type="file" onChange={handleFileChange} accept=".xlsx, .xls" disabled={isUploading} />
                </div>
                <Button onClick={handleImport} disabled={!file || isUploading} className="w-full" size="lg">
                    <FileUp className="mr-2 h-4 w-4" />
                    {isUploading ? `Importing... (${Math.round(uploadProgress)}%)` : "Import Students"}
                </Button>
                
                {isUploading && (
                    <Progress value={uploadProgress} className="w-full" />
                )}

                {uploadResult && (
                    <div className="p-4 rounded-lg bg-muted">
                        <h3 className="font-semibold text-lg mb-2">Import Summary</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span>{uploadResult.success} Succeeded</span>
                            </div>
                            {uploadResult.failed > 0 && (
                                <div className="flex items-center gap-2 text-red-600">
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
