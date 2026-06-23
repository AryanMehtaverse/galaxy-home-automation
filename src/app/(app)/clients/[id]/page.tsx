'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchLeads, fetchCallLogs, updateLead } from '@/lib/leadsService'
import { getQuotesByLeadId } from '@/lib/firestore/quotesNative'
import { subscribeToProjects } from '@/lib/firestore/projects'
import type { Lead, CallLog, LeadStatus } from '@/types/lead'
import type { Quote } from '@/types/quote'
import type { Project } from '@/types'
import {
  Phone, MessageSquare, ArrowLeft, MapPin, Mail, Calendar,
  Clock, ChevronRight, FileText, Building2, Briefcase, Star,
  Edit2, Check, X
} from 'lucide-react'

const STATUS_OPTIONS: LeadStatus[] = [
  'New Lead', 'Contacted', 'Interested', 'Call Back Later',
  'Site Visit Required', 'Quotation Requested', 'Negotiation', 'Won', 'Lost', 'Not Interested'
]

const STATUS_COLOR: Record<string, string> = {
  'New Lead':            'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  'Contacted':           'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  'Interested':          'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  'Call Back Later':     'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  'Site Visit Required': 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
  'Quotation Requested': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400',
  'Negotiation':         'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400',
  'Won':                 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  'Lost':                'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  'Not Interested':      'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
}

const QUOTE_STATUS_COLOR: Record<string, string> = {
  draft:     'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  sent:      'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  approved:  'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  expired:   'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
}

const OUTCOME_COLOR: Record<string, string> = {
  'Interested':          'text-green-600 dark:text-green-400',
  'Not Interested':      'text-red-500 dark:text-red-400',
  'Call Back Later':     'text-amber-600 dark:text-amber-400',
  'Quotation Requested': 'text-cyan-600 dark:text-cyan-400',
  'Site Visit Required': 'text-orange-600 dark:text-orange-400',
  'No Answer':           'text-zinc-400',
  'Busy':                'text-zinc-400',
  'Wrong Number':        'text-zinc-400',
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-zinc-400 w-32 shrink-0">{label}</span>
      <span className="text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  )
}

interface PageProps { params: Promise<{ id: string }> }

export default function ClientDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [lead, setLead] = useState<Lead | null>(null)
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<LeadStatus>('New Lead')
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchLeads(),
      fetchCallLogs(id),
      getQuotesByLeadId(id),
    ]).then(([leads, logs, qs]) => {
      const found = leads.find(l => l.id === id) ?? null
      setLead(found)
      if (found) setNewStatus(found.status)
      setCallLogs(logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      setQuotes(qs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
    }).finally(() => setLoading(false))

    const unsub = subscribeToProjects(all => setProjects(all))
    return () => unsub()
  }, [id])

  async function handleStatusSave() {
    if (!lead) return
    setSavingStatus(true)
    try {
      await updateLead(lead.id, { status: newStatus })
      setLead(prev => prev ? { ...prev, status: newStatus } : prev)
      setEditingStatus(false)
    } finally {
      setSavingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 dark:border-zinc-700 border-t-[#C9A840]" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <p className="text-sm">Client not found</p>
        <button onClick={() => router.back()} className="mt-3 text-xs text-[#C9A840] hover:underline">Go back</button>
      </div>
    )
  }

  const linkedProjects = projects.filter(p => p.clientName?.toLowerCase() === lead.name.toLowerCase())

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </button>

      {/* Hero card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-[#C9A840]/10 border border-[#C9A840]/30 flex items-center justify-center text-xl font-bold text-[#C9A840] shrink-0">
            {lead.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{lead.name}</h1>
              {/* Status badge / editor */}
              {editingStatus ? (
                <div className="flex items-center gap-2">
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as LeadStatus)}
                    className="text-xs border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840]"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={handleStatusSave} disabled={savingStatus} className="text-green-600 hover:text-green-500">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingStatus(false); setNewStatus(lead.status) }} className="text-zinc-400 hover:text-zinc-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingStatus(true)} className="group flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_COLOR[lead.status] || ''}`}>
                    {lead.status}
                  </span>
                  <Edit2 className="w-3 h-3 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                </button>
              )}
              {lead.priority === 'High' && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
                  <Star className="w-3 h-3" /> High Priority
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-sm text-[#C9A840] hover:underline">
                <Phone className="w-3.5 h-3.5" />{lead.phone}
              </a>
              {lead.whatsapp && (
                <a href={`https://wa.me/91${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-green-600 hover:underline">
                  <MessageSquare className="w-3.5 h-3.5" />WA: {lead.whatsapp}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:underline">
                  <Mail className="w-3.5 h-3.5" />{lead.email}
                </a>
              )}
            </div>
          </div>

          <Link href={`/leads/${lead.id}`} className="shrink-0 text-xs text-zinc-400 hover:text-[#C9A840] flex items-center gap-1 transition-colors">
            Full Lead <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metadata grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Source', value: lead.source },
            { label: 'Type', value: lead.leadType },
            { label: 'Property', value: lead.propertyType },
            { label: 'Budget', value: lead.budget },
            { label: 'City', value: lead.city },
            { label: 'Assigned To', value: lead.assignedTo },
          ].map(({ label, value }) => value ? (
            <div key={label} className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-400 font-semibold">{label}</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-0.5">{value}</p>
            </div>
          ) : null)}
        </div>

        {lead.address && (
          <div className="flex items-start gap-2 mt-4 text-sm text-zinc-500">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{lead.address}{lead.city ? `, ${lead.city}` : ''}</span>
          </div>
        )}
        {lead.notes && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-sm text-zinc-700 dark:text-zinc-300">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wide mb-1">Notes</p>
            {lead.notes}
          </div>
        )}
      </div>

      {/* Follow-up banner */}
      {lead.nextFollowUpDate && (
        <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 border ${
          new Date(lead.nextFollowUpDate) < new Date()
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
        }`}>
          <Calendar className="w-4 h-4 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Follow-up: </span>
            {new Date(lead.nextFollowUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            {lead.nextFollowUpTime && ` at ${lead.nextFollowUpTime}`}
            {new Date(lead.nextFollowUpDate) < new Date() && <span className="ml-2 font-bold">— Overdue</span>}
          </div>
        </div>
      )}

      {/* Call History */}
      <Section
        title={`Call History (${callLogs.length})`}
        action={
          <Link href={`/leads/${lead.id}`} className="text-xs text-[#C9A840] hover:underline flex items-center gap-1">
            Log call <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {callLogs.length === 0 ? (
          <p className="text-sm text-zinc-400">No calls logged yet.</p>
        ) : (
          <div className="space-y-3">
            {callLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${OUTCOME_COLOR[log.outcome] || 'text-zinc-700 dark:text-zinc-300'}`}>
                      {log.outcome}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {log.time && ` · ${log.time}`}
                    </span>
                  </div>
                  {log.notes && <p className="text-xs text-zinc-500 mt-1">{log.notes}</p>}
                  {log.nextFollowUpDate && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Follow-up: {log.nextFollowUpDate}{log.nextFollowUpTime ? ` at ${log.nextFollowUpTime}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Quotations */}
      <Section
        title={`Quotations (${quotes.length})`}
        action={
          <Link href="/quotations" className="text-xs text-[#C9A840] hover:underline flex items-center gap-1">
            New quote <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {quotes.length === 0 ? (
          <p className="text-sm text-zinc-400">No quotations yet.</p>
        ) : (
          <div className="space-y-2">
            {quotes.map(q => (
              <Link
                key={q.id}
                href={`/quotations?edit=${q.id}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 px-4 py-3 hover:border-[#C9A840]/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group"
              >
                <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{q.number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${QUOTE_STATUS_COLOR[q.status] || ''}`}>
                      {q.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {new Date(q.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {q.notes ? ` · ${q.notes.slice(0, 60)}` : ''}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#C9A840] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Projects */}
      <Section
        title={`Projects (${linkedProjects.length})`}
        action={
          <Link href="/projects/new" className="text-xs text-[#C9A840] hover:underline flex items-center gap-1">
            New project <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {linkedProjects.length === 0 ? (
          <p className="text-sm text-zinc-400">No projects linked to this client.</p>
        ) : (
          <div className="space-y-2">
            {linkedProjects.map(p => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 px-4 py-3 hover:border-[#C9A840]/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group"
              >
                <Building2 className="w-4 h-4 text-zinc-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                      p.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' :
                      p.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' :
                      p.status === 'on_hold' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                      'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>{p.status.replace('_', ' ')}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 max-w-24">
                      <div className="h-full rounded-full bg-[#C9A840]" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-xs text-zinc-400">{p.progress}%</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#C9A840] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
