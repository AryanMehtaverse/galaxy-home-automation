'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, ArrowLeft, Eye } from 'lucide-react'
import { getQuoteNative, updateQuoteNative } from '@/lib/firestore/quotesNative'
import { getAllProductsFromFirestore } from '@/lib/firestore/quotes'
import { ClientDetailsForm } from '@/components/quotations/ClientDetailsForm'
import { RoomsEditor } from '@/components/quotations/RoomsEditor'
import { BOQView } from '@/components/quotations/BOQView'
import { QuoteStatusBadge } from '@/components/quotations/QuoteStatusBadge'
import { computePricing, formatCurrency } from '@/lib/pricingEngine'
import type { Quote, CatalogProduct, QuoteRoom } from '@/types/quote'

const TABS = [
  { id: 'client', label: 'Client Details' },
  { id: 'rooms', label: 'Rooms & Products' },
  { id: 'boq', label: 'BOQ' },
  { id: 'summary', label: 'Summary' },
]

export default function QuoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [quote, setQuote] = useState<Partial<Quote> | null>(null)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('client')

  useEffect(() => {
    Promise.all([getQuoteNative(id), getAllProductsFromFirestore()]).then(([q, p]) => {
      setQuote(q)
      setProducts(p as CatalogProduct[])
      setLoading(false)
    })
  }, [id])

  const handleSave = useCallback(async () => {
    if (!quote) return
    setSaving(true)
    try {
      await updateQuoteNative(id, quote as Partial<Quote>)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [id, quote])

  // Auto-save on tab switch
  const switchTab = useCallback(async (tab: string) => {
    if (quote && !saving) {
      setSaving(true)
      try { await updateQuoteNative(id, quote as Partial<Quote>) } finally { setSaving(false) }
    }
    setActiveTab(tab)
  }, [id, quote, saving])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-[#C9A840]" />
    </div>
  )

  if (!quote) return (
    <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
      <p>Quote not found</p>
      <Link href="/quotations" className="mt-2 text-sm text-[#C9A840] hover:underline">← Back to Quotations</Link>
    </div>
  )

  const pricing = computePricing(quote.rooms ?? [], products, quote.sectionDiscounts ?? {})

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={quote.leadId ? `/leads/${quote.leadId}` : '/quotations'} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#C9A840]">{quote.number}</span>
              <QuoteStatusBadge status={quote.status ?? 'Draft'} />
            </div>
            <p className="text-sm text-zinc-500 truncate">{quote.clientName || 'Unnamed Client'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:block text-sm font-semibold text-[#C9A840]">{formatCurrency(pricing.grandSubtotal)}</span>
          <Link
            href={`/quotations/${id}/boq`}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 transition-colors"
          >
            <Eye className="w-4 h-4" /> Preview BOQ
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[#C9A840] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8962e] disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#C9A840] text-[#C9A840]'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
        {activeTab === 'client' && (
          <ClientDetailsForm quote={quote} onChange={setQuote} />
        )}

        {activeTab === 'rooms' && (
          <RoomsEditor
            rooms={quote.rooms ?? []}
            products={products}
            onChange={(rooms) => setQuote((q) => ({ ...q, rooms }))}
          />
        )}

        {activeTab === 'boq' && (
          <BOQView
            quote={quote}
            products={products}
            editable
            onDiscountChange={(category, value) =>
              setQuote((q) => ({ ...q, sectionDiscounts: { ...(q?.sectionDiscounts ?? {}), [category]: value } }))
            }
          />
        )}

        {activeTab === 'summary' && (
          <div className="p-6 max-w-2xl space-y-5">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Summary & Save</h3>

            {/* Checklist */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
              {[
                { label: 'Client name', ok: !!quote.clientName },
                { label: 'At least 1 room', ok: (quote.rooms?.length ?? 0) > 0 },
                { label: 'At least 1 product', ok: pricing.lineItems.length > 0 },
              ].map((c) => (
                <div key={c.label} className={`flex items-center gap-2 text-sm ${c.ok ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  <span>{c.ok ? '✓' : '○'}</span> {c.label}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Client', value: quote.clientName || '—' },
                { label: 'Quote No.', value: quote.number || '—' },
                { label: 'Rooms', value: `${quote.rooms?.length ?? 0} room(s)` },
                { label: 'Products', value: `${pricing.lineItems.length} line item(s)` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                  <p className="text-xs text-zinc-400">{label}</p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{value}</p>
                </div>
              ))}
              <div className="col-span-2 rounded-xl border border-[#C9A840]/30 bg-[#C9A840]/5 p-4">
                <p className="text-xs text-zinc-400">Grand Total</p>
                <p className="text-2xl font-bold text-[#C9A840]">{formatCurrency(pricing.grandSubtotal)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !quote.clientName}
                className="flex items-center gap-2 rounded-lg bg-[#C9A840] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b8962e] disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Quote'}
              </button>
              <Link
                href={`/quotations/${id}/boq`}
                className="flex items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 transition-colors"
              >
                <Eye className="w-4 h-4" /> Preview BOQ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
