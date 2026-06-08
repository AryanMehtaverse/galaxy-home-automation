"use client";

import { useEffect, useState } from "react";
import { subscribeToInventorySheets } from "@/lib/firestore/inventory";
import type { InventorySheet } from "@/types/inventory";

export function useInventorySheets() {
  const [sheets, setSheets] = useState<InventorySheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToInventorySheets((data) => {
      setSheets(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { sheets, loading };
}
