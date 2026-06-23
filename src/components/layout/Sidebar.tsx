"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";
import { useAuthContext } from "@/components/providers/AuthProvider";
import {
  canViewActivityLogs, canAccessRecycleBin, canManageUsers,
  canAccessSiteOperations, canAccessMySites, canAccessLeads,
} from "@/lib/auth/permissions";

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  visible: boolean;
  matchPrefix?: string; // custom prefix for active-check
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!onNavigate) {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored === "true") requestAnimationFrame(() => setIsCollapsed(true));
    }
    requestAnimationFrame(() => setMounted(true));
  }, [onNavigate]);

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const effectiveCollapsed = onNavigate ? false : isCollapsed;

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
      href: "/clients",
      label: "Workstation",
      visible: canAccessLeads(user),
      icon: (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
          const active = pathname === item.href || pathname.startsWith(item.href + '/') ||
            (item.matchPrefix ? pathname.startsWith(item.matchPrefix) : false);

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
                {item.label}
              </span>
              {effectiveCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-zinc-900 text-zinc-100 text-xs whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity pointer-events-none z-50 shadow-md border border-zinc-700">
                  {item.label}
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
