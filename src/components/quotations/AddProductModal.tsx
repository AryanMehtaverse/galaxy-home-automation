'use client'

import { useState, useMemo } from 'react'
import { Search, X, Plus, Minus, CheckCircle2 } from 'lucide-react'
import type { CatalogProduct } from '@/types/quote'
import { formatCurrency } from '@/lib/pricingEngine'

const CATEGORY_LABELS: Record<string, string> = {
  ELYSIA_SWITCHES: 'Elysia Switches',
  VITRUM_SWITCHES: 'Vitrum Switches',
  CURTAINS: 'Curtains',
  LCD_PANELS: 'LCD Panels',
  VDP: 'Video Door Phone',
  LOCKS: 'Smart Locks',
  NETWORKING: 'Networking',
  SENSORS: 'Sensors',
  IR_CONTROLLERS: 'IR Controllers',
  CONTROLLERS: 'Controllers',
}

interface Props {
  roomName: string
  products: CatalogProduct[]
  currentProducts: { productId: string; qty: number }[]
  onSave: (products: { productId: string; qty: number }[]) => void
  onClose: () => void
}

export function AddProductModal({ roomName, products, currentProducts, onSave, onClose }: Props) {
  const initQtys = () => {
    const q: Record<string, number> = {}
    currentProducts.forEach(({ productId, qty }) => { q[productId] = qty })
    return q
  }
  const [qtys, setQtys] = useState<Record<string, number>>(initQtys)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')

  const activeProducts = products.filter((p) => p.active !== false)
  const categories = ['ALL', ...Object.keys(CATEGORY_LABELS).filter((k) => activeProducts.some((p) => p.category === k))]

  const filtered = activeProducts.filter((p) => {
    const matchCat = category === 'ALL' || p.category === category
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.partCode as string || '').toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  const adjust = (id: string, delta: number) =>
    setQtys((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }))

  const handleSave = () => {
    const result = Object.entries(qtys)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, qty }))
    onSave(result)
  }

  const totalAdded = Object.values(qtys).filter((q) => q > 0).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 pb-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-zinc-200 dark:border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Add Products to &quot;{roomName}&quot;</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{totalAdded} product type(s) selected</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Search + Filter */}
        <div className="px-6 pt-4 pb-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or part code…"
              className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  category === cat
                    ? 'bg-[#C9A840] text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat === 'ALL' ? 'All' : CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
          {filtered.length === 0 && (
            <p className="text-center text-zinc-400 text-sm py-8">No products match your search.</p>
          )}
          {filtered.map((p) => {
            const qty = qtys[p.id] || 0
            const price = (p.gsp || p.price || 0) as number
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  qty > 0
                    ? 'border-[#C9A840]/50 bg-[#C9A840]/5 dark:bg-[#C9A840]/10'
                    : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 bg-white dark:bg-zinc-800/50'
                }`}
              >
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image as string}
                    alt={p.name}
                    className="w-12 h-12 object-contain rounded-lg bg-white border border-zinc-100 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{p.name}</p>
                  <p className="text-xs text-zinc-400 font-mono">{p.partCode as string}</p>
                  <p className="text-xs font-semibold text-[#C9A840] mt-0.5">{formatCurrency(price)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {qty > 0 ? (
                    <>
                      <button onClick={() => adjust(p.id, -1)} className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-[#C9A840]">{qty}</span>
                      <button onClick={() => adjust(p.id, 1)} className="w-7 h-7 rounded-full bg-[#C9A840] hover:bg-[#b8962e] text-white flex items-center justify-center transition">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => adjust(p.id, 1)} className="w-7 h-7 rounded-full bg-[#C9A840] hover:bg-[#b8962e] text-white flex items-center justify-center transition">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-b-2xl">
          <p className="text-sm text-zinc-500">
            {totalAdded} type(s) · {Object.values(qtys).reduce((s, q) => s + q, 0)} total units
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 transition">Cancel</button>
            <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-[#C9A840] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8962e] transition">
              <CheckCircle2 className="w-4 h-4" />
              Save Products
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
