"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useInventorySheets } from "@/hooks/useInventorySheets";
import {
  addInventorySheet,
  updateInventorySheet,
  deleteInventorySheet,
  checkSpreadsheetIdExists,
} from "@/lib/firestore/inventory";
import {
  canAddInventorySheet,
  canEditInventorySheet,
  canDeleteInventorySheet,
  canOpenInventorySheet,
} from "@/lib/auth/permissions";
import { parseGoogleSheetsUrl } from "@/lib/utils/sheets";
import { formatDate } from "@/lib/utils/dates";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import type { InventorySheet, AppUser } from "@/types";

export default function InventoryPage() {
  const { user } = useAuthContext();
  const { sheets, loading } = useInventorySheets();

  // Dialog & Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<InventorySheet | null>(null);
  const [deletingSheet, setDeletingSheet] = useState<InventorySheet | null>(null);

  // Permission Checks
  const allowedToAdd = canAddInventorySheet(user);
  const allowedToEdit = canEditInventorySheet(user);
  const allowedToDelete = canDeleteInventorySheet(user);
  const allowedToOpen = canOpenInventorySheet(user);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-150 pb-4 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Inventory
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage and embed site inventory spreadsheets.
          </p>
        </div>
        {allowedToAdd && (
          <Button
            variant="primary"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 font-medium"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Sheet
          </Button>
        )}
      </div>

      {/* Sheets Content */}
      {sheets.length === 0 ? (
        <EmptyState
          title="No inventory sheets found"
          description="Get started by linking an existing Google Sheets inventory tracking URL."
          action={
            allowedToAdd ? (
              <Button variant="primary" onClick={() => setIsAddOpen(true)}>
                Add Sheet
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sheets.map((sheet) => (
            <Card key={sheet.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                {/* Header Icon + Info */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-zinc-900 dark:text-zinc-100" title={sheet.name}>
                      {sheet.name}
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Spreadsheet ID: <span className="font-mono text-zinc-500">{sheet.spreadsheetId.slice(0, 8)}...</span>
                    </p>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="space-y-1.5 border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Created: {formatDate(sheet.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="truncate">Added By: {sheet.createdBy.displayName || sheet.createdBy.email}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                {allowedToOpen ? (
                  <Link href={`/dashboard/inventory/${sheet.id}`}>
                    <Button variant="primary" size="sm">
                      Open Sheet
                    </Button>
                  </Link>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  {allowedToEdit && (
                    <button
                      onClick={() => setEditingSheet(sheet)}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-150 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                      title="Edit Sheet"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  )}
                  {allowedToDelete && (
                    <button
                      onClick={() => setDeletingSheet(sheet)}
                      className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-300"
                      title="Delete Sheet"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Sheet Modal */}
      {isAddOpen && user && (
        <AddSheetModal
          open={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          user={user}
        />
      )}

      {/* Edit Sheet Modal */}
      {editingSheet && (
        <EditSheetModal
          open={!!editingSheet}
          onClose={() => setEditingSheet(null)}
          sheet={editingSheet}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingSheet && (
        <DeleteSheetModal
          open={!!deletingSheet}
          onClose={() => setDeletingSheet(null)}
          sheet={deletingSheet}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// MODAL COMPONENTS
// ----------------------------------------------------------------------------

interface AddSheetModalProps {
  open: boolean;
  onClose: () => void;
  user: AppUser;
}

function AddSheetModal({ open, onClose, user }: AddSheetModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const parsed = parseGoogleSheetsUrl(url);
      if (!parsed) {
        setError("Invalid Google Sheets URL. Please enter a valid URL in the format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/...");
        setLoading(false);
        return;
      }

      // Check if duplicate spreadsheet ID exists
      const duplicateExists = await checkSpreadsheetIdExists(parsed.spreadsheetId);
      if (duplicateExists) {
        setError("An inventory sheet with this Spreadsheet ID has already been added.");
        setLoading(false);
        return;
      }

      // Add to Firestore
      await addInventorySheet(
        {
          name: name.trim(),
          originalUrl: url.trim(),
          spreadsheetId: parsed.spreadsheetId,
          embedUrl: parsed.embedUrl,
        },
        user
      );

      onClose();
    } catch (err) {
      console.error(err);
      setError("An error occurred while adding the inventory sheet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Inventory Sheet"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding..." : "Add Sheet"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Sheet Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Electrical Inventory"
          required
          disabled={loading}
        />

        <Input
          label="Google Sheet URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="e.g. https://docs.google.com/spreadsheets/d/..."
          required
          disabled={loading}
        />

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </form>
    </Modal>
  );
}

interface EditSheetModalProps {
  open: boolean;
  onClose: () => void;
  sheet: InventorySheet;
}

function EditSheetModal({ open, onClose, sheet }: EditSheetModalProps) {
  const [name, setName] = useState(sheet.name);
  const [url, setUrl] = useState(sheet.originalUrl);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const parsed = parseGoogleSheetsUrl(url);
      if (!parsed) {
        setError("Invalid Google Sheets URL. Please enter a valid URL in the format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/...");
        setLoading(false);
        return;
      }

      // Check if duplicate spreadsheet ID exists on another sheet
      const duplicateExists = await checkSpreadsheetIdExists(parsed.spreadsheetId, sheet.id);
      if (duplicateExists) {
        setError("Another inventory sheet with this Spreadsheet ID has already been added.");
        setLoading(false);
        return;
      }

      // Update in Firestore
      await updateInventorySheet(sheet.id, {
        name: name.trim(),
        originalUrl: url.trim(),
        spreadsheetId: parsed.spreadsheetId,
        embedUrl: parsed.embedUrl,
      });

      onClose();
    } catch (err) {
      console.error(err);
      setError("An error occurred while updating the inventory sheet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Inventory Sheet"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Sheet Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Electrical Inventory"
          required
          disabled={loading}
        />

        <Input
          label="Google Sheet URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="e.g. https://docs.google.com/spreadsheets/d/..."
          required
          disabled={loading}
        />

        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </form>
    </Modal>
  );
}

interface DeleteSheetModalProps {
  open: boolean;
  onClose: () => void;
  sheet: InventorySheet;
}

function DeleteSheetModal({ open, onClose, sheet }: DeleteSheetModalProps) {
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
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
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
