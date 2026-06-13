import React from 'react'
import { formatCurrency } from '../utils/formatters'
import { CATEGORY_LABELS } from '../utils/boqGenerator'

export default function BOQTable({ boq }) {
  if (!boq || boq.lineItems.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-sm">No products selected yet.</p>
      </div>
    )
  }

  // Group by category
  const grouped = boq.lineItems.reduce((acc, item) => {
    const cat = CATEGORY_LABELS[item.category] || item.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Part Code</th>
            <th className="text-center px-4 py-3 font-semibold text-slate-600">Qty</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">Rate</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([category, items]) => (
            <React.Fragment key={category}>
              <tr className="bg-galaxy-50 border-b border-galaxy-100">
                <td colSpan={6} className="px-4 py-2 text-xs font-semibold text-galaxy-700 uppercase tracking-wide">
                  {category}
                </td>
              </tr>
              {items.map((item, idx) => (
                <tr key={item.productId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{item.partCode}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{item.qty}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50">
            <td colSpan={5} className="px-4 py-3 text-right text-slate-600 font-medium">Subtotal</td>
            <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(boq.subtotal)}</td>
          </tr>
          <tr className="bg-slate-50">
            <td colSpan={5} className="px-4 py-3 text-right text-slate-600 font-medium">
              GST ({(boq.gstRate * 100).toFixed(0)}%)
            </td>
            <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(boq.gstAmount)}</td>
          </tr>
          <tr className="bg-galaxy-600">
            <td colSpan={5} className="px-4 py-4 text-right font-bold text-white text-base">Grand Total</td>
            <td className="px-4 py-4 text-right font-bold text-white text-base">{formatCurrency(boq.grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
