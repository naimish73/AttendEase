
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, UserPlus, Users, School } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex items-center gap-4 mb-8">
        <School className="h-12 w-12 text-primary" />
        <h1 className="text-4xl font-bold font-headline text-foreground">
          AttendEase
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Link href="/attendance" passHref>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
              <ClipboardCheck className="w-8 h-8 text-primary" />
              <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>Mark and view student attendance.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/add-student" passHref>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
              <UserPlus className="w-8 h-8 text-primary" />
              <CardTitle>Add Student</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>Add a new student to the roster.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/students" passHref>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
              <Users className="w-8 h-8 text-primary" />
              <CardTitle>Manage Students</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p>View and delete student records.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
