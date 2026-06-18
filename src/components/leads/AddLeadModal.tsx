"use client"

import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { Lead, LeadSource, LeadStatus, LeadType, PropertyType, Priority } from '@/types/lead'

const SOURCES: LeadSource[] = ['IndiaMART', 'Meta Ads', 'Google Ads', 'Website', 'Referral', 'Architect', 'Builder', 'JustDial', 'Cold Calling', 'Walk In', 'Manual Entry', 'Instagram', 'Facebook', 'LinkedIn', 'Other']
const STATUSES: LeadStatus[] = ['New Lead', 'Contacted', 'Interested', 'Call Back Later', 'Site Visit Required', 'Quotation Requested', 'Negotiation', 'Won', 'Lost', 'Not Interested']
const PROPERTY_TYPES: PropertyType[] = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Villa', 'Office', 'Commercial', 'Other']
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low']

interface AddLeadModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Lead, 'id'>) => Promise<void>
  initial?: Lead | null
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#C9A840] focus:outline-none focus:ring-1 focus:ring-[#C9A840]'

export function AddLeadModal({ open, onClose, onSave, initial }: AddLeadModalProps) {
  const now = new Date().toISOString().split('T')[0]
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    whatsapp: initial?.whatsapp ?? '',
    email: initial?.email ?? '',
    city: initial?.city ?? '',
    address: initial?.address ?? '',
    source: initial?.source ?? ('IndiaMART' as LeadSource),
    leadType: initial?.leadType ?? ('B2C' as LeadType),
    propertyType: initial?.propertyType ?? ('3 BHK' as PropertyType),
    budget: initial?.budget ?? '',
    assignedTo: initial?.assignedTo ?? '',
    notes: initial?.notes ?? '',
    status: initial?.status ?? ('New Lead' as LeadStatus),
    priority: initial?.priority ?? ('Medium' as Priority),
    nextFollowUpDate: initial?.nextFollowUpDate ?? '',
    nextFollowUpTime: initial?.nextFollowUpTime ?? '',
  })

  // Reset when initial changes
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone || !form.city) return
    setSaving(true)
    try {
      const data: Omit<Lead, 'id'> = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
        email: form.email.trim() || undefined,
        city: form.city.trim(),
        address: form.address.trim() || undefined,
        source: form.source,
        leadType: form.leadType,
        propertyType: form.leadType === 'B2C' ? form.propertyType : ('Other' as PropertyType),
        budget: form.leadType === 'B2C' ? (form.budget.trim() || undefined) : undefined,
        assignedTo: form.assignedTo.trim() || undefined,
        notes: form.notes.trim() || undefined,
        status: form.status,
        priority: form.priority,
        nextFollowUpDate: form.nextFollowUpDate || undefined,
        nextFollowUpTime: form.nextFollowUpTime || undefined,
        createdAt: initial?.createdAt ?? now,
        updatedAt: now,
        totalCalls: initial?.totalCalls ?? 0,
        lastCallDate: initial?.lastCallDate,
        lastCallOutcome: initial?.lastCallOutcome,
      }
      await onSave(data)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Lead' : 'Add New Lead'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" form="lead-form" type="submit" disabled={saving}>
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Lead'}
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-1 sm:grid-cols-2">
        <Field label="Name *">
          <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Rajesh Sharma" required />
        </Field>
        <Field label="Phone *">
          <input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="9820112233" required />
        </Field>
        <Field label="WhatsApp">
          <input className={inputCls} value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="Same as phone" />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@example.com" />
        </Field>
        <Field label="City *">
          <input className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Mumbai" required />
        </Field>
        <Field label="Source">
          <select className={inputCls} value={form.source} onChange={(e) => set('source', e.target.value)}>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Lead Type">
          <div className="flex gap-4 py-2">
            {(['B2C', 'B2B'] as LeadType[]).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="leadType"
                  value={t}
                  checked={form.leadType === t}
                  onChange={() => set('leadType', t)}
                  className="accent-[#C9A840]"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{t}</span>
              </label>
            ))}
          </div>
        </Field>
        {form.leadType === 'B2C' && (
          <>
            <Field label="Property Type">
              <select className={inputCls} value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                {PROPERTY_TYPES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Budget">
              <input className={inputCls} value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="₹2-3 Lakh" />
            </Field>
          </>
        )}
        <Field label="Status">
          <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select className={inputCls} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Assigned To">
          <input className={inputCls} value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} placeholder="Aryan" />
        </Field>
        <Field label="Next Follow-up Date">
          <input className={inputCls} type="date" value={form.nextFollowUpDate} onChange={(e) => set('nextFollowUpDate', e.target.value)} />
        </Field>
        <Field label="Follow-up Time">
          <input className={inputCls} type="time" value={form.nextFollowUpTime} onChange={(e) => set('nextFollowUpTime', e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address">
            <input className={inputCls} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Flat 302, Suncity Apartments, Andheri West" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <textarea className={inputCls + ' resize-none'} rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Additional notes about this lead..." />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
