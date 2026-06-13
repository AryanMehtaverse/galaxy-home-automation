/**
 * Pricing Engine — computes full pricing chain for a quote.
 *
 * sectionDiscounts: { [category]: discountPercent }
 *   e.g. { ELYSIA_SWITCHES: 25, LCD_PANELS: 35, NETWORKING: 0 }
 *   Missing categories default to 0% discount.
 *
 * Installation rate per category (% of discounted subtotal):
 *   LCD_PANELS → 0%
 *   LOCKS      → 10%
 *   All others → 15%
 */

export const GST_RATE = 0.09 // legacy, not shown in UI

export const INSTALLATION_RATES = {
  LCD_PANELS: 0,
  LOCKS:      0.10,
  _default:   0.15,
}

export const getInstallationRate = (category) =>
  INSTALLATION_RATES[category] ?? INSTALLATION_RATES._default

/**
 * Aggregate all room products into a flat {productId: totalQty} map.
 */
export const aggregateRoomProducts = (rooms = []) => {
  const map = {}
  rooms.forEach((room) => {
    ;(room.products || []).forEach(({ productId, qty }) => {
      if (qty > 0) map[productId] = (map[productId] || 0) + qty
    })
  })
  return map
}

/**
 * Resolve discount % for a category.
 * sectionDiscounts can be:
 *   - object: { [category]: percent }  ← new per-section mode
 *   - number: legacy global discount
 */
const resolveDiscount = (sectionDiscounts, category) => {
  if (typeof sectionDiscounts === 'number') return sectionDiscounts
  if (!sectionDiscounts) return 0
  return sectionDiscounts[category] ?? 0
}

/**
 * Compute the full pricing chain.
 * Returns lineItems, sections, totals.
 */
export const computePricing = (rooms = [], products = [], sectionDiscounts = {}) => {
  const aggregated = aggregateRoomProducts(rooms)

  const lineItems = Object.entries(aggregated)
    .map(([productId, qty]) => {
      const product = products.find((p) => p.id === productId)
      if (!product) return null
      const unitPrice = product.gsp || product.price
      const amount    = unitPrice * qty
      return {
        productId,
        name:        product.name,
        partCode:    product.partCode || '',
        category:    product.category,
        brand:       product.brand || '',
        image:       product.image || '',
        description: product.description || '',
        unitPrice,
        qty,
        amount,
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const ORDER = ['ELYSIA_SWITCHES','VITRUM_SWITCHES','CURTAINS','LCD_PANELS','VDP','LOCKS','NETWORKING','SENSORS','IR_CONTROLLERS','CONTROLLERS']
      const ai = ORDER.indexOf(a.category)
      const bi = ORDER.indexOf(b.category)
      const aIdx = ai === -1 ? ORDER.length : ai
      const bIdx = bi === -1 ? ORDER.length : bi
      return aIdx - bIdx
    })

  // ── Section subtotals by category ──────────────────────────
  const sectionMap = {}
  lineItems.forEach((item) => {
    if (!sectionMap[item.category]) {
      sectionMap[item.category] = {
        category:    item.category,
        itemTotal:   0,
        installRate: getInstallationRate(item.category),
        discountPercent: resolveDiscount(sectionDiscounts, item.category),
      }
    }
    sectionMap[item.category].itemTotal += item.amount
  })

  const sections = Object.values(sectionMap).map((sec) => {
    const disc = sec.discountPercent / 100
    // Match Excel: round the discounted unit price first, then multiply by qty
    // discountedItemTotal = sum of [ round(unitPrice * (1-disc)) * qty ] per line item
    const discountedItemTotal = lineItems
      .filter(i => i.category === sec.category)
      .reduce((s, i) => s + Math.round(i.unitPrice * (1 - disc)) * i.qty, 0)
    const discountAmount  = sec.itemTotal - discountedItemTotal
    const installCharge   = Math.round(discountedItemTotal * sec.installRate)
    return {
      ...sec,
      discountAmount,
      discountedItemTotal,
      installCharge,
    }
  })

  // ── Grand totals ────────────────────────────────────────────
  const productSubtotal    = sections.reduce((s, sec) => s + sec.itemTotal, 0)
  const totalDiscountAmount = sections.reduce((s, sec) => s + sec.discountAmount, 0)
  const discountedSubtotal = sections.reduce((s, sec) => s + sec.discountedItemTotal, 0)
  const totalInstallation  = sections.reduce((s, sec) => s + sec.installCharge, 0)
  const grandSubtotal      = discountedSubtotal + totalInstallation

  // Legacy GST (not shown in UI, kept for any old references)
  const cgst      = Math.round(grandSubtotal * GST_RATE)
  const sgst      = Math.round(grandSubtotal * GST_RATE)
  const grandTotal = grandSubtotal + cgst + sgst

  // Compute a representative "global" discount % for display
  const discountPercent = productSubtotal > 0
    ? Math.round((totalDiscountAmount / productSubtotal) * 100 * 10) / 10
    : 0

  return {
    lineItems,
    sections,
    productSubtotal,
    discountPercent,          // effective blended % (for display)
    discountAmount: totalDiscountAmount,
    discountedSubtotal,
    totalInstallation,
    grandSubtotal,
    cgst,
    sgst,
    grandTotal,
    // legacy aliases
    subtotal:        productSubtotal,
    discountedTotal: discountedSubtotal,
    gstRate:         GST_RATE * 2,
    gstAmount:       cgst + sgst,
  }
}
