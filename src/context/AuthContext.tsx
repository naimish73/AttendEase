
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { School } from 'lucide-react';
import { User } from 'firebase/auth'; // Keep for type consistency if needed elsewhere

// =================================================================================
// Admin Credentials
// =================================================================================
const ADMIN_USER_ID = "AXITK010";
const ADMIN_PASSWORD = "Gurukul@290705";
// =================================================================================

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null; // This can be a mock user object if needed
  login: (userId: string, password: string) => boolean;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('isAuthenticated');
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Could not access localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userId: string, password: string): boolean => {
    if (userId === ADMIN_USER_ID && password === ADMIN_PASSWORD) {
      localStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      router.push('/');
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex items-center gap-4 mb-4">
            <School className="h-10 w-10 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold font-headline">AttendEase</h1>
        </div>
        <p>Initializing...</p>
      </div>
    );
  }

  // Route protection
  if (!loading && !isAuthenticated && pathname !== '/login') {
    router.push('/login');
    return null; // Render nothing while redirecting
  }
  
  if (!loading && isAuthenticated && pathname === '/login') {
    router.push('/');
    return null; // Render nothing while redirecting
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user: null, login, logout, loading }}>
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
