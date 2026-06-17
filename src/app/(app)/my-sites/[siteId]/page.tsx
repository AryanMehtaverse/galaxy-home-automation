"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  subscribeToMySiteAssignments,
  subscribeToSiteManagerAssignments,
  subscribeToAllSiteAssignments,
  updateSiteStatus,
  uploadSitePhoto,
  addTimelineEntry,
  uploadVoiceReport,
  assignFieldTeamMember,
  getFieldTeamMembers,
} from "@/lib/firestore/siteOperations";
import { subscribeToSiteTimeline } from "@/lib/firestore/siteOperations";
import { useAuthContext } from "@/components/providers/AuthProvider";
import type { SiteAssignment, SiteTimelineEntry } from "@/types/site";

// ── Timeline with exact timestamps ──────────────────────────────────────────

const ACTION_ICONS: Record<string, string> = {
  "Assignment Created": "📋",
  "Field Team Assigned": "👷",
  "Arrived at Site": "📍",
  "Before Work Photo": "📷",
  "After Work Photo": "📸",
  "Voice Report Submitted": "🎙️",
  "Left Site": "🚪",
  "Status Changed": "🔄",
  "Assignment Updated": "✏️",
};

function Timeline({ siteId }: { siteId: string }) {
  const [entries, setEntries] = useState<SiteTimelineEntry[]>([]);
  useEffect(() => subscribeToSiteTimeline(siteId, setEntries), [siteId]);

  if (entries.length === 0) return <p className="text-sm text-zinc-400 text-center py-6">No activity yet.</p>;

  return (
    <ol className="relative border-l-2 border-amber-200 dark:border-amber-900 space-y-4 pl-5">
      {entries.map((e) => {
        const d = e.timestamp ? (e.timestamp as unknown as { toDate: () => Date }).toDate() : null;
        return (
          <li key={e.id} className="relative">
            <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full bg-amber-400 dark:bg-amber-500 border-2 border-white dark:border-zinc-900" />
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2.5">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {ACTION_ICONS[e.action] ?? "•"} {e.action}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{e.description}</p>
              {d && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                  {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {" · "}
                  {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ── Voice recorder (inline, minimal) ────────────────────────────────────────

type VoiceState = "idle" | "recording" | "preview" | "uploading" | "done";

function VoiceButton({ siteId }: { siteId: string }) {
  const { user } = useAuthContext();
  const [state, setState] = useState<VoiceState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("preview");
      };
      rec.start();
      setState("recording");
    } catch {
      setError("Mic access denied");
    }
  };

  const stop = () => recorderRef.current?.stop();

  const submit = async () => {
    if (!audioBlob || !user) return;
    setState("uploading");
    try {
      await uploadVoiceReport(siteId, audioBlob, user.uid, user.displayName, "", null);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setState("preview");
    }
  };

  const reset = () => { setAudioBlob(null); setAudioUrl(null); setError(null); setState("idle"); };

  if (state === "done") return (
    <div className="rounded-2xl bg-green-500 p-5 text-center space-y-2">
      <p className="text-3xl">✅</p>
      <p className="text-white font-bold">Voice update sent!</p>
      <button onClick={reset} className="text-green-100 text-sm underline">Record another</button>
    </div>
  );

  if (state === "preview" && audioUrl) return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
      <audio controls src={audioUrl} className="w-full" />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={submit} className="rounded-xl bg-purple-500 py-3 text-sm font-bold text-white">Submit</button>
        <button onClick={reset} className="rounded-xl border border-zinc-300 dark:border-zinc-700 py-3 text-sm font-medium text-zinc-500">Re-record</button>
      </div>
    </div>
  );

  if (state === "uploading") return (
    <div className="rounded-2xl bg-purple-100 dark:bg-purple-900/20 p-5 text-center">
      <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">Uploading…</p>
    </div>
  );

  return (
    <button
      onClick={state === "idle" ? start : stop}
      className={`w-full rounded-2xl py-6 text-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
        state === "recording" ? "bg-red-500 animate-pulse" : "bg-purple-500"
      }`}
    >
      {state === "recording" ? "⏹ Stop Recording" : "🎙️ Voice Report"}
    </button>
  );
}

// ── Site Manager view ────────────────────────────────────────────────────────

function SiteManagerView({ site, siteId }: { site: SiteAssignment; siteId: string }) {
  const { user } = useAuthContext();
  const [fieldTeam, setFieldTeam] = useState<{ uid: string; name: string }[]>([]);
  const [selectedUid, setSelectedUid] = useState(site.assignedTo ?? "");
  const [assigning, setAssigning] = useState(false);
  const [assigned, setAssigned] = useState(false);

  useEffect(() => { getFieldTeamMembers().then(setFieldTeam); }, []);

  const handleAssign = async () => {
    if (!selectedUid || !user) return;
    const member = fieldTeam.find((m) => m.uid === selectedUid);
    if (!member) return;
    setAssigning(true);
    try {
      await assignFieldTeamMember(siteId, member.uid, member.name, user.uid, user.displayName);
      setAssigned(true);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link href="/my-sites" className="text-xs text-amber-500 hover:underline">← My Sites</Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{site.projectName}</h1>
        <p className="text-sm text-zinc-500">{site.clientName}</p>
        {site.address && <p className="text-xs text-zinc-400 mt-0.5">📍 {site.address}</p>}
      </div>

      {/* Assign field team */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">👷 Assign Field Team Member</p>
        {site.assignedToName && (
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Currently: {site.assignedToName}</p>
        )}
        <div className="flex gap-2">
          <select
            value={selectedUid}
            onChange={(e) => setSelectedUid(e.target.value)}
            className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Select field team member…</option>
            {fieldTeam.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedUid || assigning}
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
          >
            {assigning ? "…" : assigned ? "✓ Done" : "Assign"}
          </button>
        </div>
      </div>

      {/* Work description */}
      {(site.workDescription || site.notes) && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
          {site.workDescription && (
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Work Description</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{site.workDescription}</p>
            </div>
          )}
          {site.notes && (
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{site.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Activity Log</p>
        <Timeline siteId={siteId} />
      </div>
    </div>
  );
}

// ── Field Team view — ultra minimal ─────────────────────────────────────────

function FieldTeamView({ site, siteId }: { site: SiteAssignment; siteId: string }) {
  const { user } = useAuthContext();
  const [uploading, setUploading] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [showTimeline, setShowTimeline] = useState(false);

  const hasArrived = site.status !== "Assigned";
  const hasLeft = site.status === "Completed" || site.status === "Cancelled";

  const logAndUpdate = async (action: string, description: string, newStatus?: string) => {
    if (!user) return;
    await addTimelineEntry(siteId, { action, description, userId: user.uid, userName: user.displayName });
    if (newStatus) await updateSiteStatus(siteId, newStatus as never, user.uid, user.displayName);
    setDone((d) => ({ ...d, [action]: true }));
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>, category: "Before Work" | "After Work") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(category);
    try {
      await uploadSitePhoto(siteId, file, category, user.uid, user.displayName);
      await addTimelineEntry(siteId, {
        action: category === "Before Work" ? "Before Work Photo" : "After Work Photo",
        description: `${category} photo uploaded by ${user.displayName}`,
        userId: user.uid,
        userName: user.displayName,
      });
      setDone((d) => ({ ...d, [category]: true }));
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      {/* Site info card */}
      <div className="rounded-2xl bg-zinc-900 text-white p-5 space-y-1">
        <p className="font-extrabold text-lg leading-tight">{site.projectName}</p>
        <p className="text-sm text-zinc-300">{site.clientName}</p>
        {site.address && <p className="text-xs text-zinc-400">📍 {site.address}</p>}
        {site.workDescription && (
          <p className="text-xs text-zinc-400 pt-1 border-t border-zinc-700 mt-2">{site.workDescription}</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-3">

        {/* Arrived */}
        {!hasArrived && (
          <button
            onClick={() => logAndUpdate("Arrived at Site", `${user?.displayName} arrived at the site`, "In Progress")}
            className="w-full rounded-2xl bg-green-500 hover:bg-green-600 py-7 text-2xl font-extrabold text-white shadow-lg transition-all active:scale-95"
          >
            📍 I've Arrived
          </button>
        )}
        {hasArrived && !hasLeft && (
          <div className="rounded-2xl bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 py-3 text-center text-sm font-semibold text-green-700 dark:text-green-400">
            ✅ Checked In
          </div>
        )}

        {/* Before Work Photo */}
        <label className={`w-full rounded-2xl py-6 text-xl font-bold text-white shadow-lg flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-95 ${
          done["Before Work"] ? "bg-blue-400" : uploading === "Before Work" ? "bg-blue-300 opacity-70" : "bg-blue-500 hover:bg-blue-600"
        }`}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handlePhoto(e, "Before Work")}
            disabled={!!uploading}
          />
          {uploading === "Before Work" ? "⏳ Uploading…" : done["Before Work"] ? "✅ Before Photo Sent" : "📷 Before Work Photo"}
        </label>

        {/* After Work Photo */}
        <label className={`w-full rounded-2xl py-6 text-xl font-bold text-white shadow-lg flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-95 ${
          done["After Work"] ? "bg-amber-400" : uploading === "After Work" ? "bg-amber-300 opacity-70" : "bg-amber-500 hover:bg-amber-600"
        }`}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handlePhoto(e, "After Work")}
            disabled={!!uploading}
          />
          {uploading === "After Work" ? "⏳ Uploading…" : done["After Work"] ? "✅ After Photo Sent" : "📸 After Work Photo"}
        </label>

        {/* Voice report */}
        <VoiceButton siteId={siteId} />

        {/* Left Site */}
        {hasArrived && !hasLeft && (
          <button
            onClick={() => logAndUpdate("Left Site", `${user?.displayName} has left the site`, "Completed")}
            className="w-full rounded-2xl bg-red-500 hover:bg-red-600 py-7 text-2xl font-extrabold text-white shadow-lg transition-all active:scale-95"
          >
            🚪 I'm Leaving
          </button>
        )}

        {hasLeft && (
          <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 py-4 text-center text-sm font-semibold text-zinc-500">
            🏁 Visit Completed
          </div>
        )}
      </div>

      {/* Timeline toggle */}
      <button
        onClick={() => setShowTimeline(!showTimeline)}
        className="w-full text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 py-2 transition-colors"
      >
        {showTimeline ? "▲ Hide" : "▼ Show"} Activity Log
      </button>
      {showTimeline && <Timeline siteId={siteId} />}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

function SiteDetailContent() {
  const { siteId } = useParams<{ siteId: string }>();
  const { user } = useAuthContext();
  const [site, setSite] = useState<SiteAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  const isSiteManager = user?.role === "site_manager";
  const isFieldTeam = user?.role === "field_team" || user?.role === "site_worker";

  useEffect(() => {
    if (!user) return;
    const sub = isSiteManager
      ? subscribeToSiteManagerAssignments(user.uid, (list) => {
          setSite(list.find((a) => a.id === siteId) ?? null);
          setLoading(false);
        }, () => setLoading(false))
      : isFieldTeam
        ? subscribeToMySiteAssignments(user.uid, (list) => {
            setSite(list.find((a) => a.id === siteId) ?? null);
            setLoading(false);
          }, () => setLoading(false))
        : subscribeToAllSiteAssignments((list) => {
            setSite(list.find((a) => a.id === siteId) ?? null);
            setLoading(false);
          });
    return sub;
  }, [user, siteId, isSiteManager, isFieldTeam]);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
    </div>
  );

  if (!site) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <p className="text-zinc-500">Site not found or access denied.</p>
      <Link href="/my-sites" className="text-sm text-amber-500 underline">Back to My Sites</Link>
    </div>
  );

  if (isSiteManager) return <SiteManagerView site={site} siteId={siteId} />;
  return <FieldTeamView site={site} siteId={siteId} />;
}

export default function SiteDetailPage() {
  return (
    <RoleGuard allowedRoles={["site_manager", "field_team", "site_worker"]} redirectTo="/home">
      <SiteDetailContent />
    </RoleGuard>
  );
}
