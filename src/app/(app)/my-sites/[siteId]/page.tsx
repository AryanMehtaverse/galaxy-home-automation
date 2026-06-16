"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  subscribeToAllSiteAssignments,
  subscribeToMySiteAssignments,
  updateSiteStatus,
} from "@/lib/firestore/siteOperations";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { SiteTimeline } from "@/components/site/SiteTimeline";
import { PhotoUpload } from "@/components/site/PhotoUpload";
import { VoiceRecorder } from "@/components/site/VoiceRecorder";
import { WrittenReport } from "@/components/site/WrittenReport";
import type { SiteAssignment, SiteStatus } from "@/types/site";

const STATUSES: SiteStatus[] = ["Assigned", "In Progress", "Partially Completed", "Completed", "Need Support", "Need Materials", "Cancelled"];

const STATUS_COLORS: Record<SiteStatus, string> = {
  "Assigned": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Partially Completed": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Completed": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Need Support": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "Need Materials": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Cancelled": "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "text-zinc-500",
  Medium: "text-amber-500",
  High: "text-orange-500",
  Urgent: "text-red-500 font-bold",
};

type Tab = "instructions" | "photos" | "reports" | "voice" | "timeline";

function SiteDetailContent() {
  const { siteId } = useParams<{ siteId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const [site, setSite] = useState<SiteAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("instructions");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const isSiteWorker = user?.role === "site_worker";
  const isManager = user?.role === "admin" || user?.role === "project_manager" || user?.role === "owner";

  useEffect(() => {
    // site_workers see only their own; managers see all
    if (!user) return;
    if (isSiteWorker) {
      const unsub = subscribeToMySiteAssignments(user.uid, (assignments) => {
        const found = assignments.find((a) => a.id === siteId) ?? null;
        setSite(found);
        setLoading(false);
      });
      return unsub;
    }
    const unsub = subscribeToAllSiteAssignments((assignments) => {
      const found = assignments.find((a) => a.id === siteId) ?? null;
      setSite(found);
      setLoading(false);
    });
    return unsub;
  }, [user, siteId, isSiteWorker]);

  // Auto-start visit if ?action=start
  useEffect(() => {
    if (searchParams.get("action") === "start" && site && site.status === "Assigned" && user) {
      handleStatusChange("In Progress");
      router.replace(`/my-sites/${siteId}`);
    }
  }, [site, searchParams]);

  const handleStatusChange = async (newStatus: SiteStatus) => {
    if (!user || !site) return;
    setUpdatingStatus(true);
    try {
      await updateSiteStatus(siteId, newStatus, user.uid, user.displayName);
      setShowStatusPicker(false);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (ts: SiteAssignment["siteDate"] | null | undefined) => {
    if (!ts) return "—";
    if (typeof ts === "string") return ts;
    return "—";
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "instructions", label: "Instructions" },
    { id: "photos", label: "Photos" },
    { id: "voice", label: "Voice" },
    { id: "timeline", label: "Timeline" },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-zinc-500">Site not found or access denied.</p>
        <Link href="/my-sites" className="text-sm text-amber-500 underline">Back to My Sites</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={isSiteWorker ? "/my-sites" : "/site-operations"} className="text-xs text-amber-500 hover:underline">
            ← {isSiteWorker ? "My Sites" : "Site Operations"}
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{site.projectName}</h1>
          <p className="text-sm text-zinc-500">{site.clientName}</p>
        </div>
        <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[site.status]}`}>
          {site.status}
        </span>
      </div>

      {/* Info grid */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {[
          { label: "Address", value: site.address || "—" },
          { label: "Site Date", value: site.siteDate || "—" },
          { label: "Priority", value: site.priority, className: PRIORITY_COLORS[site.priority] },
          { label: "Assigned By", value: site.assignedByName || "—" },
        ].map(({ label, value, className }) => (
          <div key={label}>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
            <p className={`mt-0.5 text-zinc-900 dark:text-zinc-100 ${className ?? ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Status update buttons (site worker) */}
      {isSiteWorker && (
        <div className="space-y-2">
          {site.status === "Assigned" && (
            <button
              onClick={() => handleStatusChange("In Progress")}
              disabled={updatingStatus}
              className="w-full rounded-xl bg-amber-500 py-3.5 text-base font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              🚀 Start Visit
            </button>
          )}
          {site.status !== "Completed" && site.status !== "Cancelled" && (
            <div className="relative">
              <button
                onClick={() => setShowStatusPicker(!showStatusPicker)}
                disabled={updatingStatus}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Update Status ▾
              </button>
              {showStatusPicker && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
                  {STATUSES.filter((s) => s !== site.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 -mx-4 px-4 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "instructions" && (
          <div className="space-y-4">
            {site.workDescription && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Work Description</h3>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{site.workDescription}</p>
              </div>
            )}
            {site.notes && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{site.notes}</p>
              </div>
            )}
            {!site.workDescription && !site.notes && (
              <p className="text-sm text-zinc-400 text-center py-6">No instructions provided.</p>
            )}
          </div>
        )}
        {tab === "photos" && <PhotoUpload siteId={siteId} />}
        {tab === "voice" && <VoiceRecorder siteId={siteId} />}
        {tab === "timeline" && <SiteTimeline siteId={siteId} />}
      </div>

      {/* Quick action bar for site workers */}
      {isSiteWorker && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 flex gap-2 lg:relative lg:bg-transparent lg:border-0 lg:px-0 lg:py-0">
          {(["photos", "voice"] as const).map((t) => {
            const labels = { photos: "📷 Photo", voice: "🎙️ Voice" };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  tab === t
                    ? "bg-amber-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SiteDetailPage() {
  return (
    <RoleGuard allowedRoles={["site_worker", "admin", "project_manager", "owner"]} redirectTo="/dashboard">
      <SiteDetailContent />
    </RoleGuard>
  );
}
