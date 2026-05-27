"use client";

import { useEffect, useState } from "react";
import { subscribeToProjectPhotos, type ProjectPhoto } from "@/lib/firestore/projects";

export function useProjectPhotos(projectId: string) {
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeToProjectPhotos(projectId, (data) => {
      setPhotos(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [projectId]);

  return { photos, loading };
}
