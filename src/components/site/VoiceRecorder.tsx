"use client";

import { useRef, useState } from "react";
import { uploadVoiceReport } from "@/lib/firestore/siteOperations";
import { useAuthContext } from "@/components/providers/AuthProvider";

interface Props {
  siteId: string;
}

type State = "idle" | "recording" | "preview" | "uploading" | "done";

export function VoiceRecorder({ siteId }: Props) {
  const { user } = useAuthContext();
  const [state, setState] = useState<State>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
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

  const handleSubmit = async () => {
    if (!audioBlob || !user) return;
    setState("uploading");
    setError(null);
    try {
      await uploadVoiceReport(siteId, audioBlob, user.uid, user.displayName, "", null);
      setState("done");
    } catch (err: unknown) {
      console.error("Voice upload error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Upload failed: ${msg}`);
      setState("preview");
    }
  };

  const reset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
    setState("idle");
  };

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-3xl">✅</div>
        <p className="font-semibold text-green-700 dark:text-green-400">Voice update sent!</p>
        <button onClick={reset} className="text-sm text-zinc-500 underline">Record another</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Idle */}
      {state === "idle" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <button
            onClick={startRecording}
            className="h-24 w-24 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center shadow-lg transition-all active:scale-95"
          >
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
          <p className="text-sm text-zinc-500">Tap to start recording</p>
        </div>
      )}

      {/* Recording */}
      {state === "recording" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex items-center gap-2 text-red-500 font-medium">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            Recording…
          </div>
          <button
            onClick={stopRecording}
            className="h-24 w-24 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-all active:scale-95"
          >
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
          <p className="text-sm text-zinc-500">Tap to stop</p>
        </div>
      )}

      {/* Preview */}
      {state === "preview" && audioUrl && (
        <div className="space-y-4">
          <audio controls src={audioUrl} className="w-full" />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSubmit}
              className="w-full rounded-xl bg-amber-500 py-4 text-base font-bold text-white hover:bg-amber-600 transition-colors active:scale-95"
            >
              Submit
            </button>
            <button
              onClick={reset}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 py-3 text-sm font-medium text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Re-record
            </button>
          </div>
        </div>
      )}

      {/* Uploading */}
      {state === "uploading" && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-sm text-zinc-500">Uploading…</p>
        </div>
      )}
    </div>
  );
}
