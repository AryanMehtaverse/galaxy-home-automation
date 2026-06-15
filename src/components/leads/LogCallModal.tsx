"use client"

import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { CallLog, CallOutcome, Priority } from '@/types/lead'

const OUTCOMES: CallOutcome[] = ['No Answer', 'Busy', 'Interested', 'Call Back Later', 'Quotation Requested', 'Site Visit Required', 'Not Interested', 'Wrong Number']
const PRIORITIES: Priority[] = ['High', 'Medium', 'Low']

interface LogCallModalProps {
  open: boolean
  onClose: () => void
  leadId: string
  onSave: (data: Omit<CallLog, 'id'>) => Promise<void>
}

const inputCls = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#C9A840] focus:outline-none focus:ring-1 focus:ring-[#C9A840]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</label>
      {children}
    </div>
  )
}

export function LogCallModal({ open, onClose, leadId, onSave }: LogCallModalProps) {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const timeStr = now.toTimeString().slice(0, 5)

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: todayStr,
    time: timeStr,
    outcome: 'Interested' as CallOutcome,
    notes: '',
    nextFollowUpDate: '',
    nextFollowUpTime: '',
    priority: 'Medium' as Priority,
  })

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const data: Omit<CallLog, 'id'> = {
        leadId,
        date: form.date,
        time: form.time,
        outcome: form.outcome,
        notes: form.notes.trim() || undefined,
        nextFollowUpDate: form.nextFollowUpDate || undefined,
        nextFollowUpTime: form.nextFollowUpTime || undefined,
        priority: form.priority,
        createdAt: new Date().toISOString(),
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
      title="Log Call"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" form="call-form" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Log Call'}
          </Button>
        </>
      }
    >
      <form id="call-form" onSubmit={handleSubmit} className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Date">
          <input className={inputCls} type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
        </Field>
        <Field label="Time">
          <input className={inputCls} type="time" value={form.time} onChange={(e) => set('time', e.target.value)} required />
        </Field>
        <div className="col-span-2">
          <Field label="Call Outcome">
            <select className={inputCls} value={form.outcome} onChange={(e) => set('outcome', e.target.value)}>
              {OUTCOMES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Next Follow-up Date">
          <input className={inputCls} type="date" value={form.nextFollowUpDate} onChange={(e) => set('nextFollowUpDate', e.target.value)} />
        </Field>
        <Field label="Follow-up Time">
          <input className={inputCls} type="time" value={form.nextFollowUpTime} onChange={(e) => set('nextFollowUpTime', e.target.value)} />
        </Field>
        <div className="col-span-2">
          <Field label="Priority">
            <select className={inputCls} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Notes">
            <textarea className={inputCls + ' resize-none'} rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="What was discussed on this call?" />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
