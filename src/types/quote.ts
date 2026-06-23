export type QuoteStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'On Hold'

export interface QuoteRoom {
  id: string
  name: string
  products: { productId: string; qty: number }[]
}

export interface Quote {
  id: string
  number: string
  leadId?: string
  clientName: string
  company?: string
  phone?: string
  email?: string
  address?: string
  date: string
  status: QuoteStatus
  salesperson?: string
  notes?: string
  rooms: QuoteRoom[]
  sectionDiscounts: Record<string, number>
  createdAt: string
  updatedAt: string
}

export interface CatalogProduct {
  id: string
  name: string
  partCode?: string
  category: string
  gsp?: number
  price?: number
  brand?: string
  image?: string
  description?: string
  active?: boolean
  custom?: boolean
  [key: string]: unknown
}
