
import { NextRequest, NextResponse } from 'next/server'
import { tcgGetSet } from '@/lib/pokemontcg'
import { scoreCard } from '@/lib/scoring'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const cards = await tcgGetSet(params.id)
  const scored = cards.map(c => ({
    ...c,
    score: scoreCard({
      rawPrice: c.tcgplayerMarket ?? null, psa10Price: null, psa9Price: null,
      gradedPrice: null, volume: 10, rarity: c.rarity, releaseYear: null,
    }).total,
  }))
  return NextResponse.json({ cards: scored })
}
