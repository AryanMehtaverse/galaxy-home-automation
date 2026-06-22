"use client";

import { useState } from "react";
import { addInventorySheet, checkSpreadsheetIdExists } from "@/lib/firestore/inventory";
import { parseGoogleSheetsUrl } from "@/lib/utils/sheets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { AppUser } from "@/types";

interface AddSheetModalProps {
  open: boolean;
  onClose: () => void;
  user: AppUser;
}

export function AddSheetModal({ open, onClose, user }: AddSheetModalProps) {
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

      const duplicateExists = await checkSpreadsheetIdExists(parsed.spreadsheetId);
      if (duplicateExists) {
        setError("An inventory sheet with this Spreadsheet ID has already been added.");
        setLoading(false);
        return;
      }

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
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
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
