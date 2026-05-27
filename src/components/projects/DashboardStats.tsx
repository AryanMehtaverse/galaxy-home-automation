"use client";

import type { Project } from "@/types";
import { isOverdue } from "@/lib/utils/dates";

interface DashboardStatsProps {
  projects: Project[];
}

export function DashboardStats({ projects }: DashboardStatsProps) {
  const planning = projects.filter(
    (p) => p.status === "planning" && !isOverdue(p.deadline, p.status)
  ).length;
  const inProgress = projects.filter(
    (p) => p.status === "in_progress" && !isOverdue(p.deadline, p.status)
  ).length;
  const completed = projects.filter((p) => p.status === "completed").length;
  const overdue = projects.filter((p) =>
    isOverdue(p.deadline, p.status)
  ).length;
  const total = planning + inProgress + completed + overdue;

  const stats = [
    { label: "Total Projects", value: total, color: "text-zinc-900 dark:text-zinc-100" },
    { label: "Planning", value: planning, color: "text-slate-600 dark:text-slate-400" },
    { label: "In Progress", value: inProgress, color: "text-blue-600 dark:text-blue-400" },
    { label: "Completed", value: completed, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Overdue", value: overdue, color: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500">{stat.label}</p>
          <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
