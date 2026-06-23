import type { Lead, CallLog } from '@/types/lead'
import { auth } from '@/lib/firebase'
import {
  fetchLeadsFromFirestore,
  createLeadInFirestore,
  updateLeadInFirestore,
  fetchCallLogsFromFirestore,
  createCallLogInFirestore,
  deleteCallLogFromFirestore,
} from '@/lib/firestore/leads'

// ── Leads ────────────────────────────────────────────────────────────────────

export async function fetchLeads(): Promise<Lead[]> {
  return fetchLeadsFromFirestore()
}

export async function createLead(data: Omit<Lead, 'id'>): Promise<Lead> {
  return createLeadInFirestore(data)
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  return updateLeadInFirestore(id, updates)
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

// ── Call Logs ─────────────────────────────────────────────────────────────────

export async function fetchCallLogs(leadId?: string): Promise<CallLog[]> {
  return fetchCallLogsFromFirestore(leadId)
}

export async function createCallLog(data: Omit<CallLog, 'id'>): Promise<CallLog> {
  return createCallLogInFirestore(data)
}

export async function deleteCallLog(id: string): Promise<void> {
  return deleteCallLogFromFirestore(id)
}
