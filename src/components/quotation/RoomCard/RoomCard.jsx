import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Plus, Minus, PackagePlus } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { AddProductModal } from './AddProductModal'
import { ConfirmDialog } from '../ui/ConfirmDialog'

const ROOM_EMOJI = {
  'entry': '🚪', 'foyer': '🚪',
  'living': '🛋️', 'living room': '🛋️',
  'dining': '🍽️', 'dining room': '🍽️',
  'kitchen': '🍳',
  'bedroom': '🛏️', 'master bedroom': '🛏️', 'guest bedroom': '🛏️',
  'bathroom': '🚿', 'washroom': '🚿', 'toilet': '🚿', 'toilets': '🚿',
  'utility': '📡', 'network': '📡',
  'study': '📚',
  'balcony': '🌿',
  'garage': '🚗',
  'lobby': '🏛️',
}

const getEmoji = (room) => {
  const key = (room.name || room.type || '').toLowerCase()
  for (const [k, v] of Object.entries(ROOM_EMOJI)) {
    if (key.includes(k)) return v
  }
  return '🏠'
}

export function RoomCard({ room, products, onChange, onDelete, index }) {
  const [expanded, setExpanded] = useState((room.products?.length || 0) > 0)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const roomProducts = room.products || []
  const roomTotal = roomProducts.reduce((sum, rp) => {
    const p = products.find((x) => x.id === rp.productId)
    return sum + (p ? (p.gsp || p.price) * rp.qty : 0)
  }, 0)

  const handleSaveProducts = (newProducts) => {
    onChange({ ...room, products: newProducts })
    setShowModal(false)
  }

  const adjustQty = (productId, delta) => {
    const updated = roomProducts
      .map((rp) => rp.productId === productId ? { ...rp, qty: Math.max(0, rp.qty + delta) } : rp)
      .filter((rp) => rp.qty > 0)
    onChange({ ...room, products: updated })
  }

  const emoji = getEmoji(room)

  return (
    <>
      <div className="rounded-2xl overflow-hidden"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
          onClick={() => setExpanded(e => !e)}
          style={{ borderBottom: expanded ? '1px solid var(--border)' : 'none' }}
        >
          {/* Emoji + number */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg leading-none">{emoji}</span>
            <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--text-muted)' }}>
              {index + 1}
            </span>
          </div>

          {/* Room name */}
          <input
            value={room.name}
            onChange={(e) => { e.stopPropagation(); onChange({ ...room, name: e.target.value }) }}
            onClick={(e) => e.stopPropagation()}
            placeholder="Room Name"
            className="flex-1 text-sm font-semibold bg-transparent border-none outline-none min-w-0"
            style={{ color: 'var(--text-primary)' }}
          />

          {/* Meta + actions */}
          <div className="flex items-center gap-2 shrink-0">
            {roomProducts.length > 0 && (
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {roomProducts.length} items
              </span>
            )}
            {roomTotal > 0 && (
              <span className="text-xs font-bold" style={{ color: 'var(--gold)' }}>
                {formatCurrency(roomTotal)}
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true) }}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <span style={{ color: 'var(--text-muted)' }}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        {expanded && (
          <div className="p-4 space-y-3">

            {/* Products */}
            {roomProducts.length > 0 && (
              <div className="space-y-1.5">
                {roomProducts.map((rp) => {
                  const p = products.find((x) => x.id === rp.productId)
                  if (!p) return (
                    <div key={rp.productId} className="text-xs px-3 py-2 rounded-xl"
                         style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      ⚠ Product {rp.productId} not found in catalog
                    </div>
                  )
                  const unitPrice = p.gsp || p.price
                  return (
                    <div key={rp.productId}
                         className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                         style={{ background: 'var(--bg-page)', border: '1px solid var(--border)' }}>
                      <img
                        src={p.image || '/images/placeholder.png'}
                        alt={p.name}
                        className="w-8 h-8 object-contain rounded-lg shrink-0"
                        style={{ background: 'rgba(255,255,255,0.03)' }}
                        onError={(e) => { e.target.src = '/images/placeholder.png' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {formatCurrency(unitPrice)} × {rp.qty}
                          <span className="ml-2 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            = {formatCurrency(unitPrice * rp.qty)}
                          </span>
                        </p>
                      </div>
                      {/* Qty controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => adjustQty(rp.productId, -1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold" style={{ color: 'var(--gold)' }}>
                          {rp.qty}
                        </span>
                        <button onClick={() => adjustQty(rp.productId, 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: 'var(--gold)' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add/Edit products */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ border: '1.5px dashed var(--border)', color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <PackagePlus className="w-3.5 h-3.5" />
              {roomProducts.length > 0 ? 'Edit Products' : 'Add Products'}
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <AddProductModal
          room={room}
          products={products}
          currentProducts={roomProducts}
          onSave={handleSaveProducts}
          onClose={() => setShowModal(false)}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Room?"
        message={`Remove "${room.name}" and all its products?`}
        confirmLabel="Delete"
        onConfirm={() => { onDelete(); setShowDeleteConfirm(false) }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
