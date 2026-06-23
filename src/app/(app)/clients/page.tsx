'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchLeads } from '@/lib/leadsService'
import { subscribeToProjects } from '@/lib/firestore/projects'
import type { Lead } from '@/types/lead'
import type { Project } from '@/types'
import { Search, UserPlus, Phone, ChevronRight, Building2 } from 'lucide-react'

// A unified client row — either backed by a lead or a project-only entry
type ClientRow =
  | { kind: 'lead'; id: string; name: string; phone?: string; city?: string; meta?: string; badge: string; badgeColor: string; sub?: string; followUp?: string; overdue?: boolean; totalCalls: number }
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

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function toRow(lead: Lead): ClientRow {
  return {
    kind: 'lead',
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    city: lead.city,
    meta: [lead.propertyType, lead.assignedTo ? `· ${lead.assignedTo}` : ''].filter(Boolean).join(' '),
    badge: lead.status,
    badgeColor: LEAD_STATUS_COLOR[lead.status] || '',
    followUp: lead.nextFollowUpDate,
    overdue: lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate) < new Date() : false,
    totalCalls: lead.totalCalls,
  }
}

function projectRow(p: Project): ClientRow {
  return {
    kind: 'project',
    id: p.id,
    name: p.clientName,
    phone: p.clientPhone,
    city: p.city,
    meta: p.address,
    badge: p.status.replace('_', ' '),
    badgeColor: PROJECT_STATUS_COLOR[p.status] || '',
    projectId: p.id,
  }
}

export default function ClientsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'Leads' | 'Projects'>('All')
  const router = useRouter()

  useEffect(() => {
    fetchLeads().then(setLeads).finally(() => setLoading(false))
    const unsub = subscribeToProjects(setProjects)
    return () => unsub()
  }, [])

  // Project-only clients: projects whose clientName doesn't match any lead name
  const leadNames = new Set(leads.map(l => l.name.toLowerCase().trim()))
  const projectOnlyClients = projects.filter(p =>
    p.clientName && !p.deleted && !leadNames.has(p.clientName.toLowerCase().trim())
  )

  // Deduplicate project-only by clientName (keep most recent)
  const seenNames = new Set<string>()
  const dedupedProjects: Project[] = []
  for (const p of projectOnlyClients) {
    const key = p.clientName.toLowerCase().trim()
    if (!seenNames.has(key)) {
      seenNames.add(key)
      dedupedProjects.push(p)
    }
  }

  const allRows: ClientRow[] = [
    ...leads.map(toRow),
    ...dedupedProjects.map(projectRow),
  ].sort((a, b) => a.name.localeCompare(b.name))

  const filtered = allRows.filter(r => {
    const matchSearch = !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search) ||
      r.city?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'All' ||
      (filter === 'Leads' && r.kind === 'lead') ||
      (filter === 'Projects' && r.kind === 'project')
    return matchSearch && matchFilter
  })

  function handleClick(row: ClientRow) {
    if (row.kind === 'lead') router.push(`/clients/${row.id}`)
    else router.push(`/dashboard/${row.projectId}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Clients</h1>
            <p className="text-xs text-zinc-400 mt-0.5">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, phone, city…"
                className="pl-9 pr-4 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-[#C9A840] w-64 transition-colors"
              />
            </div>
            <button
              onClick={() => router.push('/leads')}
              className="flex items-center gap-2 rounded-xl bg-[#C9A840] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8962e] transition-colors"
            >
              <UserPlus className="w-4 h-4" /> New Client
            </button>
          </div>
        </div>

        {/* Source filter */}
        <div className="flex gap-2 mt-4">
          {(['All', 'Leads', 'Projects'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-4 py-1.5 rounded-full font-medium transition-colors ${
                filter === f
                  ? 'bg-[#C9A840] text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
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
            <p className="text-sm">No clients found</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-4xl mx-auto">
            {filtered.map(row => (
              <button
                key={row.kind === 'lead' ? `lead-${row.id}` : `proj-${row.id}`}
                onClick={() => handleClick(row)}
                className="w-full flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 hover:border-[#C9A840]/50 hover:shadow-md transition-all text-left group"
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  row.kind === 'lead'
                    ? 'bg-[#C9A840]/10 border border-[#C9A840]/20 text-[#C9A840]'
                    : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                }`}>
                  {row.kind === 'project' ? <Building2 className="w-4 h-4" /> : initials(row.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${row.badgeColor}`}>
                      {row.badge}
                    </span>
                    {row.kind === 'project' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        Project
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {row.phone && (
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Phone className="w-3 h-3" />{row.phone}
                      </span>
                    )}
                    {row.city && <span className="text-xs text-zinc-400">{row.city}</span>}
                    {row.meta && <span className="text-xs text-zinc-400">{row.meta}</span>}
                  </div>
                </div>

                {/* Right */}
                {row.kind === 'lead' && (
                  <div className="text-right shrink-0">
                    {row.followUp && (
                      <p className={`text-xs font-medium ${row.overdue ? 'text-red-500' : 'text-[#C9A840]'}`}>
                        Follow-up: {new Date(row.followUp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 mt-0.5">{row.totalCalls} call{row.totalCalls !== 1 ? 's' : ''}</p>
                  </div>
                )}

                <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-[#C9A840] transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
