"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { mapFirebaseUser } from "@/lib/auth/user";
import type { AppUser } from "@/types/auth";

const googleProvider = new GoogleAuthProvider();

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        try {
          const userDocRef = doc(db, "authorized_users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            await signOut(auth);
            setUser(null);
            setAuthError("Access denied. Your account is not authorized.");
          } else {
            const data = userDoc.data();
            if (data.active === false) {
              await signOut(auth);
              setUser(null);
              setAuthError("Access denied. Your account is inactive.");
            } else {
              setUser({
                ...mapFirebaseUser(firebaseUser),
                role: data.role,
                active: data.active,
              });
              setAuthError(null);
            }
          }
        } catch (err) {
          console.error("Error checking user authorization:", err);
          await signOut(auth);
          setUser(null);
          setAuthError("Access denied. Failed to verify account permissions.");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userDocRef = doc(db, "authorized_users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error("Access denied. Your account is not authorized.");
      }
      
      const data = userDoc.data();
      if (data.active === false) {
        await signOut(auth);
        throw new Error("Access denied. Your account is inactive.");
      }
      
      const mapped = {
        ...mapFirebaseUser(firebaseUser),
        role: data.role,
        active: data.active,
      };
      setUser(mapped);
      return mapped;
    } catch (err) {
      console.error("Sign in error:", err);
      throw err;
    }
  };

  const logout = () => signOut(auth);

  return { user, loading, authError, signInWithGoogle, logout };
}
