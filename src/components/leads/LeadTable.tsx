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
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}

const today = new Date().toISOString().split('T')[0]

export function LeadTable({ leads, onEdit, onDelete }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
        <svg className="h-12 w-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm">No leads found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
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
        <tbody className="divide-y divide-zinc-800/60">
          {leads.map((lead) => {
            const isOverdue = lead.nextFollowUpDate && lead.nextFollowUpDate < today
            const isToday = lead.nextFollowUpDate === today
            return (
              <tr key={lead.id} className="group hover:bg-zinc-800/30 transition-colors">
                <td className="py-3 pr-4">
                  <Link href={`/leads/${lead.id}`} className="font-medium text-zinc-100 hover:text-[#C9A840] transition-colors">
                    {lead.name}
                  </Link>
                  <p className="text-xs text-zinc-500">{lead.propertyType}</p>
                </td>
                <td className="py-3 pr-4 text-zinc-300 font-mono text-xs">{lead.phone}</td>
                <td className="py-3 pr-4 text-zinc-400">{lead.city}</td>
                <td className="py-3 pr-4 text-zinc-400">{lead.source}</td>
                <td className="py-3 pr-4">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="py-3 pr-4">
                  {lead.nextFollowUpDate ? (
                    <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : isToday ? 'text-orange-400' : 'text-zinc-400'}`}>
                      {isOverdue && '⚠ '}
                      {formatDate(lead.nextFollowUpDate)}
                      {lead.nextFollowUpTime && ` ${lead.nextFollowUpTime}`}
                    </span>
                  ) : (
                    <span className="text-zinc-600 text-xs">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-zinc-400 text-xs">{lead.assignedTo || '—'}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/leads/${lead.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">View</Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEdit(lead)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" className="h-7 px-2 text-xs" onClick={() => onDelete(lead)}>
                      Del
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
