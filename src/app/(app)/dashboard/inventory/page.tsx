"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useInventorySheets } from "@/hooks/useInventorySheets";
import {
  canAddInventorySheet,
  canEditInventorySheet,
  canDeleteInventorySheet,
  canOpenInventorySheet,
} from "@/lib/auth/permissions";
import { formatAlertDate } from "@/lib/utils/dates";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddSheetModal } from "@/components/inventory/AddSheetModal";
import { EditSheetModal } from "@/components/inventory/EditSheetModal";
import { DeleteSheetModal } from "@/components/inventory/DeleteSheetModal";
import type { InventorySheet } from "@/types";

export default function InventoryPage() {
  const { user } = useAuthContext();
  const { sheets, loading } = useInventorySheets();
  const router = useRouter();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<InventorySheet | null>(null);
  const [deletingSheet, setDeletingSheet] = useState<InventorySheet | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  // Close dropdown on scroll or resize to keep position aligned
  useEffect(() => {
    if (!activeDropdownId) return;

    const handleScrollOrResize = () => {
      setActiveDropdownId(null);
      setDropdownPosition(null);
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [activeDropdownId]);

  const handleDropdownToggle = (e: React.MouseEvent<HTMLButtonElement>, sheetId: string) => {
    e.stopPropagation();
    if (activeDropdownId === sheetId) {
      setActiveDropdownId(null);
      setDropdownPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setActiveDropdownId(sheetId);
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 128,
      });
    }
  };

  const allowedToAdd = canAddInventorySheet(user);
  const allowedToEdit = canEditInventorySheet(user);
  const allowedToDelete = canDeleteInventorySheet(user);
  const allowedToOpen = canOpenInventorySheet(user);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-150 pb-4 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Inventory
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage and embed site inventory spreadsheets.
          </p>
        </div>
        {allowedToAdd && (
          <Button
            variant="primary"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 font-medium"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Sheet
          </Button>
        )}
      </div>

      {/* Sheets Content */}
      {sheets.length === 0 ? (
        <EmptyState
          title="No inventory sheets found"
          description="Get started by linking an existing Google Sheets inventory tracking URL."
          action={
            allowedToAdd ? (
              <Button variant="primary" onClick={() => setIsAddOpen(true)}>
                Add Sheet
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <table className="min-w-full table-fixed divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Sheet Name
                  </th>
                  <th style={{ width: "200px" }} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Created By
                  </th>
                  <th style={{ width: "150px" }} className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Created On
                  </th>
                  <th style={{ width: "60px" }} className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Open
                  </th>
                  {(allowedToEdit || allowedToDelete) && (
                    <th style={{ width: "60px" }} className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800/50 bg-white dark:bg-zinc-900">
                {sheets.map((sheet) => (
                  <tr
                    key={sheet.id}
                    onClick={() => router.push(`/dashboard/inventory/${sheet.id}`)}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-0">
                      {sheet.name}
                    </td>
                    <td style={{ width: "200px" }} className="px-6 py-4 text-zinc-600 dark:text-zinc-400 truncate whitespace-nowrap max-w-[200px]">
                      {sheet.createdBy.displayName || sheet.createdBy.email}
                    </td>
                    <td style={{ width: "150px" }} className="px-6 py-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {formatAlertDate(sheet.createdAt)}
                    </td>
                    <td style={{ width: "60px" }} className="px-6 py-4 text-center whitespace-nowrap">
                      {allowedToOpen ? (
                        <a
                          href={sheet.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-605 transition-colors"
                          title="Open in new tab"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-zinc-350 dark:text-zinc-700">—</span>
                      )}
                    </td>
                    {(allowedToEdit || allowedToDelete) && (
                      <td style={{ width: "60px" }} className="px-6 py-4 text-center whitespace-nowrap relative">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => handleDropdownToggle(e, sheet.id)}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-650 dark:hover:text-zinc-300"
                            title="Actions"
                          >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Floating dropdown via portal to prevent clipping */}
          {activeDropdownId && dropdownPosition && typeof document !== "undefined" && createPortal(
            <>
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdownId(null);
                  setDropdownPosition(null);
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                }}
                className="w-32 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg ring-1 ring-black/5 focus:outline-none z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  {allowedToEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const sheet = sheets.find((s) => s.id === activeDropdownId);
                        if (sheet) setEditingSheet(sheet);
                        setActiveDropdownId(null);
                        setDropdownPosition(null);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-zinc-750 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left font-medium"
                    >
                      Edit
                    </button>
                  )}
                  {allowedToDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const sheet = sheets.find((s) => s.id === activeDropdownId);
                        if (sheet) setDeletingSheet(sheet);
                        setActiveDropdownId(null);
                        setDropdownPosition(null);
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm text-red-650 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </>,
            document.body
          )}
        </>
      )}

      {isAddOpen && user && (
        <AddSheetModal open={isAddOpen} onClose={() => setIsAddOpen(false)} user={user} />
      )}
      {editingSheet && (
        <EditSheetModal open={!!editingSheet} onClose={() => setEditingSheet(null)} sheet={editingSheet} />
      )}
      {deletingSheet && (
        <DeleteSheetModal open={!!deletingSheet} onClose={() => setDeletingSheet(null)} sheet={deletingSheet} />
      )}
    </div>
  );
}
