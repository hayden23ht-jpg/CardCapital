
import { NextRequest, NextResponse } from 'next/server'
import { pcSearch } from '@/lib/pricecharting'
import { tcgSearch } from '@/lib/pokemontcg'
import { scoreCard } from '@/lib/scoring'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json({ cards: [] })

  try {
    const [pcResults, tcgResults] = await Promise.allSettled([
      pcSearch(q, 20),
      tcgSearch(q),
    ])

    const pc = pcResults.status === 'fulfilled' ? pcResults.value : []
    const tcg = tcgResults.status === 'fulfilled' ? tcgResults.value : []

    // Merge — match TCG image to PC pricing by name
    const cards = pc.map(p => {
      const match = tcg.find(t =>
        t.name.toLowerCase() === p.name.split(' - ')[0].toLowerCase() ||
        t.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
      )
      const score = scoreCard({
        rawPrice: p.rawPrice, psa10Price: p.psa10Price,
        psa9Price: p.psa9Price, gradedPrice: p.gradedPrice,
        volume: p.volume, rarity: match?.rarity ?? '',
        releaseYear: match?.releaseDate ? parseInt(match.releaseDate.split('/')[0]) : null,
      })
      return {
        pcId: p.id, name: p.name, setName: p.consoleName.replace(/pokemon ?/gi, '').trim(),
        imageUrl: match?.imageUrl ?? null, imageHiRes: match?.imageUrlHiRes ?? null,
        tcgId: match?.id ?? null, number: match?.number ?? null, rarity: match?.rarity ?? null,
        rawPrice: p.rawPrice, psa9Price: p.psa9Price, psa10Price: p.psa10Price,
        gradedPrice: p.gradedPrice, volume: p.volume,
        score: score.total, recommendation: score.recommendation,
        estimatedUpside: score.estimatedUpside, searchUrl: p.searchUrl,
      }
    })

    // Also include TCG-only results with no PC match
    const unmatched = tcg.filter(t => !pc.some(p =>
      p.name.toLowerCase().includes(t.name.toLowerCase().split(' ')[0])
    )).slice(0, 5).map(t => ({
      pcId: null, name: t.name, setName: t.setName, imageUrl: t.imageUrl,
      imageHiRes: t.imageUrlHiRes, tcgId: t.id, number: t.number, rarity: t.rarity,
      rawPrice: t.tcgplayerMarket ?? null, psa9Price: null, psa10Price: null,
      gradedPrice: null, volume: 0,
      score: 40, recommendation: 'WATCH', estimatedUpside: null,
      searchUrl: `https://www.pricecharting.com/search-products?q=${encodeURIComponent(t.name)}&type=prices`,
    }))

    return NextResponse.json({ cards: [...cards, ...unmatched], total: cards.length + unmatched.length })
  } catch (err) {
    return NextResponse.json({ cards: [], error: String(err) })
  }
}
