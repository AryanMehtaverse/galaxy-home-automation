'use client'

import { useMemo } from 'react'
import type { Quote, CatalogProduct } from '@/types/quote'
import { computePricing, formatCurrency } from '@/lib/pricingEngine'

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
  quote: Partial<Quote>
  products: CatalogProduct[]
  onDiscountChange?: (category: string, value: number) => void
  editable?: boolean
}

export function BOQView({ quote, products, onDiscountChange, editable = false }: Props) {
  const pricing = useMemo(
    () => computePricing(quote.rooms ?? [], products, quote.sectionDiscounts ?? {}),
    [quote.rooms, products, quote.sectionDiscounts]
  )

  if (pricing.lineItems.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-zinc-400">
        No products added yet. Go to the Rooms tab and add products.
      </div>
    )
  }

  // Group line items by category
  const grouped: Record<string, typeof pricing.lineItems> = {}
  pricing.lineItems.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  })

  let srNo = 0

  return (
    <div className="p-4 space-y-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-zinc-900 dark:bg-zinc-800 text-[#C9A840]">
            <th className="text-left px-3 py-2.5 w-10 font-medium">Sr.</th>
            <th className="text-left px-3 py-2.5 font-medium">Product</th>
            <th className="text-left px-3 py-2.5 hidden md:table-cell font-medium">Part Code</th>
            <th className="text-center px-3 py-2.5 w-16 font-medium">Qty</th>
            <th className="text-right px-3 py-2.5 font-medium">Unit Price</th>
            <th className="text-right px-3 py-2.5 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([category, items]) => {
            const section = pricing.sections.find((s) => s.category === category)
            const discountPct = quote.sectionDiscounts?.[category] ?? 0

            return (
              <>
                {/* Category header */}
                <tr key={`cat-${category}`} className="bg-zinc-800 dark:bg-zinc-700">
                  <td colSpan={4} className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#C9A840]">
                    {CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ')}
                  </td>
                  <td colSpan={2} className="px-3 py-2 text-right">
                    {editable && onDiscountChange ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-zinc-400">Discount:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={discountPct}
                          onChange={(e) => onDiscountChange(category, Number(e.target.value))}
                          className="w-14 rounded border border-zinc-600 bg-zinc-700 px-1.5 py-0.5 text-xs text-white text-center focus:outline-none focus:border-[#C9A840]"
                        />
                        <span className="text-xs text-zinc-400">%</span>
                      </div>
                    ) : discountPct > 0 ? (
                      <span className="text-xs text-red-400">Discount: {discountPct}%</span>
                    ) : null}
                  </td>
                </tr>

                {/* Items */}
                {items.map((item) => {
                  srNo++
                  const disc = discountPct / 100
                  const discountedUnit = Math.round(item.unitPrice * (1 - disc))
                  return (
                    <tr key={item.productId} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-3 py-2.5 text-xs text-zinc-400">{srNo}</td>
                      <td className="px-3 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">{item.name}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-zinc-400 hidden md:table-cell">{item.partCode}</td>
                      <td className="px-3 py-2.5 text-center text-zinc-600 dark:text-zinc-400">{item.qty}</td>
                      <td className="px-3 py-2.5 text-right text-zinc-600 dark:text-zinc-400">
                        {formatCurrency(item.unitPrice)}
                        {discountPct > 0 && (
                          <span className="ml-1 text-[10px] text-red-400">→ {formatCurrency(discountedUnit)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-[#C9A840]">
                        {formatCurrency(discountedUnit * item.qty)}
                      </td>
                    </tr>
                  )
                })}

                {/* Category subtotal */}
                {section && (
                  <tr key={`sub-${category}`} className="bg-zinc-50 dark:bg-zinc-800/30">
                    <td colSpan={5} className="px-3 py-1.5 text-right text-xs text-zinc-500">
                      {CATEGORY_LABELS[category] ?? category} subtotal
                      {section.installCharge > 0 && ` + Installation (${Math.round(section.installRate * 100)}%): ${formatCurrency(section.installCharge)}`}
                    </td>
                    <td className="px-3 py-1.5 text-right text-xs font-bold text-[#C9A840]">
                      {formatCurrency(section.discountedItemTotal + section.installCharge)}
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
        <tfoot>
          {pricing.discountAmount > 0 && (
            <tr className="border-t border-zinc-200 dark:border-zinc-700">
              <td colSpan={5} className="px-3 py-2 text-right text-sm text-red-500">Total Discount</td>
              <td className="px-3 py-2 text-right text-sm text-red-500">− {formatCurrency(pricing.discountAmount)}</td>
            </tr>
          )}
          {pricing.totalInstallation > 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-1.5 text-right text-sm text-indigo-400">Installation & Setup</td>
              <td className="px-3 py-1.5 text-right text-sm font-semibold text-indigo-400">+ {formatCurrency(pricing.totalInstallation)}</td>
            </tr>
          )}
          <tr className="bg-zinc-900 dark:bg-zinc-800">
            <td colSpan={5} className="px-3 py-3 text-right font-bold text-[#C9A840]">Grand Total</td>
            <td className="px-3 py-3 text-right font-bold text-lg text-[#C9A840]">{formatCurrency(pricing.grandSubtotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
