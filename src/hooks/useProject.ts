"use client";

import { useEffect, useState } from "react";
import { subscribeToProject } from "@/lib/firestore/projects";
import type { Project } from "@/types";

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToProject(id, (data) => {
      setProject(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [id]);

  return { project, loading };
}
