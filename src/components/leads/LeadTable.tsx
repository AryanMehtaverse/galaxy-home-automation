"use client"

import Link from 'next/link'
import type { Lead } from '@/types/lead'
import { StatusBadge } from './StatusBadge'
import { Button } from '@/components/ui/Button'

interface LeadTableProps {
  leads: Lead[]
  onEdit: (lead: Lead) => void
  onDelete: (lead: Lead) => void
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}

const today = new Date().toISOString().split('T')[0]

export function LeadTable({ leads, onEdit, onDelete }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-500">
        <svg className="h-12 w-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm">No leads found</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="space-y-3 sm:hidden">
        {leads.map((lead) => {
          const isOverdue = lead.nextFollowUpDate && lead.nextFollowUpDate < today
          const isToday = lead.nextFollowUpDate === today
          return (
            <div key={lead.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-800/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/leads/${lead.id}`} className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-[#C9A840] transition-colors">
                    {lead.name}
                  </Link>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {lead.leadType && <span className="inline-block mr-1.5 rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{lead.leadType}</span>}
                    {lead.propertyType} · {lead.city}
                  </p>
                </div>
                <StatusBadge status={lead.status} />
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-[#C9A840] font-mono font-medium">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  {lead.phone}
                </a>
                <span>{lead.source}</span>
              </div>

              {lead.nextFollowUpDate && (
                <div className={`mt-2 text-xs font-medium ${isOverdue ? 'text-red-400' : isToday ? 'text-orange-400' : 'text-zinc-400'}`}>
                  {isOverdue ? '⚠ Overdue: ' : isToday ? '📅 Today: ' : '🕐 Follow-up: '}
                  {formatDate(lead.nextFollowUpDate)}{lead.nextFollowUpTime && ` ${lead.nextFollowUpTime}`}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <Link href={`/leads/${lead.id}`} className="flex-1">
                  <button className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:border-[#C9A840] hover:text-[#C9A840] transition-colors">
                    View
                  </button>
                </Link>
                <button onClick={() => onEdit(lead)} className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
                  Edit
                </button>
                <button onClick={() => onDelete(lead)} className="rounded-lg border border-red-900/40 px-3 py-1.5 text-xs text-red-400 hover:border-red-700 transition-colors">
                  Del
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Phone</th>
              <th className="pb-3 pr-4 font-medium">City</th>
              <th className="pb-3 pr-4 font-medium">Source</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pr-4 font-medium">Next Follow-up</th>
              <th className="pb-3 pr-4 font-medium">Assigned To</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            {leads.map((lead) => {
              const isOverdue = lead.nextFollowUpDate && lead.nextFollowUpDate < today
              const isToday = lead.nextFollowUpDate === today
              return (
                <tr key={lead.id} className="group hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 pr-4">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-[#C9A840] transition-colors">
                      {lead.name}
                    </Link>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {lead.leadType && <span className="inline-block mr-1.5 rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{lead.leadType}</span>}
                      {lead.propertyType}
                    </p>
                  </td>
                  <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300 font-mono text-xs">{lead.phone}</td>
                  <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">{lead.city}</td>
                  <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">{lead.source}</td>
                  <td className="py-3 pr-4"><StatusBadge status={lead.status} /></td>
                  <td className="py-3 pr-4">
                    {lead.nextFollowUpDate ? (
                      <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : isToday ? 'text-orange-400' : 'text-zinc-400'}`}>
                        {isOverdue && '⚠ '}{formatDate(lead.nextFollowUpDate)}{lead.nextFollowUpTime && ` ${lead.nextFollowUpTime}`}
                      </span>
                    ) : <span className="text-zinc-400 dark:text-zinc-600 text-xs">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400 text-xs">{lead.assignedTo || '—'}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">View</Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEdit(lead)}>Edit</Button>
                      <Button variant="danger" size="sm" className="h-7 px-2 text-xs" onClick={() => onDelete(lead)}>Del</Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
