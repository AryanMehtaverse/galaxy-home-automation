"use client";

import { use } from "react";
import Link from "next/link";
import { useInventorySheet } from "@/hooks/useInventorySheet";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

interface InventoryDetailPageProps {
  params: Promise<{ sheetId: string }>;
}

export default function InventoryDetailPage({ params }: InventoryDetailPageProps) {
  const { sheetId } = use(params);
  const { sheet, loading } = useInventorySheet(sheetId);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!sheet) {
    return (
      <EmptyState
        title="Inventory sheet not found"
        description="The spreadsheet you are trying to view does not exist or has been deleted."
        action={
          <Link href="/dashboard/inventory">
            <Button variant="secondary">Back to Inventory</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/inventory"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 font-medium hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Inventory
        </Link>
      </div>

      {/* Header and Action Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-150 pb-4 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate" title={sheet.name}>
            {sheet.name}
          </h1>
        </div>

        {/* Action Button to Open in new tab */}
        <a href={sheet.originalUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" className="flex items-center gap-1.5 font-medium border border-zinc-200 dark:border-zinc-800">
            <svg className="h-4 w-4 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in Google Sheets
          </Button>
        </a>
      </div>

      {/* Embedded Iframe Container */}
      <div className="w-full flex-1 min-h-[550px] md:min-h-[650px] lg:min-h-[750px] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
        <iframe
          src={sheet.embedUrl}
          title={sheet.name}
          className="w-full h-full min-h-[550px] md:min-h-[650px] lg:min-h-[750px] border-none"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}
