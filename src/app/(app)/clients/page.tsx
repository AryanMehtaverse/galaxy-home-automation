'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createLead } from '@/lib/leadsService'
import { subscribeToLeads } from '@/lib/firestore/leads'
import { subscribeToProjects } from '@/lib/firestore/projects'
import type { Lead, LeadSource, LeadStatus, PropertyType } from '@/types/lead'
import type { Project } from '@/types'
import { Search, UserPlus, Phone, ChevronRight, Building2, X } from 'lucide-react'

type ClientRow =
  | { kind: 'lead'; id: string; name: string; phone?: string; city?: string; meta?: string; badge: string; badgeColor: string; followUp?: string; overdue?: boolean; totalCalls: number }
  | { kind: 'project'; id: string; name: string; phone?: string; city?: string; meta?: string; badge: string; badgeColor: string; projectId: string }

const LEAD_STATUS_COLOR: Record<string, string> = {
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
const PROJECT_STATUS_COLOR: Record<string, string> = {
  'in_progress': 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  'completed':   'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  'planning':    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  'review':      'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  'on_hold':     'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
}

const SOURCES: LeadSource[] = ['IndiaMART','Meta Ads','Google Ads','Website','Referral','Architect','Builder','JustDial','Cold Calling','Walk In','Instagram','Facebook','LinkedIn','Manual Entry','Other']
const PROPERTY_TYPES: PropertyType[] = ['1 BHK','2 BHK','3 BHK','4 BHK','Villa','Office','Commercial','Other']

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const EMPTY_FORM = { name: '', phone: '', email: '', city: '', source: 'Manual Entry' as LeadSource, propertyType: '2 BHK' as PropertyType, budget: '', assignedTo: '', notes: '' }

export default function WorkstationPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'Leads' | 'Projects'>('All')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const router = useRouter()
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsub1 = subscribeToLeads(ls => { setLeads(ls); setLoading(false) })
    const unsub2 = subscribeToProjects(setProjects)
    return () => { unsub1(); unsub2() }
  }, [])

  useEffect(() => {
    if (showAdd) setTimeout(() => nameRef.current?.focus(), 80)
  }, [showAdd])

  const leadNames = new Set(leads.map(l => l.name.toLowerCase().trim()))
  const projectOnlyClients = projects.filter(p => p.clientName && !p.deleted && !leadNames.has(p.clientName.toLowerCase().trim()))
  const seenNames = new Set<string>()
  const dedupedProjects: Project[] = []
  for (const p of projectOnlyClients) {
    const key = p.clientName.toLowerCase().trim()
    if (!seenNames.has(key)) { seenNames.add(key); dedupedProjects.push(p) }
  }

  const allRows: ClientRow[] = [
    ...leads.map(l => ({
      kind: 'lead' as const,
      id: l.id, name: l.name, phone: l.phone, city: l.city,
      meta: [l.propertyType, l.assignedTo ? `· ${l.assignedTo}` : ''].filter(Boolean).join(' '),
      badge: l.status, badgeColor: LEAD_STATUS_COLOR[l.status] || '',
      followUp: l.nextFollowUpDate,
      overdue: l.nextFollowUpDate ? new Date(l.nextFollowUpDate) < new Date() : false,
      totalCalls: l.totalCalls,
    })),
    ...dedupedProjects.map(p => ({
      kind: 'project' as const,
      id: p.id, name: p.clientName, phone: p.clientPhone, city: p.city, meta: p.address,
      badge: p.status.replace('_', ' '), badgeColor: PROJECT_STATUS_COLOR[p.status] || '',
      projectId: p.id,
    })),
  ].sort((a, b) => a.name.localeCompare(b.name))

  const filtered = allRows.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !search || r.name.toLowerCase().includes(q) || r.phone?.includes(search) || r.city?.toLowerCase().includes(q)
    const matchFilter = filter === 'All' || (filter === 'Leads' && r.kind === 'lead') || (filter === 'Projects' && r.kind === 'project')
    return matchSearch && matchFilter
  })

  function handleClick(row: ClientRow) {
    if (row.kind === 'lead') router.push(`/clients/${row.id}`)
    else router.push(`/projects/${row.projectId}`)
  }

  function field(key: keyof typeof form, val: string) {
    setForm(f => ({ ...f, [key]: val }))
    setFormError('')
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Name is required'); return }
    if (!form.phone.trim()) { setFormError('Phone is required'); return }
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const lead = await createLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        city: form.city.trim() || 'Not specified',
        source: form.source,
        propertyType: form.propertyType,
        budget: form.budget.trim() || undefined,
        assignedTo: form.assignedTo.trim() || undefined,
        notes: form.notes.trim() || undefined,
        status: 'New Lead',
        totalCalls: 0,
        createdAt: now,
        updatedAt: now,
      })
      setShowAdd(false)
      setForm(EMPTY_FORM)
      router.push(`/clients/${lead.id}`)
    } catch {
      setFormError('Failed to add client. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Workstation</h1>
            <p className="text-xs text-zinc-400 mt-0.5">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, phone, city…"
                className="pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840] w-60 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 rounded-xl bg-[#C9A840] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8962e] transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Add Client
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {(['All', 'Leads', 'Projects'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-4 py-1.5 rounded-full font-medium transition-colors ${filter === f ? 'bg-[#C9A840] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 dark:border-zinc-700 border-t-[#C9A840]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <p className="text-sm">{search ? 'No clients match your search' : 'No clients yet — add your first one'}</p>
            {!search && <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-[#C9A840] hover:underline">+ Add Client</button>}
          </div>
        ) : (
          <div className="space-y-2 max-w-4xl mx-auto">
            {filtered.map(row => (
              <button
                key={row.kind === 'lead' ? `lead-${row.id}` : `proj-${row.id}`}
                onClick={() => handleClick(row)}
                className="w-full flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 hover:border-[#C9A840]/50 hover:shadow-md transition-all text-left group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${row.kind === 'lead' ? 'bg-[#C9A840]/10 border border-[#C9A840]/20 text-[#C9A840]' : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'}`}>
                  {row.kind === 'project' ? <Building2 className="w-4 h-4" /> : initials(row.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${row.badgeColor}`}>{row.badge}</span>
                    {row.kind === 'project' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">Project</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {row.phone && <span className="flex items-center gap-1 text-xs text-zinc-400"><Phone className="w-3 h-3" />{row.phone}</span>}
                    {row.city && <span className="text-xs text-zinc-400">{row.city}</span>}
                    {row.meta && <span className="text-xs text-zinc-400">{row.meta}</span>}
                  </div>
                </div>
                {row.kind === 'lead' && (
                  <div className="text-right shrink-0">
                    {row.followUp && <p className={`text-xs font-medium ${row.overdue ? 'text-red-500' : 'text-[#C9A840]'}`}>
                      {row.overdue ? 'Overdue' : new Date(row.followUp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>}
                    <p className="text-xs text-zinc-400 mt-0.5">{row.totalCalls} call{row.totalCalls !== 1 ? 's' : ''}</p>
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-[#C9A840] transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Add New Client</h2>
              <button onClick={() => setShowAdd(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddClient} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Full Name *</label>
                  <input ref={nameRef} value={form.name} onChange={e => field('name', e.target.value)} placeholder="e.g. Raj Shah" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Phone *</label>
                  <input value={form.phone} onChange={e => field('phone', e.target.value)} placeholder="9876543210" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">City</label>
                  <input value={form.city} onChange={e => field('city', e.target.value)} placeholder="Mumbai" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Email</label>
                  <input value={form.email} onChange={e => field('email', e.target.value)} placeholder="client@email.com" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Budget</label>
                  <input value={form.budget} onChange={e => field('budget', e.target.value)} placeholder="e.g. 5-10L" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Source</label>
                  <select value={form.source} onChange={e => field('source', e.target.value)} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840]">
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Property Type</label>
                  <select value={form.propertyType} onChange={e => field('propertyType', e.target.value)} className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840]">
                    {PROPERTY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Assigned To</label>
                  <input value={form.assignedTo} onChange={e => field('assignedTo', e.target.value)} placeholder="Team member name" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Notes</label>
                  <textarea value={form.notes} onChange={e => field('notes', e.target.value)} rows={2} placeholder="Any initial notes…" className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840] resize-none" />
                </div>
              </div>
              {formError && <p className="text-xs text-red-500">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-[#C9A840] py-2.5 text-sm font-semibold text-white hover:bg-[#b8962e] disabled:opacity-50 transition-colors">
                  {saving ? 'Adding…' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
