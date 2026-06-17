"use client";

import { useEffect, useState } from "react";
import { subscribeToSiteTimeline } from "@/lib/firestore/siteOperations";
import type { SiteTimelineEntry } from "@/types/site";

const ACTION_ICONS: Record<string, string> = {
  "Assignment Created": "📋",
  "Assignment Updated": "✏️",
  "Visit Started": "🚀",
  "Photo Uploaded": "📷",
  "Voice Report Submitted": "🎙️",
  "Report Submitted": "📝",
  "Status Changed": "🔄",
  "Site Completed": "✅",
  "AI Report Generated": "🤖",
};

interface Props {
  siteId: string;
}

export function SiteTimeline({ siteId }: Props) {
  const [entries, setEntries] = useState<SiteTimelineEntry[]>([]);

  useEffect(() => {
    return subscribeToSiteTimeline(siteId, setEntries);
  }, [siteId]);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">
        No timeline events yet.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-zinc-200 dark:border-zinc-700 space-y-4 pl-4">
      {entries.map((entry) => {
        const date = entry.timestamp
          ? (entry.timestamp as unknown as { toDate: () => Date }).toDate()
          : null;

        return (
          <li key={entry.id} className="ml-2">
            <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-amber-400 dark:border-zinc-900 dark:bg-amber-500" />
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {ACTION_ICONS[entry.action] ?? "•"} {entry.action}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{entry.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-400">{entry.userName}</span>
                {date && (
                  <>
                    <span className="text-xs text-zinc-300 dark:text-zinc-600">·</span>
                    <span className="text-xs text-zinc-400">
                      {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}{" "}
                      {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
