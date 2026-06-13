import React from 'react'
import { PRESETS } from '../../data/presets'

const OPTIONS = [
  { key: '2BHK', label: '2 BHK', beds: 2, desc: 'Entry · Living · Dining · 2 Bedrooms · Toilets · Network' },
  { key: '3BHK', label: '3 BHK', beds: 3, desc: 'Entry · Living · Dining · 3 Bedrooms · Toilets · Network' },
  { key: '4BHK', label: '4 BHK', beds: 4, desc: 'Entry · Living · Dining · 4 Bedrooms · Toilets · Network' },
]

const makeRoom = (template) => ({
  id: crypto.randomUUID(),
  name: template.name,
  type: template.type,
  products: template.products || [],
})

export function HouseTypeTab({ quote, onChange }) {
  const apply = (key) => {
    const preset = PRESETS[key]
    if (!preset) return
    onChange({
      ...quote,
      bhkType: key,
      rooms: preset.rooms.map(makeRoom),
      sectionDiscounts: preset.sectionDiscounts || {},
      discountPercent: preset.discountPercent ?? 0,
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Property Type
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Select the configuration — rooms and standard products will be pre-filled automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {OPTIONS.map(({ key, label, beds, desc }) => {
          const isActive = quote.bhkType === key
          return (
            <button
              key={key}
              onClick={() => apply(key)}
              className="relative text-left p-5 rounded-2xl transition-all duration-200"
              style={isActive ? {
                background: 'rgba(212,175,55,0.08)',
                border: '2px solid var(--gold)',
              } : {
                background: 'var(--bg-surface)',
                border: '2px solid var(--border)',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)' }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Bedroom count visual */}
                  <div className="flex gap-1 shrink-0">
                    {Array.from({ length: beds }).map((_, i) => (
                      <div key={i} className="w-3 h-4 rounded-sm"
                           style={{ background: isActive ? 'var(--gold)' : 'var(--border)' }} />
                    ))}
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: isActive ? 'var(--gold)' : 'var(--text-primary)' }}>
                      {label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </div>
                {isActive && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                       style={{ background: 'var(--gold)', color: '#0A0808' }}>
                    <span className="text-xs font-black">✓</span>
                  </div>
                )}
              </div>

              {isActive && (
                <div className="mt-3 pt-3 grid grid-cols-3 gap-2 text-center"
                     style={{ borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                  {[
                    { label: 'Rooms',    value: (PRESETS[key]?.rooms?.length ?? 0) },
                    { label: 'Products', value: (PRESETS[key]?.rooms?.reduce((s, r) => s + (r.products?.length || 0), 0) ?? 0) + ' types' },
                    { label: 'Discount', value: (PRESETS[key]?.discountPercent ?? 25) + '%' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--gold)' }}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {quote.bhkType && (
        <div className="px-4 py-3 rounded-xl text-sm"
             style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', color: 'var(--text-secondary)' }}>
          ✓ <strong style={{ color: 'var(--gold)' }}>{quote.bhkType.replace('BHK', ' BHK')}</strong> template applied —{' '}
          {quote.rooms?.length ?? 0} rooms with standard products pre-filled. You can customise everything in the next steps.
        </div>
      )}
    </div>
  )
}
