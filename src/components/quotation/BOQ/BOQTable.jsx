import React from 'react'
import { formatCurrency } from '../../utils/formatters'
import { CATEGORY_LABELS } from '../../utils/boqGenerator'

export function BOQTable({ pricing, sectionDiscounts = {}, onSectionDiscountChange }) {
  const { lineItems = [], sections = [], productSubtotal, discountAmount, discountedSubtotal, totalInstallation, grandSubtotal } = pricing
  const editable = typeof onSectionDiscountChange === 'function'

  if (!lineItems.length) {
    return <div className="text-center py-12 text-gray-400 text-sm">No products added yet.</div>
  }

  // Group line items by category
  const groups = {}
  lineItems.forEach((item) => {
    const cat = CATEGORY_LABELS[item.category] || item.category
    if (!groups[cat]) groups[cat] = { label: cat, category: item.category, items: [] }
    groups[cat].items.push(item)
  })

  let srNo = 0

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-galaxy-800 text-white">
            <th className="px-3 py-2.5 text-left w-10">Sr.</th>
            <th className="px-3 py-2.5 text-left">Product Name</th>
            <th className="px-3 py-2.5 text-left hidden md:table-cell">Part Code</th>
            <th className="px-3 py-2.5 text-center w-16">Qty</th>
            <th className="px-3 py-2.5 text-right">Unit Price</th>
            <th className="px-3 py-2.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(groups).map(({ label, category, items }) => {
            const secData   = sections.find((s) => s.category === category)
            const discPct   = sectionDiscounts[category] ?? 0
            const itemTotal = items.reduce((s, i) => s + i.amount, 0)

            return (
              <React.Fragment key={label}>
                {/* ── Category header with per-section discount input ── */}
                <tr className="bg-galaxy-50 border-t border-galaxy-200">
                  <td colSpan={editable ? 4 : 6} className="px-3 py-2 font-semibold text-galaxy-700 text-xs uppercase tracking-wider">
                    {label}
                  </td>
                  {editable && (
                    <td colSpan={2} className="px-3 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs text-gray-400">Disc.</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={discPct}
                          onChange={(e) => onSectionDiscountChange(category, parseFloat(e.target.value) || 0)}
                          className="w-16 text-right border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-galaxy-500"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </td>
                  )}
                </tr>

                {/* ── Product rows ── */}
                {items.map((item) => {
                  srNo++
                  return (
                    <tr key={item.productId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-400 text-xs">{srNo}</td>
                      <td className="px-3 py-2.5 text-gray-800 font-medium">{item.name}</td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs hidden md:table-cell font-mono">{item.partCode}</td>
                      <td className="px-3 py-2.5 text-center text-gray-700">{item.qty}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-gray-800">{formatCurrency(item.amount)}</td>
                    </tr>
                  )
                })}

                {/* ── Section subtotal (after discount) ── */}
                <tr className="bg-amber-50">
                  <td colSpan={5} className="px-3 py-1.5 text-right text-xs font-semibold text-amber-800">
                    {label} — Subtotal
                    {discPct > 0 && (
                      <span className="ml-1 font-normal text-amber-600">(after {discPct}% discount)</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-right text-xs font-bold text-gray-800">
                    {formatCurrency(secData ? secData.discountedItemTotal : itemTotal)}
                  </td>
                </tr>

                {/* ── Installation charge (only if rate > 0) ── */}
                {secData && secData.installRate > 0 && (
                  <tr className="bg-indigo-50">
                    <td colSpan={5} className="px-3 py-1.5 text-right text-xs text-indigo-700">
                      Installation &amp; Setup — {label} ({Math.round(secData.installRate * 100)}%)
                    </td>
                    <td className="px-3 py-1.5 text-right text-xs font-semibold text-indigo-700">
                      {formatCurrency(secData.installCharge)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>

        <tfoot>
          <tr className="border-t-2 border-galaxy-200">
            <td colSpan={5} className="px-3 py-2.5 text-right text-sm font-medium text-gray-600">Product Subtotal</td>
            <td className="px-3 py-2.5 text-right font-semibold text-gray-800">{formatCurrency(productSubtotal)}</td>
          </tr>

          {discountAmount > 0 && (
            <>
              <tr>
                <td colSpan={5} className="px-3 py-1.5 text-right text-sm text-red-600">Total Discount</td>
                <td className="px-3 py-1.5 text-right text-sm text-red-600">− {formatCurrency(discountAmount)}</td>
              </tr>
              <tr>
                <td colSpan={5} className="px-3 py-1.5 text-right text-sm text-gray-600">Discounted Total</td>
                <td className="px-3 py-1.5 text-right text-sm font-medium text-gray-700">{formatCurrency(discountedSubtotal)}</td>
              </tr>
            </>
          )}

          {totalInstallation > 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-1.5 text-right text-sm text-indigo-700 font-medium">
                Total Installation &amp; Setup Charges
              </td>
              <td className="px-3 py-1.5 text-right text-sm font-semibold text-indigo-700">
                + {formatCurrency(totalInstallation)}
              </td>
            </tr>
          )}

          <tr className="bg-galaxy-700 text-white">
            <td colSpan={5} className="px-3 py-3 text-right font-bold">Grand Total</td>
            <td className="px-3 py-3 text-right font-bold text-lg">{formatCurrency(grandSubtotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
