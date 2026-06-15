"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Lead, CallLog } from '@/types/lead'
import { fetchLeads, updateLead, fetchCallLogs, createCallLog } from '@/lib/leadsService'
import { SAMPLE_LEADS, SAMPLE_CALL_LOGS } from '@/data/sampleLeads'
import { StatusBadge, OutcomeBadge, PriorityBadge } from '@/components/leads/StatusBadge'
import { AddLeadModal } from '@/components/leads/AddLeadModal'
import { LogCallModal } from '@/components/leads/LogCallModal'
import { Button } from '@/components/ui/Button'

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(date: string, time?: string) {
  const d = new Date(date)
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  return time ? `${dateStr} at ${time}` : dateStr
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [leads, logs] = await Promise.all([fetchLeads(), fetchCallLogs(id)])
      let found = leads.find((l) => l.id === id)
      let foundLogs = logs

      // Fallback to sample data
      if (!found) {
        found = SAMPLE_LEADS.find((l) => l.id === id)
        foundLogs = SAMPLE_CALL_LOGS.filter((l) => l.leadId === id)
      }

      setLead(found ?? null)
      setCallLogs(foundLogs.sort((a, b) => (b.date > a.date ? 1 : -1)))
    } catch {
      // fallback to sample
      const found = SAMPLE_LEADS.find((l) => l.id === id) ?? null
      const foundLogs = SAMPLE_CALL_LOGS.filter((l) => l.leadId === id)
      setLead(found)
      setCallLogs(foundLogs)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleEditSave(data: Omit<Lead, 'id'>) {
    if (!lead) return
    await updateLead(lead.id, data)
    setLead({ ...lead, ...data })
  }

  async function handleLogCall(data: Omit<CallLog, 'id'>) {
    if (!lead) return
    const log = await createCallLog(data)
    setCallLogs((p) => [log, ...p])
    // Update lead with call info
    const updates: Partial<Lead> = {
      lastCallDate: data.date,
      lastCallOutcome: data.outcome,
      totalCalls: lead.totalCalls + 1,
      updatedAt: new Date().toISOString().split('T')[0],
    }
    if (data.nextFollowUpDate) {
      updates.nextFollowUpDate = data.nextFollowUpDate
      updates.nextFollowUpTime = data.nextFollowUpTime
      updates.priority = data.priority
    }
    await updateLead(lead.id, updates)
    setLead((p) => p ? { ...p, ...updates } : p)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-[#C9A840]" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-400">
        <p className="text-lg font-medium">Lead not found</p>
        <Link href="/leads" className="mt-4 text-sm text-[#C9A840] hover:underline">← Back to Leads</Link>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = lead.nextFollowUpDate && lead.nextFollowUpDate < today

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-[1400px]">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/leads" className="hover:text-[#C9A840] transition-colors">Leads</Link>
          <span>/</span>
          <span className="text-zinc-300">{lead.name}</span>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Lead Info Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-100">{lead.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={lead.status} />
                    {lead.priority && <PriorityBadge priority={lead.priority} />}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>Edit Lead</Button>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <InfoRow label="Phone" value={lead.phone} mono />
                {lead.whatsapp && <InfoRow label="WhatsApp" value={lead.whatsapp} mono />}
                {lead.email && <InfoRow label="Email" value={lead.email} />}
                <InfoRow label="City" value={lead.city} />
                <InfoRow label="Source" value={lead.source} />
                <InfoRow label="Property Type" value={lead.propertyType} />
                {lead.budget && <InfoRow label="Budget" value={lead.budget} />}
                {lead.assignedTo && <InfoRow label="Assigned To" value={lead.assignedTo} />}
                <InfoRow label="Total Calls" value={String(lead.totalCalls)} />
                <InfoRow label="Created" value={formatDate(lead.createdAt)} />
              </div>

              {lead.address && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Address</p>
                  <p className="text-sm text-zinc-300">{lead.address}</p>
                </div>
              )}

              {lead.notes && (
                <div className="mt-4 rounded-lg bg-zinc-800/60 p-3">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-zinc-300">{lead.notes}</p>
                </div>
              )}
            </div>

            {/* Call History Timeline */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-zinc-100">Call History</h2>
                <Button variant="primary" size="sm" onClick={() => setLogOpen(true)}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Log Call
                </Button>
              </div>

              {callLogs.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-zinc-600">
                  <svg className="h-10 w-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <p className="text-sm">No calls logged yet</p>
                </div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-zinc-800" />
                  <div className="space-y-6">
                    {callLogs.map((log) => (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-4 top-1.5 h-3 w-3 rounded-full border-2 border-zinc-950 bg-[#C9A840]" />
                        <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-zinc-400">{formatDateTime(log.date, log.time)}</span>
                              <OutcomeBadge outcome={log.outcome} />
                              {log.priority && <PriorityBadge priority={log.priority} />}
                            </div>
                          </div>
                          {log.notes && <p className="text-sm text-zinc-300 mb-2">{log.notes}</p>}
                          {log.nextFollowUpDate && (
                            <p className="text-xs text-zinc-500">
                              Next follow-up: <span className="text-[#C9A840]">{formatDateTime(log.nextFollowUpDate, log.nextFollowUpTime)}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column — sticky */}
          <div className="lg:w-72 xl:w-80">
            <div className="sticky top-6 space-y-4">
              {/* Call Summary Card */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Summary</h3>
                <div className="space-y-3">
                  <SummaryRow label="Status">
                    <StatusBadge status={lead.status} />
                  </SummaryRow>
                  <SummaryRow label="Total Calls">
                    <span className="text-2xl font-bold text-[#C9A840]">{lead.totalCalls}</span>
                  </SummaryRow>
                  <SummaryRow label="Last Call">
                    <span className="text-sm text-zinc-300">{formatDate(lead.lastCallDate)}</span>
                  </SummaryRow>
                  {lead.lastCallOutcome && (
                    <SummaryRow label="Last Outcome">
                      <OutcomeBadge outcome={lead.lastCallOutcome} />
                    </SummaryRow>
                  )}
                  {lead.nextFollowUpDate && (
                    <SummaryRow label="Next Follow-up">
                      <span className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-[#C9A840]'}`}>
                        {isOverdue && '⚠ '}
                        {formatDateTime(lead.nextFollowUpDate, lead.nextFollowUpTime)}
                      </span>
                    </SummaryRow>
                  )}
                  {lead.priority && (
                    <SummaryRow label="Priority">
                      <PriorityBadge priority={lead.priority} />
                    </SummaryRow>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <a href={`tel:${lead.phone}`} className="flex w-full items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition-colors">
                    <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call {lead.phone}
                  </a>
                  <a
                    href={`https://wa.me/91${lead.whatsapp || lead.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition-colors"
                  >
                    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                  <button
                    onClick={() => { navigator.clipboard.writeText(lead.phone) }}
                    className="flex w-full items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition-colors"
                  >
                    <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Number
                  </button>
                  <Button variant="primary" className="w-full" onClick={() => setLogOpen(true)}>
                    Log Call
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <AddLeadModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={handleEditSave}
          initial={lead}
        />
      )}
      <LogCallModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        leadId={lead.id}
        onSave={handleLogCall}
      />
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className={`mt-0.5 text-sm text-zinc-200 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <div>{children}</div>
    </div>
  )
}
