"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { STATUS_COLORS, PROJECT_STATUSES } from "@/lib/constants";
import { formatDeadlineLabel, isOverdue } from "@/lib/utils/dates";
import { DeleteProjectModal } from "./DeleteProjectModal";
import { CreatorInfo } from "./CreatorInfo";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { canDeleteProject, canArchiveProject } from "@/lib/auth/permissions";
import { archiveProject, restoreFromArchive } from "@/lib/firestore/projects";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const { user } = useAuthContext();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const overdue = isOverdue(project.deadline, project.status);
  const statusLabel = overdue
    ? "Overdue"
    : (PROJECT_STATUSES.find((s) => s.value === project.status)?.label ?? project.status);

  const badgeClass = overdue
    ? "bg-red-500/15 text-red-600 dark:text-red-300"
    : (STATUS_COLORS[project.status] ?? STATUS_COLORS.planning);

  const canDelete = canDeleteProject(user, project);
  const canArchive = canArchiveProject(user, project);

  const handleArchiveToggle = async () => {
    setArchiveLoading(true);
    try {
      if (project.archived) {
        await restoreFromArchive(project.id);
      } else {
        await archiveProject(project.id);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to archive/restore project");
    } finally {
      setArchiveLoading(false);
    }
  };

  return (
    <>
      <div
        className={`rounded-xl border p-6 ${
          overdue
            ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
            : project.archived
            ? "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/20"
            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to dashboard
          </Link>
          <div className="flex gap-2">
            {canArchive && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleArchiveToggle}
                disabled={archiveLoading}
              >
                {archiveLoading
                  ? "Processing..."
                  : project.archived
                  ? "Restore from Archive"
                  : "Archive Project"}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                Delete project
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {project.name}
            </h1>
            {project.clientName && project.clientName.trim() && (
              <p className="mt-1 text-zinc-500">{project.clientName}</p>
            )}
          </div>
          <div className="flex gap-2">
            {project.archived && (
              <Badge className="bg-zinc-500/15 text-zinc-600 dark:text-zinc-300">
                Archived
              </Badge>
            )}
            <Badge className={badgeClass}>{statusLabel}</Badge>
          </div>
        </div>

        <div className="mt-6">
          <ProgressBar value={project.progress} />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CreatorInfo
            createdByName={project.createdByName}
            createdByEmail={project.createdByEmail}
            createdAt={project.createdAt}
          />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Started: {new Date(project.startDate).toLocaleDateString()}
          </p>
          <p
            className={`text-sm ${
              overdue
                ? "font-semibold text-red-600 dark:text-red-400"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {formatDeadlineLabel(project.deadline)}
          </p>
        </div>
      </div>

      <DeleteProjectModal
        projectId={project.id}
        projectName={project.name}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
