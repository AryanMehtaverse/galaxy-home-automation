'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getNextQuoteNumber, createQuoteNative } from '@/lib/firestore/quotesNative'
import type { Quote } from '@/types/quote'

export default function NewQuotePage() {
  const router = useRouter()
  const params = useSearchParams()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function create() {
      if (creating) return
      setCreating(true)
      const number = await getNextQuoteNumber()
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
      const id = await createQuoteNative(data)
      router.replace(`/quotations/${id}`)
    }
    create()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex items-center justify-center h-64 gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-[#C9A840]" />
      <span className="text-sm text-zinc-500">Creating quote…</span>
    </div>
  )
}
