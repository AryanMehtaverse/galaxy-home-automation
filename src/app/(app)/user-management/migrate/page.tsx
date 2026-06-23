"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { migrateLeadToFirestore, migrateCallLogToFirestore } from "@/lib/firestore/leads";
import type { Lead, CallLog } from "@/types/lead";

const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

async function fetchFromRealtimeDB<T>(path: string): Promise<T[]> {
  const res = await fetch(`${DB_URL}${path}.json`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  const data = await res.json();
  if (!data) return [];
  return Object.entries(data).map(([id, val]) => ({ ...(val as object), id })) as T[];
}

type MigrationStatus = "idle" | "running" | "done" | "error";

interface Progress {
  leads: { total: number; done: number; errors: number };
  callLogs: { total: number; done: number; errors: number };
}

export default function MigratePage() {
  return (
    <RoleGuard allowedRoles={["admin", "owner"]} redirectTo="/dashboard">
      <MigrateContent />
    </RoleGuard>
  );
}

function MigrateContent() {
  const [status, setStatus] = useState<MigrationStatus>("idle");
  const [progress, setProgress] = useState<Progress>({
    leads: { total: 0, done: 0, errors: 0 },
    callLogs: { total: 0, done: 0, errors: 0 },
  });
  const [log, setLog] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const addLog = (msg: string) => setLog((p) => [...p, `${new Date().toLocaleTimeString()} — ${msg}`]);

  const runMigration = async () => {
    setStatus("running");
    setLog([]);

    try {
      // ── Fetch from Realtime DB ──
      addLog("Fetching leads from Realtime Database…");
      const leads = await fetchFromRealtimeDB<Lead>("/leads");
      addLog(`Found ${leads.length} leads.`);

      addLog("Fetching call logs from Realtime Database…");
      const callLogs = await fetchFromRealtimeDB<CallLog>("/callLogs");
      addLog(`Found ${callLogs.length} call logs.`);

      setProgress({
        leads: { total: leads.length, done: 0, errors: 0 },
        callLogs: { total: callLogs.length, done: 0, errors: 0 },
      });

      // ── Migrate leads ──
      addLog("Migrating leads to Firestore (preserving IDs)…");
      let leadErrors = 0;
      for (let i = 0; i < leads.length; i++) {
        try {
          await migrateLeadToFirestore(leads[i]);
          setProgress((p) => ({ ...p, leads: { ...p.leads, done: i + 1 } }));
        } catch (e) {
          leadErrors++;
          addLog(`⚠ Error migrating lead ${leads[i].id}: ${String(e)}`);
          setProgress((p) => ({ ...p, leads: { ...p.leads, errors: leadErrors } }));
        }
      }
      addLog(`✅ Leads done — ${leads.length - leadErrors} migrated, ${leadErrors} errors.`);

      // ── Migrate call logs ──
      addLog("Migrating call logs to Firestore…");
      let logErrors = 0;
      for (let i = 0; i < callLogs.length; i++) {
        try {
          await migrateCallLogToFirestore(callLogs[i]);
          setProgress((p) => ({ ...p, callLogs: { ...p.callLogs, done: i + 1 } }));
        } catch (e) {
          logErrors++;
          addLog(`⚠ Error migrating call log ${callLogs[i].id}: ${String(e)}`);
          setProgress((p) => ({ ...p, callLogs: { ...p.callLogs, errors: logErrors } }));
        }
      }
      addLog(`✅ Call logs done — ${callLogs.length - logErrors} migrated, ${logErrors} errors.`);

      addLog("🎉 Migration complete! Verify data in Firestore before switching the app.");
      setStatus("done");
    } catch (e) {
      addLog(`❌ Migration failed: ${String(e)}`);
      setStatus("error");
    }
  };

  const pct = (done: number, total: number) =>
    total === 0 ? 100 : Math.round((done / total) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Database Migration</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Migrate Leads and Call Logs from Realtime Database → Firestore
        </p>
      </div>

      {/* Warning */}
      <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">⚠ Before you run this:</p>
        <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
          <li>Make sure you have downloaded a JSON backup from User Management</li>
          <li>This copies data — it does NOT delete anything from Realtime DB</li>
          <li>Original IDs are preserved — no data will change</li>
          <li>You can safely run this multiple times — it overwrites with the same data</li>
        </ul>
      </div>

      {/* Confirmation */}
      {status === "idle" && (
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-amber-500"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              I have downloaded a JSON backup and understand this operation
            </span>
          </label>
          <button
            onClick={runMigration}
            disabled={!confirmed}
            className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Start Migration
          </button>
        </div>
      )}

      {/* Progress */}
      {(status === "running" || status === "done" || status === "error") && (
        <div className="space-y-4">
          {/* Leads progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Leads</span>
              <span className="text-zinc-500">{progress.leads.done} / {progress.leads.total}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                style={{ width: `${pct(progress.leads.done, progress.leads.total)}%` }}
              />
            </div>
          </div>

          {/* Call logs progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Call Logs</span>
              <span className="text-zinc-500">{progress.callLogs.done} / {progress.callLogs.total}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                style={{ width: `${pct(progress.callLogs.done, progress.callLogs.total)}%` }}
              />
            </div>
          </div>

          {/* Status */}
          {status === "done" && (
            <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-800 p-4">
              <p className="text-sm font-bold text-green-700 dark:text-green-400">✅ Migration Complete</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                Verify your data looks correct in the Leads page, then inform the dev to switch the app to Firestore.
              </p>
            </div>
          )}
          {status === "error" && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-800 p-4">
              <p className="text-sm font-bold text-red-700 dark:text-red-400">❌ Migration Failed</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-1">Check the log below. Your Realtime DB data is untouched.</p>
            </div>
          )}
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 space-y-1 max-h-64 overflow-y-auto">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Migration Log</p>
          {log.map((line, i) => (
            <p key={i} className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
