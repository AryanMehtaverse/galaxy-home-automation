import React, { useMemo, useState } from 'react'
import { PricingSummary } from '../BOQ/PricingSummary'
import { computePricing } from '../../utils/pricingEngine'
import { formatCurrency } from '../../utils/formatters'

function ZoneBOQTable({ rooms, products, sectionDiscounts, onSectionDiscountChange, pricing }) {
  if (!rooms || rooms.length === 0) {
    return <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No zones added yet. Draw zones on the Floor Plan tab and drag products onto them.</div>
  }

  const allEmpty = rooms.every(r => (r.products || []).length === 0)
  if (allEmpty) {
    return <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>No products placed in any zone yet.</div>
  }

  let srNo = 0

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ background: '#1E1F30', color: '#A78BFA' }}>
            <th className="px-3 py-2.5 text-left w-10">Sr.</th>
            <th className="px-3 py-2.5 text-left">Product Name</th>
            <th className="px-3 py-2.5 text-left hidden md:table-cell">Part Code</th>
            <th className="px-3 py-2.5 text-center w-16">Qty</th>
            <th className="px-3 py-2.5 text-right">Unit Price</th>
            <th className="px-3 py-2.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map(room => {
            const roomItems = (room.products || []).map(rp => {
              const product = products.find(p => p.id === rp.productId)
              if (!product) return null
              const basePrice = product.gsp || product.price || 0
              const discPct = sectionDiscounts[product.category] ?? 0
              const discountedUnit = basePrice * (1 - discPct / 100)
              const amount = discountedUnit * rp.qty
              return { product, qty: rp.qty, unitPrice: basePrice, discountedUnit, amount, discPct }
            }).filter(Boolean)

            if (roomItems.length === 0) return null

            const roomSubtotal = roomItems.reduce((s, i) => s + i.amount, 0)

            return (
              <React.Fragment key={room.id}>
                {/* Zone header */}
                <tr style={{ background: '#1E1F30' }}>
                  <td colSpan={6} className="px-3 py-2 font-bold text-xs uppercase tracking-wider" style={{ color: '#A78BFA' }}>
                    {room.name}
                  </td>
                </tr>

                {/* Product rows */}
                {roomItems.map(({ product, qty, unitPrice, discPct, amount }) => {
                  srNo++
                  return (
                    <tr key={`${room.id}-${product.id}`} className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>{srNo}</td>
                      <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>{product.name}</td>
                      <td className="px-3 py-2.5 text-xs hidden md:table-cell font-mono" style={{ color: 'var(--text-muted)' }}>{product.partCode || product.id}</td>
                      <td className="px-3 py-2.5 text-center" style={{ color: 'var(--text-secondary)' }}>{qty}</td>
                      <td className="px-3 py-2.5 text-right" style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(unitPrice)}
                        {discPct > 0 && <span className="ml-1 text-[10px]" style={{ color: '#ef4444' }}>-{discPct}%</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold" style={{ color: 'var(--gold)' }}>{formatCurrency(amount)}</td>
                    </tr>
                  )
                })}

                {/* Zone subtotal */}
                <tr style={{ background: 'rgba(124,58,237,0.06)' }}>
                  <td colSpan={5} className="px-3 py-1.5 text-right text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {room.name} — Subtotal
                  </td>
                  <td className="px-3 py-1.5 text-right text-xs font-bold" style={{ color: 'var(--gold)' }}>
                    {formatCurrency(roomSubtotal)}
                  </td>
                </tr>
              </React.Fragment>
            )
          })}
        </tbody>

        {/* Grand total from pricingEngine */}
        {pricing && (
          <tfoot>
            {pricing.discountAmount > 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-2 text-right text-sm" style={{ color: '#ef4444' }}>Total Discount</td>
                <td className="px-3 py-2 text-right text-sm" style={{ color: '#ef4444' }}>− {formatCurrency(pricing.discountAmount)}</td>
              </tr>
            )}
            {pricing.totalInstallation > 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-1.5 text-right text-sm" style={{ color: '#818CF8' }}>
                  Total Installation &amp; Setup
                </td>
                <td className="px-3 py-1.5 text-right text-sm font-semibold" style={{ color: '#818CF8' }}>
                  + {formatCurrency(pricing.totalInstallation)}
                </td>
              </tr>
            )}
            <tr style={{ background: '#1E1F30' }}>
              <td colSpan={5} className="px-3 py-3 text-right font-bold" style={{ color: '#A78BFA' }}>Grand Total</td>
              <td className="px-3 py-3 text-right font-bold text-lg" style={{ color: 'var(--gold)' }}>{formatCurrency(pricing.grandSubtotal)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

export function BOQTab({ quote, products, onChange }) {
  const sectionDiscounts = quote.sectionDiscounts || {}

  const pricing = useMemo(
    () => computePricing(quote.rooms || [], products, sectionDiscounts),
    [quote.rooms, products, sectionDiscounts]
  )

  const handleSectionDiscount = (category, value) => {
    onChange({ ...quote, sectionDiscounts: { ...sectionDiscounts, [category]: value } })
  }

  const handleApplyAll = (value) => {
    const updated = {}
    pricing.sections.forEach((s) => { updated[s.category] = value })
    onChange({ ...quote, sectionDiscounts: updated })
  }

  return (
    <div className="p-6 space-y-5">
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Bill of Quantities</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <ZoneBOQTable
              rooms={quote.rooms || []}
              products={products}
              sectionDiscounts={sectionDiscounts}
              onSectionDiscountChange={handleSectionDiscount}
              pricing={pricing}
            />
          </div>
        </div>
        <div>
          <PricingSummary
            pricing={pricing}
            sectionDiscounts={sectionDiscounts}
            onApplyAll={handleApplyAll}
            editable
          />
        </div>
      </div>
    </div>
  )
}
