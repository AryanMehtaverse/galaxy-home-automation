"use client";

import { useState } from "react";
import { deleteInventorySheet } from "@/lib/firestore/inventory";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { InventorySheet } from "@/types";

interface DeleteSheetModalProps {
  open: boolean;
  onClose: () => void;
  sheet: InventorySheet;
}

export function DeleteSheetModal({ open, onClose, sheet }: DeleteSheetModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await deleteInventorySheet(sheet.id);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to delete sheet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete Inventory Sheet?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete Sheet"}
          </Button>
        </>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-zinc-100">{sheet.name}</span>?
        This action will permanently remove the link and embedding from the Project Manager Tool, but will not delete your spreadsheet inside Google Drive.
      </p>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </Modal>
  );
}
