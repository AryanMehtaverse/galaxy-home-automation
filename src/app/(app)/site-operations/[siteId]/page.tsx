"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { subscribeToAllSiteAssignments, updateSiteStatus } from "@/lib/firestore/siteOperations";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { SiteTimeline } from "@/components/site/SiteTimeline";
import { PhotoUpload } from "@/components/site/PhotoUpload";
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

type Tab = "overview" | "photos" | "reports" | "timeline";

function AdminSiteDetailContent() {
  const { siteId } = useParams<{ siteId: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  const [site, setSite] = useState<SiteAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  useEffect(() => {
    return subscribeToAllSiteAssignments((assignments) => {
      setSite(assignments.find((a) => a.id === siteId) ?? null);
      setLoading(false);
    });
  }, [siteId]);

  const handleStatusChange = async (status: SiteStatus) => {
    if (!user || !site) return;
    setUpdatingStatus(true);
    try {
      await updateSiteStatus(siteId, status, user.uid, user.displayName);
      setShowStatusPicker(false);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "photos", label: "Photos" },
    { id: "reports", label: "Reports" },
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
        <p className="text-zinc-500">Site assignment not found.</p>
        <Link href="/site-operations" className="text-sm text-amber-500 underline">Back to Site Operations</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/site-operations" className="text-xs text-amber-500 hover:underline">
            ← Site Operations
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{site.projectName}</h1>
          <p className="text-sm text-zinc-500">{site.clientName}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[site.status]}`}>
            {site.status}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowStatusPicker(!showStatusPicker)}
              disabled={updatingStatus}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Change Status ▾
            </button>
            {showStatusPicker && (
              <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
                {STATUSES.filter((s) => s !== site.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Assigned To", value: site.assignedToName },
          { label: "Assigned By", value: site.assignedByName },
          { label: "Priority", value: site.priority, className: PRIORITY_COLORS[site.priority] },
          { label: "Site Date", value: site.siteDate || "—" },
          { label: "Address", value: site.address || "—", span: true },
        ].map(({ label, value, className, span }) => (
          <div key={label} className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 ${span ? "col-span-2 md:col-span-4" : ""}`}>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
            <p className={`mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 ${className ?? ""}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
        {tab === "overview" && (
          <div className="space-y-4">
            {site.workDescription && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Work Description</h3>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{site.workDescription}</p>
              </div>
            )}
            {site.notes && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{site.notes}</p>
              </div>
            )}
            {!site.workDescription && !site.notes && (
              <p className="text-sm text-zinc-400 text-center py-6">No description or notes.</p>
            )}
          </div>
        )}
        {tab === "photos" && <PhotoUpload siteId={siteId} />}
        {tab === "reports" && <WrittenReport siteId={siteId} />}
        {tab === "timeline" && <SiteTimeline siteId={siteId} />}
      </div>
    </div>
  );
}

export default function AdminSiteDetailPage() {
  return (
    <RoleGuard allowedRoles={["admin", "owner", "project_manager"]} redirectTo="/site-operations">
      <AdminSiteDetailContent />
    </RoleGuard>
  );
}
