import React, { useState } from 'react'
import { Document, Page } from 'react-pdf'
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'

export function FloorPlanViewer({ floorPlan }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)

  if (!floorPlan?.data) return null

  const isPDF = floorPlan.mimeType === 'application/pdf'

  if (!isPDF) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
        <img
          src={floorPlan.data}
          alt={floorPlan.fileName}
          className="max-w-full max-h-[600px] object-contain"
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between bg-galaxy-800 text-white px-4 py-2 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="p-1.5 hover:bg-white/20 rounded-lg disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm">
            Page {pageNumber} / {numPages || '…'}
          </span>
          <button
            onClick={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))}
            disabled={pageNumber >= (numPages || 1)}
            className="p-1.5 hover:bg-white/20 rounded-lg disabled:opacity-40 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, parseFloat((s - 0.25).toFixed(2))))}
            className="p-1.5 hover:bg-white/20 rounded-lg transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm w-14 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(3.0, parseFloat((s + 0.25).toFixed(2))))}
            className="p-1.5 hover:bg-white/20 rounded-lg transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="bg-gray-100 rounded-xl p-4 overflow-auto max-h-[600px] flex justify-center">
        <Document
          file={floorPlan.data}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={(e) => console.error('PDF load error', e)}
          loading={<div className="text-gray-400 text-sm py-8">Loading PDF…</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg rounded"
          />
        </Document>
      </div>
    </div>
  )
}
