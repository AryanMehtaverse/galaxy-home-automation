"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { subscribeToAllSiteAssignments, deleteSiteAssignment, getSiteManagers } from "@/lib/firestore/siteOperations";
import { CreateSiteAssignmentModal } from "@/components/site/CreateSiteAssignmentModal";
import { EditSiteAssignmentModal } from "@/components/site/EditSiteAssignmentModal";
import { STATUS_COLORS, PRIORITY_COLORS, STATUSES } from "@/components/site/siteOperationsConstants";
import type { SiteAssignment, SiteStatus } from "@/types/site";

export default function SiteOperationsPage() {
  return (
    <RoleGuard allowedRoles={["admin", "owner"]} redirectTo="/dashboard">
      <SiteOperationsContent />
    </RoleGuard>
  );
}

function SiteOperationsContent() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<SiteAssignment[]>([]);
  const [managers, setManagers] = useState<{ uid: string; name: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<SiteAssignment | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SiteStatus | "all">("all");
  const [filterWorker, setFilterWorker] = useState("all");

  useEffect(() => {
    const unsub = subscribeToAllSiteAssignments(setAssignments);
    getSiteManagers().then(setManagers);
    return unsub;
  }, []);

  const stats = {
    total: assignments.length,
    assigned: assignments.filter((a) => a.status === "Assigned").length,
    inProgress: assignments.filter((a) => a.status === "In Progress").length,
    completed: assignments.filter((a) => a.status === "Completed").length,
    needSupport: assignments.filter((a) => a.status === "Need Support" || a.status === "Need Materials").length,
  };

  const filtered = assignments.filter((a) => {
    const matchSearch = !search || a.projectName.toLowerCase().includes(search.toLowerCase()) || a.clientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    const matchWorker = filterWorker === "all" || a.siteManagerId === filterWorker;
    return matchSearch && matchStatus && matchWorker;
  });

  const formatDate = (ts: SiteAssignment["updatedAt"]) => {
    if (!ts) return "—";
    const d = (ts as unknown as { toDate: () => Date }).toDate();
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the site assignment for "${name}"?`)) {
      try {
        await deleteSiteAssignment(id);
      } catch (error) {
        alert("Failed to delete assignment.");
        console.error(error);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {showCreate && (
        <CreateSiteAssignmentModal
          onClose={() => setShowCreate(false)}
          managers={managers}
          onCreated={() => {}}
        />
      )}
      {editingAssignment && (
        <EditSiteAssignmentModal
          assignment={editingAssignment}
          onClose={() => setEditingAssignment(null)}
          managers={managers}
        />
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Site Operations</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage and track all site assignments</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors flex-shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Assignment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-zinc-900 dark:text-zinc-100", statusKey: "all" as const },
          { label: "Assigned", value: stats.assigned, color: "text-blue-600 dark:text-blue-400", statusKey: "Assigned" as const },
          { label: "In Progress", value: stats.inProgress, color: "text-amber-600 dark:text-amber-400", statusKey: "In Progress" as const },
          { label: "Completed", value: stats.completed, color: "text-green-600 dark:text-green-400", statusKey: "Completed" as const },
          { label: "Need Support", value: stats.needSupport, color: "text-red-600 dark:text-red-400", statusKey: "Need Support" as const },
        ].map((s) => {
          const isActive = filterStatus === s.statusKey;
          return (
            <button
              key={s.label}
              onClick={() => {
                if (s.statusKey === "all") { setFilterStatus("all"); return; }
                setFilterStatus(isActive ? "all" : s.statusKey as SiteStatus);
              }}
              className={`rounded-xl border p-4 text-center transition-all duration-150 cursor-pointer hover:opacity-90 active:scale-95 ${
                isActive
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-500/40"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              }`}
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Search project or client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as SiteStatus | "all")}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterWorker}
          onChange={(e) => setFilterWorker(e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">All Site Managers</option>
          {managers.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
        </select>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
              {["Project", "Client", "Site Manager", "Field Team", "Priority", "Status", "Last Update", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((a) => {
              const needsAttention = a.status === "Need Support" || a.status === "Need Materials";
              return (
                <tr
                  key={a.id}
                  onClick={() => router.push(`/site-operations/${a.id}`)}
                  className={`transition-colors cursor-pointer ${needsAttention ? "bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/30"}`}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-2">
                      {needsAttention && <span className="text-red-500 text-xs animate-pulse">⚠</span>}
                      {a.projectName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{a.clientName}</td>
                  <td className="px-4 py-3 text-zinc-500">{a.siteManagerName || "—"}</td>
                  <td className="px-4 py-3 text-zinc-500">{a.assignedToName || <span className="text-zinc-300 dark:text-zinc-600 italic text-xs">Not assigned</span>}</td>
                  <td className={`px-4 py-3 text-xs font-semibold ${PRIORITY_COLORS[a.priority]}`}>{a.priority}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{formatDate(a.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingAssignment(a); }}
                        className="rounded-lg p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                        title="Edit assignment"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(a.id!, a.projectName); }}
                        className="rounded-lg p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete assignment"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">No assignments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((a) => {
          const needsAttention = a.status === "Need Support" || a.status === "Need Materials";
          return (
            <div
              key={a.id}
              onClick={() => router.push(`/site-operations/${a.id}`)}
              className={`rounded-xl border p-4 space-y-2 cursor-pointer active:opacity-70 ${needsAttention ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    {needsAttention && <span className="text-red-500 text-xs">⚠</span>}
                    {a.projectName}
                  </p>
                  <p className="text-xs text-zinc-500">{a.clientName}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingAssignment(a); }}
                    className="rounded-lg p-1 text-zinc-400 hover:text-amber-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(a.id!, a.projectName); }}
                    className="rounded-lg p-1 text-zinc-400 hover:text-red-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>👷 {a.assignedToName}</span>
                <span className={PRIORITY_COLORS[a.priority]}>{a.priority}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-sm text-zinc-400 py-8">No assignments found.</p>}
      </div>
    </div>
  );
}
