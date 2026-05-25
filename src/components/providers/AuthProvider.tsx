"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "firebase/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => ReturnType<typeof import("firebase/auth").signInWithEmailAndPassword>;
  signUp: (email: string, password: string) => ReturnType<typeof import("firebase/auth").createUserWithEmailAndPassword>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
