"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { Project } from "@/types";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { canUploadPhoto, canDeletePhoto } from "@/lib/auth/permissions";
import {
  subscribeToProjectPhotos,
  uploadProjectPhoto,
  deleteProjectPhoto,
  updatePhotoCaption,
  type ProjectPhoto,
} from "@/lib/firestore/photos";

interface ProjectPhotosProps {
  project: Project;
}

export function ProjectPhotos({ project }: ProjectPhotosProps) {
  const projectId = project.id;
  const { user } = useAuthContext();
  const canUpload = canUploadPhoto(user, project);
  const canDelete = canDeletePhoto(user, project);

  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [activePhoto, setActivePhoto] = useState<ProjectPhoto | null>(null);
  
  // Ref to trigger hidden file selector click
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time listener for photos
  useEffect(() => {
    const unsubscribe = subscribeToProjectPhotos(projectId, (updatedPhotos) => {
      setPhotos(updatedPhotos);
    });
    return () => unsubscribe();
  }, [projectId]);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canUpload) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Upload Logic
  const handleFilesUpload = async (files: FileList) => {
    if (!canUpload) return;
    setUploading(true);
    setError("");
    setUploadProgress(0);

    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (validFiles.length === 0) {
      setError("Please select valid image files.");
      setUploading(false);
      return;
    }

    try {
      const total = validFiles.length;
      for (let i = 0; i < total; i++) {
        setUploadProgress(Math.round(((i) / total) * 100));
        await uploadProjectPhoto(projectId, validFiles[i]);
      }
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      setError("Failed to upload one or more photos.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Drag Drop Handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canUpload) return;
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  // Input Selection Handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUpload) return;
    if (e.target.files && e.target.files.length > 0) {
      handleFilesUpload(e.target.files);
    }
  };

  // Click Upload Trigger
  const triggerFileSelect = () => {
    if (!canUpload) return;
    fileInputRef.current?.click();
  };

  // Deletion Logic
  const handleDelete = async (photo: ProjectPhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDelete) return;
    if (window.confirm("Are you sure you want to delete this photo?")) {
      try {
        await deleteProjectPhoto(projectId, photo.id, photo.storagePath);
        if (activePhoto?.id === photo.id) {
          setActivePhoto(null);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to delete photo.");
      }
    }
  };

  // Caption Editing State Helper Component
  function CaptionItem({ photo, disabled }: { photo: ProjectPhoto; disabled: boolean }) {
    const [isEditing, setIsEditing] = useState(false);
    const [captionText, setCaptionText] = useState(photo.caption || "");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isEditing) {
        inputRef.current?.focus();
      }
    }, [isEditing]);

    const handleSave = async () => {
      setIsEditing(false);
      if (captionText.trim() !== photo.caption) {
        try {
          await updatePhotoCaption(projectId, photo.id, captionText.trim());
        } catch (err) {
          console.error(err);
        }
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSave();
      } else if (e.key === "Escape") {
        setCaptionText(photo.caption || "");
        setIsEditing(false);
      }
    };

    if (isEditing && !disabled) {
      return (
        <input
          ref={inputRef}
          type="text"
          value={captionText}
          onChange={(e) => setCaptionText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          placeholder="Add a caption..."
        />
      );
    }

    return (
      <p
        onClick={(e) => {
          if (disabled) return;
          e.stopPropagation();
          setIsEditing(true);
        }}
        className={disabled ? "text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate" : "cursor-pointer truncate text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"}
        title={photo.caption || (disabled ? "" : "Click to add caption")}
      >
        {photo.caption || (disabled ? "" : <span className="italic text-zinc-400">Add a caption...</span>)}
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-md font-semibold text-zinc-900 dark:text-zinc-100">
          <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Project Photos
        </h2>
        
        {/* Simple Visible Upload Trigger Button */}
        {canUpload && (
          <button
            onClick={triggerFileSelect}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:bg-indigo-400 dark:bg-indigo-50 dark:hover:bg-indigo-600 dark:focus:ring-offset-zinc-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Photos
          </button>
        )}
      </div>

      {/* Hidden file input supporting multiple selection, camera capture for mobile */}
      {canUpload && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      )}

      {/* Drag & Drop Zone */}
      {canUpload && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`group relative mb-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/40 dark:border-indigo-400 dark:bg-indigo-950/20"
              : "border-zinc-200 bg-zinc-50/50 hover:border-indigo-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/30 dark:hover:border-zinc-700"
          }`}
        >
          <div className="pointer-events-none flex flex-col items-center">
            <svg
              className={`h-10 w-10 text-zinc-400 transition-all group-hover:scale-110 dark:text-zinc-500 ${
                dragActive ? "text-indigo-500 dark:text-indigo-400" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Drag & drop images here
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              or click to select from your device / open camera
            </p>
          </div>
        </div>
      )}

      {/* Progress & Error States */}
      {uploading && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            <span>Uploading images...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-500"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mb-4 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Gallery Grid */}
      {photos.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No photos uploaded yet for this project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setActivePhoto(photo)}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/20"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-square w-full overflow-hidden">
                <Image
                  src={photo.imageUrl}
                  alt={photo.caption || photo.fileName}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Deletion Hover Overlay */}
                {canDelete && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-start justify-end p-2">
                    <button
                      onClick={(e) => handleDelete(photo, e)}
                      className="rounded-lg bg-red-600/90 p-1.5 text-white shadow-sm transition-all hover:bg-red-600"
                      title="Delete Photo"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Caption Section */}
              <div className="bg-white p-2.5 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800/80">
                <CaptionItem photo={photo} disabled={!canUpload} />
                <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                  {photo.uploadedAt
                    ? new Date(photo.uploadedAt.toDate()).toLocaleDateString()
                    : "Uploading..."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Preview Modal */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActivePhoto(null)}
        >
          {/* Close Trigger Button */}
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute right-4 top-4 rounded-full bg-zinc-800/80 p-2.5 text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Full Screen Image Frame */}
          <div
            className="relative max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video w-full">
              <Image
                src={activePhoto.imageUrl}
                alt={activePhoto.caption || activePhoto.fileName}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Details Bar */}
          <div
            className="mt-4 w-full max-w-4xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-md font-bold text-white">
              {activePhoto.caption || activePhoto.fileName}
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Uploaded on{" "}
              {activePhoto.uploadedAt
                ? new Date(activePhoto.uploadedAt.toDate()).toLocaleString()
                : "—"}
            </p>
            
            <div className="mt-3 flex justify-center gap-3">
              {/* Download Option */}
              <a
                href={activePhoto.imageUrl}
                target="_blank"
                rel="noreferrer"
                download={activePhoto.fileName}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-750"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Original
              </a>
              
              {/* Deletion Option */}
              {canDelete && (
                <button
                  onClick={(e) => handleDelete(activePhoto, e)}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-950/80 px-3.5 py-1.5 text-xs font-semibold text-red-300 border border-red-900/50 hover:bg-red-900/80"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
