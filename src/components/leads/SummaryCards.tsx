import type { Lead } from '@/types/lead'

interface CardDef {
  label: string
  value: number
  color: string
  bg: string
}

export function SummaryCards({ leads }: { leads: Lead[] }) {
  const today = new Date().toISOString().split('T')[0]

  const cards: CardDef[] = [
    { label: 'Total', value: leads.length, color: 'text-[#C9A840]', bg: 'border-[#C9A840]/30 bg-[#C9A840]/10' },
    { label: 'New', value: leads.filter((l) => l.status === 'New Lead').length, color: 'text-blue-400', bg: 'border-blue-500/30 bg-blue-500/10' },
    { label: 'Contacted', value: leads.filter((l) => l.status === 'Contacted').length, color: 'text-purple-400', bg: 'border-purple-500/30 bg-purple-500/10' },
    { label: 'Interested', value: leads.filter((l) => l.status === 'Interested').length, color: 'text-green-400', bg: 'border-green-500/30 bg-green-500/10' },
    { label: 'Quotation', value: leads.filter((l) => l.status === 'Quotation Requested').length, color: 'text-amber-400', bg: 'border-amber-500/30 bg-amber-500/10' },
    { label: 'Won', value: leads.filter((l) => l.status === 'Won').length, color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-500/10' },
    { label: 'Lost', value: leads.filter((l) => l.status === 'Lost').length, color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/10' },
    { label: "Today's", value: leads.filter((l) => l.nextFollowUpDate === today).length, color: 'text-orange-400', bg: 'border-orange-500/30 bg-orange-500/10' },
    { label: 'Overdue', value: leads.filter((l) => l.nextFollowUpDate && l.nextFollowUpDate < today).length, color: 'text-red-400', bg: 'border-red-800/40 bg-red-900/20' },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border p-3 ${card.bg}`}>
          <p className="text-[10px] leading-tight text-zinc-500 dark:text-zinc-400 sm:text-xs">{card.label}</p>
          <p className={`mt-1 text-xl font-bold sm:text-2xl ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
