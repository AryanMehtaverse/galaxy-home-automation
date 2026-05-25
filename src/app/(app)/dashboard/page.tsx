"use client";

import Link from "next/link";
import { useProjects } from "@/hooks/useProjects";
import { DashboardStats } from "@/components/projects/DashboardStats";
import { ProjectList } from "@/components/projects/ProjectList";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardPage() {
  const { projects, loading } = useProjects();

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
          <DashboardStats projects={projects} />
          <div>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Projects
            </h2>
            <ProjectList projects={projects} />
          </div>
        </>
      )}
    </div>
  );
}
