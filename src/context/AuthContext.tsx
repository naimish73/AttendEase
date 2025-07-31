
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { School } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// This is a simplified, non-secure auth context for a local admin panel.
// In a real application, you would use a secure authentication provider.
const ADMIN_USERID = "youthsabha";
const ADMIN_PASSWORD = "shreehari";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (userId: string, password: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Check if the user is "logged in" from a previous session
    try {
      const storedAuth = localStorage.getItem('isAdminAuthenticated');
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
        // localStorage is not available on the server, so we can ignore this.
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      } else if (isAuthenticated && pathname === '/login') {
        router.push('/');
      }
    }
  }, [isAuthenticated, loading, pathname, router]);


  const login = (userId: string, password: string) => {
    if (userId === ADMIN_USERID && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      try {
        localStorage.setItem('isAdminAuthenticated', 'true');
      } catch (error) {
        // localStorage not available
      }
      router.push('/');
    } else {
      toast({
        title: "Invalid Credentials",
        description: "The user ID or password you entered is incorrect.",
        variant: "destructive",
      });
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
     try {
        localStorage.removeItem('isAdminAuthenticated');
      } catch (error) {
        // localStorage not available
      }
    router.push('/login');
  };

  if (loading && pathname !== '/login') {
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
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
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
