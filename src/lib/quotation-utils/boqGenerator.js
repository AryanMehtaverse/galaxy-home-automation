import { computePricing } from './pricingEngine'

export const CATEGORY_LABELS = {
  ELYSIA_SWITCHES: 'Galaxy Elysia Switches',
  VITRUM_SWITCHES: 'Galaxy Vitrum Switches',
  IR_CONTROLLERS: 'IR Controllers',
  SENSORS: 'Sensors',
  CONTROLLERS: 'Controllers / Hubs',
  LCD_PANELS: 'LCD Smart Panels',
  CURTAINS: 'Curtain Motors',
  LOCKS: 'Smart Locks',
  NETWORKING: 'Networking',
  VDP: 'Video Door Phone',
  // Legacy
  SHARED: 'IR / Sensors / Accessories',
}

/**
 * Generate BOQ from rooms (new room-centric architecture).
 */
export const generateBOQFromRooms = (rooms = [], products = [], discountPercent = 0) => {
  return computePricing(rooms, products, discountPercent)
}

/**
 * Legacy: generate BOQ from flat {[productId]: qty} map.
 */
export const generateBOQ = (selectedProducts, products, discountPercent = 0) => {
  const rooms = [
    {
      id: 'legacy',
      name: 'All Products',
      products: Object.entries(selectedProducts)
        .filter(([, qty]) => qty > 0)
        .map(([productId, qty]) => ({ productId, qty })),
    },
  ]
  return computePricing(rooms, products, discountPercent)
}
