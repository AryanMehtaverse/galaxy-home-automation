import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Quote } from '@/types/quote'

const QUOTES_COL = 'quotes'
const COUNTERS_COL = 'counters'
const COUNTER_DOC = 'quoteCounter'

// ── Counter ───────────────────────────────────────────────────────────────────

export async function getNextQuoteNumber(): Promise<string> {
  const ref = doc(db, COUNTERS_COL, COUNTER_DOC)
  let next = 42 // start after existing 41 quotes in old system
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const current = snap.exists() ? (snap.data().value as number) : 41
    next = current + 1
    tx.set(ref, { value: next })
  })
  return `GHA-${String(next).padStart(4, '0')}`
}

// ── Quotes ────────────────────────────────────────────────────────────────────

export function subscribeToQuotes(callback: (quotes: Quote[]) => void): Unsubscribe {
  const q = query(collection(db, QUOTES_COL), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quote)))
  })
}

export async function getAllQuotesNative(): Promise<Quote[]> {
  const snap = await getDocs(query(collection(db, QUOTES_COL), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quote))
}

export async function getQuotesByLeadId(leadId: string): Promise<Quote[]> {
  const snap = await getDocs(
    query(collection(db, QUOTES_COL), where('leadId', '==', leadId), orderBy('createdAt', 'desc'))
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quote))
}

export async function getQuoteNative(id: string): Promise<Quote | null> {
  const snap = await getDoc(doc(db, QUOTES_COL, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Quote
}

export async function createQuoteNative(data: Omit<Quote, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, QUOTES_COL), data)
  return ref.id
}

export async function updateQuoteNative(id: string, data: Partial<Quote>): Promise<void> {
  await updateDoc(doc(db, QUOTES_COL, id), { ...data, updatedAt: new Date().toISOString() })
}

export async function deleteQuoteNative(id: string): Promise<void> {
  await deleteDoc(doc(db, QUOTES_COL, id))
}

export async function duplicateQuoteNative(id: string, newNumber: string): Promise<string> {
  const original = await getQuoteNative(id)
  if (!original) throw new Error('Quote not found')
  const { id: _id, ...data } = original
  const now = new Date().toISOString()
  const ref = await addDoc(collection(db, QUOTES_COL), {
    ...data,
    number: newNumber,
    status: 'Draft',
    createdAt: now,
    updatedAt: now,
  })
  return ref.id
}
