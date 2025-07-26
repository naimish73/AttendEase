
"use client"

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ClipboardCheck, Users, School } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <School className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold font-headline text-foreground">
              AttendEase
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/" passHref>
                    <SidebarMenuButton asChild isActive={pathname === '/'}>
                        <span>
                            <ClipboardCheck />
                            Attendance
                        </span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <Link href="/students" passHref>
                    <SidebarMenuButton asChild isActive={pathname === '/students'}>
                        <span>
                            <Users />
                            Manage Students
                        </span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="md:hidden flex items-center p-2 border-b">
            <SidebarTrigger />
            <div className="flex items-center gap-2 mx-auto">
                <School className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-bold font-headline text-foreground">
                AttendEase
                </h1>
            </div>
        </div>
        {children}
        </SidebarInset>
    </SidebarProvider>
  );
}
