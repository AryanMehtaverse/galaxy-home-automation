"use client";

import { useEffect, useRef, useState } from "react";
import { uploadSitePhoto, subscribeToSitePhotos } from "@/lib/firestore/siteOperations";
import { useAuthContext } from "@/components/providers/AuthProvider";
import type { SitePhoto } from "@/types/site";

const CATEGORIES: SitePhoto["category"][] = ["Before Work", "During Work", "After Work"];

interface Props {
  siteId: string;
}

export function PhotoUpload({ siteId }: Props) {
  const { user } = useAuthContext();
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SitePhoto["category"]>("Before Work");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return subscribeToSitePhotos(siteId, setPhotos);
  }, [siteId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    setError(null);
    try {
      await uploadSitePhoto(siteId, selectedFile, selectedCategory, user.uid, user.displayName);
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDiscard = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = photos.filter((p) => p.category === cat);
    return acc;
  }, {} as Record<SitePhoto["category"], SitePhoto[]>);

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as SitePhoto["category"])}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Choose Photo
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {preview && (
          <div className="space-y-3">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-64 object-contain rounded-lg border border-zinc-200 dark:border-zinc-700"
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {uploading ? "Uploading…" : "Upload Photo"}
              </button>
              <button
                onClick={handleDiscard}
                disabled={uploading}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Photo gallery by category */}
      {CATEGORIES.map((cat) => (
        grouped[cat].length > 0 && (
          <div key={cat}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">{cat}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {grouped[cat].map((photo) => (
                <a key={photo.id} href={photo.imageUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={photo.imageUrl}
                    alt={cat}
                    className="w-full h-28 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 hover:opacity-90 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        )
      ))}

      {photos.length === 0 && !preview && (
        <p className="text-center text-sm text-zinc-400 py-4">No photos uploaded yet.</p>
      )}
    </div>
  );
}
