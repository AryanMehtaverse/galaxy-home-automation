import type { ProjectStatus } from "@/types";

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  in_progress: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  review: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  on_hold: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300",
};
