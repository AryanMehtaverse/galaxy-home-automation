"use client";

import { useState } from "react";
import type { Project } from "@/types";
import { useProjectPhotos } from "@/hooks/useProjectPhotos";
import { formatDate } from "@/lib/utils/dates";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { isNodeCompleted } from "@/lib/workflow/progress";
import { getSortedPipeline } from "@/lib/workflow/pipeline";

interface ClientPortalViewProps {
  project: Project;
  onLogout: () => void;
}

export function ClientPortalView({ project, onLogout }: ClientPortalViewProps) {
  const { photos, loading: photosLoading } = useProjectPhotos(project.id);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Workflow steps sorting and completion calculation
  const sortedWorkflow = getSortedPipeline(project.workflow);

  // Format date exactly: DD MMM YYYY (e.g., 12 Jun 2026)
  const formatAlertDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const statusLabels: Record<string, string> = {
    planning: "Planning",
    in_progress: "In Progress",
    review: "Review",
    completed: "Completed",
    on_hold: "On Hold",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Premium Header */}
      <header className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/60 p-6 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60 shadow-lg">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 uppercase tracking-wider">
              Client Portal
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              {project.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Welcome, <span className="font-semibold text-zinc-800 dark:text-zinc-200">{project.clientName || "Client"}</span>
            </p>
          </div>
          <button
            onClick={onLogout}
            className="self-start sm:self-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
          >
            Exit Portal
          </button>
        </div>

        <div className="mt-6 grid gap-4 border-t border-zinc-200/60 pt-6 dark:border-zinc-800/60 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-zinc-500">Site Manager</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
              {project.siteManagerName || "Unassigned"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Project Status</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 capitalize">
              {statusLabels[project.status] || project.status}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Start Date</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
              {formatAlertDate(project.startDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Deadline</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
              {formatAlertDate(project.deadline)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
            <span>Overall Progress</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{project.progress}%</span>
          </div>
          <ProgressBar value={project.progress} size="md" />
        </div>
      </header>

      {/* Main Grid: Workflow timeline & Contacts */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Workflow Timeline (2/3 width) */}
        <section className="md:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>📅</span> Workflow Progress
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Real-time installation and verification pipeline steps.
            </p>
          </div>

          <div className="relative border-l border-zinc-200 pl-6 space-y-6 dark:border-zinc-800 ml-3">
            {sortedWorkflow.map((node) => {
              const completed = isNodeCompleted(node);
              return (
                <div key={node.id} className="relative group">
                  {/* Timeline icon */}
                  <span className={`absolute -left-[35px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-zinc-900 ${
                    completed
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                  }`}>
                    {completed ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    )}
                  </span>

                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {node.title}
                    </h4>
                    {node.description && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {node.description}
                      </p>
                    )}
                    {node.completedAt && (
                      <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Completed on {formatAlertDate(node.completedAt)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contacts Panel (1/3 width) */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6 h-fit">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>📞</span> Site Contacts
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Authorized contacts for questions and updates.
            </p>
          </div>

          <div className="space-y-4">
            {project.siteContacts && project.siteContacts.length > 0 ? (
              project.siteContacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-150 bg-zinc-50/50 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/20"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {contact.designation}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {contact.name || "Unnamed"}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 italic">No site contacts provided.</p>
            )}
          </div>
        </section>
      </div>

      {/* Gallery Section */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>📷</span> Site Photos
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Visual archive of the home automation implementation progress.
          </p>
        </div>

        {photosLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : photos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No photos have been uploaded for this project yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setLightboxUrl(photo.url)}
                className="group aspect-square relative rounded-xl border border-zinc-150 dark:border-zinc-800/80 bg-zinc-50 overflow-hidden shadow-sm hover:shadow-md hover:ring-1 hover:ring-indigo-500/25 transition-all cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`Site photo`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-black/0 p-2 text-white">
                  <p className="text-[9px] text-zinc-300">
                    {photo.uploadedAt ? formatDate(photo.uploadedAt) : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox Zoom Overlay */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center cursor-zoom-out p-4 md:p-8"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white hover:text-zinc-300 transition-colors p-2 bg-zinc-800/40 rounded-full hover:bg-zinc-800/60"
            title="Close viewer"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Site photo zoomed preview"
            className="max-w-full max-h-full rounded-lg object-contain shadow-2xl animate-fade-in"
          />
        </div>
      )}
    </div>
  );
}
