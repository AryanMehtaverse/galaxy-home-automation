"use client";

import { ProjectForm } from "@/components/projects/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Create Project
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Set up a new home automation project with the full workflow template
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}
