"use client";

import { useEffect, useState } from "react";
import { subscribeToVoiceReports } from "@/lib/firestore/siteOperations";
import type { VoiceReport } from "@/types/site";

interface Props {
  siteId: string;
}

export function VoiceReportViewer({ siteId }: Props) {
  const [reports, setReports] = useState<VoiceReport[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToVoiceReports(siteId, setReports);
  }, [siteId]);

  const formatDate = (ts: VoiceReport["createdAt"]) => {
    if (!ts) return "—";
    const d = (ts as unknown as { toDate: () => Date }).toDate();
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
        <div className="text-4xl mb-3">🎙️</div>
        <p className="text-sm font-medium text-zinc-500">No voice reports submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((r) => (
        <div key={r.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                🎙️
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{r.workerName}</p>
                <p className="text-xs text-zinc-400">{formatDate(r.createdAt)}</p>
              </div>
            </div>
            <svg
              className={`h-4 w-4 text-zinc-400 transition-transform ${expanded === r.id ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {expanded === r.id && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-4 space-y-4">
              {/* Audio player */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Audio Recording</p>
                <audio controls src={r.audioUrl} className="w-full" />
              </div>

              {/* Transcript */}
              {r.transcript && (
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Transcript</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{r.transcript}</p>
                </div>
              )}

              {/* AI Generated Report */}
              {r.generatedReport && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">AI Generated Report</p>

                  {r.generatedReport.recommendedStatus && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Recommended Status:</span>
                      <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {r.generatedReport.recommendedStatus}
                      </span>
                    </div>
                  )}

                  {(
                    [
                      { key: "workCompleted", label: "✅ Work Completed", color: "text-green-600 dark:text-green-400" },
                      { key: "materialsUsed", label: "🔧 Materials Used", color: "text-blue-600 dark:text-blue-400" },
                      { key: "pendingWork", label: "⏳ Pending Work", color: "text-amber-600 dark:text-amber-400" },
                      { key: "issues", label: "⚠️ Issues", color: "text-red-600 dark:text-red-400" },
                      { key: "clientRequests", label: "💬 Client Requests", color: "text-purple-600 dark:text-purple-400" },
                    ] as const
                  ).map(({ key, label, color }) => {
                    const items = r.generatedReport![key] as string[];
                    if (!items || items.length === 0) return null;
                    return (
                      <div key={key}>
                        <p className={`text-xs font-semibold mb-1 ${color}`}>{label}</p>
                        <ul className="space-y-1">
                          {items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                              <span className="text-zinc-400 mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
