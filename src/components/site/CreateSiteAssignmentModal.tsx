"use client";

import { useState } from "react";
import { createSiteAssignment } from "@/lib/firestore/siteOperations";
import { useAuthContext } from "@/components/providers/AuthProvider";
import type { SitePriority } from "@/types/site";
import { PRIORITIES, EMPTY_FORM } from "./siteOperationsConstants";

export function CreateSiteAssignmentModal({ onClose, managers, onCreated }: {
  onClose: () => void;
  managers: { uid: string; name: string }[];
  onCreated: () => void;
}) {
  const { user } = useAuthContext();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManagerChange = (uid: string) => {
    const mgr = managers.find((m) => m.uid === uid);
    setForm((f) => ({ ...f, siteManagerId: uid, siteManagerName: mgr?.name ?? "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.projectName || !form.clientName || !form.siteManagerId) {
      setError("Project name, client name and site manager are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createSiteAssignment({
        ...form,
        assignedTo: "",
        assignedToName: "",
        assignedBy: user.uid,
        assignedByName: user.displayName,
        status: "Assigned",
      });
      onCreated();
      onClose();
    } catch {
      setError("Failed to create assignment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-5 my-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">New Site Assignment</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { field: "projectName", label: "Project Name", type: "text", required: true },
            { field: "clientName", label: "Client Name", type: "text", required: true },
            { field: "address", label: "Address", type: "text", required: false },
            { field: "siteDate", label: "Site Date", type: "date", required: false },
          ].map(({ field, label, type, required }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{label}</label>
              <input
                type={type}
                required={required}
                value={(form as Record<string, string>)[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as SitePriority }))}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Site Manager</label>
              <select
                value={form.siteManagerId}
                onChange={(e) => handleManagerChange(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select manager…</option>
                {managers.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Work Description</label>
            <textarea
              rows={3}
              value={form.workDescription}
              onChange={(e) => setForm((f) => ({ ...f, workDescription: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors">
              {saving ? "Creating…" : "Create Assignment"}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
