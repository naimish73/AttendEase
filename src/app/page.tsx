
import { AttendancePage } from '@/components/attendance-page';
import { AddStudentForm } from '@/components/add-student-form';
import { StudentsPage } from '@/components/students-page';
import { School } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <School className="h-12 w-12 text-primary" />
        <h1 className="text-4xl font-bold font-headline text-foreground">
          AttendEase
        </h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-7xl">
        <div className="lg:col-span-2">
            <AttendancePage />
        </div>
        <div className="flex flex-col gap-6">
            <AddStudentForm />
            <StudentsPage />
        </div>
      </div>
    </div>
  );
}
