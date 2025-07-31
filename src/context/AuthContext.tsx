
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { School } from 'lucide-react';
import { auth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, type User } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const ALLOWED_EMAILS = [
  "gurukulyouthsatsang2025@gmail.com",
  "naimishbbhuva@gmail.com",
  "axitkatharotiya2005@gmail.com"
];

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loginWithGoogle: () => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && ALLOWED_EMAILS.includes(currentUser.email || '')) {
        setUser(currentUser);
      } else {
        setUser(null);
        if(auth.currentUser) {
          signOut(auth);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
        console.error("Error signing in with Google:", error);
        toast({
            title: "Authentication Failed",
            description: error.message || "Could not sign in with Google. Please try again.",
            variant: "destructive",
          });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/login');
    } catch (error: any) {
        console.error("Error signing out:", error);
        toast({
            title: "Logout Failed",
            description: error.message || "Could not sign out. Please try again.",
            variant: "destructive",
          });
    }
  };

  const isAuthenticated = !!user;

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      } else if (isAuthenticated && pathname === '/login') {
        router.push('/');
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex items-center gap-4 mb-4">
            <School className="h-10 w-10 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold font-headline">AttendEase</h1>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
