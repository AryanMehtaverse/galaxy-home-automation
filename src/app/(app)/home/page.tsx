"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useProjects } from "@/hooks/useProjects";
import { subscribeToAllSiteAssignments, subscribeToMySiteAssignments } from "@/lib/firestore/siteOperations";
import { fetchLeads } from "@/lib/leadsService";
import { getAlertsForUser } from "@/lib/utils/alerts";
import type { SiteAssignment } from "@/types/site";

function StatCard({ label, value, href, color }: { label: string; value: number | string; href?: string; color?: string }) {
  const content = (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-center hover:shadow-md transition-shadow">
      <p className={`text-3xl font-bold ${color ?? "text-zinc-900 dark:text-zinc-100"}`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
      {href && <Link href={href} className="text-xs text-amber-600 hover:underline font-medium">{linkLabel ?? "View all"}</Link>}
    </div>
  );
}

// ── Role-specific widgets ─────────────────────────────────────────────────────

function AdminHome() {
  const { projects, loading: projLoading } = useProjects();
  const { user } = useAuthContext();
  const [assignments, setAssignments] = useState<SiteAssignment[]>([]);
  const [leadCount, setLeadCount] = useState<number | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllSiteAssignments(setAssignments);
    fetchLeads().then((l) => setLeadCount(l.length)).catch(() => setLeadCount(null));
    return unsub;
  }, []);

  const alerts = getAlertsForUser(projects, user);
  const needAttention = assignments.filter((a) => a.status === "Need Support" || a.status === "Need Materials");
  const activeSites = assignments.filter((a) => a.status !== "Completed" && a.status !== "Cancelled");

  return (
    <div className="space-y-8">
      {needAttention.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4 flex items-start gap-3">
          <span className="text-red-500 text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">{needAttention.length} site{needAttention.length > 1 ? "s" : ""} need attention</p>
            <p className="text-xs text-red-500 mt-0.5">{needAttention.map((a) => a.projectName).join(", ")}</p>
            <Link href="/site-operations" className="text-xs text-red-600 font-semibold underline mt-1 inline-block">Go to Site Operations →</Link>
          </div>
        </div>
      )}

      <div>
        <SectionHeader title="Projects" href="/dashboard" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Projects" value={projLoading ? "…" : projects.length} href="/dashboard" />
          <StatCard label="Active Alerts" value={alerts.length} href="/dashboard/alerts" color={alerts.length > 0 ? "text-red-600" : undefined} />
          <StatCard label="Active Sites" value={activeSites.length} href="/site-operations" color="text-amber-600 dark:text-amber-400" />
          <StatCard label="Total Leads" value={leadCount ?? "…"} href="/leads" color="text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      <div>
        <SectionHeader title="Active Sites" href="/site-operations" />
        {activeSites.length === 0 ? (
          <p className="text-sm text-zinc-400">No active sites.</p>
        ) : (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                  {["Project", "Worker", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {activeSites.slice(0, 5).map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                      <Link href={`/site-operations/${a.id}`} className="hover:underline">{a.projectName}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500">{a.assignedToName}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        a.status === "Need Support" || a.status === "Need Materials"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PMHome() {
  const { projects, loading: projLoading } = useProjects();
  const { user } = useAuthContext();
  const alerts = getAlertsForUser(projects, user);

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader title="Overview" href="/dashboard" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total Projects" value={projLoading ? "…" : projects.length} href="/dashboard" />
          <StatCard label="Active Alerts" value={alerts.length} href="/dashboard/alerts" color={alerts.length > 0 ? "text-red-600" : undefined} />
          <StatCard label="Quotations" value="View" href="/quotations" />
        </div>
      </div>
      {alerts.length > 0 && (
        <div>
          <SectionHeader title="Active Alerts" href="/dashboard/alerts" />
          <div className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <div key={a.project.id} className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{a.project.projectName}</p>
                <p className="text-xs text-amber-600 mt-0.5">{a.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BDHome() {
  const [leadCount, setLeadCount] = useState<number | null>(null);
  useEffect(() => { fetchLeads().then((l) => setLeadCount(l.length)).catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <SectionHeader title="Leads Pipeline" href="/leads" />
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Leads" value={leadCount ?? "…"} href="/leads" color="text-blue-600 dark:text-blue-400" />
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col items-center justify-center gap-2">
          <Link href="/leads" className="text-sm font-semibold text-amber-600 hover:underline">Open Leads →</Link>
        </div>
      </div>
    </div>
  );
}

function WorkerHome() {
  const { user } = useAuthContext();
  const [mySites, setMySites] = useState<SiteAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMySiteAssignments(
      user.uid,
      (data) => { setMySites(data); setLoading(false); },
      () => setLoading(false)
    );
    return unsub;
  }, [user]);

  const active = mySites.filter((s) => s.status !== "Completed" && s.status !== "Cancelled");

  return (
    <div className="space-y-6">
      <SectionHeader title="My Active Sites" href="/my-sites" />
      {loading ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : active.length === 0 ? (
        <p className="text-sm text-zinc-400">No active sites assigned to you.</p>
      ) : (
        <div className="space-y-3">
          {active.map((s) => (
            <Link key={s.id} href={`/my-sites/${s.id}`}
              className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:shadow-md transition-shadow">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{s.projectName}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.clientName}</p>
              <span className="mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{s.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountsHome() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-zinc-500">Access your quotations and billing documents.</p>
        <Link href="/quotations" className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors">Open Quotations</Link>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const ROLE_GREETINGS: Record<string, string> = {
  admin: "Admin Overview",
  owner: "Owner Overview",
  project_manager: "Project Manager Overview",
  bd_team: "BD Team Overview",
  site_worker: "Field Worker Overview",
  accounts: "Accounts Overview",
  clerk: "Overview",
  unassigned: "Welcome",
};

export default function HomePage() {
  const { user } = useAuthContext();
  const role = user?.role ?? "unassigned";
  const greeting = ROLE_GREETINGS[role] ?? "Welcome";

  const renderWidget = () => {
    if (role === "admin" || role === "owner") return <AdminHome />;
    if (role === "project_manager" || role === "clerk") return <PMHome />;
    if (role === "bd_team") return <BDHome />;
    if (role === "site_worker") return <WorkerHome />;
    if (role === "accounts") return <AccountsHome />;
    return <p className="text-sm text-zinc-500">Your account is pending role assignment.</p>;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{greeting}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Welcome back, {user?.displayName?.split(" ")[0] ?? "there"} 👋
        </p>
      </div>
      {renderWidget()}
    </div>
  );
}
