
"use client";

import { ImportExcelPage } from "@/components/import-excel-page";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ImportExcelRoutePage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading || !isAuthenticated) {
    return null; // Or a loading spinner
  }
  
  return (
    <main className="flex-1 bg-muted/40 p-4 md:p-8 lg:p-10">
       <div className="w-full max-w-6xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost" className="pl-0">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <ImportExcelPage />
      </div>
    </main>
  );
}
