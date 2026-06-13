import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FileText, User, LayoutGrid, Map, DollarSign } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { computePricing } from '../../utils/pricingEngine'
import { PricingSummary } from '../BOQ/PricingSummary'

export function SummaryTab({ quote, products, onSave, saving }) {
  const navigate = useNavigate()
  const pricing = useMemo(
    () => computePricing(quote.rooms || [], products, quote.sectionDiscounts || {}),
    [quote.rooms, products, quote.sectionDiscounts]
  )

  const totalRooms = (quote.rooms || []).length
  const totalProducts = (quote.rooms || []).reduce((s, r) => s + (r.products || []).length, 0)
  const hasClient = !!quote.clientName

  const checks = [
    { label: 'Client name', ok: hasClient },
    { label: 'At least 1 room', ok: totalRooms > 0 },
    { label: 'At least 1 product', ok: pricing.lineItems.length > 0 },
  ]

  const canSave = checks.every((c) => c.ok)

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <h3 className="text-base font-semibold text-gray-900">Summary & Save</h3>

      {/* Checklist */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        {checks.map((c) => (
          <div key={c.label} className={`flex items-center gap-2.5 text-sm ${c.ok ? 'text-green-700' : 'text-amber-600'}`}>
            <CheckCircle2 className={`w-4 h-4 ${c.ok ? 'text-green-500' : 'text-amber-400'}`} />
            {c.label}
            {!c.ok && <span className="text-xs text-amber-500">(required)</span>}
          </div>
        ))}
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<User />} label="Client" value={quote.clientName || '—'} />
        <StatCard icon={<FileText />} label="Quote No." value={quote.number || '—'} />
        <StatCard icon={<LayoutGrid />} label="Rooms" value={`${totalRooms} room${totalRooms !== 1 ? 's' : ''}`} />
        <StatCard icon={<Map />} label="Floor Plan" value={quote.floorPlan?.fileName || 'None'} />
        <StatCard icon={<DollarSign />} label="Grand Total" value={formatCurrency(pricing.grandSubtotal)} accent />
      </div>

      {/* Pricing summary (read-only) */}
      <PricingSummary pricing={pricing} sectionDiscounts={quote.sectionDiscounts || {}} editable={false} />

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={!canSave || saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Quote'}
        </button>
        {quote.id && (
          <button
            onClick={() => navigate(`/quote/${quote.id}/boq`)}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Preview BOQ
          </button>
        )}
      </div>

      {!canSave && (
        <p className="text-xs text-amber-600">Complete the required fields above before saving.</p>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, accent = false }) {
  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${accent ? 'bg-galaxy-50 border-galaxy-200' : 'bg-white border-gray-100'}`}>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? 'bg-galaxy-100 text-galaxy-600' : 'bg-gray-100 text-gray-500'}`}>
        {React.cloneElement(icon, { className: 'w-4 h-4' })}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm font-semibold truncate ${accent ? 'text-galaxy-700' : 'text-gray-800'}`}>{value}</p>
      </div>
    </div>
  )
}
