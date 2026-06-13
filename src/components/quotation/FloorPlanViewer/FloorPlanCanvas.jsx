import React, { useState, useRef, useCallback } from 'react'
import { Document, Page } from 'react-pdf'
import {
  MousePointer2, PenLine, Trash2,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Check, X,
} from 'lucide-react'
import { AddProductModal } from '../RoomCard/AddProductModal'
import { formatCurrency } from '../../utils/formatters'

// ── Colour palette ────────────────────────────────────────────────────────────
const FILLS   = ['rgba(212,175,55,0.28)','rgba(99,148,248,0.28)','rgba(107,203,119,0.28)',
                  'rgba(255,107,107,0.28)','rgba(196,144,228,0.28)','rgba(255,159,67,0.28)']
const STROKES = ['#D4AF37','#6394F8','#6BCB77','#FF6B6B','#C490E4','#FF9F43']

const centroid = (pts) => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
})
const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

function toSVGPct(e, el) {
  const r = el.getBoundingClientRect()
  return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
}

// ── Main component ────────────────────────────────────────────────────────────
export function FloorPlanCanvas({ floorPlan, zones = [], onZonesChange, products = [], rooms = [], onRoomsChange }) {
  const [mode, setMode]           = useState('select')
  const [drawing, setDrawing]     = useState([])
  const [hoverPt, setHoverPt]     = useState(null)
  const [naming, setNaming]       = useState(null)   // finished polygon, pending name
  const [nameInput, setNameInput] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [addingTo, setAddingTo]   = useState(null)   // zone id
  const [scale, setScale]         = useState(1.0)
  const [pageNumber, setPageNumber] = useState(1)
  const [numPages, setNumPages]   = useState(null)
  const svgRef = useRef(null)
  const isPDF  = floorPlan?.mimeType === 'application/pdf'

  // ── Sync helpers ─────────────────────────────────────────────────────────
  // A zone and its linked room share the same id
  const syncRoomProducts = (zoneId, newProducts, currentRooms) => {
    return currentRooms.map(r => r.id === zoneId ? { ...r, products: newProducts } : r)
  }

  // ── Drawing ───────────────────────────────────────────────────────────────
  const handleClick = useCallback((e) => {
    if (mode !== 'draw' || !svgRef.current) return
    const pt = toSVGPct(e, svgRef.current)
    if (drawing.length >= 3 && dist(pt, drawing[0]) < 3) {
      setNaming(drawing)
      setDrawing([])
      setHoverPt(null)
      setNameInput(`Room ${zones.length + 1}`)
      return
    }
    setDrawing(prev => [...prev, pt])
  }, [mode, drawing, zones.length])

  const handleDblClick = useCallback((e) => {
    if (mode !== 'draw') return
    e.preventDefault()
    if (drawing.length >= 3) {
      setNaming(drawing)
      setDrawing([])
      setHoverPt(null)
      setNameInput(`Room ${zones.length + 1}`)
    }
  }, [mode, drawing, zones.length])

  const handleMouseMove = useCallback((e) => {
    if (mode === 'draw' && svgRef.current) setHoverPt(toSVGPct(e, svgRef.current))
  }, [mode])

  // ── Confirm new zone → also create room ──────────────────────────────────
  const confirmZone = () => {
    if (!naming || !nameInput.trim()) return
    const idx = zones.length % FILLS.length
    const id  = crypto.randomUUID()
    const newZone = {
      id, name: nameInput.trim(),
      fill: FILLS[idx], stroke: STROKES[idx],
      points: naming, products: [],
    }
    // Mirror as a room
    const newRoom = {
      id, name: nameInput.trim(), type: 'Other', products: [],
    }
    onZonesChange([...zones, newZone])
    onRoomsChange([...rooms, newRoom])
    setNaming(null)
    setNameInput('')
    setMode('select')
  }

  const cancelZone = () => { setNaming(null); setNameInput(''); setDrawing([]); setHoverPt(null) }

  // ── Delete zone → also remove room ───────────────────────────────────────
  const deleteZone = (id) => {
    onZonesChange(zones.filter(z => z.id !== id))
    onRoomsChange(rooms.filter(r => r.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  // ── Save products → sync to room ─────────────────────────────────────────
  const saveProducts = (zoneId, newProducts) => {
    onZonesChange(zones.map(z => z.id === zoneId ? { ...z, products: newProducts } : z))
    onRoomsChange(syncRoomProducts(zoneId, newProducts, rooms))
    setAddingTo(null)
  }

  const pts2str = (pts) => pts.map(p => `${p.x},${p.y}`).join(' ')
  const addingZone = zones.find(z => z.id === addingTo)

  return (
    <div className="space-y-3">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {[
            { m: 'select', Icon: MousePointer2, label: 'Select' },
            { m: 'draw',   Icon: PenLine,       label: 'Draw Zone' },
          ].map(({ m, Icon, label }) => (
            <button key={m}
              onClick={() => { setMode(m); setDrawing([]); setHoverPt(null) }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all"
              style={mode === m
                ? { background: 'var(--gold)', color: '#0A0808' }
                : { background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {isPDF && (
          <>
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <button onClick={() => setPageNumber(p => Math.max(1, p-1))} disabled={pageNumber <= 1}
                className="p-1 disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>
                <ChevronLeft className="w-3.5 h-3.5"/>
              </button>
              <span className="text-xs font-medium px-2" style={{ color: 'var(--text-secondary)' }}>
                {pageNumber} / {numPages || '…'}
              </span>
              <button onClick={() => setPageNumber(p => Math.min(numPages||1, p+1))} disabled={pageNumber>=(numPages||1)}
                className="p-1 disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>
                <ChevronRight className="w-3.5 h-3.5"/>
              </button>
            </div>
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <button onClick={() => setScale(s => Math.max(0.5, +(s-.25).toFixed(2)))}
                style={{ color: 'var(--text-secondary)' }}><ZoomOut className="w-3.5 h-3.5"/></button>
              <span className="text-xs font-medium w-10 text-center" style={{ color: 'var(--text-secondary)' }}>
                {Math.round(scale*100)}%
              </span>
              <button onClick={() => setScale(s => Math.min(3, +(s+.25).toFixed(2)))}
                style={{ color: 'var(--text-secondary)' }}><ZoomIn className="w-3.5 h-3.5"/></button>
            </div>
          </>
        )}

        {zones.length > 0 && (
          <span className="ml-auto text-xs font-medium px-3 py-2 rounded-xl"
                style={{ background: 'rgba(212,175,55,0.08)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.2)' }}>
            {zones.length} zone{zones.length !== 1 ? 's' : ''} · synced with Rooms
          </span>
        )}
      </div>

      {/* ── Draw hint ── */}
      {mode === 'draw' && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
             style={{ background: 'rgba(212,175,55,0.06)', border: '1px dashed rgba(212,175,55,0.3)', color: 'var(--gold)' }}>
          <PenLine className="w-3.5 h-3.5 shrink-0" />
          {drawing.length === 0
            ? 'Click on the floor plan to start drawing a room boundary'
            : drawing.length < 3
            ? `${drawing.length} point${drawing.length > 1 ? 's' : ''} placed — add more`
            : 'Click near the first point (or double-click) to close the zone'}
        </div>
      )}

      {/* ── Zone name input ── */}
      {naming && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
             style={{ background: 'var(--bg-surface)', border: '1px solid rgba(212,175,55,0.3)' }}>
          <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>Zone name:</span>
          <input
            autoFocus value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') confirmZone(); if (e.key === 'Escape') cancelZone() }}
            className="flex-1 bg-transparent text-sm outline-none px-2 py-1 rounded-lg"
            style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            placeholder="e.g. Living Room"
          />
          <button onClick={confirmZone} className="p-2 rounded-lg" style={{ background: 'var(--gold)', color: '#0A0808' }}>
            <Check className="w-4 h-4"/>
          </button>
          <button onClick={cancelZone} className="p-2 rounded-lg" style={{ background: 'var(--bg-surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            <X className="w-4 h-4"/>
          </button>
        </div>
      )}

      {/* ── Canvas ── */}
      <div className="relative rounded-2xl overflow-hidden"
           style={{ border: '1px solid var(--border)', background: '#0A0A0F', cursor: mode === 'draw' ? 'crosshair' : 'default' }}>

        {/* Floor plan */}
        {isPDF ? (
          <div className="flex justify-center overflow-auto max-h-[70vh]">
            <Document file={floorPlan.data}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<div className="py-20 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>}>
              <Page pageNumber={pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false}/>
            </Document>
          </div>
        ) : (
          <img src={floorPlan.data} alt="Floor plan" className="w-full object-contain max-h-[70vh]" style={{ display: 'block' }}/>
        )}

        {/* SVG overlay */}
        <svg ref={svgRef}
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100" preserveAspectRatio="none"
          onClick={handleClick} onDoubleClick={handleDblClick} onMouseMove={handleMouseMove}
          style={{ pointerEvents: mode === 'select' ? 'none' : 'all' }}>

          {/* Completed zones */}
          {zones.map(zone => {
            const c = centroid(zone.points)
            const sel = selectedId === zone.id
            return (
              <g key={zone.id} style={{ pointerEvents: mode === 'select' ? 'all' : 'none' }}
                 onClick={e => { e.stopPropagation(); setSelectedId(sel ? null : zone.id) }}>
                <polygon points={pts2str(zone.points)} fill={zone.fill} stroke={zone.stroke}
                  strokeWidth={sel ? 0.55 : 0.3} strokeDasharray={sel ? '2 1' : 'none'}/>
                <rect x={c.x - 9} y={c.y - 3.5} width={18} height={7} rx={1.5} fill="rgba(0,0,0,0.7)"/>
                <text x={c.x} y={c.y + 1.2} textAnchor="middle" fontSize="2.6" fontWeight="600" fill={zone.stroke}
                  style={{ fontFamily: 'system-ui,sans-serif', pointerEvents: 'none' }}>
                  {zone.name}
                </text>
              </g>
            )
          })}

          {/* In-progress polygon */}
          {drawing.length > 0 && (
            <g style={{ pointerEvents: 'none' }}>
              {hoverPt && (
                <line x1={drawing[drawing.length-1].x} y1={drawing[drawing.length-1].y}
                      x2={hoverPt.x} y2={hoverPt.y}
                      stroke="#D4AF37" strokeWidth="0.3" strokeDasharray="1.5 1"/>
              )}
              {drawing.length >= 2 && (
                <polyline points={drawing.map(p=>`${p.x},${p.y}`).join(' ')} fill="none"
                  stroke="#D4AF37" strokeWidth="0.35" strokeDasharray="2 1"/>
              )}
              {drawing.map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r={i===0 ? 1.2 : 0.7}
                  fill={i===0 ? '#D4AF37' : '#fff'} stroke="#D4AF37" strokeWidth="0.3"/>
              ))}
            </g>
          )}
        </svg>

        {/* "+" HTML buttons */}
        {mode === 'select' && zones.map(zone => {
          const c = centroid(zone.points)
          return (
            <div key={`btn-${zone.id}`}
              className="absolute flex flex-col items-center gap-1"
              style={{ left: `${c.x}%`, top: `${c.y + 5}%`, transform: 'translate(-50%,0)', zIndex: 10 }}>
              <button
                onClick={e => { e.stopPropagation(); setAddingTo(zone.id) }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-base font-bold transition-transform hover:scale-110 shadow-lg"
                style={{ background: zone.stroke, color: '#0A0808', boxShadow: `0 2px 10px ${zone.stroke}80` }}>
                +
              </button>
              {zone.products?.length > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.75)', color: zone.stroke }}>
                  {zone.products.length} items
                </span>
              )}
              {selectedId === zone.id && (
                <button onClick={e => { e.stopPropagation(); deleteZone(zone.id) }}
                  className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                  style={{ background: '#ef4444', color: '#fff' }}>
                  <Trash2 className="w-2.5 h-2.5"/>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Zone summary ── */}
      {zones.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest px-1"
             style={{ color: 'var(--text-muted)' }}>Zones · synced with Rooms tab</p>
          {zones.map(zone => {
            const total = (zone.products || []).reduce((s, rp) => {
              const p = products.find(x => x.id === rp.productId)
              return s + (p ? (p.gsp || p.price) * rp.qty : 0)
            }, 0)
            return (
              <div key={zone.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--bg-surface)', border: `1px solid ${zone.stroke}33` }}>
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: zone.stroke }}/>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{zone.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {zone.products?.length || 0} product type{zone.products?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {total > 0 && <span className="text-sm font-bold" style={{ color: 'var(--gold)' }}>{formatCurrency(total)}</span>}
                  <button onClick={() => setAddingTo(zone.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: zone.stroke, border: `1px solid ${zone.stroke}44`, background: `${zone.stroke}11` }}
                    onMouseEnter={e => e.currentTarget.style.background = `${zone.stroke}22`}
                    onMouseLeave={e => e.currentTarget.style.background = `${zone.stroke}11`}>
                    {zone.products?.length > 0 ? 'Edit Products' : '+ Add Products'}
                  </button>
                  <button onClick={() => deleteZone(zone.id)}
                    className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Product modal ── */}
      {addingTo && addingZone && (
        <AddProductModal
          room={{ name: addingZone.name }}
          products={products}
          currentProducts={addingZone.products || []}
          onSave={newProducts => saveProducts(addingTo, newProducts)}
          onClose={() => setAddingTo(null)}
        />
      )}
    </div>
  )
}
