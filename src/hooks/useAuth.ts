"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { mapFirebaseUser } from "@/lib/auth/user";
import type { AppUser } from "@/types/auth";

const googleProvider = new GoogleAuthProvider();

async function resolveUser(firebaseUser: import("firebase/auth").User): Promise<{ user: AppUser | null; error: string | null }> {
  const userDocRef = doc(db, "authorized_users", firebaseUser.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // Auto-create with unassigned role
    await setDoc(userDocRef, {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName ?? "",
      email: firebaseUser.email ?? "",
      role: "unassigned",
      active: true,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    return {
      user: {
        ...mapFirebaseUser(firebaseUser),
        role: "unassigned",
        active: true,
      },
      error: null,
    };
  }

  const data = userDoc.data();

  if (data.active === false) {
    await signOut(auth);
    return { user: null, error: "Access denied. Your account has been disabled." };
  }

  // Update lastLogin
  await updateDoc(userDocRef, { lastLogin: serverTimestamp() }).catch(() => {});

  return {
    user: {
      ...mapFirebaseUser(firebaseUser),
      role: data.role,
      active: data.active,
    },
    error: null,
  };
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        try {
          const { user: resolved, error } = await resolveUser(firebaseUser);
          setUser(resolved);
          setAuthError(error);
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
      const { user: resolved, error } = await resolveUser(result.user);
      if (error) {
        throw new Error(error);
      }
      setUser(resolved);
      return resolved!;
    } catch (err) {
      console.error("Sign in error:", err);
      throw err;
    }
  };

  const logout = () => signOut(auth);

  return { user, loading, authError, signInWithGoogle, logout };
}
