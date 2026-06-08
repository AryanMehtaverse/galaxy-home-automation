import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { InventorySheet } from "@/types/inventory";
import type { AppUser } from "@/types/auth";

const COLLECTION = "inventorySheets";

export function subscribeToInventorySheets(
  callback: (sheets: InventorySheet[]) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const sheets = snapshot.docs.map((d) => {
      const data = d.data();
      return normalizeSheetFromFirestore(d.id, data);
    });
    callback(sheets);
  });
}

export function normalizeSheetFromFirestore(
  id: string,
  data: Record<string, unknown>
): InventorySheet {
  const toIso = (value: unknown, fallback: string): string => {
    if (
      value &&
      typeof value === "object" &&
      "toDate" in value &&
      typeof (value as { toDate: () => Date }).toDate === "function"
    ) {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof value === "string" && value) return value;
    return fallback;
  };

  const now = new Date().toISOString();
  const createdAt = data["createdAt"] ? toIso(data["createdAt"], now) : now;
  const createdBy = data["createdBy"] as Record<string, unknown> | undefined;

  return {
    id,
    name: String(data["name"] ?? "").trim(),
    originalUrl: String(data["originalUrl"] ?? "").trim(),
    spreadsheetId: String(data["spreadsheetId"] ?? "").trim(),
    embedUrl: String(data["embedUrl"] ?? "").trim(),
    createdAt,
    createdBy: {
      uid: String(createdBy?.uid ?? ""),
      displayName: String(createdBy?.displayName ?? ""),
      email: String(createdBy?.email ?? ""),
    },
  };
}

export async function addInventorySheet(
  sheet: Omit<InventorySheet, "id" | "createdAt" | "createdBy">,
  user: AppUser
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    name: sheet.name.trim(),
    originalUrl: sheet.originalUrl.trim(),
    spreadsheetId: sheet.spreadsheetId.trim(),
    embedUrl: sheet.embedUrl.trim(),
    createdAt: Timestamp.now(),
    createdBy: {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
    },
  });
  return docRef.id;
}

export async function updateInventorySheet(
  id: string,
  updates: Partial<Omit<InventorySheet, "id" | "createdAt" | "createdBy">>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  const data: Record<string, unknown> = {};
  if (updates.name !== undefined) data["name"] = updates.name.trim();
  if (updates.originalUrl !== undefined) data["originalUrl"] = updates.originalUrl.trim();
  if (updates.spreadsheetId !== undefined) data["spreadsheetId"] = updates.spreadsheetId.trim();
  if (updates.embedUrl !== undefined) data["embedUrl"] = updates.embedUrl.trim();

  await updateDoc(docRef, data);
}

export async function deleteInventorySheet(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await deleteDoc(docRef);
}

export async function checkSpreadsheetIdExists(
  spreadsheetId: string,
  excludeId?: string
): Promise<boolean> {
  const q = query(
    collection(db, COLLECTION),
    where("spreadsheetId", "==", spreadsheetId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return false;
  
  if (excludeId) {
    // Exclude the currently editing sheet
    return snapshot.docs.some((doc) => doc.id !== excludeId);
  }
  return true;
}
