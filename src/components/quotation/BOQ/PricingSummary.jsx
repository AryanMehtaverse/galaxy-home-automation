import React, { useState } from 'react'
import { formatCurrency } from '../../utils/formatters'
import { Tag } from 'lucide-react'
import { CATEGORY_LABELS } from '../../utils/boqGenerator'

export function PricingSummary({ pricing, sectionDiscounts = {}, onApplyAll, editable = false }) {
  const {
    sections = [], productSubtotal, discountAmount, discountedSubtotal,
    totalInstallation, grandSubtotal,
  } = pricing

  const [applyAllValue, setApplyAllValue] = useState('')

  return (
    <div className="bg-white rounded-xl border border-galaxy-200 overflow-hidden">
      <div className="bg-galaxy-50 px-5 py-3 border-b border-galaxy-200 flex items-center gap-2">
        <Tag className="w-4 h-4 text-galaxy-600" />
        <span className="font-semibold text-galaxy-800 text-sm">Pricing Summary</span>
      </div>

      <div className="p-5 space-y-4">

        {/* Apply to all sections shortcut */}
        {editable && (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-500 shrink-0">Apply to all:</span>
            <input
              type="number" min="0" max="100" step="1"
              value={applyAllValue}
              placeholder="0"
              onChange={(e) => setApplyAllValue(e.target.value)}
              className="w-16 text-right border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-galaxy-500"
            />
            <span className="text-xs text-gray-400">%</span>
            <button
              onClick={() => { onApplyAll(parseFloat(applyAllValue) || 0); setApplyAllValue('') }}
              className="ml-auto text-xs bg-galaxy-600 text-white px-2.5 py-1 rounded hover:bg-galaxy-700 transition"
            >
              Apply
            </button>
          </div>
        )}

        {/* Per-section breakdown */}
        {sections.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section Breakdown</p>
            {sections.map((sec) => {
              const disc = sectionDiscounts[sec.category] ?? 0
              return (
                <div key={sec.category} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate max-w-[140px]">
                    {CATEGORY_LABELS[sec.category] || sec.category}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {disc > 0 && (
                      <span className="text-red-500">−{disc}%</span>
                    )}
                    <span className="font-medium text-gray-800 w-24 text-right">
                      {formatCurrency(sec.discountedItemTotal)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="border-t border-gray-100 pt-3 space-y-2">
          <Row label="Product Subtotal" value={formatCurrency(productSubtotal)} />

          {discountAmount > 0 && (
            <Row label="Total Discount" value={`− ${formatCurrency(discountAmount)}`} valueClass="text-red-600" />
          )}

          {discountAmount > 0 && (
            <Row label="Discounted Total" value={formatCurrency(discountedSubtotal)} />
          )}

          {totalInstallation > 0 && (
            <Row
              label="Installation & Setup"
              value={`+ ${formatCurrency(totalInstallation)}`}
              valueClass="text-indigo-600"
            />
          )}
        </div>

        {/* Grand Total */}
        <div className="border-t border-galaxy-200 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-galaxy-900">Grand Total</span>
            <span className="text-xl font-bold text-galaxy-700">{formatCurrency(grandSubtotal)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, valueClass = 'text-gray-800' }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  )
}
