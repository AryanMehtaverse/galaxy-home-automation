import React from 'react'
import { User, Building2, Phone, Mail, MapPin, Hash } from 'lucide-react'

export function ClientDetailsTab({ quote, onChange }) {
  const set = (field) => (e) => onChange({ ...quote, [field]: e.target.value })

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Client Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field icon={<User />} label="Client Name *" placeholder="Full name">
            <input value={quote.clientName || ''} onChange={set('clientName')} placeholder="e.g. Rajesh Kumar" className="input-field" />
          </Field>
          <Field icon={<Building2 />} label="Company / Project">
            <input value={quote.company || ''} onChange={set('company')} placeholder="Company or project name" className="input-field" />
          </Field>
          <Field icon={<Phone />} label="Phone Number">
            <input value={quote.phone || ''} onChange={set('phone')} placeholder="+91 98765 43210" className="input-field" />
          </Field>
          <Field icon={<Mail />} label="Email Address">
            <input value={quote.email || ''} onChange={set('email')} type="email" placeholder="client@example.com" className="input-field" />
          </Field>
          <Field icon={<MapPin />} label="Property Address" className="md:col-span-2">
            <textarea
              value={quote.address || ''}
              onChange={set('address')}
              rows={3}
              placeholder="Full property address"
              className="input-field resize-none"
            />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Quote Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field icon={<Hash />} label="Quote Number">
            <input value={quote.number || ''} disabled className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" />
          </Field>
          <Field label="Quote Date">
            <input
              type="date"
              value={quote.date ? quote.date.split('T')[0] : ''}
              onChange={(e) => onChange({ ...quote, date: new Date(e.target.value).toISOString() })}
              className="input-field"
            />
          </Field>
          <Field label="Status">
            <select value={quote.status || 'Draft'} onChange={set('status')} className="input-field">
              {['Draft', 'Sent', 'Approved', 'Rejected', 'On Hold'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Salesperson">
            <input value={quote.salesperson || ''} onChange={set('salesperson')} placeholder="Sales executive name" className="input-field" />
          </Field>
          <Field label="Notes" className="md:col-span-2">
            <textarea
              value={quote.notes || ''}
              onChange={set('notes')}
              rows={3}
              placeholder="Internal notes or special requirements"
              className="input-field resize-none"
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

function Field({ icon, label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
        {icon && <span className="w-3.5 h-3.5 text-galaxy-500">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  )
}
