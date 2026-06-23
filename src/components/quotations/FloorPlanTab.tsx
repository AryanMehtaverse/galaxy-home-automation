'use client'

import { useState } from 'react'
import { Upload, FileImage, X } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { FloorPlanCanvas, type Zone } from './FloorPlanCanvas'
import type { CatalogProduct, QuoteRoom } from '@/types/quote'

interface FloorPlan {
  url: string
  mimeType: string
  fileName: string
}

interface Props {
  quoteId: string
  floorPlan?: FloorPlan | null
  floorPlanZones?: Zone[]
  rooms: QuoteRoom[]
  products: CatalogProduct[]
  onFloorPlanChange: (fp: FloorPlan | null) => void
  onZonesChange: (zones: Zone[]) => void
  onRoomsChange: (rooms: QuoteRoom[]) => void
}

export function FloorPlanTab({
  quoteId, floorPlan, floorPlanZones = [], rooms, products,
  onFloorPlanChange, onZonesChange, onRoomsChange,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (!file) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Please upload a PDF, JPG, PNG, or WebP file.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File is too large. Maximum 20MB.')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const storageRef = ref(storage, `floorPlans/${quoteId}/${Date.now()}-${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      onFloorPlanChange({ url, mimeType: file.type, fileName: file.name })
      // Reset zones when new floor plan is uploaded
      onZonesChange([])
    } catch (e) {
      setError(`Upload failed: ${String(e)}`)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    onFloorPlanChange(null)
    onZonesChange([])
  }

  if (!floorPlan?.url) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('fp-input')?.click()}
          className="rounded-2xl p-16 text-center cursor-pointer transition-all border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#C9A840] dark:hover:border-[#C9A840]"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-[#C9A840]" />
              <p className="text-sm text-zinc-500">Uploading floor plan…</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-[#C9A840]/10 border border-[#C9A840]/20">
                <Upload className="w-7 h-7 text-[#C9A840]" />
              </div>
              <p className="text-lg font-bold mb-2 text-zinc-900 dark:text-zinc-100">Upload Floor Plan</p>
              <p className="text-sm mb-6 text-zinc-400">PDF, JPG or PNG · Max 20MB</p>
              <button type="button" className="rounded-lg bg-[#C9A840] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#b8962e] transition-colors">
                Browse File
              </button>
            </>
          )}
          <input
            id="fp-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          {[
            { step: '1', text: 'Upload your floor plan image or PDF' },
            { step: '2', text: 'Draw zones around each room' },
            { step: '3', text: 'Click + on each zone to add products' },
          ].map(({ step, text }) => (
            <div key={step} className="px-3 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-black bg-[#C9A840]/10 text-[#C9A840] border border-[#C9A840]/20">
                {step}
              </div>
              <p className="text-xs text-zinc-500">{text}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ minHeight: '600px' }}>
      {/* File bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#C9A840]/10 border border-[#C9A840]/20">
            <FileImage className="w-3.5 h-3.5 text-[#C9A840]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{floorPlan.fileName}</p>
            <p className="text-[10px] text-zinc-400">
              {floorPlanZones.length} zone{floorPlanZones.length !== 1 ? 's' : ''} drawn
              {floorPlanZones.length > 0 && ' · synced with Rooms'}
            </p>
          </div>
        </div>
        <button onClick={handleRemove} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-y-auto p-4">
        <FloorPlanCanvas
          floorPlan={floorPlan}
          zones={floorPlanZones}
          onZonesChange={onZonesChange}
          rooms={rooms}
          onRoomsChange={onRoomsChange}
          products={products}
        />
      </div>
    </div>
  )
}
