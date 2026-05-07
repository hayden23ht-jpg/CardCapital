
import { NextResponse } from 'next/server'
import { pcSearch } from '@/lib/pricecharting'
import { tcgSearch } from '@/lib/pokemontcg'
import { scoreCard } from '@/lib/scoring'

const TRENDING_SEARCHES = ['Charizard ex','Umbreon','Lugia silver tempest','Rayquaza','Pikachu VMAX','Mewtwo','Eevee','Gengar']

export async function GET() {
  try {
    const results = await Promise.allSettled(
      TRENDING_SEARCHES.slice(0, 4).map(async q => {
        const [pc, tcg] = await Promise.allSettled([pcSearch(q, 5), tcgSearch(q)])
        const pcCards = pc.status === 'fulfilled' ? pc.value : []
        const tcgCards = tcg.status === 'fulfilled' ? tcg.value : []
        return pcCards.slice(0, 3).map(p => {
          const match = tcgCards.find(t => t.name.toLowerCase().includes(p.name.split(' ')[0].toLowerCase()))
          const s = scoreCard({ rawPrice:p.rawPrice, psa10Price:p.psa10Price, psa9Price:p.psa9Price, gradedPrice:p.gradedPrice, volume:p.volume, rarity:match?.rarity??'', releaseYear:null })
          // Synthetic trend momentum 
          const momentum7d  = -5 + Math.random() * 25
          const momentum30d = -10 + Math.random() * 45
          return {
            pcId:p.id, name:p.name, setName:p.consoleName.replace(/pokemon ?/gi,'').trim(),
            imageUrl:match?.imageUrl??null, rawPrice:p.rawPrice, psa10Price:p.psa10Price,
            volume:p.volume, score:s.total, rec:s.recommendation, upside:s.estimatedUpside,
            momentum7d, momentum30d, searchTerm:q
          }
        })
      })
    )

    const trending = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => (r as PromiseFulfilledResult<any[]>).value)
      .filter(c => c.rawPrice && c.rawPrice > 0)
      .sort((a,b) => b.momentum7d - a.momentum7d)
      .slice(0, 12)

    return NextResponse.json({ trending, updatedAt: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ error: String(err), trending: [] })
  }
}
