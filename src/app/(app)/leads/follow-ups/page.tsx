"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { Lead } from '@/types/lead'
import { fetchLeads, createCallLog } from '@/lib/leadsService'
import { SAMPLE_LEADS } from '@/data/sampleLeads'
import { StatusBadge, PriorityBadge } from '@/components/leads/StatusBadge'
import { LogCallModal } from '@/components/leads/LogCallModal'
import type { CallLog } from '@/types/lead'

const today = new Date().toISOString().split('T')[0]
const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()
const in7Days = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] })()

type Tab = 'overdue' | 'today' | 'tomorrow' | 'upcoming'

interface LeadRowProps {
  lead: Lead
  highlight: string
  onLogCall: (lead: Lead) => void
}

function LeadRow({ lead, highlight, onLogCall }: LeadRowProps) {
  return (
    <div className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:gap-4 ${highlight}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-zinc-100">{lead.name}</span>
          <StatusBadge status={lead.status} size="sm" />
          {lead.priority && <PriorityBadge priority={lead.priority} />}
        </div>
        <p className="mt-0.5 text-xs text-zinc-400 font-mono">{lead.phone} · {lead.city}</p>
        {lead.nextFollowUpDate && (
          <p className="mt-1 text-xs text-zinc-500">
            Follow-up: {lead.nextFollowUpDate}{lead.nextFollowUpTime ? ` at ${lead.nextFollowUpTime}` : ''}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href={`/leads/${lead.id}`}>
          <button className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors">
            Open Lead
          </button>
        </Link>
        <button
          onClick={() => onLogCall(lead)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-950 transition-colors"
          style={{ background: 'linear-gradient(135deg, #E0C050 0%, #C9A840 50%, #A07820 100%)' }}
        >
          Log Call
        </button>
      </div>
    </div>
  )
}

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overdue')
  const [logLead, setLogLead] = useState<Lead | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      let data = await fetchLeads()
      if (data.length === 0) data = SAMPLE_LEADS
      setLeads(data)
    } catch {
      setLeads(SAMPLE_LEADS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const overdue = leads.filter((l) => l.nextFollowUpDate && l.nextFollowUpDate < today)
    .sort((a, b) => (a.nextFollowUpDate! > b.nextFollowUpDate! ? 1 : -1))
  const todayLeads = leads.filter((l) => l.nextFollowUpDate === today)
  const tomorrowLeads = leads.filter((l) => l.nextFollowUpDate === tomorrow)
  const upcoming = leads.filter((l) => l.nextFollowUpDate && l.nextFollowUpDate > tomorrow && l.nextFollowUpDate <= in7Days)
    .sort((a, b) => (a.nextFollowUpDate! > b.nextFollowUpDate! ? 1 : -1))

  const tabs: { id: Tab; label: string; count: number; color: string; activeColor: string }[] = [
    { id: 'overdue', label: 'Overdue', count: overdue.length, color: 'text-red-400', activeColor: 'border-red-500 text-red-300' },
    { id: 'today', label: 'Today', count: todayLeads.length, color: 'text-orange-400', activeColor: 'border-orange-500 text-orange-300' },
    { id: 'tomorrow', label: 'Tomorrow', count: tomorrowLeads.length, color: 'text-yellow-400', activeColor: 'border-yellow-500 text-yellow-300' },
    { id: 'upcoming', label: 'Upcoming (7 days)', count: upcoming.length, color: 'text-green-400', activeColor: 'border-green-500 text-green-300' },
  ]

  const currentLeads = { overdue, today: todayLeads, tomorrow: tomorrowLeads, upcoming }[activeTab]
  const highlights: Record<Tab, string> = {
    overdue: 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10',
    today: 'border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10',
    tomorrow: 'border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10',
    upcoming: 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10',
  }

  async function handleLogCall(data: Omit<CallLog, 'id'>) {
    await createCallLog(data)
    setLogLead(null)
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-3 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Follow-ups</h1>
            <p className="mt-1 text-sm text-zinc-500">Stay on top of your scheduled follow-ups</p>
          </div>
          <Link href="/leads">
            <button className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">
              ← All Leads
            </button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-3 py-3 text-sm font-medium border-b-2 transition-colors -mb-px sm:px-4 ${
                activeTab === tab.id
                  ? `${tab.activeColor} border-current`
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${activeTab === tab.id ? '' : tab.color} bg-zinc-800`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-[#C9A840]" />
          </div>
        ) : currentLeads.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-zinc-600">
            <svg className="h-12 w-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No follow-ups in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentLeads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                highlight={highlights[activeTab]}
                onLogCall={setLogLead}
              />
            ))}
          </div>
        )}
      </div>

      {logLead && (
        <LogCallModal
          open={!!logLead}
          onClose={() => setLogLead(null)}
          leadId={logLead.id}
          onSave={handleLogCall}
        />
      )}
    </div>
  )
}
