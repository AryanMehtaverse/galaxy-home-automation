"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { subscribeToUsers, updateUserProfile, type ManagedUser } from "@/lib/firestore/users";
import { exportAllData, downloadJSON, downloadCSV } from "@/lib/exportService";
import type { AppRole } from "@/types/auth";

const ALL_ROLES: AppRole[] = ["admin", "owner", "project_manager", "bd_team", "site_manager", "field_team", "site_worker", "accounts", "clerk", "unassigned"];

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  owner: "Owner",
  project_manager: "Project Manager",
  bd_team: "BD Team",
  site_manager: "Site Manager",
  field_team: "Field Team",
  site_worker: "Site Worker",
  accounts: "Accounts",
  clerk: "Clerk",
  unassigned: "Unassigned",
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  owner: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  project_manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  bd_team: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  site_manager: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  field_team: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  site_worker: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  accounts: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  clerk: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  unassigned: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

function EditModal({ user, onClose, onSave }: { user: ManagedUser; onClose: () => void; onSave: (uid: string, data: { name: string; role: AppRole; active: boolean }) => Promise<void> }) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<AppRole>(user.role);
  const [active, setActive] = useState(user.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(user.uid, { name, role, active });
      onClose();
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Edit User</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Email</label>
            <input
              value={user.email}
              disabled
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-zinc-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Status</label>
            <select
              value={active ? "active" : "disabled"}
              onChange={(e) => setActive(e.target.value === "active")}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <RoleGuard allowedRoles={["admin"]} redirectTo="/dashboard">
      <UserManagementContent />
    </RoleGuard>
  );
}

function UserManagementContent() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<AppRole | "all">("all");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  useEffect(() => {
    return subscribeToUsers(setUsers);
  }, []);

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleSave = async (uid: string, data: { name: string; role: AppRole; active: boolean }) => {
    const { updateUserProfile } = await import("@/lib/firestore/users");
    await updateUserProfile(uid, data);
  };

  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const handleExport = async (format: "json" | "csv") => {
    setExporting(true);
    try {
      const result = await exportAllData();
      const date = new Date().toISOString().split("T")[0];
      if (format === "json") {
        downloadJSON(result, `galaxy-backup-${date}.json`);
      } else {
        const { data } = result;
        Object.entries(data).forEach(([key, rows]) => {
          if ((rows as unknown[]).length > 0) {
            downloadCSV(rows as unknown[], `galaxy-${key}-${date}.csv`);
          }
        });
      }
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (d: Date | null) => {
    if (!d) return "Never";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {editingUser && (
        <EditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSave}
        />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">User Management</h1>
          <p className="text-sm text-zinc-500 mt-1">{users.length} users registered</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 hidden sm:block">Export all data:</span>
          <button
            onClick={() => handleExport("json")}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {exporting ? "Exporting…" : exportDone ? "✓ Done" : "⬇ JSON Backup"}
          </button>
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {exporting ? "Exporting…" : "⬇ CSV Sheets"}
          </button>
          <Link
            href="/user-management/migrate"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            🔄 DB Migration
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as AppRole | "all")}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="all">All Roles</option>
          {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left px-4 py-3 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">Last Login</th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((u) => (
              <tr key={u.uid} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{u.name || "—"}</td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${u.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${u.active ? "bg-green-500" : "bg-red-500"}`} />
                    {u.active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{formatDate(u.lastLogin)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setEditingUser(u)}
                    className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((u) => (
          <div key={u.uid} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{u.name || "—"}</p>
                <p className="text-xs text-zinc-500 truncate">{u.email}</p>
              </div>
              <button
                onClick={() => setEditingUser(u)}
                className="flex-shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Edit
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                {ROLE_LABELS[u.role]}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${u.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${u.active ? "bg-green-500" : "bg-red-500"}`} />
                {u.active ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="text-xs text-zinc-400">Last login: {formatDate(u.lastLogin)}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-zinc-400 py-8">No users found.</p>
        )}
      </div>
    </div>
  );
}
