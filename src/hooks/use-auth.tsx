"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { AuthFormValues } from "@/app/auth/page";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (data: AuthFormValues) => Promise<void>;
  signUp: (data: AuthFormValues) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerificationEmail: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for disabled authentication
const mockUser = {
  uid: "guest-user-123",
  email: "guest@lexease.com",
  displayName: "Guest User",
  emailVerified: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Set to true to enable Firebase authentication
  const authEnabled = false; 

  const [user, setUser] = useState<User | null>(authEnabled ? null : mockUser as unknown as User);
  const [loading, setLoading] = useState(authEnabled);
  const { toast } = useToast();

  useEffect(() => {
    if (!authEnabled) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [authEnabled]);

  const signIn = async (data: AuthFormValues) => {
    if (!authEnabled) return;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        toast({
            variant: "destructive",
            title: "Email not verified",
            description: "Please check your inbox or resend the verification email.",
        });
        const error: any = new Error("Email not verified");
        error.code = "auth/user-not-verified";
        throw error;
      }
    } catch (error: any) {
       if (error.code !== "auth/user-not-verified") {
            toast({
                variant: "destructive",
                title: "Sign in failed",
                description: error.message,
            });
       }
      throw error;
    }
  };

  const signUp = async (data: AuthFormValues) => {
    if (!authEnabled) return;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const newUser = userCredential.user;
      
      // Don't await these promises on the client
      sendEmailVerification(newUser);
      setDoc(doc(db, "users", newUser.uid), {
        email: newUser.email,
        createdAt: new Date(),
      });

      await firebaseSignOut(auth); // Sign out user until they are verified
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
      throw error;
    }
  };

  const signOut = async () => {
    if (!authEnabled) return;
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message,
      });
    }
  };

  const sendPasswordReset = async (email: string) => {
    if (!authEnabled) return;
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox to reset your password.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message,
      });
    }
  };
  
  const resendVerificationEmail = async (email: string, password: string) => {
    if (!authEnabled) return;
    try {
      // To resend, we need to temporarily sign the user in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await firebaseSignOut(auth);
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and verify your email address.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Resend Email",
        description: "Could not resend verification email. Please check your credentials.",
      });
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    resendVerificationEmail
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
