"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { canViewActivityLogs, canAccessRecycleBin } from "@/lib/auth/permissions";

import { useProjects } from "@/hooks/useProjects";
import { getAlertsForUser } from "@/lib/utils/alerts";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const { projects } = useProjects();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only load collapsed state on desktop view (where onNavigate is not defined)
    if (!onNavigate) {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored === "true") {
        requestAnimationFrame(() => {
          setIsCollapsed(true);
        });
      }
    }
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, [onNavigate]);

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  // Force expanded behavior on mobile layout
  const effectiveCollapsed = onNavigate ? false : isCollapsed;

  const alertsCount = getAlertsForUser(projects, user).length;

  const items = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      href: "/dashboard/alerts",
      label: `Alerts (${alertsCount})`,
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      badgeLabel: `Alerts (${alertsCount})`,
    },
    {
      href: "/dashboard/inventory",
      label: "Inventory",
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      badgeLabel: "Inventory",
    },
    {
      href: "/projects/new",
      label: "New Project",
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    },
    {
      href: "/dashboard/activity-logs",
      label: "Activity Logs",
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      href: "/dashboard/recycle-bin",
      label: "Recycle Bin",
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
    },
  ];

  const visibleNavItems = items.filter((item) => {
    if (item.href === "/dashboard/activity-logs") {
      return canViewActivityLogs(user);
    }
    if (item.href === "/dashboard/recycle-bin") {
      return canAccessRecycleBin(user);
    }
    return true;
  });

  return (
    <aside
      className={`flex h-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 select-none ${mounted ? "transition-all duration-300 ease-in-out" : ""
        } ${effectiveCollapsed ? "w-16" : "w-64"}`}
    >
      <div
        className={`flex items-center border-b border-zinc-200 px-4 py-5 dark:border-zinc-800 transition-all duration-300 ${effectiveCollapsed ? "justify-center px-2" : "justify-start gap-3"
          }`}
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
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Project Manager Tool
            </p>
            <p className="text-xs text-zinc-500 leading-tight mt-0.5">
              Galaxy Home Automation LLP
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNavItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          const displayLabel = item.badgeLabel || item.label;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative group/nav ${active
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                } ${effectiveCollapsed ? "justify-center px-2" : ""}`}
            >
              {item.icon}
              <span className={`transition-all duration-300 whitespace-nowrap ${effectiveCollapsed ? "hidden lg:hidden" : ""}`}>
                {displayLabel}
              </span>
              {effectiveCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-zinc-900 text-zinc-100 text-xs whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity pointer-events-none z-50 shadow-md border border-zinc-700">
                  {displayLabel}
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
