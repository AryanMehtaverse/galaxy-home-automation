"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { mapFirebaseUser } from "@/lib/auth/user";
import type { AppUser } from "@/types/auth";

const googleProvider = new GoogleAuthProvider();

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = () =>
    signInWithPopup(auth, googleProvider).then((result) =>
      mapFirebaseUser(result.user)
    );

  const logout = () => signOut(auth);

  return { user, loading, signInWithGoogle, logout };
}
