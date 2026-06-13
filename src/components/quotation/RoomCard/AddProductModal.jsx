import React, { useState, useMemo } from 'react'
import { Search, X, Plus, Minus, CheckCircle2, Lightbulb } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { CATEGORY_LABELS } from '../../utils/boqGenerator'
import { getSuggestionsForRoom } from '../../utils/rulesEngine'

const ALL_CAT = 'ALL'

export function AddProductModal({ room, products, currentProducts = [], onSave, onClose }) {
  // Local quantities — init from current room products
  const initQtys = () => {
    const q = {}
    currentProducts.forEach(({ productId, qty }) => { q[productId] = qty })
    return q
  }
  const [qtys, setQtys] = useState(initQtys)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(ALL_CAT)

  const activeProducts = products.filter((p) => p.active !== false)
  const suggestions = useMemo(() => getSuggestionsForRoom(room, activeProducts), [room, activeProducts])
  const suggestedIds = new Set(suggestions.map((s) => s.productId))

  const categories = [ALL_CAT, ...Object.keys(CATEGORY_LABELS).filter((k) =>
    activeProducts.some((p) => p.category === k)
  )]

  const filtered = activeProducts.filter((p) => {
    const matchCat = category === ALL_CAT || p.category === category
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.partCode || '').toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  const adjust = (id, delta) => {
    setQtys((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }))
  }

  const handleSave = () => {
    const result = Object.entries(qtys)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, qty }))
    onSave(result)
  }

  const applySuggestions = () => {
    setQtys((prev) => {
      const next = { ...prev }
      suggestions.forEach(({ productId, qty }) => {
        if (!next[productId]) next[productId] = qty
      })
      return next
    })
  }

  const totalAdded = Object.values(qtys).filter((q) => q > 0).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 pb-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Add Products to "{room.name}"</h2>
            <p className="text-xs text-gray-500 mt-0.5">{totalAdded} product type(s) selected</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggestions banner */}
        {suggestions.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-800">Smart Suggestions</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {suggestions.map((s) => {
                    const p = products.find((x) => x.id === s.productId)
                    return p?.name
                  }).filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>
            <button
              onClick={applySuggestions}
              className="shrink-0 text-xs font-medium text-amber-700 border border-amber-300 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition"
            >
              Apply All
            </button>
          </div>
        )}

        {/* Search + Filter */}
        <div className="px-6 pt-4 pb-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or part code…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-galaxy-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  category === cat
                    ? 'bg-galaxy-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === ALL_CAT ? 'All' : CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No products match your search.</p>
          )}
          {filtered.map((p) => {
            const qty = qtys[p.id] || 0
            const isSuggested = suggestedIds.has(p.id)
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  qty > 0
                    ? 'border-galaxy-400 bg-galaxy-50'
                    : isSuggested
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <img
                  src={p.image || '/images/placeholder.png'}
                  alt={p.name}
                  className="w-12 h-12 object-contain rounded-lg bg-white border border-gray-100 shrink-0"
                  onError={(e) => { e.target.src = '/images/placeholder.png' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    {isSuggested && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Suggested</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{p.partCode}</p>
                  <p className="text-xs font-semibold text-galaxy-700 mt-0.5">{formatCurrency(p.price)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {qty > 0 ? (
                    <>
                      <button onClick={() => adjust(p.id, -1)} className="w-7 h-7 rounded-full bg-galaxy-100 hover:bg-galaxy-200 text-galaxy-700 flex items-center justify-center transition">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-galaxy-700">{qty}</span>
                      <button onClick={() => adjust(p.id, 1)} className="w-7 h-7 rounded-full bg-galaxy-600 hover:bg-galaxy-700 text-white flex items-center justify-center transition">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => adjust(p.id, 1)} className="w-7 h-7 rounded-full bg-galaxy-600 hover:bg-galaxy-700 text-white flex items-center justify-center transition">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-sm text-gray-500">
            {totalAdded} product type(s) · {Object.values(qtys).reduce((s, q) => s + q, 0)} total units
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Save Products
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
