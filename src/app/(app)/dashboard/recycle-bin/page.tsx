"use client";

import { useState } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useDeletedProjects } from "@/hooks/useDeletedProjects";
import { restoreFromRecycleBin, permanentlyDeleteProject } from "@/lib/firestore/projects";
import { canAccessRecycleBin } from "@/lib/auth/permissions";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/dates";
import { Modal } from "@/components/ui/Modal";

export default function RecycleBinPage() {
  const { user, loading: authLoading } = useAuthContext();
  const { projects: deletedProjects, loading: projectsLoading } = useDeletedProjects();
  
  // State for permanent delete confirmation modal
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRestore = async (id: string) => {
    setActionLoading(true);
    try {
      await restoreFromRecycleBin(id);
    } catch (err) {
      console.error(err);
      alert("Failed to restore project");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedProject) return;
    setActionLoading(true);
    setError("");
    try {
      await permanentlyDeleteProject(selectedProject.id);
      setSelectedProject(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project permanently");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || projectsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  // Security check: Only Admin and Owner can view the Recycle Bin
  if (!user || !canAccessRecycleBin(user)) {
    return (
      <div className="mx-auto max-w-xl text-center py-20 space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Access Denied</h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          You do not have permissions to view the Recycle Bin. This section is restricted to Administrator and Owner roles only.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Recycle Bin
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          View and restore deleted projects. Deleted projects remain here unless permanently removed.
        </p>
      </div>

      {deletedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <svg className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recycle Bin is empty</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-xs">
            No projects have been deleted or moved here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-zinc-500 dark:text-zinc-400">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th scope="col" className="px-6 py-4">Project Name</th>
                  <th scope="col" className="px-6 py-4">Deleted Date</th>
                  <th scope="col" className="px-6 py-4">Deleted By</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {deletedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">{project.name}</td>
                    <td className="px-6 py-4">{project.deletedAt ? formatDate(project.deletedAt) : "—"}</td>
                    <td className="px-6 py-4 font-medium text-zinc-700 dark:text-zinc-300">{project.deletedBy || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleRestore(project.id)}
                        >
                          Restore
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => setSelectedProject({ id: project.id, name: project.name })}
                        >
                          Delete Permanently
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {selectedProject && (
        <Modal
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title="Delete project permanently?"
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelectedProject(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handlePermanentDelete} disabled={actionLoading}>
                {actionLoading ? "Deleting..." : "Permanently Delete"}
              </Button>
            </>
          }
        >
          <p className="text-zinc-600 dark:text-zinc-400">
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedProject.name}
            </span>
            ? This action <span className="font-bold text-red-600 dark:text-red-400">cannot</span> be undone and will permanently destroy all associated stages, checklist items, contacts, and photos.
          </p>
          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </Modal>
      )}
    </div>
  );
}
