import type { Lead } from '@/types/lead'

interface CardDef {
  label: string
  value: number
  color: string
  bg: string
  activeBg: string
  filterType: 'total' | 'status' | 'date'
  filterValue: string
}

interface SummaryCardsProps {
  leads: Lead[]
  activeStatus: string
  activeDateFilter: string
  onStatusClick: (status: string) => void
  onDateClick: (dateFilter: string) => void
}

export function SummaryCards({ leads, activeStatus, activeDateFilter, onStatusClick, onDateClick }: SummaryCardsProps) {
  const today = new Date().toISOString().split('T')[0]

  const cards: CardDef[] = [
    { label: 'Total', value: leads.length, color: 'text-[#C9A840]', bg: 'border-[#C9A840]/30 bg-[#C9A840]/10', activeBg: 'border-[#C9A840] bg-[#C9A840]/25 ring-2 ring-[#C9A840]/50', filterType: 'total', filterValue: '' },
    { label: 'New', value: leads.filter((l) => l.status === 'New Lead').length, color: 'text-blue-400', bg: 'border-blue-500/30 bg-blue-500/10', activeBg: 'border-blue-500 bg-blue-500/25 ring-2 ring-blue-500/50', filterType: 'status', filterValue: 'New Lead' },
    { label: 'Contacted', value: leads.filter((l) => l.status === 'Contacted').length, color: 'text-purple-400', bg: 'border-purple-500/30 bg-purple-500/10', activeBg: 'border-purple-500 bg-purple-500/25 ring-2 ring-purple-500/50', filterType: 'status', filterValue: 'Contacted' },
    { label: 'Interested', value: leads.filter((l) => l.status === 'Interested').length, color: 'text-green-400', bg: 'border-green-500/30 bg-green-500/10', activeBg: 'border-green-500 bg-green-500/25 ring-2 ring-green-500/50', filterType: 'status', filterValue: 'Interested' },
    { label: 'Quotation', value: leads.filter((l) => l.status === 'Quotation Requested').length, color: 'text-amber-400', bg: 'border-amber-500/30 bg-amber-500/10', activeBg: 'border-amber-500 bg-amber-500/25 ring-2 ring-amber-500/50', filterType: 'status', filterValue: 'Quotation Requested' },
    { label: 'Won', value: leads.filter((l) => l.status === 'Won').length, color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-500/10', activeBg: 'border-emerald-500 bg-emerald-500/25 ring-2 ring-emerald-500/50', filterType: 'status', filterValue: 'Won' },
    { label: 'Lost', value: leads.filter((l) => l.status === 'Lost').length, color: 'text-red-400', bg: 'border-red-500/30 bg-red-500/10', activeBg: 'border-red-500 bg-red-500/25 ring-2 ring-red-500/50', filterType: 'status', filterValue: 'Lost' },
    { label: "Today's", value: leads.filter((l) => l.nextFollowUpDate === today).length, color: 'text-orange-400', bg: 'border-orange-500/30 bg-orange-500/10', activeBg: 'border-orange-500 bg-orange-500/25 ring-2 ring-orange-500/50', filterType: 'date', filterValue: 'today' },
    { label: 'Overdue', value: leads.filter((l) => l.nextFollowUpDate && l.nextFollowUpDate < today).length, color: 'text-red-400', bg: 'border-red-800/40 bg-red-900/20', activeBg: 'border-red-600 bg-red-900/40 ring-2 ring-red-600/50', filterType: 'date', filterValue: 'overdue' },
  ]

  function isActive(card: CardDef): boolean {
    if (card.filterType === 'total') return activeStatus === '' && activeDateFilter === ''
    if (card.filterType === 'status') return activeStatus === card.filterValue && activeDateFilter === ''
    return activeDateFilter === card.filterValue
  }

  function handleClick(card: CardDef) {
    if (card.filterType === 'total') {
      onStatusClick('')
      onDateClick('')
      return
    }
    if (card.filterType === 'status') {
      onDateClick('')
      onStatusClick(isActive(card) ? '' : card.filterValue)
      return
    }
    // date card
    onStatusClick('')
    onDateClick(isActive(card) ? '' : card.filterValue)
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
      {cards.map((card) => {
        const active = isActive(card)
        return (
          <button
            key={card.label}
            onClick={() => handleClick(card)}
            className={`rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer hover:opacity-90 active:scale-95 ${active ? card.activeBg : card.bg}`}
          >
            <p className="text-[10px] leading-tight text-zinc-500 dark:text-zinc-400 sm:text-xs">{card.label}</p>
            <p className={`mt-1 text-xl font-bold sm:text-2xl ${card.color}`}>{card.value}</p>
          </button>
        )
      })}
    </div>
  )
}
