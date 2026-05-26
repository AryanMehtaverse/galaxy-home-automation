"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createProject } from "@/lib/firestore/projects";
import { toProjectCreator } from "@/lib/auth/user";
import { PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectStatus } from "@/types";

export function ProjectForm() {
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planning");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [landmark, setLandmark] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const id = await createProject(
        {
          name,
          clientName,
          ...(deadline ? { deadline } : {}),
          status,
          address,
          city,
          landmark,
          googleMapsLink,
          clientPhone,
        },
        toProjectCreator(user)
      );
      router.push(`/projects/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          General Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Villa Lighting & Automation"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Client Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. John Smith"
              required
            />
          </div>
          <div>
            <Input
              label="Deadline (optional)"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div>
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              options={PROJECT_STATUSES}
            />
          </div>
        </div>
      </div>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Site & Location Details
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
              placeholder="e.g. Flat 402, Sunset Heights"
            />
          </div>
          <div>
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Mumbai"
            />
          </div>
          <div>
            <Input
              label="Landmark"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near Central Park"
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
          {loading ? "Creating…" : "Create Project"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>

      <p className="text-xs text-zinc-500">
        New projects include the full home automation workflow template. You can
        modify all details later from the project page.
      </p>
    </form>
  );
}
