
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Assuming auth is exported from firebase.ts
import { useToast } from '@/hooks/use-toast';
import { School } from 'lucide-react';

// =================================================================================
// IMPORTANT: Add the email addresses of authorized users to this list.
// =================================================================================
const ALLOWED_USERS = [
  "axitkatharotiya2005@gmail.com",
  "nilkanthcsc1@gmail.com", // <-- Replace with your authorized email addresses
];
// =================================================================================

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: () => void;
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
      if (currentUser) {
        // Check if the signed-in user is in the allowed list
        if (currentUser.email && ALLOWED_USERS.includes(currentUser.email)) {
          setUser(currentUser);
        } else {
          // If not allowed, sign them out and show an error
          signOut(auth);
          setUser(null);
          toast({
            title: "Access Denied",
            description: "This Google account is not authorized to access this application.",
            variant: "destructive",
          });
           if (pathname !== '/login') {
            router.push('/login');
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged observer will handle the user state and redirection
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      toast({
        title: "Login Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex items-center gap-4 mb-4">
            <School className="h-10 w-10 text-primary animate-pulse" />
            <h1 className="text-4xl font-bold font-headline">AttendEase</h1>
        </div>
        <p>Initializing authentication...</p>
      </div>
    );
  }

  // If not authenticated and not on the login page, redirect
  if (!user && pathname !== '/login') {
    router.push('/login');
    return null; // Render nothing while redirecting
  }
  
  // If authenticated and on the login page, redirect to home
  if (user && pathname === '/login') {
    router.push('/');
    return null; // Render nothing while redirecting
  }


  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, loading }}>
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
