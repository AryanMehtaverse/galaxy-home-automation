'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react'
import type { QuoteRoom, CatalogProduct } from '@/types/quote'

const PRESET_ROOMS = [
  'Living Room', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3',
  'Kitchen', 'Dining Room', 'Bathroom', 'Master Bathroom',
  'Study / Office', 'Balcony', 'Entrance / Foyer', 'Corridor',
  'Storeroom', 'Garage', 'Common Area',
]

interface Props {
  rooms: QuoteRoom[]
  products: CatalogProduct[]
  onChange: (rooms: QuoteRoom[]) => void
}

function uid() { return crypto.randomUUID() }

export function RoomsEditor({ rooms, products, onChange }: Props) {
  const [expandedRoom, setExpandedRoom] = useState<string | null>(rooms[0]?.id ?? null)
  const [productSearch, setProductSearch] = useState('')
  const [customName, setCustomName] = useState('')

  const activeProducts = products.filter((p) => p.active !== false)

  const addRoom = (name: string) => {
    const room: QuoteRoom = { id: uid(), name, products: [] }
    const updated = [...rooms, room]
    onChange(updated)
    setExpandedRoom(room.id)
    setCustomName('')
  }

  const removeRoom = (id: string) => {
    onChange(rooms.filter((r) => r.id !== id))
    if (expandedRoom === id) setExpandedRoom(null)
  }

  const setQty = (roomId: string, productId: string, qty: number) => {
    onChange(rooms.map((r) => {
      if (r.id !== roomId) return r
      const existing = r.products.find((p) => p.productId === productId)
      if (qty <= 0) return { ...r, products: r.products.filter((p) => p.productId !== productId) }
      if (existing) return { ...r, products: r.products.map((p) => p.productId === productId ? { ...p, qty } : p) }
      return { ...r, products: [...r.products, { productId, qty }] }
    }))
  }

  const getQty = (room: QuoteRoom, productId: string) =>
    room.products.find((p) => p.productId === productId)?.qty ?? 0

  const filteredProducts = activeProducts.filter((p) =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
  )

  // Group products by category
  const grouped = filteredProducts.reduce<Record<string, CatalogProduct[]>>((acc, p) => {
    const cat = p.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const inputCls = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-[#C9A840] focus:outline-none focus:ring-1 focus:ring-[#C9A840]'

  return (
    <div className="flex gap-0 h-full" style={{ minHeight: '500px' }}>
      {/* Left: room list + product picker */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Add room */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Add Room</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_ROOMS.filter((name) => !rooms.some((r) => r.name === name)).map((name) => (
              <button
                key={name}
                onClick={() => addRoom(name)}
                className="rounded-full border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:border-[#C9A840] hover:text-[#C9A840] transition-colors"
              >
                + {name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder="Custom room name…"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && customName.trim() && addRoom(customName.trim())}
            />
            <button
              onClick={() => customName.trim() && addRoom(customName.trim())}
              className="rounded-lg bg-[#C9A840] px-3 py-2 text-white hover:bg-[#b8962e] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Room cards */}
        {rooms.length === 0 && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-10 text-center text-sm text-zinc-400">
            Add rooms above to start assigning products
          </div>
        )}
        {rooms.map((room) => (
          <div key={room.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{room.name}</span>
                <span className="text-xs text-zinc-400">
                  {room.products.length} product{room.products.length !== 1 ? 's' : ''} ·{' '}
                  {room.products.reduce((s, p) => s + p.qty, 0)} items
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); removeRoom(room.id) }}
                  className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {expandedRoom === room.id ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </div>
            </button>

            {expandedRoom === room.id && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  <input
                    className={`${inputCls} pl-9`}
                    placeholder="Search products…"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                {Object.entries(grouped).map(([category, prods]) => (
                  <div key={category}>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{category.replace(/_/g, ' ')}</p>
                    <div className="space-y-1">
                      {prods.map((product) => {
                        const qty = getQty(room, product.id)
                        return (
                          <div key={product.id} className="flex items-center gap-3 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{product.name}</p>
                              {product.partCode && <p className="text-[10px] text-zinc-400 font-mono">{product.partCode as string}</p>}
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                              ₹{((product.gsp || product.price || 0) as number).toLocaleString('en-IN')}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setQty(room.id, product.id, qty - 1)}
                                disabled={qty === 0}
                                className="w-6 h-6 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-[#C9A840] hover:text-[#C9A840] disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold flex items-center justify-center transition-colors"
                              >−</button>
                              <span className={`w-7 text-center text-sm font-mono ${qty > 0 ? 'text-[#C9A840] font-bold' : 'text-zinc-400'}`}>{qty}</span>
                              <button
                                onClick={() => setQty(room.id, product.id, qty + 1)}
                                className="w-6 h-6 rounded border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-[#C9A840] hover:text-[#C9A840] text-sm font-bold flex items-center justify-center transition-colors"
                              >+</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
