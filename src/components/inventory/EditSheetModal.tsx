"use client";

import { useState } from "react";
import { updateInventorySheet, checkSpreadsheetIdExists } from "@/lib/firestore/inventory";
import { parseGoogleSheetsUrl } from "@/lib/utils/sheets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { InventorySheet } from "@/types";

interface EditSheetModalProps {
  open: boolean;
  onClose: () => void;
  sheet: InventorySheet;
}

export function EditSheetModal({ open, onClose, sheet }: EditSheetModalProps) {
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

      const duplicateExists = await checkSpreadsheetIdExists(parsed.spreadsheetId, sheet.id);
      if (duplicateExists) {
        setError("Another inventory sheet with this Spreadsheet ID has already been added.");
        setLoading(false);
        return;
      }

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
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
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
