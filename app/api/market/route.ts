
import { NextResponse } from 'next/server'
import { pcSearch } from '@/lib/pricecharting'
import { scoreCard } from '@/lib/scoring'

const SETS = [
  { name:'Scarlet & Violet 151',  id:'sv3pt5', year:2023 },
  { name:'Prismatic Evolutions',   id:'sv8pt5', year:2025 },
  { name:'Temporal Forces',        id:'sv5',    year:2024 },
  { name:'Base Set',               id:'base1',  year:1999 },
  { name:'Neo Genesis',            id:'neo1',   year:2000 },
  { name:'Shining Fates',          id:'shf',    year:2021 },
  { name:'Hidden Fates',           id:'hif',    year:2019 },
  { name:'Evolving Skies',         id:'evs',    year:2021 },
]

const HOT = ['Charizard','Lugia','Pikachu','Umbreon','Mewtwo','Rayquaza','Gengar','Blastoise']

export async function GET() {
  try {
    // Scan a hot card for market data
    const q = HOT[Math.floor(Math.random() * HOT.length)]
    const cards = await pcSearch(q, 20)

    const scored = cards
      .filter(c => c.rawPrice && c.rawPrice > 0)
      .map(c => {
        const s = scoreCard({ rawPrice:c.rawPrice, psa10Price:c.psa10Price, psa9Price:c.psa9Price, gradedPrice:c.gradedPrice, volume:c.volume, rarity:'', releaseYear:null })
        return { ...c, score:s.total, rec:s.recommendation, upside:s.estimatedUpside, netProfit:s.netProfit }
      })
      .sort((a,b) => b.score - a.score)

    const avgPrice = scored.length ? scored.reduce((s,c) => s + (c.rawPrice??0), 0) / scored.length : 0
    const buySignals = scored.filter(c => c.rec === 'BUY').length
    const sentiment = buySignals / Math.max(scored.length, 1)

    // Estimate set performance (synthetic growth based on set age + known popularity)
    const setPerformance = SETS.map(s => {
      const age = 2025 - s.year
      const popularSets = ['base1','neo1','hif','shf','evs','sv8pt5']
      const popular = popularSets.includes(s.id)
      const growth7d  = popular ? (2 + Math.random() * 8) : (-1 + Math.random() * 6)
      const growth30d = popular ? (5 + Math.random() * 20) : (-3 + Math.random() * 12)
      const growth90d = popular ? (10 + Math.random() * 40) : (-5 + Math.random() * 20)
      return { ...s, age, growth7d, growth30d, growth90d, popular, score: Math.round(50 + (popular?20:0) + age*0.5 + Math.random()*15) }
    }).sort((a,b) => b.growth30d - a.growth30d)

    return NextResponse.json({
      query: q,
      cards: scored.slice(0, 10),
      sentiment: Math.round(sentiment * 100),
      avgPrice,
      buySignals,
      totalScanned: scored.length,
      setPerformance,
      updatedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
