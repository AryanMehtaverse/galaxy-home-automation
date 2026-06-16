"use client";

import { useRef, useState } from "react";
import { uploadVoiceReport } from "@/lib/firestore/siteOperations";
import { useAuthContext } from "@/components/providers/AuthProvider";
import type { GeneratedReport } from "@/types/site";

interface Props {
  siteId: string;
}

type RecorderState = "idle" | "recording" | "preview" | "processing" | "review" | "saved";

export function VoiceRecorder({ siteId }: Props) {
  const { user } = useAuthContext();
  const [state, setState] = useState<RecorderState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [editedReport, setEditedReport] = useState<GeneratedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("preview");
      };

      recorder.start();
      setState("recording");
    } catch {
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript("");
    setGeneratedReport(null);
    setEditedReport(null);
    setState("idle");
  };

  const processRecording = async () => {
    if (!audioBlob) return;
    setState("processing");
    setError(null);
    try {
      const form = new FormData();
      form.append("audio", audioBlob, "recording.webm");
      const res = await fetch("/api/voice-report", { method: "POST", body: form });
      if (!res.ok) throw new Error("Processing failed");
      const data = await res.json();
      setTranscript(data.transcript);
      setGeneratedReport(data.generatedReport);
      setEditedReport(data.generatedReport);
      setState("review");
    } catch {
      setError("Failed to process recording. Please try again.");
      setState("preview");
    }
  };

  const handleDirectUpload = async () => {
    if (!audioBlob || !user) return;
    setState("processing");
    setError(null);
    try {
      await uploadVoiceReport(siteId, audioBlob, user.uid, user.displayName, "", null);
      setState("saved");
    } catch {
      setError("Failed to upload. Please try again.");
      setState("preview");
    }
  };

  const handleSave = async () => {
    if (!audioBlob || !user || !editedReport) return;
    setState("processing");
    setError(null);
    try {
      await uploadVoiceReport(siteId, audioBlob, user.uid, user.displayName, transcript, editedReport);
      setState("saved");
    } catch {
      setError("Failed to save report. Please try again.");
      setState("review");
    }
  };

  const updateReportField = (field: keyof GeneratedReport, value: string) => {
    if (!editedReport) return;
    const isArray = Array.isArray(editedReport[field]);
    setEditedReport({
      ...editedReport,
      [field]: isArray
        ? (value as string).split("\n").filter(Boolean)
        : value,
    });
  };

  if (state === "saved") {
    return (
      <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-semibold text-green-800 dark:text-green-300">Voice report saved successfully!</p>
        <button onClick={deleteRecording} className="mt-4 text-sm text-zinc-500 underline">
          Record another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Idle / Recording */}
      {(state === "idle" || state === "recording") && (
        <div className="flex flex-col items-center gap-4 py-6">
          {state === "recording" && (
            <div className="flex items-center gap-2 text-red-500 font-medium">
              <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              Recording…
            </div>
          )}
          <button
            onClick={state === "idle" ? startRecording : stopRecording}
            className={`h-20 w-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all ${
              state === "recording"
                ? "bg-red-500 hover:bg-red-600 scale-110"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {state === "idle" ? (
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            ) : (
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            )}
          </button>
          <p className="text-sm text-zinc-500">{state === "idle" ? "Tap to start recording" : "Tap to stop"}</p>
        </div>
      )}

      {/* Preview */}
      {state === "preview" && audioUrl && (
        <div className="space-y-4">
          <audio controls src={audioUrl} className="w-full" />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleDirectUpload}
              className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Upload Recording
            </button>
            <button
              onClick={processRecording}
              className="w-full rounded-lg border border-amber-400 dark:border-amber-600 px-4 py-3 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
            >
              Generate AI Report First
            </button>
            <button
              onClick={deleteRecording}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Processing */}
      {state === "processing" && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-sm text-zinc-500">Processing with AI…</p>
        </div>
      )}

      {/* Review */}
      {state === "review" && editedReport && (
        <div className="space-y-4">
          {transcript && (
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Transcript</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{transcript}</p>
            </div>
          )}

          <div className="space-y-3">
            {(["workCompleted", "materialsUsed", "pendingWork", "issues", "clientRequests"] as const).map((field) => {
              const labels: Record<string, string> = {
                workCompleted: "Work Completed",
                materialsUsed: "Materials Used",
                pendingWork: "Pending Work",
                issues: "Issues",
                clientRequests: "Client Requests",
              };
              return (
                <div key={field}>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    {labels[field]}
                  </label>
                  <textarea
                    rows={2}
                    value={(editedReport[field] as string[]).join("\n")}
                    onChange={(e) => updateReportField(field, e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    placeholder="One item per line"
                  />
                </div>
              );
            })}

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                Recommended Status
              </label>
              <select
                value={editedReport.recommendedStatus}
                onChange={(e) => updateReportField("recommendedStatus", e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {["Assigned", "In Progress", "Partially Completed", "Completed", "Need Support", "Need Materials"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Accept & Save
            </button>
            <button
              onClick={deleteRecording}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
