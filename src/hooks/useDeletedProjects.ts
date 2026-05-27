"use client";

import { useEffect, useState } from "react";
import { subscribeToProjects } from "@/lib/firestore/projects";
import type { Project } from "@/types";

export function useDeletedProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((data) => {
      const deleted = data.filter((p) => p.deleted);
      setProjects(deleted);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { projects, loading };
}
