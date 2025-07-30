
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { School } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = () => {
    const success = login(userId, password);
    if (!success) {
        toast({
            title: "Login Failed",
            description: "Invalid User ID or Password.",
            variant: "destructive",
        })
    }
  };

  if (loading || isAuthenticated) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-background">
      <div className="w-full h-64 bg-primary text-primary-foreground flex flex-col items-center justify-center text-center p-8">
        <School className="h-16 w-16 mb-4" />
        <h1 className="text-4xl font-bold">Hello!</h1>
        <p className="text-lg">Welcome to AttendEase</p>
      </div>
      <div className="w-full max-w-md px-4 -mt-20">
        <Card className="shadow-2xl rounded-3xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="Enter User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="rounded-full px-5 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-full px-5 h-12"
              />
            </div>
            <Button
              onClick={handleLogin}
              className="w-full rounded-full"
              size="lg"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
