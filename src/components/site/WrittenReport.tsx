"use client";

import { useEffect, useState } from "react";
import { submitSiteReport, subscribeToSiteReports } from "@/lib/firestore/siteOperations";
import { useAuthContext } from "@/components/providers/AuthProvider";
import type { SiteReport } from "@/types/site";

interface Props {
  siteId: string;
}

const EMPTY_FORM = {
  workCompleted: "",
  pendingWork: "",
  issues: "",
  clientRequests: "",
  notes: "",
};

export function WrittenReport({ siteId }: Props) {
  const { user } = useAuthContext();
  const [reports, setReports] = useState<SiteReport[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    return subscribeToSiteReports(siteId, setReports);
  }, [siteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitSiteReport(siteId, {
        workerId: user.uid,
        workerName: user.displayName,
        ...form,
      });
      setForm(EMPTY_FORM);
      setSuccess(true);
      setShowForm(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (ts: SiteReport["createdAt"]) => {
    if (!ts) return "—";
    const d = (ts as unknown as { toDate: () => Date }).toDate();
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-4">
      {success && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          Report submitted successfully!
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg border border-dashed border-amber-400 dark:border-amber-600 py-3 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
        >
          + Submit New Report
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {(["workCompleted", "pendingWork", "issues", "clientRequests", "notes"] as const).map((field) => {
            const labels: Record<string, string> = {
              workCompleted: "Work Completed",
              pendingWork: "Pending Work",
              issues: "Issues Encountered",
              clientRequests: "Client Requests",
              notes: "Additional Notes",
            };
            return (
              <div key={field}>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  {labels[field]}
                </label>
                <textarea
                  rows={2}
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
            );
          })}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reports.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Previous Reports</h4>
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">{r.workerName}</span>
                <span className="text-xs text-zinc-400">{formatDate(r.createdAt)}</span>
              </div>
              {r.workCompleted && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase">Work Completed</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{r.workCompleted}</p>
                </div>
              )}
              {r.issues && (
                <div>
                  <p className="text-xs font-semibold text-red-400 uppercase">Issues</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{r.issues}</p>
                </div>
              )}
              {r.pendingWork && (
                <div>
                  <p className="text-xs font-semibold text-amber-500 uppercase">Pending Work</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{r.pendingWork}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
