"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  subscribeToMySiteAssignments,
  subscribeToSiteManagerAssignments,
} from "@/lib/firestore/siteOperations";
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

function SiteCard({ site, isSiteManager }: { site: SiteAssignment; isSiteManager: boolean }) {
  const needsAttention = site.status === "Need Support" || site.status === "Need Materials";
  return (
    <Link
      href={`/my-sites/${site.id}`}
      className={`block rounded-2xl border p-4 space-y-3 transition-all hover:shadow-md active:opacity-80 ${
        needsAttention
          ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            {needsAttention && <span className="text-red-500 text-sm">⚠️</span>}
            {site.projectName}
          </p>
          <p className="text-sm text-zinc-500 mt-0.5">{site.clientName}</p>
          {site.address && <p className="text-xs text-zinc-400 mt-0.5">📍 {site.address}</p>}
        </div>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[site.status]}`}>
          {site.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
        {isSiteManager ? (
          <span>👷 {site.assignedToName || <span className="italic">No field team assigned</span>}</span>
        ) : (
          <span>🏗️ Managed by {site.siteManagerName || "—"}</span>
        )}
        <span className={`font-semibold ${site.priority === "Urgent" ? "text-red-500" : site.priority === "High" ? "text-orange-500" : ""}`}>
          {site.priority}
        </span>
      </div>
    </Link>
  );
}

function MySitesContent() {
  const { user } = useAuthContext();
  const [sites, setSites] = useState<SiteAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const isSiteManager = user?.role === "site_manager";

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const sub = isSiteManager
      ? subscribeToSiteManagerAssignments(
          user.uid,
          (data) => { setSites(data); setLoading(false); },
          () => setLoading(false)
        )
      : subscribeToMySiteAssignments(
          user.uid,
          (data) => { setSites(data); setLoading(false); },
          () => setLoading(false)
        );

    return sub;
  }, [user, isSiteManager]);

  const active = sites.filter((s) => s.status !== "Completed" && s.status !== "Cancelled");
  const completed = sites.filter((s) => s.status === "Completed" || s.status === "Cancelled");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {isSiteManager ? "Sites Under My Management" : "My Sites"}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {isSiteManager ? "Sites assigned to you by the owner" : "Sites assigned to you by your site manager"}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">🏗️</p>
          <p className="text-sm text-zinc-500">No sites assigned yet.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Active · {active.length}</p>
              {active.map((s) => <SiteCard key={s.id} site={s} isSiteManager={isSiteManager} />)}
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Completed · {completed.length}</p>
              {completed.map((s) => <SiteCard key={s.id} site={s} isSiteManager={isSiteManager} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MySitesPage() {
  return (
    <RoleGuard allowedRoles={["site_manager", "field_team", "site_worker"]} redirectTo="/home">
      <MySitesContent />
    </RoleGuard>
  );
}
