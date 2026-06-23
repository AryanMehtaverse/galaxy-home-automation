'use client'

import { useState, useRef, useCallback } from 'react'
import { MousePointer2, PenLine, Trash2, Check, X, ZoomIn, ZoomOut } from 'lucide-react'
import { AddProductModal } from './AddProductModal'
import { formatCurrency } from '@/lib/pricingEngine'
import type { CatalogProduct } from '@/types/quote'

const FILLS = [
  'rgba(212,175,55,0.22)', 'rgba(99,148,248,0.22)', 'rgba(107,203,119,0.22)',
  'rgba(255,107,107,0.22)', 'rgba(196,144,228,0.22)', 'rgba(255,159,67,0.22)',
  'rgba(20,184,166,0.22)', 'rgba(244,63,94,0.22)',
]
const STROKES = ['#D4AF37', '#6394F8', '#6BCB77', '#FF6B6B', '#C490E4', '#FF9F43', '#14B8A6', '#F43F5E']

interface Point { x: number; y: number }
export interface Zone {
  id: string
  name: string
  fill: string
  stroke: string
  points: Point[]
  products: { productId: string; qty: number }[]
}

interface FloorPlan {
  url: string
  mimeType: string
  fileName: string
}

interface Props {
  floorPlan: FloorPlan
  zones: Zone[]
  onZonesChange: (zones: Zone[]) => void
  rooms: { id: string; name: string; products: { productId: string; qty: number }[] }[]
  onRoomsChange: (rooms: { id: string; name: string; products: { productId: string; qty: number }[] }[]) => void
  products: CatalogProduct[]
}

const centroid = (pts: Point[]) => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
})
const dist = (a: Point, b: Point) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

function toSVGPct(e: React.MouseEvent, el: SVGSVGElement): Point {
  const r = el.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
    y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
  }
}

export function FloorPlanCanvas({ floorPlan, zones, onZonesChange, rooms, onRoomsChange, products }: Props) {
  const [mode, setMode] = useState<'select' | 'draw'>('select')
  const [drawing, setDrawing] = useState<Point[]>([])
  const [hoverPt, setHoverPt] = useState<Point | null>(null)
  const [naming, setNaming] = useState<Point[] | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [scale, setScale] = useState(1.0)
  const svgRef = useRef<SVGSVGElement>(null)

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (mode !== 'draw' || !svgRef.current) return
    const pt = toSVGPct(e, svgRef.current)
    if (drawing.length >= 3 && dist(pt, drawing[0]) < 3) {
      setNaming(drawing)
      setDrawing([])
      setHoverPt(null)
      setNameInput(`Room ${zones.length + 1}`)
      return
    }
    setDrawing((prev) => [...prev, pt])
  }, [mode, drawing, zones.length])

  const handleDblClick = useCallback((e: React.MouseEvent) => {
    if (mode !== 'draw') return
    e.preventDefault()
    if (drawing.length >= 3) {
      setNaming(drawing)
      setDrawing([])
      setHoverPt(null)
      setNameInput(`Room ${zones.length + 1}`)
    }
  }, [mode, drawing, zones.length])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (mode === 'draw' && svgRef.current) setHoverPt(toSVGPct(e, svgRef.current))
  }, [mode])

  const confirmZone = () => {
    if (!naming || !nameInput.trim()) return
    const idx = zones.length % FILLS.length
    const id = crypto.randomUUID()
    const newZone: Zone = { id, name: nameInput.trim(), fill: FILLS[idx], stroke: STROKES[idx], points: naming, products: [] }
    onZonesChange([...zones, newZone])
    onRoomsChange([...rooms, { id, name: nameInput.trim(), products: [] }])
    setNaming(null)
    setNameInput('')
    setMode('select')
  }

  const cancelZone = () => { setNaming(null); setNameInput(''); setDrawing([]); setHoverPt(null) }

  const deleteZone = (id: string) => {
    onZonesChange(zones.filter((z) => z.id !== id))
    onRoomsChange(rooms.filter((r) => r.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const saveProducts = (zoneId: string, newProducts: { productId: string; qty: number }[]) => {
    onZonesChange(zones.map((z) => z.id === zoneId ? { ...z, products: newProducts } : z))
    onRoomsChange(rooms.map((r) => r.id === zoneId ? { ...r, products: newProducts } : r))
    setAddingTo(null)
  }

  const pts2str = (pts: Point[]) => pts.map((p) => `${p.x},${p.y}`).join(' ')
  const addingZone = zones.find((z) => z.id === addingTo)

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
          {([
            { m: 'select' as const, Icon: MousePointer2, label: 'Select' },
            { m: 'draw' as const, Icon: PenLine, label: 'Draw Zone' },
          ]).map(({ m, Icon, label }) => (
            <button
              key={m}
              onClick={() => { setMode(m); setDrawing([]); setHoverPt(null) }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-[#C9A840] text-zinc-900'
                  : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <button onClick={() => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)))} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-medium w-10 text-center text-zinc-500">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(3, +(s + 0.25).toFixed(2)))} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {zones.length > 0 && (
          <span className="ml-auto text-xs font-medium px-3 py-2 rounded-xl bg-[#C9A840]/10 text-[#C9A840] border border-[#C9A840]/20">
            {zones.length} zone{zones.length !== 1 ? 's' : ''} · synced with Rooms
          </span>
        )}
      </div>

      {/* Draw hint */}
      {mode === 'draw' && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs bg-[#C9A840]/5 border border-dashed border-[#C9A840]/30 text-[#C9A840]">
          <PenLine className="w-3.5 h-3.5 shrink-0" />
          {drawing.length === 0
            ? 'Click on the floor plan to start drawing a room boundary'
            : drawing.length < 3
            ? `${drawing.length} point${drawing.length > 1 ? 's' : ''} placed — add more`
            : 'Click near the first point (or double-click) to close the zone'}
        </div>
      )}

      {/* Zone name input */}
      {naming && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-[#C9A840]/30">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">Zone name:</span>
          <input
            autoFocus
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmZone(); if (e.key === 'Escape') cancelZone() }}
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:border-[#C9A840]"
            placeholder="e.g. Living Room"
          />
          <button onClick={confirmZone} className="p-2 rounded-lg bg-[#C9A840] text-zinc-900"><Check className="w-4 h-4" /></button>
          <button onClick={cancelZone} className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-500"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Canvas */}
      <div
        className="relative rounded-2xl overflow-auto"
        style={{ border: '1px solid #27272a', background: '#0A0A0F', cursor: mode === 'draw' ? 'crosshair' : 'default' }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}>
          {/* Floor plan image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={floorPlan.url}
            alt="Floor plan"
            className="w-full object-contain max-h-[70vh]"
            style={{ display: 'block' }}
          />

          {/* SVG overlay */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            onClick={handleClick}
            onDoubleClick={handleDblClick}
            onMouseMove={handleMouseMove}
            style={{ pointerEvents: mode === 'select' ? 'none' : 'all' }}
          >
            {/* Completed zones */}
            {zones.map((zone) => {
              const c = centroid(zone.points)
              const sel = selectedId === zone.id
              return (
                <g
                  key={zone.id}
                  style={{ pointerEvents: mode === 'select' ? 'all' : 'none', cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(sel ? null : zone.id) }}
                >
                  <polygon
                    points={pts2str(zone.points)}
                    fill={zone.fill}
                    stroke={zone.stroke}
                    strokeWidth={sel ? 0.55 : 0.3}
                    strokeDasharray={sel ? '2 1' : 'none'}
                  />
                  <rect x={c.x - 9} y={c.y - 3.5} width={18} height={7} rx={1.5} fill="rgba(0,0,0,0.7)" />
                  <text
                    x={c.x} y={c.y + 1.2}
                    textAnchor="middle" fontSize="2.6" fontWeight="600"
                    fill={zone.stroke}
                    style={{ fontFamily: 'system-ui,sans-serif', pointerEvents: 'none' }}
                  >
                    {zone.name}
                  </text>
                </g>
              )
            })}

            {/* In-progress polygon */}
            {drawing.length > 0 && (
              <g style={{ pointerEvents: 'none' }}>
                {hoverPt && (
                  <line
                    x1={drawing[drawing.length - 1].x} y1={drawing[drawing.length - 1].y}
                    x2={hoverPt.x} y2={hoverPt.y}
                    stroke="#D4AF37" strokeWidth="0.3" strokeDasharray="1.5 1"
                  />
                )}
                {drawing.length >= 2 && (
                  <polyline
                    points={drawing.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none" stroke="#D4AF37" strokeWidth="0.35" strokeDasharray="2 1"
                  />
                )}
                {drawing.map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r={i === 0 ? 1.2 : 0.7}
                    fill={i === 0 ? '#D4AF37' : '#fff'} stroke="#D4AF37" strokeWidth="0.3" />
                ))}
              </g>
            )}
          </svg>

          {/* Zone action buttons */}
          {mode === 'select' && zones.map((zone) => {
            const c = centroid(zone.points)
            return (
              <div
                key={`btn-${zone.id}`}
                className="absolute flex flex-col items-center gap-1"
                style={{ left: `${c.x}%`, top: `${c.y + 5}%`, transform: 'translate(-50%,0)', zIndex: 10 }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setAddingTo(zone.id) }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-base font-bold shadow-lg hover:scale-110 transition-transform"
                  style={{ background: zone.stroke, color: '#0A0808', boxShadow: `0 2px 10px ${zone.stroke}80` }}
                >+</button>
                {zone.products?.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.75)', color: zone.stroke }}>
                    {zone.products.length} items
                  </span>
                )}
                {selectedId === zone.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteZone(zone.id) }}
                    className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-red-500 text-white"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Zone summary */}
      {zones.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest px-1 text-zinc-500">Zones · synced with Rooms tab</p>
          {zones.map((zone) => {
            const total = (zone.products || []).reduce((s, rp) => {
              const p = products.find((x) => x.id === rp.productId)
              return s + (p ? ((p.gsp || p.price || 0) as number) * rp.qty : 0)
            }, 0)
            return (
              <div
                key={zone.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border"
                style={{ borderColor: zone.stroke + '33' }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: zone.stroke }} />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{zone.name}</span>
                  <span className="text-xs text-zinc-400">
                    {zone.products?.length || 0} product type{zone.products?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {total > 0 && <span className="text-sm font-bold text-[#C9A840]">{formatCurrency(total)}</span>}
                  <button
                    onClick={() => setAddingTo(zone.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: zone.stroke, border: `1px solid ${zone.stroke}44`, background: `${zone.stroke}11` }}
                  >
                    {zone.products?.length > 0 ? 'Edit Products' : '+ Add Products'}
                  </button>
                  <button onClick={() => deleteZone(zone.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Product modal */}
      {addingTo && addingZone && (
        <AddProductModal
          roomName={addingZone.name}
          products={products}
          currentProducts={addingZone.products || []}
          onSave={(newProducts) => saveProducts(addingTo, newProducts)}
          onClose={() => setAddingTo(null)}
        />
      )}
    </div>
  )
}
