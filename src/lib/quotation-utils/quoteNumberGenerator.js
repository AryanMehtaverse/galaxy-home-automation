const DB = 'https://galaxy-quotation-default-rtdb.firebaseio.com'

export const generateQuoteNumber = async () => {
  const res = await fetch(`${DB}/quoteCounter.json`)
  const current = (await res.json()) || 0
  const next = current + 1
  await fetch(`${DB}/quoteCounter.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(next),
  })
  return `GHA-${String(next).padStart(4, '0')}`
}

export const peekNextQuoteNumber = async () => {
  const res = await fetch(`${DB}/quoteCounter.json`)
  const current = (await res.json()) || 0
  return `GHA-${String(current + 1).padStart(4, '0')}`
}
