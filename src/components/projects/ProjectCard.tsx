"use client";

import Link from "next/link";
import type { Project } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { STATUS_COLORS, PROJECT_STATUSES } from "@/lib/constants";
import { formatDate, isOverdue } from "@/lib/utils/dates";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const overdue = isOverdue(project.deadline, project.status);
  const statusLabel =
    PROJECT_STATUSES.find((s) => s.value === project.status)?.label ??
    project.status;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card
        overdue={overdue}
        className="cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-indigo-500/20"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
              {project.name}
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500">{project.clientName}</p>
          </div>
          <Badge className={STATUS_COLORS[project.status]}>{statusLabel}</Badge>
        </div>

        <div className="mt-4">
          <ProgressBar value={project.progress} size="sm" />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span
            className={
              overdue
                ? "font-semibold text-red-600 dark:text-red-400"
                : "text-zinc-500"
            }
          >
            {overdue ? "Overdue · " : ""}
            {project.deadline
              ? `Due ${formatDate(project.deadline)}`
              : "No deadline"}
          </span>
          <span className="text-zinc-400">
            {project.workflow.length} workflow items
          </span>
        </div>
      </Card>
    </Link>
  );
}
