/**
 * Quote Presets — standard room/product templates for common home types.
 *
 * Room breakdown for 2BHK (from standard Excel template):
 *   Entry(2) · Living(6) · Dining(2) · Kitchen(0) · Bed1(6) · Bed2(6) · Toilets(2)
 *
 * productIds reference src/data/products.json
 */

export const PRESETS = {
  '2BHK': {
    label: '2 BHK',
    icon: '🏠',
    description: 'Entry · Living · Dining · 2 Bedrooms · Toilets · Network · LCD',
    discountPercent: 25,
    // Per-section discount % — matches standard Galaxy quote template
    sectionDiscounts: {
      ELYSIA_SWITCHES:  25,
      IR_CONTROLLERS:   25,
      SENSORS:          25,
      VDP:              25,
      CURTAINS:         25,
      LOCKS:            25,
      LCD_PANELS:       35,   // LCD panels always 35%
      NETWORKING:        0,   // No discount on WiFi & Camera material
      VITRUM_SWITCHES:  25,
    },
    rooms: [
      // ── Entry ────────────────────────────────────────────────
      // Dimmer(1) + VDP(1) + Face Recognition Lock(1)
      {
        name: 'Entry',
        type: 'entry',
        products: [
          { productId: 'EL-009', qty: 1 },  // Dimmer Switch (Intelligent Dimming with 2-Way)
          { productId: 'VD-001', qty: 1 },  // Video Door Phone (VDP)
          { productId: 'LK-002', qty: 1 },  // Face Recognition Door Lock
        ],
      },

      // ── Living Room ─────────────────────────────────────────
      // 4Key(2) + 8Key(1) + IR-RF(1) + SingleSocket(2) + WiFiCurtain(2) + CurtainCtrl(1) + LCD MAX(1)
      {
        name: 'Living Room',
        type: 'living',
        products: [
          { productId: 'EL-004', qty: 2 },  // 4 Key Switch
          { productId: 'EL-007', qty: 1 },  // 8 Key Switch
          { productId: 'IR-002', qty: 1 },  // IR-RF Controller
          { productId: 'EL-012', qty: 2 },  // Single Socket USB+C
          { productId: 'CR-001', qty: 2 },  // WiFi Curtain Motor
          { productId: 'CR-007', qty: 1 },  // Motor Controller — Single Channel
          { productId: 'LC-010', qty: 1 },  // MAX Smart Central Panel (gateway for whole home)
        ],
      },

      // ── Dining ──────────────────────────────────────────────
      // 4Key(1) + 8Key(1)
      {
        name: 'Dining',
        type: 'dining',
        products: [
          { productId: 'EL-004', qty: 1 },  // 4 Key Switch
          { productId: 'EL-007', qty: 1 },  // 8 Key Switch
        ],
      },

      // ── Kitchen ─────────────────────────────────────────────
      // Empty by default — user can add as needed
      {
        name: 'Kitchen',
        type: 'kitchen',
        products: [],
      },

      // ── Master Bedroom ──────────────────────────────────────
      // 4Key(2) + 8Key(1) + IR-RF(1) + SingleSocket(2) + WiFiCurtain(1) + T1E Panel(1)
      {
        name: 'Master Bedroom',
        type: 'bedroom',
        products: [
          { productId: 'EL-004', qty: 2 },  // 4 Key Switch
          { productId: 'EL-007', qty: 1 },  // 8 Key Switch
          { productId: 'IR-002', qty: 1 },  // IR-RF Controller
          { productId: 'EL-012', qty: 2 },  // Single Socket USB+C
          { productId: 'CR-001', qty: 1 },  // WiFi Curtain Motor
          { productId: 'LC-003', qty: 1 },  // T1E Smart Central Panel
        ],
      },

      // ── Bedroom 2 ───────────────────────────────────────────
      // 4Key(2) + 8Key(1) + IR-RF(1) + SingleSocket(2) + WiFiCurtain(1) + T1E Panel(1)
      {
        name: 'Bedroom 2',
        type: 'bedroom',
        products: [
          { productId: 'EL-004', qty: 2 },  // 4 Key Switch
          { productId: 'EL-007', qty: 1 },  // 8 Key Switch
          { productId: 'IR-002', qty: 1 },  // IR-RF Controller
          { productId: 'EL-012', qty: 2 },  // Single Socket USB+C
          { productId: 'CR-001', qty: 1 },  // WiFi Curtain Motor
          { productId: 'LC-003', qty: 1 },  // T1E Smart Central Panel
        ],
      },

      // ── Toilets ─────────────────────────────────────────────
      // Presence Sensor(2) — one per toilet
      {
        name: 'Toilets',
        type: 'bathroom',
        products: [
          { productId: 'SN-001', qty: 2 },  // Presence Sensor
        ],
      },

      // ── Network ─────────────────────────────────────────────
      // Deco WiFi Mesh Router(3) + 4CH Giga Switch(1)
      {
        name: 'Network',
        type: 'utility',
        products: [
          { productId: 'NW-001', qty: 3 },  // Deco WiFi Mesh Router
          { productId: 'NW-003', qty: 1 },  // 4-Port Gigabit Switch (4CH)
        ],
      },
    ],
  },

  // ── 3 BHK ── 2BHK base + 1 extra bedroom
  '3BHK': {
    label: '3 BHK',
    icon: '🏠',
    description: 'Entry · Living · Dining · 3 Bedrooms · Toilets · Network · LCD',
    discountPercent: 25,
    sectionDiscounts: {
      ELYSIA_SWITCHES:  25,
      IR_CONTROLLERS:   25,
      SENSORS:          25,
      VDP:              25,
      CURTAINS:         25,
      LOCKS:            25,
      LCD_PANELS:       35,
      NETWORKING:        0,
      VITRUM_SWITCHES:  25,
    },
    rooms: [
      {
        name: 'Entry',
        type: 'entry',
        products: [
          { productId: 'EL-009', qty: 1 },
          { productId: 'VD-001', qty: 1 },
          { productId: 'LK-002', qty: 1 },
        ],
      },
      {
        name: 'Living Room',
        type: 'living',
        products: [
          { productId: 'EL-004', qty: 2 },
          { productId: 'EL-007', qty: 1 },
          { productId: 'IR-002', qty: 1 },
          { productId: 'EL-012', qty: 2 },
          { productId: 'CR-001', qty: 2 },
          { productId: 'CR-007', qty: 1 },
          { productId: 'LC-010', qty: 1 },
        ],
      },
      {
        name: 'Dining',
        type: 'dining',
        products: [
          { productId: 'EL-004', qty: 1 },
          { productId: 'EL-007', qty: 1 },
        ],
      },
      {
        name: 'Kitchen',
        type: 'kitchen',
        products: [],
      },
      {
        name: 'Master Bedroom',
        type: 'bedroom',
        products: [
          { productId: 'EL-004', qty: 2 },
          { productId: 'EL-007', qty: 1 },
          { productId: 'IR-002', qty: 1 },
          { productId: 'EL-012', qty: 2 },
          { productId: 'CR-001', qty: 1 },
          { productId: 'LC-003', qty: 1 },
        ],
      },
      {
        name: 'Bedroom 2',
        type: 'bedroom',
        products: [
          { productId: 'EL-004', qty: 2 },
          { productId: 'EL-007', qty: 1 },
          { productId: 'IR-002', qty: 1 },
          { productId: 'EL-012', qty: 2 },
          { productId: 'CR-001', qty: 1 },
          { productId: 'LC-003', qty: 1 },
        ],
      },
      // Extra bedroom for 3 BHK
      {
        name: 'Bedroom 3',
        type: 'bedroom',
        products: [
          { productId: 'EL-004', qty: 2 },  // 2× Elysia 4 Key Switch
          { productId: 'EL-007', qty: 1 },  // 1× Elysia 8 Key Switch
          { productId: 'IR-002', qty: 1 },  // 1× IR RF Controller
          { productId: 'SN-001', qty: 1 },  // 1× Presence Sensor
          { productId: 'EL-012', qty: 2 },  // 2× Elysia Single Socket USB+C
          { productId: 'LC-003', qty: 1 },  // 1× T1E Smart Central Panel
        ],
      },
      {
        name: 'Toilets',
        type: 'bathroom',
        products: [
          { productId: 'SN-001', qty: 2 },
        ],
      },
      {
        name: 'Network',
        type: 'utility',
        products: [
          { productId: 'NW-001', qty: 3 },
          { productId: 'NW-003', qty: 1 },
        ],
      },
    ],
  },

  // ── 4 BHK ── 2BHK base + 2 extra bedrooms
  '4BHK': {
    label: '4 BHK',
    icon: '🏠',
    description: 'Entry · Living · Dining · 4 Bedrooms · Toilets · Network · LCD',
    discountPercent: 25,
    sectionDiscounts: {
      ELYSIA_SWITCHES:  25,
      IR_CONTROLLERS:   25,
      SENSORS:          25,
      VDP:              25,
      CURTAINS:         25,
      LOCKS:            25,
      LCD_PANELS:       35,
      NETWORKING:        0,
      VITRUM_SWITCHES:  25,
    },
    rooms: [
      {
        name: 'Entry',
        type: 'entry',
        products: [
          { productId: 'EL-009', qty: 1 },
          { productId: 'VD-001', qty: 1 },
          { productId: 'LK-002', qty: 1 },
        ],
      },
      {
        name: 'Living Room',
        type: 'living',
        products: [
          { productId: 'EL-004', qty: 2 },
          { productId: 'EL-007', qty: 1 },
          { productId: 'IR-002', qty: 1 },
          { productId: 'EL-012', qty: 2 },
          { productId: 'CR-001', qty: 2 },
          { productId: 'CR-007', qty: 1 },
          { productId: 'LC-010', qty: 1 },
        ],
      },
      {
        name: 'Dining',
        type: 'dining',
        products: [
          { productId: 'EL-004', qty: 1 },
          { productId: 'EL-007', qty: 1 },
        ],
      },
      {
        name: 'Kitchen',
        type: 'kitchen',
        products: [],
      },
      {
        name: 'Master Bedroom',
        type: 'bedroom',
        products: [
          { productId: 'EL-004', qty: 2 },
          { productId: 'EL-007', qty: 1 },
          { productId: 'IR-002', qty: 1 },
          { productId: 'EL-012', qty: 2 },
          { productId: 'CR-001', qty: 1 },
          { productId: 'LC-003', qty: 1 },
        ],
      },
      {
        name: 'Bedroom 2',
        type: 'bedroom',
        products: [
          { productId: 'EL-004', qty: 2 },
          { productId: 'EL-007', qty: 1 },
          { productId: 'IR-002', qty: 1 },
          { productId: 'EL-012', qty: 2 },
          { productId: 'CR-001', qty: 1 },
          { productId: 'LC-003', qty: 1 },
        ],
      },
      // Extra bedrooms for 4 BHK
      {
        name: 'Bedroom 3',
        type: 'bedroom',
        products: [
          { productId: 'EL-004', qty: 2 },
          { productId: 'EL-007', qty: 1 },
          { productId: 'IR-002', qty: 1 },
          { productId: 'SN-001', qty: 1 },
          { productId: 'EL-012', qty: 2 },
          { productId: 'LC-003', qty: 1 },
        ],
      },
      {
        name: 'Bedroom 4',
        type: 'bedroom',
        products: [
          { productId: 'EL-004', qty: 2 },
          { productId: 'EL-007', qty: 1 },
          { productId: 'IR-002', qty: 1 },
          { productId: 'SN-001', qty: 1 },
          { productId: 'EL-012', qty: 2 },
          { productId: 'LC-003', qty: 1 },
        ],
      },
      {
        name: 'Toilets',
        type: 'bathroom',
        products: [
          { productId: 'SN-001', qty: 2 },
        ],
      },
      {
        name: 'Network',
        type: 'utility',
        products: [
          { productId: 'NW-001', qty: 3 },
          { productId: 'NW-003', qty: 1 },
        ],
      },
    ],
  },

  'Villa': null,
}

export const ACTIVE_PRESETS = Object.entries(PRESETS)
  .filter(([, v]) => v !== null)
  .map(([key, v]) => ({ key, ...v }))
