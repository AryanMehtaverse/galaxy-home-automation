"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createProject } from "@/lib/firestore/projects";
import { PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectStatus } from "@/types";

export function ProjectForm() {
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planning");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const id = await createProject(
        {
          name,
          clientName,
          ...(deadline ? { deadline } : {}),
          status,
        },
        user.uid
      );
      router.push(`/projects/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Input
        label="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Villa Lighting & Automation"
        required
      />
      <Input
        label="Client Name"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
        placeholder="e.g. John Smith"
        required
      />
      <Input
        label="Deadline (optional)"
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
      />
      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as ProjectStatus)}
        options={PROJECT_STATUSES}
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create Project"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>

      <p className="text-xs text-zinc-500">
        New projects include the full home automation workflow template. You can
        set a deadline later from the project page.
      </p>
    </form>
  );
}
