"use client";

import type { Project } from "@/types";
import { ProjectCard } from "./ProjectCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create your first home automation project to start tracking the workflow."
        action={
          <Link href="/projects/new">
            <Button>Create Project</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
