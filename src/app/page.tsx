
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { School, UserPlus, Users, ClipboardCheck, Shuffle } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 md:p-8">
      <div className="flex items-center gap-4 mb-12">
        <School className="h-12 w-12 text-primary" />
        <h1 className="text-5xl font-bold font-headline text-foreground">
          AttendEase
        </h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link href="/attendance" className="transform transition-transform hover:scale-105">
          <Card className="h-full shadow-lg hover:shadow-2xl cursor-pointer flex flex-col items-center text-center p-6">
            <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                <ClipboardCheck className="h-12 w-12 text-primary" />
            </div>
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-2xl">Take Attendance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CardDescription>
                Mark student attendance as Present, Absent, or Late.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/add-student" className="transform transition-transform hover:scale-105">
            <Card className="h-full shadow-lg hover:shadow-2xl cursor-pointer flex flex-col items-center text-center p-6">
                <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                    <UserPlus className="h-12 w-12 text-primary" />
                </div>
                <CardHeader className="p-0 mb-2">
                    <CardTitle className="text-2xl">Add New Student</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <CardDescription>
                        Enroll a new student into the attendance system.
                    </CardDescription>
                </CardContent>
            </Card>
        </Link>
        <Link href="/manage-students" className="transform transition-transform hover:scale-105">
            <Card className="h-full shadow-lg hover:shadow-2xl cursor-pointer flex flex-col items-center text-center p-6">
                <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                    <Users className="h-12 w-12 text-primary" />
                </div>
                <CardHeader className="p-0 mb-2">
                    <CardTitle className="text-2xl">Manage Students</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <CardDescription>
                        View the list of all students and remove them if needed.
                    </CardDescription>
                </CardContent>
            </Card>
        </Link>
        <Link href="/team-shuffle" className="transform transition-transform hover:scale-105">
            <Card className="h-full shadow-lg hover:shadow-2xl cursor-pointer flex flex-col items-center text-center p-6">
                <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                    <Shuffle className="h-12 w-12 text-primary" />
                </div>
                <CardHeader className="p-0 mb-2">
                    <CardTitle className="text-2xl">Team Shuffle</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <CardDescription>
                        Shuffle present students into teams for sports.
                    </CardDescription>
                </CardContent>
            </Card>
        </Link>
      </div>
    </div>
  );
}
