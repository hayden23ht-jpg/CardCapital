
import { NextResponse } from 'next/server'
import { tcgGetSets } from '@/lib/pokemontcg'

export async function GET() {
  const sets = await tcgGetSets()
  return NextResponse.json({ sets })
}
