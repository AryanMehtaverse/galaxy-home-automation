"use client";

import { useState } from "react";
import type { Project } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { updateProject } from "@/lib/firestore/projects";
import { generateUniqueAccessCode } from "@/lib/utils/accessCode";

interface ClientAccessCardProps {
  project: Project;
}

export function ClientAccessCard({ project }: ClientAccessCardProps) {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [error, setError] = useState("");

  const canManage = user?.role === "admin" || user?.role === "owner";

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const code = await generateUniqueAccessCode();
      await updateProject(project.id, { clientAccessCode: code });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate code");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!window.confirm("Are you sure you want to regenerate the access code? Any client logged in with the old code will be disconnected immediately.")) {
      return;
    }
    await handleGenerate();
  };

  const handleCopyCode = async () => {
    if (!project.clientAccessCode) return;
    try {
      await navigator.clipboard.writeText(project.clientAccessCode);
      setCopyCodeSuccess(true);
      setTimeout(() => setCopyCodeSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleCopyLink = async () => {
    if (!project.clientAccessCode) return;
    const clientLink = `${window.location.origin}/client?code=${project.clientAccessCode}`;
    try {
      await navigator.clipboard.writeText(clientLink);
      setCopyLinkSuccess(true);
      setTimeout(() => setCopyLinkSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>🔑</span> Client Access
        </h3>
        {canManage && project.clientAccessCode && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRegenerate}
            disabled={loading}
          >
            {loading ? "Regenerating..." : "Regenerate Code"}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {project.clientAccessCode ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <p className="text-xs text-zinc-500">Access Code</p>
              <p className="text-lg font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {project.clientAccessCode}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopyCode}>
                {copyCodeSuccess ? "Copied!" : "Copy Code"}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleCopyLink}>
                {copyLinkSuccess ? "Link Copied!" : "Copy Client Link"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Client Access Code: Not Generated
            </p>
            {canManage ? (
              <Button onClick={handleGenerate} disabled={loading} size="sm">
                {loading ? "Generating..." : "Generate Access Code"}
              </Button>
            ) : (
              <p className="text-xs text-zinc-500">
                Only Admins or Owners can generate access codes.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </Card>
  );
}
