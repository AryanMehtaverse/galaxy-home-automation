import type { LeadStatus, CallOutcome, Priority } from '@/types/lead'

const statusColors: Record<LeadStatus, string> = {
  'New Lead': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Contacted': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Interested': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Call Back Later': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Site Visit Required': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Quotation Requested': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Negotiation': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Won': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Lost': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Not Interested': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

const outcomeColors: Record<CallOutcome, string> = {
  'No Answer': 'bg-zinc-500/20 text-zinc-400',
  'Busy': 'bg-zinc-500/20 text-zinc-400',
  'Interested': 'bg-green-500/20 text-green-300',
  'Call Back Later': 'bg-yellow-500/20 text-yellow-300',
  'Quotation Requested': 'bg-amber-500/20 text-amber-300',
  'Site Visit Required': 'bg-orange-500/20 text-orange-300',
  'Not Interested': 'bg-red-500/20 text-red-300',
  'Wrong Number': 'bg-red-500/20 text-red-300',
}

const priorityColors: Record<Priority, string> = {
  High: 'bg-red-500/20 text-red-300 border-red-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Low: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

interface StatusBadgeProps {
  status: LeadStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${statusColors[status]} ${size === 'sm' ? 'text-xs' : 'text-xs'}`}
    >
      {status}
    </span>
  )
}

interface OutcomeBadgeProps {
  outcome: CallOutcome
}

export function OutcomeBadge({ outcome }: OutcomeBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${outcomeColors[outcome]}`}>
      {outcome}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: Priority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${priorityColors[priority]}`}>
      {priority}
    </span>
  )
}
