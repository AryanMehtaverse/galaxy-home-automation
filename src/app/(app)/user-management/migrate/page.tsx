"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { migrateLeadToFirestore, migrateCallLogToFirestore } from "@/lib/firestore/leads";
import { migrateQuoteToFirestore, migrateProductToFirestore } from "@/lib/firestore/quotes";
import type { Lead, CallLog } from "@/types/lead";
import type { Quote, Product } from "@/services/storageService";

const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

async function fetchFromRealtimeDB<T>(path: string): Promise<T[]> {
  const res = await fetch(`${DB_URL}${path}.json`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  const data = await res.json();
  if (!data) return [];
  return Object.entries(data).map(([id, val]) => ({ ...(val as object), id })) as T[];
}

type MigrationStatus = "idle" | "running" | "done" | "error";

interface CollectionProgress {
  total: number;
  done: number;
  errors: number;
}

interface Progress {
  leads: CollectionProgress;
  callLogs: CollectionProgress;
  quotes: CollectionProgress;
  products: CollectionProgress;
}

const EMPTY_PROGRESS: Progress = {
  leads:    { total: 0, done: 0, errors: 0 },
  callLogs: { total: 0, done: 0, errors: 0 },
  quotes:   { total: 0, done: 0, errors: 0 },
  products: { total: 0, done: 0, errors: 0 },
};

export default function MigratePage() {
  return (
    <RoleGuard allowedRoles={["admin", "owner"]} redirectTo="/dashboard">
      <MigrateContent />
    </RoleGuard>
  );
}

function MigrateContent() {
  const [status, setStatus] = useState<MigrationStatus>("idle");
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [log, setLog] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const addLog = (msg: string) => setLog((p) => [...p, `${new Date().toLocaleTimeString()} — ${msg}`]);

  const migrateCollection = async <T extends { id: string }>(
    path: string,
    label: string,
    migrateFn: (item: T) => Promise<void>,
    key: keyof Progress
  ) => {
    addLog(`Fetching ${label} from Realtime Database…`);
    const items = await fetchFromRealtimeDB<T>(path);
    addLog(`Found ${items.length} ${label}.`);

    setProgress((p) => ({ ...p, [key]: { total: items.length, done: 0, errors: 0 } }));

    let errors = 0;
    for (let i = 0; i < items.length; i++) {
      try {
        await migrateFn(items[i]);
        setProgress((p) => ({ ...p, [key]: { ...p[key], done: i + 1 } }));
      } catch (e) {
        errors++;
        addLog(`⚠ Error migrating ${label} ${items[i].id}: ${String(e)}`);
        setProgress((p) => ({ ...p, [key]: { ...p[key], errors } }));
      }
    }
    addLog(`✅ ${label} done — ${items.length - errors} migrated, ${errors} errors.`);
  };

  const runMigration = async () => {
    setStatus("running");
    setLog([]);
    setProgress(EMPTY_PROGRESS);

    try {
      await migrateCollection<Lead>("/leads", "leads", migrateLeadToFirestore, "leads");
      await migrateCollection<CallLog>("/callLogs", "call logs", migrateCallLogToFirestore, "callLogs");
      await migrateCollection<Quote>("/quotes", "quotes", migrateQuoteToFirestore, "quotes");
      await migrateCollection<Product>("/products", "products", migrateProductToFirestore, "products");

      addLog("🎉 Full migration complete! All data is now in Firestore.");
      setStatus("done");
    } catch (e) {
      addLog(`❌ Migration failed: ${String(e)}`);
      setStatus("error");
    }
  };

  const pct = (done: number, total: number) =>
    total === 0 ? 0 : Math.round((done / total) * 100);

  const collections: { key: keyof Progress; label: string }[] = [
    { key: "leads",    label: "Leads" },
    { key: "callLogs", label: "Call Logs" },
    { key: "quotes",   label: "Quotes" },
    { key: "products", label: "Products" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Database Migration</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Migrate all Realtime Database data → Firestore
        </p>
      </div>

      {/* Warning */}
      <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">⚠ Before you run this:</p>
        <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
          <li>Download a JSON backup from User Management first</li>
          <li>This copies data — it does NOT delete anything from Realtime DB</li>
          <li>Original IDs are preserved — no data will change</li>
          <li>Safe to run multiple times — it overwrites with the same data</li>
        </ul>
      </div>

      {/* What gets migrated */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">What gets migrated</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          {["Leads", "Call Logs", "Quotes", "Products"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="text-amber-500">→</span> {item}
            </div>
          ))}
        </div>
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
            Start Full Migration
          </button>
        </div>
      )}

      {/* Progress bars */}
      {status !== "idle" && (
        <div className="space-y-4">
          {collections.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
                <span className="text-zinc-500">
                  {progress[key].done} / {progress[key].total}
                  {progress[key].errors > 0 && (
                    <span className="text-red-400 ml-2">({progress[key].errors} errors)</span>
                  )}
                </span>
              </div>
              <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${pct(progress[key].done, progress[key].total)}%` }}
                />
              </div>
            </div>
          ))}

          {status === "done" && (
            <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-800 p-4">
              <p className="text-sm font-bold text-green-700 dark:text-green-400">✅ Migration Complete</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                All data is now in Firestore. Verify everything looks correct before we remove the Realtime DB.
              </p>
            </div>
          )}
          {status === "error" && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-800 p-4">
              <p className="text-sm font-bold text-red-700 dark:text-red-400">❌ Migration Failed</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-1">Your Realtime DB data is untouched. Check the log below.</p>
            </div>
          )}
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 max-h-64 overflow-y-auto space-y-1">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Migration Log</p>
          {log.map((line, i) => (
            <p key={i} className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
