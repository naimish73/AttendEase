
import { AddStudentForm } from "@/components/add-student-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AddStudentPage() {
  return (
    <div className="flex justify-center min-h-screen bg-background p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        <AddStudentForm />
      </div>
    </div>
  );
}
