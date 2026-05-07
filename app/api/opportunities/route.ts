
import { NextResponse } from 'next/server'
import { pcSearch } from '@/lib/pricecharting'
import { tcgSearch } from '@/lib/pokemontcg'
import { scoreCard } from '@/lib/scoring'

const HOT_SEARCHES = ['Charizard', 'Lugia', 'Umbreon', 'Mewtwo', 'Pikachu', 'Rayquaza', 'Blastoise', 'Gengar']

export async function GET() {
  try {
    const query = HOT_SEARCHES[Math.floor(Math.random() * HOT_SEARCHES.length)]
    const [pc, tcg] = await Promise.allSettled([pcSearch(query, 20), tcgSearch(query)])
    const pcCards = pc.status === 'fulfilled' ? pc.value : []
    const tcgCards = tcg.status === 'fulfilled' ? tcg.value : []

    const opportunities = pcCards
      .filter(p => p.rawPrice && p.psa10Price && p.rawPrice > 0)
      .map(p => {
        const match = tcgCards.find(t => t.name.toLowerCase().includes(p.name.split(' ')[0].toLowerCase()))
        const score = scoreCard({
          rawPrice: p.rawPrice, psa10Price: p.psa10Price, psa9Price: p.psa9Price,
          gradedPrice: p.gradedPrice, volume: p.volume,
          rarity: match?.rarity ?? '', releaseYear: null,
        })
        return {
          pcId: p.id, name: p.name, setName: p.consoleName.replace(/pokemon ?/gi, '').trim(),
          imageUrl: match?.imageUrl ?? null, rawPrice: p.rawPrice, psa10Price: p.psa10Price,
          volume: p.volume, score: score.total, recommendation: score.recommendation,
          estimatedUpside: score.estimatedUpside, netProfit: score.netProfit,
          buyUnder: score.buyUnder, reason: score.reason, searchUrl: p.searchUrl,
        }
      })
      .filter(o => o.recommendation === 'BUY' && o.estimatedUpside && o.estimatedUpside > 15)
      .sort((a, b) => (b.estimatedUpside ?? 0) - (a.estimatedUpside ?? 0))
      .slice(0, 12)

    return NextResponse.json({ opportunities, query })
  } catch (err) {
    return NextResponse.json({ opportunities: [], error: String(err) })
  }
}
