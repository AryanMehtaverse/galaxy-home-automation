import type { Lead } from '@/types/lead'

interface SummaryCardsProps {
  leads: Lead[]
}

interface CardDef {
  label: string
  value: number
  color: string
  bg: string
}

export function SummaryCards({ leads }: SummaryCardsProps) {
  const today = new Date().toISOString().split('T')[0]

  const total = leads.length
  const newLeads = leads.filter((l) => l.status === 'New Lead').length
  const contacted = leads.filter((l) => l.status === 'Contacted').length
  const interested = leads.filter((l) => l.status === 'Interested').length
  const quotationReq = leads.filter((l) => l.status === 'Quotation Requested').length
  const won = leads.filter((l) => l.status === 'Won').length
  const lost = leads.filter((l) => l.status === 'Lost').length
  const todayFollowUps = leads.filter((l) => l.nextFollowUpDate === today).length
  const overdue = leads.filter(
    (l) => l.nextFollowUpDate && l.nextFollowUpDate < today
  ).length

  const cards: CardDef[] = [
    { label: 'Total Leads', value: total, color: 'text-[#C9A840]', bg: 'border-[#C9A840]/30 bg-[#C9A840]/10' },
    { label: 'New', value: newLeads, color: 'text-blue-400', bg: 'border-blue-500/30 bg-blue-500/10' },
    { label: 'Contacted', value: contacted, color: 'text-purple-400', bg: 'border-purple-500/30 bg-purple-500/10' },
    { label: 'Interested', value: interested, color: 'text-green-400', bg: 'border-green-500/30 bg-green-500/10' },
    { label: 'Quotation Req.', value: quotationReq, color: 'text-amber-400', bg: 'border-amber-500/30 bg-amber-500/10' },
    { label: 'Won', value: won, color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-500/10' },
    { label: 'Lost', value: lost, color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/10' },
    { label: "Today's Follow-ups", value: todayFollowUps, color: 'text-orange-400', bg: 'border-orange-500/30 bg-orange-500/10' },
    { label: 'Overdue', value: overdue, color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/10' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-9">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-3 ${card.bg}`}
        >
          <p className="text-xs text-zinc-400 leading-tight">{card.label}</p>
          <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
