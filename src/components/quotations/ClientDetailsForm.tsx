'use client'

import type { Quote, QuoteStatus } from '@/types/quote'

const STATUSES: QuoteStatus[] = ['Draft', 'Sent', 'Approved', 'Rejected', 'On Hold']

const inputCls = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-[#C9A840] focus:outline-none focus:ring-1 focus:ring-[#C9A840]'
const labelCls = 'block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1'

interface Props {
  quote: Partial<Quote>
  onChange: (q: Partial<Quote>) => void
}

export function ClientDetailsForm({ quote, onChange }: Props) {
  const set = (field: keyof Quote) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange({ ...quote, [field]: e.target.value })

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Client Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Client Name *</label>
            <input className={inputCls} value={quote.clientName || ''} onChange={set('clientName')} placeholder="e.g. Rajesh Kumar" />
          </div>
          <div>
            <label className={labelCls}>Company / Project</label>
            <input className={inputCls} value={quote.company || ''} onChange={set('company')} placeholder="Company or project name" />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} value={quote.phone || ''} onChange={set('phone')} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" value={quote.email || ''} onChange={set('email')} placeholder="client@example.com" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Property Address</label>
            <textarea className={inputCls} rows={3} value={quote.address || ''} onChange={set('address')} placeholder="Full property address" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Quote Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Quote Number</label>
            <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={quote.number || ''} disabled />
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input className={inputCls} type="date" value={quote.date ? quote.date.split('T')[0] : ''} onChange={(e) => onChange({ ...quote, date: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={quote.status || 'Draft'} onChange={set('status')}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Salesperson</label>
            <input className={inputCls} value={quote.salesperson || ''} onChange={set('salesperson')} placeholder="Sales executive name" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea className={inputCls} rows={3} value={quote.notes || ''} onChange={set('notes')} placeholder="Internal notes or special requirements" />
          </div>
        </div>
      </div>
    </div>
  )
}
