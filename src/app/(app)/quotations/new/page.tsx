'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, addDoc, doc, runTransaction } from 'firebase/firestore'
import type { Quote } from '@/types/quote'

async function getNextNumber(): Promise<string> {
  const ref = doc(db, 'counters', 'quoteCounter')
  let next = 42
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref)
      const current = snap.exists() ? (snap.data().value as number) : 41
      next = current + 1
      tx.set(ref, { value: next })
    })
  } catch {
    next = Date.now() % 10000
  }
  return `GHA-${String(next).padStart(4, '0')}`
}

export default function NewQuotePage() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function create() {
      try {
        const number = await getNextNumber()
        const now = new Date().toISOString()
        const data: Omit<Quote, 'id'> = {
          number,
          leadId: params.get('leadId') || undefined,
          clientName: params.get('clientName') || '',
          company: params.get('company') || '',
          phone: params.get('phone') || '',
          email: params.get('email') || '',
          address: params.get('address') || '',
          date: now.split('T')[0],
          status: 'Draft',
          salesperson: '',
          notes: '',
          rooms: [],
          sectionDiscounts: {},
          createdAt: now,
          updatedAt: now,
        }
        const ref = await addDoc(collection(db, 'quotes'), data)
        if (!cancelled) router.replace(`/quotations/${ref.id}`)
      } catch (e) {
        if (!cancelled) setError(String(e))
      }
    }
    create()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-400">
      <p className="text-sm">Failed to create quote</p>
      <p className="text-xs text-zinc-500">{error}</p>
      <button onClick={() => router.push('/quotations')} className="text-xs text-[#C9A840] hover:underline">← Back to Quotations</button>
    </div>
  )

  return (
    <div className="flex items-center justify-center h-64 gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-[#C9A840]" />
      <span className="text-sm text-zinc-500">Creating quote…</span>
    </div>
  )
}
