
import { StudentsPage } from "@/components/students-page";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ManageStudentsPage() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 md:p-8">
       <div className="w-full max-w-4xl mb-4">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      <div className="w-full max-w-4xl">
        <StudentsPage />
      </div>
    </div>
  );
}
