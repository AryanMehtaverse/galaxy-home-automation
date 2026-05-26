"use client";

import { useState, useEffect } from "react";
import type { Project, ProjectStatus } from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { updateProject } from "@/lib/firestore/projects";
import { PROJECT_STATUSES } from "@/lib/constants";

interface SiteDetailsCardProps {
  project: Project;
}

export function SiteDetailsCard({ project }: SiteDetailsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit form states
  const [name, setName] = useState(project.name);
  const [clientName, setClientName] = useState(project.clientName);
  const [deadline, setDeadline] = useState(project.deadline ? project.deadline.split("T")[0] : "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [address, setAddress] = useState(project.address ?? "");
  const [city, setCity] = useState(project.city ?? "");
  const [landmark, setLandmark] = useState(project.landmark ?? "");
  const [googleMapsLink, setGoogleMapsLink] = useState(project.googleMapsLink ?? "");
  const [clientPhone, setClientPhone] = useState(project.clientPhone ?? "");
  const [startDate, setStartDate] = useState(project.startDate ?? "");

  // Sync state with project updates from Firestore subscription
  useEffect(() => {
    setName(project.name);
    setClientName(project.clientName);
    setDeadline(project.deadline ? project.deadline.split("T")[0] : "");
    setStatus(project.status);
    setAddress(project.address ?? "");
    setCity(project.city ?? "");
    setLandmark(project.landmark ?? "");
    setGoogleMapsLink(project.googleMapsLink ?? "");
    setClientPhone(project.clientPhone ?? "");
    setStartDate(project.startDate ?? "");
  }, [project]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await updateProject(project.id, {
        name,
        clientName,
        deadline: deadline,
        status,
        address,
        city,
        landmark,
        googleMapsLink,
        clientPhone,
        startDate: startDate,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project details");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(project.name);
    setClientName(project.clientName);
    setDeadline(project.deadline ? project.deadline.split("T")[0] : "");
    setStatus(project.status);
    setAddress(project.address ?? "");
    setCity(project.city ?? "");
    setLandmark(project.landmark ?? "");
    setGoogleMapsLink(project.googleMapsLink ?? "");
    setClientPhone(project.clientPhone ?? "");
    setError("");
    setIsEditing(false);
  };

  const isValidHttpUrl = (str: string) => {
    try {
      const url = new URL(str);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  if (isEditing) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-md font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Project & Site Details
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Project Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Project Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Client Name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Select
                  label="Status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  options={PROJECT_STATUSES}
                />
              </div>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Location & Site Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Client Phone Number"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 123 Automation Way"
                />
              </div>
              <div>
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. San Francisco"
                />
              </div>
              <div>
                <Input
                  label="Landmark"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Transamerica Pyramid"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Google Maps Link"
                  type="url"
                  value={googleMapsLink}
                  onChange={(e) => setGoogleMapsLink(e.target.value)}
                  placeholder="e.g. https://maps.app.goo.gl/..."
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save Details"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Render view mode
  const hasSiteDetails = address || city || landmark || googleMapsLink || clientPhone;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-md font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Site & Client Details
        </h2>
        <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Details
          </span>
        </Button>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Start Date: {project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}</p>

      {!hasSiteDetails ? (
        <div className="rounded-lg border border-dashed border-zinc-200 p-4 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No site details or contact numbers have been saved yet.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Add Details Now
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Column 1: Client phone & Location */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Client Contact
              </span>
              <div className="mt-1 flex items-center gap-2">
                <svg className="h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.24.96l-1.35 1.35a11.047 11.047 0 004.8 4.8l1.35-1.35a1 1 0 01.96-.24l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {clientPhone ? (
                  <a
                    href={`tel:${clientPhone}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300 break-all"
                  >
                    {clientPhone}
                  </a>
                ) : (
                  <span className="text-sm text-zinc-400 dark:text-zinc-500 italic">
                    Not provided
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Site Address
              </span>
              <div className="mt-1 flex items-start gap-2">
                <svg className="h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm text-zinc-700 dark:text-zinc-300 break-words font-medium">
                  {address || <span className="text-zinc-400 dark:text-zinc-500 italic font-normal">Not provided</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: City, Landmark, Maps */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  City
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <svg className="h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2m0 0l.35 2.84A3 3 0 0020.2 16h1.4" />
                  </svg>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                    {city || <span className="text-zinc-400 dark:text-zinc-500 italic font-normal">Not provided</span>}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Landmark
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <svg className="h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                    {landmark || <span className="text-zinc-400 dark:text-zinc-500 italic font-normal">Not provided</span>}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Google Maps Location
              </span>
              <div className="mt-1 flex items-center gap-2">
                <svg className="h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {googleMapsLink ? (
                  <a
                    href={isValidHttpUrl(googleMapsLink) ? googleMapsLink : `https://${googleMapsLink.replace(/^(https?:\/\/)?/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center gap-1"
                  >
                    Open Google Maps
                  </a>
                ) : (
                  <span className="text-sm text-zinc-400 dark:text-zinc-500 italic">
                    No map link provided
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
