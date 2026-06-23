'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchLeads } from '@/lib/leadsService'
import type { Lead } from '@/types/lead'
import { Search, UserPlus, Phone, ChevronRight } from 'lucide-react'

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

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function ClientsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const router = useRouter()

  useEffect(() => {
    fetchLeads().then(setLeads).finally(() => setLoading(false))
  }, [])

  const statuses = ['All', 'New Lead', 'Contacted', 'Interested', 'Site Visit Required',
    'Quotation Requested', 'Negotiation', 'Won', 'Lost', 'Not Interested', 'Call Back Later']

  const filtered = leads.filter(l => {
    const matchSearch = !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search) ||
      l.city?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || l.status === statusFilter
    return matchSearch && matchStatus
  })

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

        {/* Status filter */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-[#C9A840] text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {s}
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
            {filtered.map(lead => (
              <button
                key={lead.id}
                onClick={() => router.push(`/clients/${lead.id}`)}
                className="w-full flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 hover:border-[#C9A840]/50 hover:shadow-md transition-all text-left group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#C9A840]/10 border border-[#C9A840]/20 flex items-center justify-center text-sm font-bold text-[#C9A840] shrink-0">
                  {initials(lead.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{lead.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_COLOR[lead.status] || ''}`}>
                      {lead.status}
                    </span>
                    {lead.priority === 'High' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
                        High Priority
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <Phone className="w-3 h-3" />{lead.phone}
                    </span>
                    {lead.city && <span className="text-xs text-zinc-400">{lead.city}</span>}
                    {lead.propertyType && <span className="text-xs text-zinc-400">{lead.propertyType}</span>}
                    {lead.assignedTo && <span className="text-xs text-zinc-400">· {lead.assignedTo}</span>}
                  </div>
                </div>

                {/* Right */}
                <div className="text-right shrink-0">
                  {lead.nextFollowUpDate && (
                    <p className={`text-xs font-medium ${new Date(lead.nextFollowUpDate) < new Date() ? 'text-red-500' : 'text-[#C9A840]'}`}>
                      Follow-up: {new Date(lead.nextFollowUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400 mt-0.5">{lead.totalCalls} call{lead.totalCalls !== 1 ? 's' : ''}</p>
                </div>

                <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-[#C9A840] transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
