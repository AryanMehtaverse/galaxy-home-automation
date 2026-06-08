"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeSheetFromFirestore } from "@/lib/firestore/inventory";
import type { InventorySheet } from "@/types/inventory";

export function useInventorySheet(id: string) {
  const [sheet, setSheet] = useState<InventorySheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, "inventorySheets", id);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSheet(normalizeSheetFromFirestore(docSnap.id, docSnap.data()));
        } else {
          setSheet(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error subscribing to inventory sheet:", err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [id]);

  return { sheet, loading };
}
