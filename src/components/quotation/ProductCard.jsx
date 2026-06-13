import React from 'react'
import { Plus, Minus } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

const CATEGORY_COLORS = {
  ELYSIA_SWITCHES: 'bg-indigo-50 text-indigo-700',
  VITRUM_SWITCHES: 'bg-emerald-50 text-emerald-700',
  SHARED: 'bg-orange-50 text-orange-700',
  CONTROLLERS: 'bg-teal-50 text-teal-700',
  LCD_PANELS: 'bg-violet-50 text-violet-700',
  CURTAINS: 'bg-yellow-50 text-yellow-700',
  LOCKS: 'bg-red-50 text-red-700',
  NETWORKING: 'bg-blue-50 text-blue-700',
  VDP: 'bg-green-50 text-green-700',
}

const CATEGORY_SHORT = {
  ELYSIA_SWITCHES: 'Elysia',
  VITRUM_SWITCHES: 'Vitrum',
  SHARED: 'Shared',
  CONTROLLERS: 'Controller',
  LCD_PANELS: 'LCD',
  CURTAINS: 'Curtain',
  LOCKS: 'Lock',
  NETWORKING: 'Network',
  VDP: 'VDP',
}

export default function ProductCard({ product, qty, onQtyChange, recommended }) {
  const catColor = CATEGORY_COLORS[product.category] || 'bg-slate-100 text-slate-600'
  const catLabel = CATEGORY_SHORT[product.category] || product.category

  return (
    <div
      className={`card flex flex-col overflow-hidden transition-all duration-150 hover:shadow-md ${
        qty > 0 ? 'ring-2 ring-galaxy-500 shadow-md' : ''
      } ${recommended && qty === 0 ? 'ring-2 ring-amber-300' : ''}`}
    >
      {recommended && qty === 0 && (
        <div className="bg-amber-400 text-amber-900 text-xs font-semibold px-3 py-1 text-center">
          ★ Recommended
        </div>
      )}

      <div className="aspect-square bg-slate-50 flex items-center justify-center p-3">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain"
          onError={(e) => { e.target.style.opacity = '0.3' }}
        />
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>
            {catLabel}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">{product.name}</p>
        <p className="text-xs text-slate-400 font-mono">{product.partCode}</p>
        <p className="text-galaxy-600 font-bold text-sm mt-auto">{formatCurrency(product.price)}</p>

        <div className="flex items-center justify-between mt-1">
          <button
            onClick={() => onQtyChange(Math.max(0, qty - 1))}
            disabled={qty === 0}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-slate-600" />
          </button>
          <span className={`text-sm font-bold w-8 text-center ${qty > 0 ? 'text-galaxy-600' : 'text-slate-400'}`}>
            {qty}
          </span>
          <button
            onClick={() => onQtyChange(qty + 1)}
            className="w-8 h-8 rounded-lg bg-galaxy-600 hover:bg-galaxy-700 flex items-center justify-center transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
