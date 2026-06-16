"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { subscribeToMySiteAssignments } from "@/lib/firestore/siteOperations";
import { useAuthContext } from "@/components/providers/AuthProvider";
import type { SiteAssignment, SiteStatus } from "@/types/site";

const STATUS_COLORS: Record<SiteStatus, string> = {
  "Assigned": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Partially Completed": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Completed": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Need Support": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "Need Materials": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Cancelled": "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function MySitesPage() {
  return (
    <RoleGuard allowedRoles={["site_worker"]} redirectTo="/dashboard">
      <MySitesContent />
    </RoleGuard>
  );
}

function MySitesContent() {
  const { user } = useAuthContext();
  const [assignments, setAssignments] = useState<SiteAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMySiteAssignments(user.uid, (data) => {
      setAssignments(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const active = assignments.filter((a) => a.status !== "Completed" && a.status !== "Cancelled");
  const done = assignments.filter((a) => a.status === "Completed" || a.status === "Cancelled");

  const formatDate = (ts: SiteAssignment["createdAt"]) => {
    if (!ts) return "—";
    const d = (ts as unknown as { toDate: () => Date }).toDate();
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const SiteCard = ({ a }: { a: SiteAssignment }) => (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{a.projectName}</p>
          <p className="text-sm text-zinc-500">{a.clientName}</p>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status]}`}>
          {a.status}
        </span>
      </div>
      {a.address && (
        <p className="text-xs text-zinc-400 flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {a.address}
        </p>
      )}
      <p className="text-xs text-zinc-400">Assigned: {formatDate(a.createdAt)}</p>
      <div className="flex gap-2 pt-1">
        <Link
          href={`/my-sites/${a.id}`}
          className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white text-center hover:bg-amber-600 transition-colors"
        >
          Open Site
        </Link>
        {a.status === "Assigned" && (
          <Link
            href={`/my-sites/${a.id}?action=start`}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 text-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Start Visit
          </Link>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">My Sites</h1>
        <p className="text-sm text-zinc-500 mt-1">{active.length} active · {done.length} completed</p>
      </div>

      {assignments.length === 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <div className="text-4xl mb-3">🏗️</div>
          <p className="font-semibold text-zinc-700 dark:text-zinc-300">No sites assigned</p>
          <p className="text-sm text-zinc-400 mt-1">Your assignments will appear here.</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Active ({active.length})</h2>
          {active.map((a) => <SiteCard key={a.id} a={a} />)}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Completed / Cancelled ({done.length})</h2>
          {done.map((a) => <SiteCard key={a.id} a={a} />)}
        </div>
      )}
    </div>
  );
}
