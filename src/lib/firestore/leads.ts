import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Lead, CallLog } from "@/types/lead";

const LEADS_COL = "leads";
const CALL_LOGS_COL = "callLogs";

// ── Leads ────────────────────────────────────────────────────────────────────

export async function fetchLeadsFromFirestore(): Promise<Lead[]> {
  const snap = await getDocs(query(collection(db, LEADS_COL), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Lead, "id">), id: d.id }));
}

export function subscribeToLeads(callback: (leads: Lead[]) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, LEADS_COL), orderBy("createdAt", "desc")),
    (snap) => callback(snap.docs.map((d) => ({ ...(d.data() as Omit<Lead, "id">), id: d.id })))
  );
}

export async function createLeadInFirestore(data: Omit<Lead, "id">): Promise<Lead> {
  const ref = await addDoc(collection(db, LEADS_COL), data);
  return { ...data, id: ref.id };
}

export async function updateLeadInFirestore(id: string, updates: Partial<Lead>): Promise<void> {
  await updateDoc(doc(db, LEADS_COL, id), updates);
}

export async function deleteLeadFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, LEADS_COL, id));
}

// ── Call Logs ─────────────────────────────────────────────────────────────────

export async function fetchCallLogsFromFirestore(leadId?: string): Promise<CallLog[]> {
  const snap = await getDocs(collection(db, CALL_LOGS_COL));
  const logs = snap.docs.map((d) => ({ ...(d.data() as Omit<CallLog, "id">), id: d.id }));
  if (leadId) return logs.filter((l) => l.leadId === leadId);
  return logs;
}

export async function createCallLogInFirestore(data: Omit<CallLog, "id">): Promise<CallLog> {
  const ref = await addDoc(collection(db, CALL_LOGS_COL), data);
  return { ...data, id: ref.id };
}

export async function deleteCallLogFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, CALL_LOGS_COL, id));
}

// ── Migration helpers (preserve original Realtime DB IDs) ────────────────────

export async function migrateLeadToFirestore(lead: Lead): Promise<void> {
  const { id, ...data } = lead;
  await setDoc(doc(db, LEADS_COL, id), data);
}

export async function migrateCallLogToFirestore(log: CallLog): Promise<void> {
  const { id, ...data } = log;
  await setDoc(doc(db, CALL_LOGS_COL, id), data);
}

export async function checkLeadExistsInFirestore(id: string): Promise<boolean> {
  const snap = await getDoc(doc(db, LEADS_COL, id));
  return snap.exists();
}
