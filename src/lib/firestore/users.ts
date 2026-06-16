import {
  collection,
  doc,
  getDocs,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AppRole } from "@/types/auth";

export interface ManagedUser {
  uid: string;
  name: string;
  email: string;
  role: AppRole;
  active: boolean;
  createdAt: Date | null;
  lastLogin: Date | null;
}

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val && typeof (val as { toDate?: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate();
  }
  return null;
}

function docToUser(id: string, data: Record<string, unknown>): ManagedUser {
  return {
    uid: id,
    name: (data.name as string) || (data.displayName as string) || "",
    email: (data.email as string) || "",
    role: (data.role as AppRole) || "unassigned",
    active: data.active !== false,
    createdAt: toDate(data.createdAt),
    lastLogin: toDate(data.lastLogin),
  };
}

export function subscribeToUsers(callback: (users: ManagedUser[]) => void): Unsubscribe {
  const q = query(collection(db, "authorized_users"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const users = snap.docs.map((d) => docToUser(d.id, d.data() as Record<string, unknown>));
    callback(users);
  });
}

export async function getAllUsers(): Promise<ManagedUser[]> {
  const snap = await getDocs(query(collection(db, "authorized_users"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => docToUser(d.id, d.data() as Record<string, unknown>));
}

export async function updateUserRole(uid: string, role: AppRole): Promise<void> {
  await updateDoc(doc(db, "authorized_users", uid), { role });
}

export async function updateUserStatus(uid: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, "authorized_users", uid), { active });
}

export async function updateUserProfile(
  uid: string,
  data: { name?: string; role?: AppRole; active?: boolean }
): Promise<void> {
  await updateDoc(doc(db, "authorized_users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
