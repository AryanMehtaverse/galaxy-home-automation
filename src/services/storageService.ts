const DB = 'https://galaxy-quotation-default-rtdb.firebaseio.com'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Quote {
  id: string
  quoteNumber: string | number
  createdAt: string
  [key: string]: unknown
}

export interface Product {
  id: string
  active?: boolean
  custom?: boolean
  [key: string]: unknown
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fbGet(path: string): Promise<unknown> {
  const res = await fetch(`${DB}${path}.json`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function fbPut(path: string, data: unknown): Promise<unknown> {
  const res = await fetch(`${DB}${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function fbDelete(path: string): Promise<unknown> {
  const res = await fetch(`${DB}${path}.json`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// Firebase returns an object keyed by ID — convert to array
function toArray<T>(obj: Record<string, T> | null): T[] {
  if (!obj) return []
  return Object.values(obj)
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

export const getAllQuotes = async (): Promise<Quote[]> => {
  const data = await fbGet('/quotes') as Record<string, Quote> | null
  return toArray(data)
}

export const getQuoteById = async (id: string): Promise<Quote> => {
  return fbGet(`/quotes/${id}`) as Promise<Quote>
}

export const saveQuote = async (quote: Quote): Promise<unknown> => {
  return fbPut(`/quotes/${quote.id}`, quote)
}

export const deleteQuote = async (id: string): Promise<unknown> => {
  return fbDelete(`/quotes/${id}`)
}

export const duplicateQuote = async (id: string, newNumber: string | number): Promise<Quote> => {
  const original = await getQuoteById(id)
  const newQuote: Quote = {
    ...original,
    id: crypto.randomUUID(),
    quoteNumber: newNumber,
    createdAt: new Date().toISOString(),
  }
  await saveQuote(newQuote)
  return newQuote
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const getAllProducts = async (): Promise<Product[]> => {
  const data = await fbGet('/products') as Record<string, Product> | null
  return toArray(data)
}

export const getProductById = async (id: string): Promise<Product> => {
  return fbGet(`/products/${id}`) as Promise<Product>
}

export const saveProduct = async (product: Product): Promise<unknown> => {
  return fbPut(`/products/${product.id}`, product)
}

export const deleteProduct = async (id: string): Promise<unknown> => {
  return fbDelete(`/products/${id}`)
}

export const toggleProductActive = async (id: string): Promise<Product> => {
  const product = await getProductById(id)
  const updated: Product = { ...product, active: !product.active }
  await fbPut(`/products/${id}`, updated)
  return updated
}

export const seedProducts = async (catalogProducts: Product[]): Promise<void> => {
  const existing = await fbGet('/products') as Record<string, Product> | null
  if (existing && Object.keys(existing).length > 0) return
  const batch: Record<string, Product> = {}
  catalogProducts.forEach(p => { batch[p.id] = p })
  await fbPut('/products', batch)
}

// Legacy compat
export const getCustomProducts   = () => getAllProducts().then(ps => ps.filter(p => p.custom))
export const saveCustomProduct   = (product: Product) => saveProduct({ ...product, custom: true })
export const deleteCustomProduct = (id: string) => deleteProduct(id)
