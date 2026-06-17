"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/components/providers/AuthProvider";
import Link from "next/link";

interface Notification {
  id: string;
  action: string;
  description: string;
  userName: string;
  siteId: string;
  timestamp: { toDate: () => Date } | null;
}

export function NotificationBell() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date>(() => new Date());
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const isManager = user?.role === "project_manager" || user?.role === "site_manager";

  useEffect(() => {
    if (!isAdmin && !isManager) return;

    const q = query(
      collection(db, "siteTimeline"),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    return onSnapshot(q, (snap) => {
      setNotifications(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification))
      );
    }, () => {});
  }, [isAdmin, isManager]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isAdmin && !isManager) return null;

  const unread = notifications.filter((n) => {
    if (!n.timestamp) return false;
    return n.timestamp.toDate() > lastSeen;
  });

  const handleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top - 8, // will be placed above via transform
        left: rect.right + 8,
      });
    }
    setOpen(!open);
    if (!open) setLastSeen(new Date());
  };

  const formatTime = (ts: Notification["timestamp"]) => {
    if (!ts) return "";
    const d = ts.toDate();
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const ACTION_ICONS: Record<string, string> = {
    "Photo Uploaded": "📷",
    "Voice Report Submitted": "🎙️",
    "Status Changed": "🔄",
    "Report Submitted": "📝",
    "Visit Started": "🚀",
    "Site Completed": "✅",
    "Need Support": "🚨",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && typeof window !== "undefined" && createPortal(
        <div
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, transform: "translateY(-100%)", zIndex: 9999 }}
          className="w-80 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800">
            {notifications.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-8">No activity yet.</p>
            )}
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={`/site-operations/${n.siteId}`}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{ACTION_ICONS[n.action] ?? "•"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{n.action}</p>
                  <p className="text-xs text-zinc-500 truncate">{n.description}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{formatTime(n.timestamp)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
