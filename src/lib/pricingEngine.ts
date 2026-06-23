import type { QuoteRoom, CatalogProduct } from '@/types/quote'

export const INSTALLATION_RATES: Record<string, number> = {
  LCD_PANELS: 0,
  LOCKS: 0.10,
  _default: 0.15,
}

export const getInstallationRate = (category: string): number =>
  INSTALLATION_RATES[category] ?? INSTALLATION_RATES._default

export interface PricingLineItem {
  productId: string
  name: string
  partCode: string
  category: string
  brand: string
  unitPrice: number
  qty: number
  amount: number
}

export interface PricingSection {
  category: string
  itemTotal: number
  discountPercent: number
  discountAmount: number
  discountedItemTotal: number
  installRate: number
  installCharge: number
}

export interface PricingResult {
  lineItems: PricingLineItem[]
  sections: PricingSection[]
  productSubtotal: number
  discountPercent: number
  discountAmount: number
  discountedSubtotal: number
  totalInstallation: number
  grandSubtotal: number
}

const CATEGORY_ORDER = [
  'ELYSIA_SWITCHES', 'VITRUM_SWITCHES', 'CURTAINS', 'LCD_PANELS',
  'VDP', 'LOCKS', 'NETWORKING', 'SENSORS', 'IR_CONTROLLERS', 'CONTROLLERS',
]

export function computePricing(
  rooms: QuoteRoom[],
  products: CatalogProduct[],
  sectionDiscounts: Record<string, number> = {}
): PricingResult {
  // Aggregate qty per product across all rooms
  const aggregated: Record<string, number> = {}
  rooms.forEach((room) => {
    ;(room.products || []).forEach(({ productId, qty }) => {
      if (qty > 0) aggregated[productId] = (aggregated[productId] || 0) + qty
    })
  })

  const lineItems: PricingLineItem[] = Object.entries(aggregated)
    .map(([productId, qty]) => {
      const product = products.find((p) => p.id === productId)
      if (!product) return null
      const unitPrice = (product.gsp || product.price || 0) as number
      return {
        productId,
        name: product.name,
        partCode: (product.partCode || '') as string,
        category: product.category,
        brand: (product.brand || '') as string,
        unitPrice,
        qty,
        amount: unitPrice * qty,
      }
    })
    .filter((x): x is PricingLineItem => x !== null)
    .sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category)
      const bi = CATEGORY_ORDER.indexOf(b.category)
      return (ai === -1 ? CATEGORY_ORDER.length : ai) - (bi === -1 ? CATEGORY_ORDER.length : bi)
    })

  const sectionMap: Record<string, PricingSection> = {}
  lineItems.forEach((item) => {
    if (!sectionMap[item.category]) {
      sectionMap[item.category] = {
        category: item.category,
        itemTotal: 0,
        discountPercent: sectionDiscounts[item.category] ?? 0,
        discountAmount: 0,
        discountedItemTotal: 0,
        installRate: getInstallationRate(item.category),
        installCharge: 0,
      }
    }
    sectionMap[item.category].itemTotal += item.amount
  })

  const sections: PricingSection[] = Object.values(sectionMap).map((sec) => {
    const disc = sec.discountPercent / 100
    const discountedItemTotal = lineItems
      .filter((i) => i.category === sec.category)
      .reduce((s, i) => s + Math.round(i.unitPrice * (1 - disc)) * i.qty, 0)
    const discountAmount = sec.itemTotal - discountedItemTotal
    const installCharge = Math.round(discountedItemTotal * sec.installRate)
    return { ...sec, discountAmount, discountedItemTotal, installCharge }
  })

  const productSubtotal = sections.reduce((s, sec) => s + sec.itemTotal, 0)
  const totalDiscountAmount = sections.reduce((s, sec) => s + sec.discountAmount, 0)
  const discountedSubtotal = sections.reduce((s, sec) => s + sec.discountedItemTotal, 0)
  const totalInstallation = sections.reduce((s, sec) => s + sec.installCharge, 0)
  const grandSubtotal = discountedSubtotal + totalInstallation
  const discountPercent = productSubtotal > 0
    ? Math.round((totalDiscountAmount / productSubtotal) * 1000) / 10
    : 0

  return {
    lineItems,
    sections,
    productSubtotal,
    discountPercent,
    discountAmount: totalDiscountAmount,
    discountedSubtotal,
    totalInstallation,
    grandSubtotal,
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}
