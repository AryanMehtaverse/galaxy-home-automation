const DB = 'https://galaxy-quotation-default-rtdb.firebaseio.com'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fbGet(path) {
  const res = await fetch(`${DB}${path}.json`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function fbPut(path, data) {
  const res = await fetch(`${DB}${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function fbDelete(path) {
  const res = await fetch(`${DB}${path}.json`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// Firebase returns an object keyed by ID — convert to array
function toArray(obj) {
  if (!obj) return []
  return Object.values(obj)
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

export const getAllQuotes = async () => {
  const data = await fbGet('/quotes')
  return toArray(data)
}

export const getQuoteById = async (id) => {
  return fbGet(`/quotes/${id}`)
}

export const saveQuote = async (quote) => {
  return fbPut(`/quotes/${quote.id}`, quote)
}

export const deleteQuote = async (id) => {
  return fbDelete(`/quotes/${id}`)
}

export const duplicateQuote = async (id, newNumber) => {
  const original = await getQuoteById(id)
  const newQuote = {
    ...original,
    id: crypto.randomUUID(),
    quoteNumber: newNumber,
    createdAt: new Date().toISOString(),
  }
  await saveQuote(newQuote)
  return newQuote
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const getAllProducts = async () => {
  const data = await fbGet('/products')
  return toArray(data)
}

export const getProductById = async (id) => {
  return fbGet(`/products/${id}`)
}

export const saveProduct = async (product) => {
  return fbPut(`/products/${product.id}`, product)
}

export const deleteProduct = async (id) => {
  return fbDelete(`/products/${id}`)
}

export const toggleProductActive = async (id) => {
  const product = await getProductById(id)
  const updated = { ...product, active: !product.active }
  await fbPut(`/products/${id}`, updated)
  return updated
}

export const seedProducts = async (catalogProducts) => {
  const existing = await fbGet('/products')
  if (existing && Object.keys(existing).length > 0) return // already seeded
  const batch = {}
  catalogProducts.forEach(p => { batch[p.id] = p })
  await fbPut('/products', batch)
}

// Legacy compat
export const getCustomProducts  = () => getAllProducts().then(ps => ps.filter(p => p.custom))
export const saveCustomProduct  = (product) => saveProduct({ ...product, custom: true })
export const deleteCustomProduct = (id) => deleteProduct(id)
