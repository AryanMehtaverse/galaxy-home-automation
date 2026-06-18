import type { Lead, CallLog } from '@/types/lead'
import { auth } from '@/lib/firebase'

const DB_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL

function dbUrl(path: string) {
  return `${DB_URL}${path}`
}

export async function fetchLeads(): Promise<Lead[]> {
  const res = await fetch(dbUrl('/leads.json'))
  if (!res.ok) throw new Error('Failed to fetch leads')
  const data = await res.json()
  if (!data) return []
  return Object.entries(data).map(([id, val]) => ({ ...(val as Omit<Lead, 'id'>), id }))
}

export async function createLead(data: Omit<Lead, 'id'>): Promise<Lead> {
  const res = await fetch(dbUrl('/leads.json'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create lead')
  const { name: id } = await res.json()
  return { ...data, id }
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  const res = await fetch(dbUrl(`/leads/${id}.json`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update lead')
}

export async function deleteLead(id: string): Promise<void> {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(`/api/leads/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 403) throw new Error('Permission denied: admin or owner role required')
  if (!res.ok) throw new Error('Failed to delete lead')
}

export async function fetchCallLogs(leadId?: string): Promise<CallLog[]> {
  const res = await fetch(dbUrl('/callLogs.json'))
  if (!res.ok) throw new Error('Failed to fetch call logs')
  const data = await res.json()
  if (!data) return []
  const logs: CallLog[] = Object.entries(data).map(([id, val]) => ({
    ...(val as Omit<CallLog, 'id'>),
    id,
  }))
  if (leadId) return logs.filter((l) => l.leadId === leadId)
  return logs
}

export async function createCallLog(data: Omit<CallLog, 'id'>): Promise<CallLog> {
  const res = await fetch(dbUrl('/callLogs.json'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create call log')
  const { name: id } = await res.json()
  return { ...data, id }
}
