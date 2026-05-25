"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { deleteProject } from "@/lib/firestore/projects";

interface DeleteProjectModalProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onClose: () => void;
}

export function DeleteProjectModal({
  projectId,
  projectName,
  open,
  onClose,
}: DeleteProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await deleteProject(projectId);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete project?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </>
      }
    >
      <p>
        Are you sure you want to delete{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {projectName}
        </span>
        ? This action cannot be undone and will remove all workflow data.
      </p>
      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </Modal>
  );
}
