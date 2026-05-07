
const BASE = 'https://www.pricecharting.com'
const TOKEN = process.env.PRICECHARTING_API_TOKEN

const cents = (v: unknown) => typeof v === 'number' ? Math.round(v) / 100 : null

export interface PCCard {
  id: string
  name: string
  consoleName: string
  rawPrice: number | null
  gradedPrice: number | null
  psa9Price: number | null
  psa10Price: number | null
  psa8Price: number | null
  volume: number
  searchUrl: string
}

function normalize(p: Record<string, unknown>): PCCard {
  const name = String(p['product-name'] ?? '')
  return {
    id:          String(p['id'] ?? ''),
    name,
    consoleName: String(p['console-name'] ?? ''),
    rawPrice:    cents(p['loose-price']),
    gradedPrice: cents(p['graded-price']),
    psa9Price:   cents(p['cib-price']),
    psa10Price:  cents(p['manual-only-price']),
    psa8Price:   null,
    volume:      typeof p['sales-volume'] === 'number' ? p['sales-volume'] : 0,
    searchUrl:   `https://www.pricecharting.com/search-products?q=${encodeURIComponent(name)}&type=prices`,
  }
}

export async function pcSearch(query: string, limit = 20): Promise<PCCard[]> {
  if (!TOKEN) return []
  try {
    const url = `${BASE}/api/products?q=${encodeURIComponent(query + ' pokemon')}&t=${TOKEN}`
    const res = await fetch(url, { headers: { 'User-Agent': 'CardCapitalBot/1.0' }, next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return ((data.products ?? []) as Record<string, unknown>[])
      .filter(p => String(p['console-name'] ?? '').toLowerCase().includes('pokemon'))
      .slice(0, limit)
      .map(normalize)
  } catch { return [] }
}

export async function pcGetById(id: string): Promise<PCCard | null> {
  if (!TOKEN) return null
  try {
    const url = `${BASE}/api/product?id=${id}&t=${TOKEN}`
    const res = await fetch(url, { headers: { 'User-Agent': 'CardCapitalBot/1.0' }, next: { revalidate: 300 } })
    if (!res.ok) return null
    return normalize(await res.json())
  } catch { return null }
}

export async function pcSearchOne(query: string): Promise<PCCard | null> {
  const results = await pcSearch(query, 1)
  return results[0] ?? null
}
