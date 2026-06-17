"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { canViewActivityLogs, canAccessRecycleBin, canManageUsers, canAccessSiteOperations, canAccessMySites, canAccessLeads, canAccessQuotations, canAccessInventory, canAccessNewProject, canAccessDashboard, canAccessAlerts } from "@/lib/auth/permissions";

import { useProjects } from "@/hooks/useProjects";
import { getAlertsForUser } from "@/lib/utils/alerts";

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  badgeLabel?: string;
  icon: React.ReactNode;
  visible: boolean;
}

const DashIcon = () => (
  <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const { projects } = useProjects();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!onNavigate) {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored === "true") {
        requestAnimationFrame(() => setIsCollapsed(true));
      }
    }
    requestAnimationFrame(() => setMounted(true));
  }, [onNavigate]);

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const effectiveCollapsed = onNavigate ? false : isCollapsed;
  const alertsCount = getAlertsForUser(projects, user).length;

  const items: NavItem[] = [
    {
      href: "/home",
      label: "Home",
      visible: true,
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/dashboard",
      label: "Projects",
      visible: canAccessDashboard(user),
      icon: <DashIcon />,
    },
    {
      href: "/dashboard/alerts",
      label: `Alerts${alertsCount > 0 ? ` (${alertsCount})` : ""}`,
      badgeLabel: `Alerts${alertsCount > 0 ? ` (${alertsCount})` : ""}`,
      visible: canAccessAlerts(user),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      href: "/dashboard/inventory",
      label: "Inventory",
      visible: canAccessInventory(user),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      href: "/projects/new",
      label: "New Project",
      visible: canAccessNewProject(user),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      href: "/quotations",
      label: "Quotations",
      visible: canAccessQuotations(user),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: "/leads",
      label: "Leads",
      visible: canAccessLeads(user),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      href: "/site-operations",
      label: "Site Operations",
      visible: canAccessSiteOperations(user),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      href: "/my-sites",
      label: "My Sites",
      visible: canAccessMySites(user),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/user-management",
      label: "User Management",
      visible: canManageUsers(user),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      href: "/chat",
      label: "SOP-Bot",
      visible: true,
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      href: "/dashboard/activity-logs",
      label: "Activity Logs",
      visible: canViewActivityLogs(user),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      href: "/dashboard/recycle-bin",
      label: "Recycle Bin",
      visible: canAccessRecycleBin(user),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
  ];

  const visibleItems = items.filter((i) => i.visible);

  return (
    <aside
      className={`flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 select-none ${mounted ? "transition-all duration-300 ease-in-out" : ""} ${effectiveCollapsed ? "w-16" : "w-64"}`}
    >
      <div
        className={`flex items-center border-b border-zinc-200 px-4 py-5 dark:border-zinc-800 transition-all duration-300 ${effectiveCollapsed ? "justify-center px-2" : "justify-start gap-3"}`}
      >
        <button
          onClick={handleToggleCollapse}
          className="hidden lg:flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
          title={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className={`flex items-center gap-2 min-w-0 transition-all duration-300 ${effectiveCollapsed ? "hidden lg:hidden" : ""}`}>
          <img src="/Galaxy Logo no bg.jpeg" alt="Galaxy" className="h-8 w-auto object-contain flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">Galaxy Home Automation</p>
            <p className="text-xs text-zinc-500 leading-tight mt-0.5">Wings of Future</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const label = item.badgeLabel || item.label;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative group/nav ${
                active
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              } ${effectiveCollapsed ? "justify-center px-2" : ""}`}
            >
              {item.icon}
              <span className={`transition-all duration-300 whitespace-nowrap ${effectiveCollapsed ? "hidden lg:hidden" : ""}`}>
                {label}
              </span>
              {effectiveCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-zinc-900 text-zinc-100 text-xs whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity pointer-events-none z-50 shadow-md border border-zinc-700">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <UserMenu collapsed={effectiveCollapsed} />
    </aside>
  );
}
