"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { canViewActivityLogs } from "@/lib/auth/permissions";
import { fetchAuditLogs, type AuditLog } from "@/lib/firestore/audit";
import { formatDate } from "@/lib/utils/dates";
import { Button } from "@/components/ui/Button";

export default function ActivityLogsPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  // Logs states
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Filters option lists
  const [projectsList, setProjectsList] = useState<string[]>([]);
  const [usersList, setUsersList] = useState<string[]>([]);
  const [actionTypesList, setActionTypesList] = useState<string[]>([]);

  // Selected filter states
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedActionType, setSelectedActionType] = useState("");

  // Role authorization guard
  useEffect(() => {
    if (!loading && (!user || !canViewActivityLogs(user))) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Load audit logs on mount/auth change
  useEffect(() => {
    if (!user || !canViewActivityLogs(user)) return;

    async function loadLogs() {
      setLoadingLogs(true);
      const fetched = await fetchAuditLogs();
      setLogs(fetched);

      // Extract unique values for filter lists
      const uniqueProjects = Array.from(new Set(fetched.map((l) => l.projectName))).sort();
      const uniqueUsers = Array.from(new Set(fetched.map((l) => l.userName))).sort();
      const uniqueActions = Array.from(new Set(fetched.map((l) => l.actionType))).sort();

      setProjectsList(uniqueProjects);
      setUsersList(uniqueUsers);
      setActionTypesList(uniqueActions);
      setLoadingLogs(false);
    }

    loadLogs();
  }, [user]);

  // Apply filters synchronously
  const filteredLogs = logs.filter((log) => {
    const matchesProject = !selectedProject || log.projectName === selectedProject;
    const matchesUser = !selectedUser || log.userName === selectedUser;
    const matchesAction = !selectedActionType || log.actionType === selectedActionType;
    return matchesProject && matchesUser && matchesAction;
  });

  const getActionBadgeStyles = (action: string) => {
    switch (action) {
      case "create_project":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20";
      case "complete_step":
      case "complete_task":
        return "bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-400 dark:ring-teal-500/20";
      case "update_project":
      case "add_step":
        return "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20";
      case "delete_project":
      case "delete_step":
        return "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20";
      case "incomplete_step":
      case "incomplete_task":
        return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20";
      default:
        return "bg-zinc-50 text-zinc-600 ring-zinc-600/10 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700";
    }
  };

  const getActionLabel = (action: string) => {
    return action
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const resetFilters = () => {
    setSelectedProject("");
    setSelectedUser("");
    setSelectedActionType("");
  };

  // Render spinner while loading auth or checking permissions
  if (loading || !user || !canViewActivityLogs(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Verifying permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <svg className="h-7 w-7 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Activity Logs
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time workflow audit trials and action history across all projects.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            setLoadingLogs(true);
            const fetched = await fetchAuditLogs();
            setLogs(fetched);
            setLoadingLogs(false);
          }}
          disabled={loadingLogs}
        >
          <span className="flex items-center gap-1.5">
            <svg className={`h-4 w-4 ${loadingLogs ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
            </svg>
            Refresh Logs
          </span>
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Filter Activities
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">All Projects</option>
              {projectsList.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">All Users</option>
              {usersList.map((userOpt) => (
                <option key={userOpt} value={userOpt}>
                  {userOpt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
              Action Type
            </label>
            <select
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">All Actions</option>
              {actionTypesList.map((action) => (
                <option key={action} value={action}>
                  {getActionLabel(action)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(selectedProject || selectedUser || selectedActionType) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Logs Content */}
      {loadingLogs ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent mb-3"></div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading activity timeline...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <svg className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">No activity logs found</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            Try adjusting your filters, refreshing the timeline, or creating/editing workflow steps.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Step Name</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-sm text-zinc-700 dark:divide-zinc-800 dark:text-zinc-300">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-zinc-500">
                      {formatDate(log.timestamp.toISOString())}
                      <span className="block text-[10px] text-zinc-400 mt-0.5">
                        {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${getActionBadgeStyles(log.actionType)}`}>
                        {getActionLabel(log.actionType)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                      {log.projectName === "Deleted Project" || log.projectName === "Unknown Project" ? (
                        <span className="text-zinc-400 italic font-normal">{log.projectName}</span>
                      ) : (
                        <Link
                          href={`/projects/${log.projectId}`}
                          className="text-amber-600 hover:text-amber-500 hover:underline dark:text-amber-400 dark:hover:text-amber-300 font-semibold"
                        >
                          {log.projectName}
                        </Link>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400 max-w-[150px] truncate font-medium">
                      {log.stepName ? (
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                          {log.stepName}
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                        {log.userName}
                      </span>
                      <span className="text-xs text-zinc-400 block break-all">
                        {log.userEmail}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-300 font-medium">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
