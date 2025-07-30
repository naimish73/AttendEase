
"use client";

import { AttendancePage } from "@/components/attendance-page";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AttendanceRoutePage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading || !isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <main className="flex min-h-screen flex-col bg-muted/40">
       <div className="w-full max-w-7xl mx-auto p-4 md:p-8 lg:p-10">
        <div className="mb-6">
          <Button asChild variant="ghost" className="pl-0">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <AttendancePage />
      </div>
    </main>
  );
}
