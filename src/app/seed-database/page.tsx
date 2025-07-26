
import { SeedDatabasePage } from "@/components/seed-database-page";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SeedDatabaseRoutePage() {
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
        <SeedDatabasePage />
      </div>
    </div>
  );
}
