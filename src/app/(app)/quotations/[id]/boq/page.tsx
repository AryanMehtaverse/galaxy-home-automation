'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { getQuoteNative } from '@/lib/firestore/quotesNative'
import { getAllProductsFromFirestore } from '@/lib/firestore/quotes'
import { BOQView } from '@/components/quotations/BOQView'
import { computePricing, formatCurrency } from '@/lib/pricingEngine'
import type { Quote, CatalogProduct } from '@/types/quote'

export default function BOQPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getQuoteNative(id), getAllProductsFromFirestore()]).then(([q, p]) => {
      setQuote(q)
      setProducts(p as CatalogProduct[])
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-[#C9A840]" />
    </div>
  )

  if (!quote) return (
    <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
      <p>Quote not found</p>
      <Link href="/quotations" className="mt-2 text-sm text-[#C9A840] hover:underline">← Back</Link>
    </div>
  )

  const pricing = computePricing(quote.rooms ?? [], products, quote.sectionDiscounts ?? {})

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Print toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <Link href={`/quotations/${id}`} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Editor
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-[#C9A840] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8962e] transition-colors"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* BOQ Document */}
      <div className="max-w-4xl mx-auto p-6 print:p-0 print:max-w-none space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Galaxy Home Automation</h1>
            <p className="text-sm text-zinc-500">Bill of Quantities</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold text-[#C9A840] text-lg">{quote.number}</p>
            <p className="text-xs text-zinc-400">{quote.date ? new Date(quote.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</p>
          </div>
        </div>

        {/* Client info */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wider">Client</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{quote.clientName}</p>
            {quote.company && <p className="text-sm text-zinc-500">{quote.company}</p>}
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wider">Contact</p>
            {quote.phone && <p className="text-sm text-zinc-700 dark:text-zinc-300">{quote.phone}</p>}
            {quote.email && <p className="text-sm text-zinc-700 dark:text-zinc-300">{quote.email}</p>}
          </div>
          {quote.address && (
            <div className="col-span-2">
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Property</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{quote.address}</p>
            </div>
          )}
        </div>

        {/* BOQ Table */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <BOQView quote={quote} products={products} editable={false} />
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2 max-w-sm ml-auto">
          <div className="flex justify-between text-sm text-zinc-500">
            <span>Product Subtotal</span>
            <span>{formatCurrency(pricing.productSubtotal)}</span>
          </div>
          {pricing.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Discount ({pricing.discountPercent}%)</span>
              <span>− {formatCurrency(pricing.discountAmount)}</span>
            </div>
          )}
          {pricing.totalInstallation > 0 && (
            <div className="flex justify-between text-sm text-indigo-400">
              <span>Installation & Setup</span>
              <span>+ {formatCurrency(pricing.totalInstallation)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t border-zinc-200 dark:border-zinc-700 pt-2 text-[#C9A840]">
            <span>Grand Total</span>
            <span>{formatCurrency(pricing.grandSubtotal)}</span>
          </div>
          <p className="text-[10px] text-zinc-400">* GST applicable as per government norms. Prices subject to change.</p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-400 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          Galaxy Home Automation · This is a computer-generated quotation.
          {quote.salesperson && ` Prepared by: ${quote.salesperson}`}
        </div>
      </div>
    </div>
  )
}
