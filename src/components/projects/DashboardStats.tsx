"use client";

import type { Project } from "@/types";
import { isOverdue } from "@/lib/utils/dates";

interface DashboardStatsProps {
  projects: Project[];
  activeFilter: string | null;
  onCardClick: (filter: string | null) => void;
}

export function DashboardStats({ projects, activeFilter, onCardClick }: DashboardStatsProps) {
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
    { id: "total", label: "Total Projects", value: total, color: "text-zinc-900 dark:text-zinc-100" },
    { id: "planning", label: "Planning", value: planning, color: "text-slate-600 dark:text-slate-400" },
    { id: "in_progress", label: "In Progress", value: inProgress, color: "text-blue-600 dark:text-blue-400" },
    { id: "completed", label: "Completed", value: completed, color: "text-emerald-600 dark:text-emerald-400" },
    { id: "overdue", label: "Overdue", value: overdue, color: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => {
        const isActive = activeFilter === stat.id || (stat.id === "total" && activeFilter === null);
        return (
          <div
            key={stat.id}
            onClick={() => {
              if (stat.id === "total") {
                onCardClick(null);
              } else {
                onCardClick(activeFilter === stat.id ? null : stat.id);
              }
            }}
            className={`rounded-xl border p-4 cursor-pointer transition-all ${
              isActive
                ? "border-indigo-500 ring-2 ring-indigo-500/25 bg-indigo-50/5 dark:bg-indigo-950/10 dark:border-indigo-400"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            }`}
          >
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
