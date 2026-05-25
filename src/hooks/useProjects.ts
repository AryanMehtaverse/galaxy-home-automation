"use client";

import { useEffect, useState } from "react";
import { subscribeToProjects } from "@/lib/firestore/projects";
import type { Project } from "@/types";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToProjects((data) => {
      setProjects(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { projects, loading };
}
