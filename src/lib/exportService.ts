import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

// ── Realtime DB fetch ────────────────────────────────────────────────────────

async function fetchRealtimeCollection(path: string): Promise<unknown[]> {
  try {
    const res = await fetch(`${DB_URL}${path}.json`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data) return [];
    return Object.entries(data).map(([id, val]) => ({ ...(val as object), id }));
  } catch {
    return [];
  }
}

// ── Firestore fetch ──────────────────────────────────────────────────────────

async function fetchFirestoreCollection(name: string): Promise<unknown[]> {
  try {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function exportAllData() {
  const [
    leads,
    callLogs,
    quotes,
    products,
    projects,
    siteAssignments,
    siteTimeline,
    siteReports,
    voiceReports,
    inventorySheets,
    users,
  ] = await Promise.all([
    fetchRealtimeCollection("/leads"),
    fetchRealtimeCollection("/callLogs"),
    fetchRealtimeCollection("/quotes"),
    fetchRealtimeCollection("/products"),
    fetchFirestoreCollection("projects"),
    fetchFirestoreCollection("siteAssignments"),
    fetchFirestoreCollection("siteTimeline"),
    fetchFirestoreCollection("siteReports"),
    fetchFirestoreCollection("voiceReports"),
    fetchFirestoreCollection("inventorySheets"),
    fetchFirestoreCollection("authorized_users"),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    summary: {
      leads: leads.length,
      callLogs: callLogs.length,
      quotes: quotes.length,
      products: products.length,
      projects: projects.length,
      siteAssignments: siteAssignments.length,
      siteTimeline: siteTimeline.length,
      siteReports: siteReports.length,
      voiceReports: voiceReports.length,
      inventorySheets: inventorySheets.length,
      users: users.length,
    },
    data: {
      leads,
      callLogs,
      quotes,
      products,
      projects,
      siteAssignments,
      siteTimeline,
      siteReports,
      voiceReports,
      inventorySheets,
      users,
    },
  };
}

// ── Download as JSON ─────────────────────────────────────────────────────────

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Download as CSV (one sheet per collection) via multi-download ────────────

function toCSV(rows: unknown[]): string {
  if (!rows.length) return "";
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r as object))));
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s}"` : s;
  };
  return [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => escape((r as Record<string, unknown>)[k])).join(",")),
  ].join("\n");
}

export function downloadCSV(rows: unknown[], filename: string) {
  const csv = toCSV(rows);
  if (!csv) return;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
