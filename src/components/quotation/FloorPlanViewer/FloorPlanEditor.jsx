import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page } from 'react-pdf'
import {
  MousePointer2, PenLine, Trash2, Check, X,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Search, Package, ChevronDown, Sparkles, Printer,
} from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { getZoneSuggestions } from '../../data/zoneRules'

// ── Zone colours ──────────────────────────────────────────────────────────────
const FILLS   = [
  'rgba(212,175,55,0.20)', 'rgba(99,148,248,0.20)', 'rgba(107,203,119,0.20)',
  'rgba(255,107,107,0.20)','rgba(196,144,228,0.20)','rgba(255,159,67,0.20)',
  'rgba(20,184,166,0.20)', 'rgba(244,63,94,0.20)',
]
const STROKES = ['#D4AF37','#6394F8','#6BCB77','#FF6B6B','#C490E4','#FF9F43','#14B8A6','#F43F5E']

// ── Helpers ───────────────────────────────────────────────────────────────────
const centroid = (pts) => ({
  x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
  y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
})
const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

function toSVGPct(e, el) {
  const r = el.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width)  * 100)),
    y: Math.max(0, Math.min(100, ((e.clientY - r.top)  / r.height) * 100)),
  }
}

function pointInPolygon(px, py, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi))
      inside = !inside
  }
  return inside
}

// Derive aggregated products list from positioned devices
function devicesAsProducts(devices = []) {
  const map = {}
  devices.forEach(d => {
    if (!map[d.productId]) map[d.productId] = { productId: d.productId, qty: 0 }
    map[d.productId].qty += d.qty
  })
  return Object.values(map)
}

// ── Category labels (used by ProductSidebar) ─────────────────────────────────
const CAT_LABELS = {
  ELYSIA_SWITCHES: 'Elysia Switches',
  VITRUM_SWITCHES: 'Vitrum Switches',
  IR_CONTROLLERS:  'IR Controllers',
  SENSORS:         'Sensors',
  VDP:             'Video Door Phone',
  CURTAINS:        'Curtains',
  LOCKS:           'Smart Locks',
  LCD_PANELS:      'LCD Panels',
  NETWORKING:      'Networking',
}

// ── Category symbol mapping ───────────────────────────────────────────────────
const CHIP_SYMBOLS = {
  ELYSIA_SWITCHES: { abbr: 'SW', color: '#6394F8' },
  VITRUM_SWITCHES: { abbr: 'SW', color: '#C490E4' },
  IR_CONTROLLERS:  { abbr: 'IR', color: '#FF9F43' },
  SENSORS:         { abbr: 'SN', color: '#6BCB77' },
  VDP:             { abbr: 'VD', color: '#FF6B6B' },
  CURTAINS:        { abbr: 'CR', color: '#14B8A6' },
  LOCKS:           { abbr: 'LK', color: '#D4AF37' },
  LCD_PANELS:      { abbr: 'LC', color: '#94A3B8' },
  NETWORKING:      { abbr: 'NW', color: '#22D3EE' },
}

// ── Device chip (positioned on canvas) ───────────────────────────────────────
function DeviceChip({ device, product, zoneStroke, selected, onMouseDown, onClick }) {
  if (!product) return null
  return (
    <div
      onMouseDown={onMouseDown}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${device.x}%`,
        top: `${device.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: selected ? 30 : 20,
        cursor: 'grab',
        userSelect: 'none',
        pointerEvents: 'all',
      }}
    >
      <img
        src={product.image || '/images/placeholder.png'}
        alt={product.name}
        draggable={false}
        onError={e => { e.target.src = '/images/placeholder.png' }}
        style={{
          width: '52px',
          height: '52px',
          objectFit: 'contain',
          display: 'block',
          mixBlendMode: 'multiply',
          filter: selected
            ? 'drop-shadow(0 0 5px #D4AF37) drop-shadow(0 0 2px #D4AF37)'
            : `drop-shadow(0 1px 3px rgba(0,0,0,0.4))`,
          transition: 'filter 0.15s',
        }}
      />
    </div>
  )
}

// ── Product Sidebar ───────────────────────────────────────────────────────────
function ProductSidebar({ products }) {
  const [search, setSearch]       = useState('')
  const [collapsed, setCollapsed] = useState({})

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.partCode || '').toLowerCase().includes(search.toLowerCase())
  )
  const byCategory = {}
  filtered.forEach(p => {
    if (!byCategory[p.category]) byCategory[p.category] = []
    byCategory[p.category].push(p)
  })

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}>
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>Products</p>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…" className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: 'var(--text-primary)' }}/>
        </div>
        <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
          Drag &amp; drop onto the floor plan to place exactly
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {Object.entries(byCategory).map(([cat, prods]) => {
          const isOpen = !collapsed[cat]
          return (
            <div key={cat}>
              <button onClick={() => setCollapsed(c => ({ ...c, [cat]: !c[cat] }))}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left mb-1"
                style={{ background: 'rgba(212,175,55,0.06)' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--gold)' }}>
                  {CAT_LABELS[cat] || cat}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold)' }}>
                    {prods.length}
                  </span>
                  <ChevronDown className="w-3 h-3 transition-transform"
                    style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}/>
                </div>
              </button>

              {isOpen && prods.map(product => (
                <div key={product.id} draggable
                  onDragStart={e => { e.dataTransfer.setData('productId', product.id); e.dataTransfer.effectAllowed = 'copy' }}
                  className="flex items-center gap-2 px-2 py-2 rounded-xl mb-1 cursor-grab active:cursor-grabbing select-none transition-all"
                  style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <img src={product.image || '/images/placeholder.png'} alt={product.name}
                       className="w-8 h-8 object-contain rounded-lg shrink-0"
                       style={{ background: 'white', padding: '2px' }}
                       onError={e => { e.target.src = '/images/placeholder.png' }}
                       draggable={false}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                      {product.name}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--gold)' }}>
                      {formatCurrency(product.gsp || product.price)}
                    </p>
                  </div>
                  <div className="shrink-0 opacity-40 flex flex-col gap-0.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="flex gap-0.5">
                        <div className="w-1 h-1 rounded-full" style={{ background: 'var(--text-muted)' }}/>
                        <div className="w-1 h-1 rounded-full" style={{ background: 'var(--text-muted)' }}/>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }}/>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No products found</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Selected device panel ─────────────────────────────────────────────────────
function DevicePanel({ device, product, zone, onUpdateQty, onDelete, onClose }) {
  if (!device || !product) return null
  return (
    <div className="absolute top-4 left-4 z-30 w-64 rounded-2xl overflow-hidden shadow-2xl"
         style={{ background: 'var(--bg-surface)', border: `2px solid ${zone?.stroke || 'var(--gold)'}` }}>
      <div className="flex items-center justify-between px-3 py-2.5"
           style={{ background: `${zone?.stroke || '#D4AF37'}22`, borderBottom: `1px solid ${zone?.stroke || '#D4AF37'}44` }}>
        <div className="flex items-center gap-2">
          <img src={product.image || '/images/placeholder.png'} alt={product.name}
               className="w-7 h-7 object-contain rounded"
               onError={e => { e.target.src = '/images/placeholder.png' }}/>
          <div>
            <p className="text-xs font-bold leading-tight" style={{ color: zone?.stroke || 'var(--gold)' }}>
              {product.partCode || product.id}
            </p>
            {zone && <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{zone.name}</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4"/>
        </button>
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold mb-3 truncate" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Unit price</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(product.gsp || product.price)}
          </span>
        </div>
        <button onClick={onDelete}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
          <Trash2 className="w-3.5 h-3.5"/> Remove from plan
        </button>
      </div>
    </div>
  )
}

// ── Zone summary list ─────────────────────────────────────────────────────────
function ZoneSummaryList({ zone, products, onUpdateDevice, onDeleteDevice, onClose }) {
  const devices = zone.devices || []
  const total = devices.reduce((s, d) => {
    const p = products.find(x => x.id === d.productId)
    return s + (p ? (p.gsp || p.price) * d.qty : 0)
  }, 0)

  return (
    <div className="absolute top-4 left-4 z-30 w-64 rounded-2xl overflow-hidden shadow-2xl"
         style={{ background: 'var(--bg-surface)', border: `2px solid ${zone.stroke}` }}>
      <div className="flex items-center justify-between px-3 py-2.5"
           style={{ background: `${zone.stroke}22`, borderBottom: `1px solid ${zone.stroke}44` }}>
        <div>
          <p className="text-sm font-bold" style={{ color: zone.stroke }}>{zone.name}</p>
          {total > 0 && <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(total)}</p>}
        </div>
        <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4"/>
        </button>
      </div>
      <div className="p-3 max-h-60 overflow-y-auto space-y-1.5">
        {devices.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
            Drag products from the sidebar onto this zone
          </p>
        )}
        {devices.map(device => {
          const p = products.find(x => x.id === device.productId)
          if (!p) return null
          return (
            <div key={device.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl"
                 style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
              <img src={p.image || '/images/placeholder.png'} alt={p.name}
                   className="w-6 h-6 object-contain rounded shrink-0"
                   onError={e => { e.target.src = '/images/placeholder.png' }}/>
              <span className="flex-1 text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onUpdateDevice(device.id, Math.max(1, device.qty - 1))}
                  className="w-5 h-5 rounded flex items-center justify-center text-xs"
                  style={{ background: 'var(--bg-surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>−</button>
                <span className="w-4 text-center text-xs font-bold" style={{ color: 'var(--gold)' }}>{device.qty}</span>
                <button onClick={() => onUpdateDevice(device.id, device.qty + 1)}
                  className="w-5 h-5 rounded flex items-center justify-center text-xs"
                  style={{ background: 'rgba(212,175,55,0.12)', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.2)' }}>+</button>
                <button onClick={() => onDeleteDevice(device.id)}
                  className="w-5 h-5 rounded flex items-center justify-center ml-0.5"
                  style={{ color: '#ef4444' }}>
                  <X className="w-3 h-3"/>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Editor ───────────────────────────────────────────────────────────────
export function FloorPlanEditor({ floorPlan, zones = [], onZonesChange, products = [] }) {
  const [mode, setMode]                   = useState('select')
  const [drawing, setDrawing]             = useState([])
  const [hoverPt, setHoverPt]             = useState(null)
  const [naming, setNaming]               = useState(null)
  const [nameInput, setNameInput]         = useState('')
  const [selectedZoneId, setSelectedZoneId]     = useState(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [draggingDeviceId, setDraggingDeviceId] = useState(null)
  const [draggingDevicePos, setDraggingDevicePos] = useState(null)
  const [dragOverZoneId, setDragOverZoneId]     = useState(null)
  const [pendingSuggestion, setPendingSuggestion]   = useState(null)
  const [acceptedSuggestions, setAcceptedSuggestions] = useState({})
  const [scale, setScale]                 = useState(1.0)
  const [pageNumber, setPageNumber]       = useState(1)
  const [numPages, setNumPages]           = useState(null)
  const svgRef     = useRef(null)
  const canvasRef  = useRef(null)
  const [canvasWidth, setCanvasWidth] = useState(900)
  const isPDF  = floorPlan?.mimeType === 'application/pdf'

  // Measure canvas container width so PDF fills it exactly (fixes zone alignment on zoom)
  useEffect(() => {
    if (!canvasRef.current) return
    const ro = new ResizeObserver(e => setCanvasWidth(Math.floor(e[0].contentRect.width)))
    ro.observe(canvasRef.current)
    return () => ro.disconnect()
  }, [])

  // ── Zone drawing ──────────────────────────────────────────────────────────
  const handleSvgClick = useCallback((e) => {
    if (mode !== 'draw' || !svgRef.current) return
    const pt = toSVGPct(e, svgRef.current)
    if (drawing.length >= 3 && dist(pt, drawing[0]) < 1.5) {
      setNaming(drawing); setDrawing([]); setHoverPt(null)
      setNameInput(`Zone ${zones.length + 1}`)
      return
    }
    setDrawing(prev => [...prev, pt])
  }, [mode, drawing, zones.length])

  const handleSvgDblClick = useCallback((e) => {
    if (mode !== 'draw') return
    e.preventDefault()
    if (drawing.length >= 3) {
      setNaming(drawing); setDrawing([]); setHoverPt(null)
      setNameInput(`Zone ${zones.length + 1}`)
    }
  }, [mode, drawing, zones.length])

  // ── Confirm / cancel zone ─────────────────────────────────────────────────
  const confirmZone = () => {
    if (!naming || !nameInput.trim()) return
    const idx    = zones.length % FILLS.length
    const zoneId = crypto.randomUUID()
    const name   = nameInput.trim()
    const newZone = { id: zoneId, name, fill: FILLS[idx], stroke: STROKES[idx], points: naming, devices: [] }
    setNaming(null); setNameInput(''); setMode('select')

    const rules = getZoneSuggestions(name)
    if (rules.length > 0) {
      const initial = {}
      rules[0].suggestions.forEach(s => { initial[s.productId] = true })
      setPendingSuggestion({ pendingZone: newZone, rules })
      setAcceptedSuggestions(initial)
    } else {
      onZonesChange([...zones, newZone])
    }
  }

  const confirmZoneSuggestions = () => {
    if (!pendingSuggestion) return
    const { pendingZone, rules } = pendingSuggestion
    // Add suggested products as devices placed at zone centroid
    const c = centroid(pendingZone.points)
    const offset = 8  // spread devices around centroid
    const suggestions = rules[0].suggestions.filter(s => acceptedSuggestions[s.productId])
    // Expand qty > 1 into separate individual chips
    const expanded = suggestions.flatMap(s =>
      Array.from({ length: s.qty }, () => ({ productId: s.productId }))
    )
    const suggestedDevices = expanded.map((s, i) => {
      const angle = (i / Math.max(expanded.length, 1)) * 2 * Math.PI
      return {
        id: crypto.randomUUID(),
        productId: s.productId,
        qty: 1,
        x: Math.max(2, Math.min(98, c.x + (expanded.length > 1 ? Math.cos(angle) * offset : 0))),
        y: Math.max(2, Math.min(98, c.y + (expanded.length > 1 ? Math.sin(angle) * offset : 0))),
        zoneId: pendingZone.id,
      }
    })
    onZonesChange([...zones, { ...pendingZone, devices: suggestedDevices }])
    setPendingSuggestion(null)
  }

  const dismissZoneSuggestions = () => {
    if (!pendingSuggestion) return
    onZonesChange([...zones, pendingSuggestion.pendingZone])
    setPendingSuggestion(null)
  }

  const cancelZone = () => { setNaming(null); setNameInput(''); setDrawing([]); setHoverPt(null) }

  const deleteZone = (id) => {
    onZonesChange(zones.filter(z => z.id !== id))
    if (selectedZoneId === id) setSelectedZoneId(null)
  }

  // ── Find zone at point ────────────────────────────────────────────────────
  const findZoneAtPoint = useCallback((pct) => {
    for (let i = zones.length - 1; i >= 0; i--) {
      if (pointInPolygon(pct.x, pct.y, zones[i].points)) return zones[i].id
    }
    return null
  }, [zones])

  // ── Drag over / drop (from sidebar) ──────────────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    if (!svgRef.current) return
    setDragOverZoneId(findZoneAtPoint(toSVGPct(e, svgRef.current)))
  }, [findZoneAtPoint])

  const handleDragLeave = useCallback(() => setDragOverZoneId(null), [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const productId = e.dataTransfer.getData('productId')
    if (!productId || !svgRef.current) return
    const pct    = toSVGPct(e, svgRef.current)
    const zoneId = findZoneAtPoint(pct)
    setDragOverZoneId(null)

    const newDevice = {
      id: crypto.randomUUID(),
      productId,
      qty: 1,
      x: pct.x,
      y: pct.y,
      zoneId: zoneId || null,
    }

    if (!zoneId) return  // only allow drops inside a zone
    onZonesChange(zones.map(z =>
      z.id === zoneId
        ? { ...z, devices: [...(z.devices || []), newDevice] }
        : z
    ))
    setSelectedZoneId(zoneId)
  }, [zones, onZonesChange, findZoneAtPoint])

  // ── Device dragging (reposition) ──────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (mode === 'draw' && svgRef.current) setHoverPt(toSVGPct(e, svgRef.current))
    if (draggingDeviceId && svgRef.current) {
      setDraggingDevicePos(toSVGPct(e, svgRef.current))
    }
  }, [mode, draggingDeviceId])

  const handleMouseUp = useCallback((e) => {
    if (draggingDeviceId && draggingDevicePos && svgRef.current) {
      const finalPos = draggingDevicePos
      // Find the device and its assigned zone
      const device = zones.flatMap(z => z.devices || []).find(d => d.id === draggingDeviceId)
      const assignedZone = device ? zones.find(z => z.id === device.zoneId) : null
      // Only commit move if new position is within the device's zone
      const withinZone = assignedZone
        ? pointInPolygon(finalPos.x, finalPos.y, assignedZone.points)
        : true
      if (withinZone) {
        onZonesChange(zones.map(zone => ({
          ...zone,
          devices: (zone.devices || []).map(d =>
            d.id === draggingDeviceId
              ? { ...d, x: finalPos.x, y: finalPos.y }
              : d
          ),
        })))
      }
    }
    setDraggingDeviceId(null)
    setDraggingDevicePos(null)
  }, [draggingDeviceId, draggingDevicePos, zones, onZonesChange])

  const startDeviceDrag = (e, deviceId) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingDeviceId(deviceId)
    setSelectedDeviceId(deviceId)
    setSelectedZoneId(null)
  }

  // ── Device updates ────────────────────────────────────────────────────────
  const updateDeviceQty = (deviceId, qty) => {
    onZonesChange(zones.map(z => ({
      ...z,
      devices: (z.devices || []).map(d => d.id === deviceId ? { ...d, qty } : d),
    })))
  }

  const deleteDevice = (deviceId) => {
    onZonesChange(zones.map(z => ({
      ...z,
      devices: (z.devices || []).filter(d => d.id !== deviceId),
    })))
    if (selectedDeviceId === deviceId) setSelectedDeviceId(null)
  }

  const pts2str = (pts) => pts.map(p => `${p.x},${p.y}`).join(' ')

  // ── Print layout ───────────────────────────────────────────────────────────
  const handlePrint = async () => {
    let fpUrl = floorPlan.data

    // For PDFs: capture the rendered canvas element
    if (isPDF) {
      const canvas = document.querySelector('.react-pdf__Page canvas')
      if (canvas) {
        fpUrl = canvas.toDataURL('image/png')
      } else {
        alert('PDF is still loading — please wait a moment and try again.')
        return
      }
    }

    const origin = window.location.origin
    const deviceChips = allDevices.map(device => {
      const product = products.find(p => p.id === device.productId)
      if (!product) return ''
      // Resolve image src — data URLs work directly; relative paths need origin prefix
      const imgSrc = product.image
        ? (product.image.startsWith('data:') || product.image.startsWith('http')
            ? product.image
            : `${origin}${product.image}`)
        : ''
      return `
        <div style="position:absolute;left:${device.x}%;top:${device.y}%;transform:translate(-50%,-50%);z-index:10;">
          ${imgSrc
            ? `<img src="${imgSrc}" style="width:52px;height:52px;object-fit:contain;display:block;mix-blend-mode:multiply;" />`
            : `<div style="width:52px;height:52px;background:rgba(0,0,0,0.2);border-radius:4px;"></div>`}
        </div>
      `
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Floor Plan — Galaxy Home Automation</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: white; font-family: Arial, sans-serif; }
    .header { padding: 10px 16px 6px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #D4AF37; }
    .logo { font-size: 13px; font-weight: 900; color: #D4AF37; letter-spacing: 2px; }
    .meta { font-size: 10px; color: #666; text-align: right; }
    .container { position: relative; display: block; width: 100%; }
    .fp-img { width: 100%; height: auto; display: block; }
    @media print {
      body { margin: 0; }
      @page { margin: 8mm; size: A3 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">GALAXY HOME AUTOMATION</div>
    <div class="meta">
      Floor Plan — Device Placement<br/>
      ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
    </div>
  </div>

  <div class="container">
    <img class="fp-img" src="${fpUrl}" />
    ${deviceChips}
  </div>

  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`

    const w = window.open('', '_blank', 'width=1200,height=900')
    if (!w) { alert('Please allow pop-ups for this site to use Print Layout.'); return }
    w.document.write(html)
    w.document.close()
  }

  // Resolve selected items
  const selectedZone = zones.find(z => z.id === selectedZoneId)
  const allDevices   = zones.flatMap(z => (z.devices || []).map(d => ({ ...d, zone: z })))
  const selectedDeviceObj = allDevices.find(d => d.id === selectedDeviceId)
  const selectedDeviceProduct = selectedDeviceObj
    ? products.find(p => p.id === selectedDeviceObj.productId)
    : null

  return (
    <div className="flex h-full relative" style={{ minHeight: '600px' }}>

      {/* ── Auto-Suggestion Popup ── */}
      {pendingSuggestion && (
        <div className="absolute inset-0 z-50 flex items-center justify-center"
             style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="w-96 rounded-2xl overflow-hidden shadow-2xl"
               style={{ background: 'var(--bg-surface)', border: `2px solid ${pendingSuggestion.pendingZone.stroke}` }}>
            <div className="px-5 py-4"
                 style={{ background: `${pendingSuggestion.pendingZone.stroke}18`, borderBottom: `1px solid ${pendingSuggestion.pendingZone.stroke}33` }}>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4" style={{ color: pendingSuggestion.pendingZone.stroke }}/>
                <p className="text-sm font-bold" style={{ color: pendingSuggestion.pendingZone.stroke }}>
                  Smart Recommendations
                </p>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                For <strong style={{ color: 'var(--text-primary)' }}>{pendingSuggestion.pendingZone.name}</strong>
                {' '}— {pendingSuggestion.rules[0].reason}
              </p>
            </div>
            <div className="p-4 space-y-2">
              {pendingSuggestion.rules[0].suggestions.map(({ productId, qty }) => {
                const product = products.find(p => p.id === productId)
                const checked = !!acceptedSuggestions[productId]
                return (
                  <label key={productId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: checked ? `${pendingSuggestion.pendingZone.stroke}10` : 'var(--bg-page)',
                      border: `1px solid ${checked ? pendingSuggestion.pendingZone.stroke + '44' : 'var(--border)'}`,
                    }}>
                    <input type="checkbox" checked={checked}
                      onChange={e => setAcceptedSuggestions(s => ({ ...s, [productId]: e.target.checked }))}
                      style={{ accentColor: pendingSuggestion.pendingZone.stroke }}/>
                    {product && (
                      <img src={product.image || '/images/placeholder.png'} alt={product.name}
                           className="w-8 h-8 object-contain rounded-lg shrink-0"
                           style={{ background: 'white', padding: '2px' }}
                           onError={e => { e.target.src = '/images/placeholder.png' }}/>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {product?.name || productId}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--gold)' }}>
                        {productId} · Qty {qty}
                        {product && ` · ${formatCurrency(product.gsp || product.price)}`}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
            <div className="flex items-center gap-2 px-4 pb-4">
              <button onClick={confirmZoneSuggestions}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: pendingSuggestion.pendingZone.stroke, color: '#0A0808' }}>
                <Check className="w-4 h-4"/> Add to Plan
              </button>
              <button onClick={dismissZoneSuggestions}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Canvas area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 flex-wrap"
             style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {[
              { m: 'select', Icon: MousePointer2, label: 'Select' },
              { m: 'draw',   Icon: PenLine,       label: 'Draw Zone' },
            ].map(({ m, Icon, label }) => (
              <button key={m}
                onClick={() => { setMode(m); setDrawing([]); setHoverPt(null) }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all"
                style={mode === m
                  ? { background: 'var(--gold)', color: '#0A0808' }
                  : { background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                <Icon className="w-3.5 h-3.5"/>{label}
              </button>
            ))}
          </div>

          {isPDF && (
            <>
              <div className="flex items-center gap-1 px-3 py-2 rounded-xl"
                   style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                <button onClick={() => setPageNumber(p => Math.max(1, p-1))} disabled={pageNumber<=1}
                  className="p-1 rounded disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>
                  <ChevronLeft className="w-3.5 h-3.5"/>
                </button>
                <span className="text-xs px-2" style={{ color: 'var(--text-secondary)' }}>{pageNumber}/{numPages||'…'}</span>
                <button onClick={() => setPageNumber(p => Math.min(numPages||1, p+1))} disabled={pageNumber>=(numPages||1)}
                  className="p-1 rounded disabled:opacity-30" style={{ color: 'var(--text-secondary)' }}>
                  <ChevronRight className="w-3.5 h-3.5"/>
                </button>
              </div>
              <div className="flex items-center gap-1 px-3 py-2 rounded-xl"
                   style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                <button onClick={() => setScale(s => Math.max(0.5, +(s-.25).toFixed(2)))}
                  style={{ color: 'var(--text-secondary)' }}><ZoomOut className="w-3.5 h-3.5"/></button>
                <span className="text-xs w-10 text-center" style={{ color: 'var(--text-secondary)' }}>{Math.round(scale*100)}%</span>
                <button onClick={() => setScale(s => Math.min(3, +(s+.25).toFixed(2)))}
                  style={{ color: 'var(--text-secondary)' }}><ZoomIn className="w-3.5 h-3.5"/></button>
              </div>
            </>
          )}

          {mode === 'draw' && (
            <span className="text-xs px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(212,175,55,0.08)', color: 'var(--gold)', border: '1px dashed rgba(212,175,55,0.3)' }}>
              {drawing.length === 0
                ? 'Click to place points (unlimited) · Click back on start node to close'
                : `${drawing.length} pts — click back on the start node to close`}
            </span>
          )}
          {mode === 'select' && zones.length > 0 && (
            <span className="text-xs px-3 py-2 rounded-xl"
                  style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {zones.length} zone{zones.length !== 1 ? 's' : ''} ·{' '}
              {allDevices.length} device{allDevices.length !== 1 ? 's' : ''} placed
            </span>
          )}

          {/* Print button — always visible when floor plan is loaded */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ml-auto"
            style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            title="Print floor plan with device placements"
          >
            <Printer className="w-3.5 h-3.5" /> Print Layout
          </button>
        </div>

        {/* Zone name input */}
        {naming && (
          <div className="flex items-center gap-2 px-4 py-2.5 shrink-0"
               style={{ background: 'rgba(212,175,55,0.06)', borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--gold)' }}>Name this zone:</span>
            <input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmZone(); if (e.key === 'Escape') cancelZone() }}
              className="flex-1 bg-transparent text-sm outline-none px-3 py-1.5 rounded-xl"
              style={{ color: 'var(--text-primary)', border: '1px solid rgba(212,175,55,0.4)' }}
              placeholder="e.g. Living Room, Washroom, Master Bedroom…"/>
            <button onClick={confirmZone} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--gold)', color: '#0A0808' }}>
              <Check className="w-3.5 h-3.5"/> Confirm
            </button>
            <button onClick={cancelZone} className="p-2 rounded-xl"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              <X className="w-4 h-4"/>
            </button>
          </div>
        )}

        {/* Canvas */}
        <div ref={canvasRef} className="flex-1 overflow-auto"
             style={{ background: '#0A0A0F', cursor: mode === 'draw' ? 'crosshair' : draggingDeviceId ? 'grabbing' : 'default' }}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}>

          <div className="relative"
               onClick={e => {
                 if (e.target === e.currentTarget) {
                   setSelectedZoneId(null)
                   setSelectedDeviceId(null)
                 }
               }}>

            {/* Floor plan */}
            {isPDF ? (
              <Document
                file={floorPlan.data}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={err => console.error('PDF load error:', err)}
                loading={<div className="py-32 text-sm text-center" style={{ color: 'var(--text-muted)' }}>Loading PDF…</div>}
                error={<div className="py-32 text-sm text-center" style={{ color: '#ef4444' }}>Failed to load PDF. Try a smaller file.</div>}
              >
                <Page
                  pageNumber={pageNumber}
                  width={canvasWidth > 0 ? Math.floor(canvasWidth * scale) : undefined}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            ) : (
              <img src={floorPlan.data} alt="Floor plan"
                   className="block w-full" style={{ height: 'auto' }}/>
            )}

            {/* SVG zone overlay */}
            <svg ref={svgRef}
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100" preserveAspectRatio="none"
              onClick={handleSvgClick}
              onDoubleClick={handleSvgDblClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{ pointerEvents: 'all' }}
            >
              {zones.map(zone => {
                const c          = centroid(zone.points)
                const isDragTarget = dragOverZoneId === zone.id
                const isSelected   = selectedZoneId  === zone.id
                const deviceCount  = (zone.devices || []).length
                return (
                  <g key={zone.id}
                     onClick={e => {
                       if (mode !== 'select') return
                       e.stopPropagation()
                       setSelectedDeviceId(null)
                       setSelectedZoneId(isSelected ? null : zone.id)
                     }}>
                    <polygon
                      points={pts2str(zone.points)}
                      fill={isDragTarget
                        ? zone.stroke.replace(')', ',0.38)').replace('rgb', 'rgba')
                        : zone.fill}
                      stroke={zone.stroke}
                      strokeWidth={isDragTarget || isSelected ? 0.6 : 0.3}
                      strokeDasharray={isSelected ? '2 1' : 'none'}
                      style={{ transition: 'fill 0.15s', cursor: 'pointer' }}
                    />
                    <rect x={c.x - 10} y={c.y - 3.5} width={20} height={7} rx={2} fill="rgba(0,0,0,0.72)"/>
                    <text x={c.x} y={c.y + 1.2} textAnchor="middle" fontSize="2.8" fontWeight="700" fill={zone.stroke}
                          style={{ fontFamily: 'system-ui,sans-serif', pointerEvents: 'none' }}>
                      {zone.name}
                    </text>
                    {deviceCount > 0 && (
                      <>
                        <rect x={c.x - 6} y={c.y + 4} width={12} height={4.5} rx={2} fill={zone.stroke + '33'}/>
                        <text x={c.x} y={c.y + 7.2} textAnchor="middle" fontSize="2.2" fontWeight="600" fill={zone.stroke}
                              style={{ fontFamily: 'system-ui,sans-serif', pointerEvents: 'none' }}>
                          {deviceCount} device{deviceCount !== 1 ? 's' : ''}
                        </text>
                      </>
                    )}
                    {isDragTarget && (
                      <>
                        <rect x={c.x - 4} y={c.y - 10} width={8} height={8} rx={4} fill={zone.stroke}/>
                        <text x={c.x} y={c.y - 5.5} textAnchor="middle" fontSize="5" fontWeight="900" fill="#0A0808"
                              style={{ fontFamily: 'system-ui,sans-serif', pointerEvents: 'none' }}>+</text>
                      </>
                    )}
                  </g>
                )
              })}

              {/* In-progress polygon */}
              {drawing.length > 0 && (
                <g style={{ pointerEvents: 'none' }}>
                  {drawing.length >= 2 && (
                    <polyline points={drawing.map(p=>`${p.x},${p.y}`).join(' ')}
                      fill="none" stroke="#D4AF37" strokeWidth="0.4" strokeDasharray="2 1"/>
                  )}
                  {hoverPt && (
                    <line x1={drawing[drawing.length-1].x} y1={drawing[drawing.length-1].y}
                          x2={hoverPt.x} y2={hoverPt.y}
                          stroke="#D4AF37" strokeWidth="0.3" strokeDasharray="1.5 1"/>
                  )}
                  {drawing.map((pt, i) => (
                    <circle key={i} cx={pt.x} cy={pt.y} r={i===0 ? 1.3 : 0.8}
                      fill={i===0 ? '#D4AF37' : '#fff'} stroke="#D4AF37" strokeWidth="0.3"/>
                  ))}
                </g>
              )}
            </svg>

            {/* ── Device chips ── */}
            {allDevices.map(device => {
              const product = products.find(p => p.id === device.productId)
              const isDraggingThis = draggingDeviceId === device.id
              const displayX = isDraggingThis && draggingDevicePos ? draggingDevicePos.x : device.x
              const displayY = isDraggingThis && draggingDevicePos ? draggingDevicePos.y : device.y
              const displayDevice = { ...device, x: displayX, y: displayY }
              return (
                <DeviceChip
                  key={device.id}
                  device={displayDevice}
                  product={product}
                  zoneStroke={device.zone?.stroke}
                  selected={selectedDeviceId === device.id}
                  onMouseDown={e => startDeviceDrag(e, device.id)}
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedZoneId(null)
                    setSelectedDeviceId(selectedDeviceId === device.id ? null : device.id)
                  }}
                />
              )
            })}

            {/* Selected device panel */}
            {selectedDeviceObj && selectedDeviceProduct && !selectedZoneId && (
              <DevicePanel
                device={selectedDeviceObj}
                product={selectedDeviceProduct}
                zone={selectedDeviceObj.zone}
                onUpdateQty={qty => updateDeviceQty(selectedDeviceObj.id, qty)}
                onDelete={() => deleteDevice(selectedDeviceObj.id)}
                onClose={() => setSelectedDeviceId(null)}
              />
            )}

            {/* Selected zone list */}
            {selectedZone && !selectedDeviceId && (
              <ZoneSummaryList
                zone={selectedZone}
                products={products}
                onUpdateDevice={(deviceId, qty) => updateDeviceQty(deviceId, qty)}
                onDeleteDevice={deleteDevice}
                onClose={() => setSelectedZoneId(null)}
              />
            )}
          </div>
        </div>

        {/* Zone summary strip */}
        {zones.length > 0 && (
          <div className="flex gap-2 px-4 py-2 overflow-x-auto shrink-0"
               style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            {zones.map(zone => {
              const devices = zone.devices || []
              const total = devices.reduce((s, d) => {
                const p = products.find(x => x.id === d.productId)
                return s + (p ? (p.gsp||p.price)*d.qty : 0)
              }, 0)
              return (
                <button key={zone.id}
                  onClick={() => { setSelectedDeviceId(null); setSelectedZoneId(selectedZoneId === zone.id ? null : zone.id) }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all shrink-0"
                  style={selectedZoneId === zone.id
                    ? { background: `${zone.stroke}22`, border: `1px solid ${zone.stroke}`, color: zone.stroke }
                    : { background: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: zone.stroke }}/>
                  <span className="text-xs font-semibold">{zone.name}</span>
                  {devices.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: `${zone.stroke}22`, color: zone.stroke }}>
                      {devices.length} · {total > 0 ? formatCurrency(total) : '—'}
                    </span>
                  )}
                  <button onClick={e => { e.stopPropagation(); deleteZone(zone.id) }}
                    className="w-4 h-4 flex items-center justify-center rounded-full opacity-40 hover:opacity-100"
                    style={{ color: '#ef4444' }}>
                    <X className="w-3 h-3"/>
                  </button>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Product Sidebar ── */}
      <div className="w-64 shrink-0 flex flex-col overflow-hidden">
        <ProductSidebar products={products}/>
      </div>
    </div>
  )
}
