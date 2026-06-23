'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FilePlus, Search, Edit2, Trash2, Copy, Eye } from 'lucide-react'
import { getAllQuotesNative, deleteQuoteNative, getNextQuoteNumber, duplicateQuoteNative } from '@/lib/firestore/quotesNative'
import { getAllProductsFromFirestore } from '@/lib/firestore/quotes'
import { computePricing, formatCurrency } from '@/lib/pricingEngine'
import { QuoteStatusBadge } from '@/components/quotations/QuoteStatusBadge'
import type { Quote, CatalogProduct } from '@/types/quote'

export default function QuotationsPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAllQuotesNative(), getAllProductsFromFirestore()]).then(([q, p]) => {
      setQuotes(q)
      setProducts(p as CatalogProduct[])
      setLoading(false)
    })
  }, [])

  const filtered = quotes.filter((q) => {
    const t = search.toLowerCase()
    return !t || q.clientName?.toLowerCase().includes(t) || q.number?.toLowerCase().includes(t) || q.company?.toLowerCase().includes(t)
  })

  const getTotal = (q: Quote) => {
    try { return computePricing(q.rooms ?? [], products, q.sectionDiscounts ?? {}).grandSubtotal } catch { return 0 }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quote permanently?')) return
    setDeletingId(id)
    await deleteQuoteNative(id)
    setQuotes((p) => p.filter((q) => q.id !== id))
    setDeletingId(null)
  }

  const handleDuplicate = async (id: string) => {
    const num = await getNextQuoteNumber()
    const newId = await duplicateQuoteNative(id, num)
    router.push(`/quotations/${newId}`)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-[#C9A840]" />
    </div>
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Quotations</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{quotes.length} quote{quotes.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/quotations/new"
          className="flex items-center gap-2 rounded-lg bg-[#C9A840] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8962e] transition-colors"
        >
          <FilePlus className="w-4 h-4" /> New Quote
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 pl-9 text-sm text-zinc-900 dark:text-zinc-100 focus:border-[#C9A840] focus:outline-none"
          placeholder="Search by client, quote number, or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-16 text-center">
          <p className="text-zinc-400 text-sm">{search ? 'No quotes match your search.' : 'No quotes yet.'}</p>
          {!search && (
            <Link href="/quotations/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#C9A840] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8962e] transition-colors">
              <FilePlus className="w-4 h-4" /> Create First Quote
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 dark:bg-zinc-800 text-[#C9A840]">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Quote No.</th>
                  <th className="text-left px-5 py-3 font-medium">Client</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Rooms</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Date</th>
                  <th className="text-center px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Total</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-[#C9A840]">{q.number}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{q.clientName || '—'}</p>
                      {q.company && <p className="text-xs text-zinc-400">{q.company}</p>}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-zinc-500">
                      {(q.rooms || []).length} room{(q.rooms || []).length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell text-zinc-500">
                      {q.date ? new Date(q.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(getTotal(q))}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/quotations/${q.id}/boq`} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition" title="View BOQ">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/quotations/${q.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-zinc-400 hover:text-blue-600 transition" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDuplicate(q.id)} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-zinc-400 hover:text-green-600 transition" title="Duplicate">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          disabled={deletingId === q.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
