
const BASE = 'https://api.pokemontcg.io/v2'

function headers() {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (process.env.POKEMON_TCG_API_KEY) h['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY
  return h
}

export interface TCGCard {
  id: string; name: string; number: string; rarity: string
  imageUrl: string; imageUrlHiRes: string
  setId: string; setName: string; setCode: string; releaseDate: string
  artist: string; types: string[]
  tcgplayerMarket?: number; cardmarketAvg?: number
}

export interface TCGSet {
  id: string; name: string; series: string; releaseDate: string
  totalCards: number; logoUrl: string; symbolUrl: string
}

function mapCard(d: Record<string, unknown>): TCGCard {
  const set = d.set as Record<string, unknown> ?? {}
  const images = d.images as Record<string, string> ?? {}
  const prices = (d as { tcgplayer?: { prices?: { normal?: { market?: number } } } }).tcgplayer?.prices?.normal
  const cm = (d as { cardmarket?: { prices?: { averageSellPrice?: number } } }).cardmarket?.prices
  return {
    id: String(d.id ?? ''), name: String(d.name ?? ''),
    number: String(d.number ?? ''), rarity: String(d.rarity ?? ''),
    imageUrl: images.small ?? '', imageUrlHiRes: images.large ?? '',
    setId: String(set.id ?? ''), setName: String(set.name ?? ''),
    setCode: String((set as Record<string,string>).ptcgoCode ?? set.id ?? ''),
    releaseDate: String(set.releaseDate ?? ''),
    artist: String(d.artist ?? ''),
    types: Array.isArray(d.types) ? d.types.map(String) : [],
    tcgplayerMarket: prices?.market,
    cardmarketAvg: cm?.averageSellPrice,
  }
}

export async function tcgSearch(name: string, setId?: string): Promise<TCGCard[]> {
  try {
    let q = `name:"${name}"`
    if (setId) q += ` set.id:${setId}`
    const res = await fetch(`${BASE}/cards?q=${encodeURIComponent(q)}&pageSize=20&orderBy=set.releaseDate`,
      { headers: headers(), next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).map(mapCard)
  } catch { return [] }
}

export async function tcgGetCard(id: string): Promise<TCGCard | null> {
  try {
    const res = await fetch(`${BASE}/cards/${id}`, { headers: headers(), next: { revalidate: 3600 } })
    if (!res.ok) return null
    return mapCard((await res.json()).data)
  } catch { return null }
}

export async function tcgGetSets(): Promise<TCGSet[]> {
  try {
    const res = await fetch(`${BASE}/sets?orderBy=-releaseDate`, { headers: headers(), next: { revalidate: 86400 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).map((s: Record<string, unknown>) => ({
      id: String(s.id ?? ''), name: String(s.name ?? ''),
      series: String(s.series ?? ''), releaseDate: String(s.releaseDate ?? ''),
      totalCards: Number(s.total ?? 0),
      logoUrl: String((s.images as Record<string,string>)?.logo ?? ''),
      symbolUrl: String((s.images as Record<string,string>)?.symbol ?? ''),
    }))
  } catch { return [] }
}

export async function tcgGetSet(setId: string): Promise<TCGCard[]> {
  try {
    const res = await fetch(`${BASE}/cards?q=set.id:${setId}&pageSize=250&orderBy=number`,
      { headers: headers(), next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data ?? []).map(mapCard)
  } catch { return [] }
}
