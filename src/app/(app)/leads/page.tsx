"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { Lead, LeadStatus, LeadSource, Priority } from '@/types/lead'
import { fetchLeads, createLead, updateLead, deleteLead } from '@/lib/leadsService'
import { SummaryCards } from '@/components/leads/SummaryCards'
import { LeadTable } from '@/components/leads/LeadTable'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { Button } from '@/components/ui/Button'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { canDeleteLead } from '@/lib/auth/permissions'

const PAGE_SIZE = 20

const ALL_STATUSES: LeadStatus[] = ['New Lead', 'Contacted', 'Interested', 'Call Back Later', 'Site Visit Required', 'Quotation Requested', 'Negotiation', 'Won', 'Lost', 'Not Interested']
const ALL_SOURCES: LeadSource[] = ['IndiaMART', 'Meta Ads', 'Google Ads', 'Website', 'Referral', 'Architect', 'Builder', 'JustDial', 'Cold Calling', 'Walk In', 'Manual Entry', 'Instagram', 'Facebook', 'LinkedIn', 'Other']
const ALL_PRIORITIES: Priority[] = ['High', 'Medium', 'Low']

const selectCls = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-[#C9A840] focus:outline-none focus:ring-1 focus:ring-[#C9A840]'
const inputCls = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-[#C9A840] focus:outline-none focus:ring-1 focus:ring-[#C9A840]'

export default function LeadsPage() {
  const { user } = useAuthContext()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterLeadType, setFilterLeadType] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchLeads()
      setLeads(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const isPrioritySort = filterPriority === 'high-to-low' || filterPriority === 'low-to-high'
  const priorityFilterValue = isPrioritySort ? '' : filterPriority

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase()
    if (q && !l.name.toLowerCase().includes(q) && !l.phone.includes(q) && !l.city.toLowerCase().includes(q)) return false
    if (filterStatus && l.status !== filterStatus) return false
    if (filterCity && l.city !== filterCity) return false
    if (filterSource && l.source !== filterSource) return false
    if (filterAssignee && l.assignedTo !== filterAssignee) return false
    if (filterLeadType && l.leadType !== filterLeadType) return false
    if (priorityFilterValue && l.priority !== priorityFilterValue) return false
    return true
  })

  const sorted = isPrioritySort ? [...filtered].sort((a, b) => {
    const order: Record<string, number> = { High: 0, Medium: 1, Low: 2 }
    const aRank = order[a.priority ?? ''] ?? 3
    const bRank = order[b.priority ?? ''] ?? 3
    return filterPriority === 'high-to-low' ? aRank - bRank : bRank - aRank
  }) : filtered

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const cities = Array.from(new Set(leads.map((l) => l.city))).sort()
  const assignees = Array.from(new Set(leads.map((l) => l.assignedTo).filter(Boolean))).sort() as string[]

  async function handleAddLead(data: Omit<Lead, 'id'>) {
    const lead = await createLead(data)
    setLeads((p) => [lead, ...p])
  }

  async function handleEditLead(data: Omit<Lead, 'id'>) {
    if (!editLead) return
    await updateLead(editLead.id, data)
    setLeads((p) => p.map((l) => (l.id === editLead.id ? { ...l, ...data } : l)))
  }

  async function handleDelete(lead: Lead) {
    if (!canDeleteLead(user)) return
    if (!confirm(`Delete lead for ${lead.name}? This cannot be undone.`)) return
    setDeletingId(lead.id)
    try {
      await deleteLead(lead.id)
      setLeads((p) => p.filter((l) => l.id !== lead.id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 p-3 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Lead Manager</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">Track and manage all your sales leads</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/leads/follow-ups">
              <Button variant="secondary" size="sm">Follow-ups</Button>
            </Link>
            <Link href="/leads/analytics">
              <Button variant="secondary" size="sm">Analytics</Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Lead
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {!loading && <SummaryCards leads={leads} />}

        {/* Filters */}
        <div className="space-y-2">
          <input
            className={inputCls}
            placeholder="Search by name, phone, city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
          <div className="flex flex-wrap gap-2">
            <select className={`${selectCls} flex-1 min-w-[130px]`} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}>
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className={`${selectCls} flex-1 min-w-[110px]`} value={filterCity} onChange={(e) => { setFilterCity(e.target.value); setPage(1) }}>
              <option value="">All Cities</option>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className={`${selectCls} flex-1 min-w-[120px]`} value={filterSource} onChange={(e) => { setFilterSource(e.target.value); setPage(1) }}>
              <option value="">All Sources</option>
              {ALL_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className={`${selectCls} flex-1 min-w-[120px]`} value={filterAssignee} onChange={(e) => { setFilterAssignee(e.target.value); setPage(1) }}>
              <option value="">All Employees</option>
              {assignees.map((a) => <option key={a}>{a}</option>)}
            </select>
            <select className={`${selectCls} flex-1 min-w-[90px]`} value={filterLeadType} onChange={(e) => { setFilterLeadType(e.target.value); setPage(1) }}>
              <option value="">All Types</option>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
            </select>
            <select className={`${selectCls} flex-1 min-w-[140px]`} value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setPage(1) }}>
              <option value="">All Priorities</option>
              {ALL_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              <option disabled>──────────</option>
              <option value="high-to-low">Priority: High → Low</option>
              <option value="low-to-high">Priority: Low → High</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-500">{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</span>
            {(search || filterStatus || filterCity || filterSource || filterAssignee || filterLeadType || filterPriority) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterCity(''); setFilterSource(''); setFilterAssignee(''); setFilterLeadType(''); setFilterPriority(''); setPage(1) }}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-[#C9A840]" />
              <span className="ml-3 text-sm text-zinc-500 dark:text-zinc-400">Loading leads…</span>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-400 text-sm">{error}</div>
          ) : (
            <LeadTable
              leads={paginated}
              onEdit={(l) => setEditLead(l)}
              onDelete={handleDelete}
              canDelete={canDeleteLead(user)}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Page {page} of {totalPages}</span>
            <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
          </div>
        )}
      </div>

      <AddLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAddLead}
      />
      {editLead && (
        <AddLeadModal
          open={!!editLead}
          onClose={() => setEditLead(null)}
          onSave={handleEditLead}
          initial={editLead}
        />
      )}
    </div>
  )
}
