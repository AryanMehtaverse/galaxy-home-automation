"use client";

import Link from "next/link";
import type { Project } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { STATUS_COLORS, PROJECT_STATUSES } from "@/lib/constants";
import { formatDate, isOverdue } from "@/lib/utils/dates";
import { CreatorInfo } from "./CreatorInfo";

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
          <p className="mt-2 text-xs text-zinc-500">Start {formatDate(project.startDate)}</p>
        </div>

        <div className="mt-3 space-y-1.5">
          <CreatorInfo
            createdByName={project.createdByName}
            createdByEmail={project.createdByEmail}
            compact
          />
          <div className="flex items-center justify-between text-xs">
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
        </div>

        {(project.city || project.clientPhone) && (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-150 pt-2.5 text-xs text-zinc-500 dark:border-zinc-800">
            {project.city && (
              <span className="flex items-center gap-1 min-w-0 max-w-full">
                <svg className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{project.city}</span>
              </span>
            )}
            {project.clientPhone && (
              <span className="flex items-center gap-1 min-w-0 max-w-full">
                <svg className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.24.96l-1.35 1.35a11.047 11.047 0 004.8 4.8l1.35-1.35a1 1 0 01.96-.24l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="truncate">{project.clientPhone}</span>
              </span>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
}
