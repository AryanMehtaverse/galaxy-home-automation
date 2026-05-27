"use client";

import { useState } from "react";
import Link from "next/link";
import { useProjects } from "@/hooks/useProjects";
import { DashboardStats } from "@/components/projects/DashboardStats";
import { ProjectList } from "@/components/projects/ProjectList";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { isOverdue } from "@/lib/utils/dates";

export default function DashboardPage() {
  const { projects, loading } = useProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredProjects = projects.filter((project) => {
    // 1. Search Query filter
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const match =
        project.name.toLowerCase().includes(query) ||
        project.clientName.toLowerCase().includes(query) ||
        (project.address && project.address.toLowerCase().includes(query)) ||
        (project.city && project.city.toLowerCase().includes(query)) ||
        (project.landmark && project.landmark.toLowerCase().includes(query)) ||
        (project.clientPhone && project.clientPhone.toLowerCase().includes(query));
      if (!match) return false;
    }

    // 2. Status Card filter
    if (activeFilter === "planning") {
      return project.status === "planning" && !isOverdue(project.deadline, project.status);
    }
    if (activeFilter === "in_progress") {
      return project.status === "in_progress" && !isOverdue(project.deadline, project.status);
    }
    if (activeFilter === "completed") {
      return project.status === "completed";
    }
    if (activeFilter === "overdue") {
      return isOverdue(project.deadline, project.status);
    }

    return true; // null or total
  });

  const getFilterLabel = () => {
    if (activeFilter === "planning") return "Planning";
    if (activeFilter === "in_progress") return "In Progress";
    if (activeFilter === "completed") return "Completed";
    if (activeFilter === "overdue") return "Overdue";
    return "";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track home automation projects and workflows in real time
          </p>
        </div>
        <Link href="/projects/new">
          <Button>New Project</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <>
          <DashboardStats
            projects={projects}
            activeFilter={activeFilter}
            onCardClick={setActiveFilter}
          />
          
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Projects</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {filteredProjects.length}
                  </span>
                  {activeFilter && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      <span>·</span>
                      <span>Filtered by {getFilterLabel()}</span>
                      <button
                        onClick={() => setActiveFilter(null)}
                        className="ml-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/30 p-0.5"
                        title="Clear filter"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                </h2>
              </div>

              {projects.length > 0 && (
                <div className="relative w-full max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="h-4 w-4 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, client, address, city, landmark..."
                    className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <svg className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">No results found</h3>
                <p className="mt-1 text-xs text-zinc-500 max-w-xs">
                  We couldn&apos;t find any projects matching your filters or search query. Try clearing them.
                </p>
                <div className="mt-4 flex gap-2">
                  {searchQuery && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear Search
                    </Button>
                  )}
                  {activeFilter && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveFilter(null)}
                    >
                      Clear Status Filter
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <ProjectList projects={filteredProjects} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
