import React from 'react'
import { Upload, FileImage, X } from 'lucide-react'
import { FloorPlanEditor } from '../FloorPlanViewer/FloorPlanEditor'
import { useApp } from '../../context/AppContext'

export function FloorPlanTab({ quote, onChange }) {
  const { products } = useApp()

  const handleFile = (file) => {
    if (!file) return
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowed.includes(file.type)) { alert('Please upload a PDF, JPG, or PNG file.'); return }
    const reader = new FileReader()
    reader.onload = (e) => onChange({
      ...quote,
      floorPlan: { data: e.target.result, mimeType: file.type, fileName: file.name },
      floorPlanZones: [],
    })
    reader.readAsDataURL(file)
  }

  const handleRemove = () => onChange({ ...quote, floorPlan: null, floorPlanZones: [] })

  // When zones change, also sync to rooms (zones share id with rooms)
  const handleZonesChange = (zones) => {
    const zoneIds    = new Set(zones.map(z => z.id))
    const presetRooms = (quote.rooms || []).filter(r =>
      !zoneIds.has(r.id) && !(quote.floorPlanZones || []).some(z => z.id === r.id)
    )
    const zoneRooms = zones.map(z => {
      // Aggregate devices into products list for pricing engine
      const devicesMap = {}
      ;(z.devices || []).forEach(d => {
        if (!devicesMap[d.productId]) devicesMap[d.productId] = { productId: d.productId, qty: 0 }
        devicesMap[d.productId].qty += d.qty
      })
      return { id: z.id, name: z.name, type: 'Other', products: Object.values(devicesMap) }
    })
    onChange({ ...quote, floorPlanZones: zones, rooms: [...presetRooms, ...zoneRooms] })
  }

  if (!quote.floorPlan?.data) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
          onDragOver={e => e.preventDefault()}
          onClick={() => document.getElementById('fp-input').click()}
          className="rounded-2xl p-16 text-center cursor-pointer transition-all"
          style={{ border: '2px dashed var(--border)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <Upload className="w-7 h-7" style={{ color: 'var(--gold)' }}/>
          </div>
          <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Upload Floor Plan</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            PDF, JPG or PNG · Max 10MB
          </p>
          <button type="button" className="btn-primary px-8 py-2.5 text-sm">Browse File</button>
          <input id="fp-input" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
            onChange={e => handleFile(e.target.files[0])}/>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          {[
            { step: '1', text: 'Upload your floor plan PDF or image' },
            { step: '2', text: 'Draw zones around each room' },
            { step: '3', text: 'Drag products from the sidebar into zones' },
          ].map(({ step, text }) => (
            <div key={step} className="px-3 py-4 rounded-2xl"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-black"
                   style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.2)' }}>
                {step}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 160px)', minHeight: '600px' }}>
      {/* File bar */}
      <div className="flex items-center justify-between px-5 py-2.5 shrink-0"
           style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
               style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}>
            <FileImage className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }}/>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{quote.floorPlan.fileName}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {(quote.floorPlanZones || []).length} zone{(quote.floorPlanZones || []).length !== 1 ? 's' : ''} drawn
              {(quote.floorPlanZones || []).length > 0 && ' · synced with BOQ'}
            </p>
          </div>
        </div>
        <button onClick={handleRemove} className="p-1.5 rounded-lg transition-all"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}>
          <X className="w-4 h-4"/>
        </button>
      </div>

      {/* Editor — fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <FloorPlanEditor
          floorPlan={quote.floorPlan}
          zones={quote.floorPlanZones || []}
          onZonesChange={handleZonesChange}
          products={products}
        />
      </div>
    </div>
  )
}
