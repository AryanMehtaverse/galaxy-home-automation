/**
 * Rules Engine — derives product suggestions from room configuration.
 * Returns suggestions only; user decides whether to add them.
 */

const RULES = [
  // AC → Smart IR+RF Universal Controller
  (room, products) => {
    if (!room.hasAC) return []
    const p = products.find((x) => x.id === 'IR-003') || products.find((x) => x.id === 'IR-001')
    if (!p) return []
    return [{ productId: p.id, reason: `AC detected in "${room.name}"` }]
  },

  // TV → IR RF Controller
  (room, products) => {
    if (!room.hasTV) return []
    const p = products.find((x) => x.id === 'IR-002')
    if (!p) return []
    return [{ productId: p.id, reason: `TV detected in "${room.name}"` }]
  },

  // Fan → Elysia Fan Controller
  (room, products) => {
    if (!room.hasFan) return []
    const p = products.find((x) => x.id === 'EL-008')
    if (!p) return []
    return [{ productId: p.id, reason: `Fan detected in "${room.name}"` }]
  },

  // Curtains → WiFi Curtain Motor (one per curtain)
  (room, products) => {
    const count = parseInt(room.curtainsCount || 0, 10)
    if (count <= 0) return []
    const p = products.find((x) => x.id === 'CR-001')
    if (!p) return []
    return Array.from({ length: count }, () => ({
      productId: p.id,
      reason: `${count} curtain(s) in "${room.name}"`,
    }))
  },

  // Washroom → Presence Sensor
  (room, products) => {
    if (room.type !== 'Washroom') return []
    const p = products.find((x) => x.id === 'SN-001')
    if (!p) return []
    return [{ productId: p.id, reason: `Washroom: "${room.name}"` }]
  },

  // Hub controller type → Zigbee Hub
  (room, products) => {
    if (room.controllerType !== 'HUB') return []
    const p = products.find((x) => x.id === 'HB-001')
    if (!p) return []
    return [{ productId: p.id, reason: `Hub controller in "${room.name}"` }]
  },

  // LCD 4" → LCD Panel 4 Button
  (room, products) => {
    if (room.controllerType !== 'LCD 4 Inch') return []
    const p = products.find((x) => x.id === 'LC-002')
    if (!p) return []
    return [{ productId: p.id, reason: `LCD 4" in "${room.name}"` }]
  },

  // LCD 10" → T1E Smart Central Panel
  (room, products) => {
    if (room.controllerType !== 'LCD 10 Inch') return []
    const p = products.find((x) => x.id === 'LC-003')
    if (!p) return []
    return [{ productId: p.id, reason: `LCD 10" in "${room.name}"` }]
  },
]

/**
 * Returns per-room suggestions: { [roomId]: [{productId, qty, reasons[]}] }
 */
export const getSuggestionsForRoom = (room, products) => {
  const raw = RULES.flatMap((rule) => rule(room, products))
  const grouped = {}
  raw.forEach(({ productId, reason }) => {
    if (!grouped[productId]) grouped[productId] = { productId, qty: 0, reasons: [] }
    grouped[productId].qty += 1
    grouped[productId].reasons.push(reason)
  })
  return Object.values(grouped)
}

/**
 * Returns flat suggestions across all rooms (legacy / BOQ usage).
 */
export const applyRules = (rooms, products) => {
  const map = {}
  rooms.forEach((room) => {
    getSuggestionsForRoom(room, products).forEach(({ productId, qty, reasons }) => {
      if (!map[productId]) map[productId] = { productId, qty: 0, reasons: [] }
      map[productId].qty += qty
      map[productId].reasons.push(...reasons)
    })
  })
  return Object.values(map)
}
