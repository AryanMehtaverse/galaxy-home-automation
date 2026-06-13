import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { RoomCard } from '../RoomCard/RoomCard'
import { PRESETS } from '../../data/presets'

const PRESET_OPTIONS = [
  { key: '2BHK', label: '2 BHK', rooms: 8,  desc: 'Entry · Living · Dining · 2 Beds · Toilets · Network' },
  { key: '3BHK', label: '3 BHK', rooms: 9,  desc: 'Entry · Living · Dining · 3 Beds · Toilets · Network' },
  { key: '4BHK', label: '4 BHK', rooms: 10, desc: 'Entry · Living · Dining · 4 Beds · Toilets · Network' },
]

const makeRoom = (template) => ({
  id: crypto.randomUUID(),
  name: template.name,
  type: template.type,
  products: template.products || [],
})

export function RoomsTab({ quote, products, onChange }) {
  const rooms = quote.rooms || []
  const [confirmKey, setConfirmKey] = useState(null)

  const applyPreset = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    const newRooms = preset.rooms.map(makeRoom)
    onChange({
      ...quote,
      rooms: newRooms,
      bhkType: key,
      discountPercent: preset.discountPercent ?? quote.discountPercent,
      sectionDiscounts: preset.sectionDiscounts || {},
    })
    setConfirmKey(null)
  }

  const handlePresetClick = (key) => {
    if (rooms.length > 0 && quote.bhkType !== key) {
      setConfirmKey(key)
    } else {
      applyPreset(key)
    }
  }

  const addRoom = () => {
    onChange({
      ...quote,
      rooms: [...rooms, makeRoom({ name: 'New Room', type: 'Bedroom', products: [] })],
    })
  }

  const updateRoom = (id, updated) =>
    onChange({ ...quote, rooms: rooms.map((r) => (r.id === id ? updated : r)) })

  const deleteRoom = (id) =>
    onChange({ ...quote, rooms: rooms.filter((r) => r.id !== id) })

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

      {/* ── Preset Selector ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3"
           style={{ color: 'var(--text-muted)' }}>
          Select Property Type
        </p>
        <div className="grid grid-cols-3 gap-3">
          {PRESET_OPTIONS.map(({ key, label, rooms: roomCount, desc }) => {
            const isActive = quote.bhkType === key
            return (
              <button
                key={key}
                onClick={() => handlePresetClick(key)}
                className="relative p-4 rounded-2xl text-left transition-all duration-200"
                style={isActive ? {
                  background: 'rgba(212,175,55,0.1)',
                  border: '1.5px solid var(--gold)',
                } : {
                  background: 'var(--bg-surface)',
                  border: '1.5px solid var(--border)',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                {isActive && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full"
                        style={{ background: 'var(--gold)' }} />
                )}
                <p className="text-base font-bold mb-1" style={{ color: isActive ? 'var(--gold)' : 'var(--text-primary)' }}>
                  {label}
                </p>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {desc}
                </p>
                <p className="text-[10px] mt-2 font-semibold" style={{ color: isActive ? 'var(--gold)' : 'var(--text-muted)' }}>
                  {roomCount} rooms
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Confirm replace ── */}
      {confirmKey && (
        <div className="rounded-2xl p-4"
             style={{ background: 'var(--bg-surface)', border: '1px solid rgba(212,175,55,0.25)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Replace existing rooms?
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            This will remove your {rooms.length} current rooms and load the {PRESET_OPTIONS.find(p => p.key === confirmKey)?.label} template.
          </p>
          <div className="flex gap-2">
            <button onClick={() => applyPreset(confirmKey)} className="btn-primary text-xs px-4 py-1.5">Replace</button>
            <button onClick={() => setConfirmKey(null)} className="btn-secondary text-xs px-4 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Room list ── */}
      {rooms.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest"
               style={{ color: 'var(--text-muted)' }}>
              Rooms &nbsp;·&nbsp; {rooms.length}
            </p>
            <button onClick={addRoom}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{ color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.06)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.12)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.06)'}
            >
              <Plus className="w-3.5 h-3.5" /> Add Room
            </button>
          </div>
          <div className="space-y-2">
            {rooms.map((room, idx) => (
              <RoomCard
                key={room.id}
                room={room}
                index={idx}
                products={products}
                onChange={(updated) => updateRoom(room.id, updated)}
                onDelete={() => deleteRoom(room.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {rooms.length === 0 && (
        <div className="text-center py-16 rounded-2xl"
             style={{ border: '2px dashed var(--border)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Select a property type above to get started
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Rooms and products will be pre-filled automatically
          </p>
        </div>
      )}
    </div>
  )
}
