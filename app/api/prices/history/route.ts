
import { NextRequest, NextResponse } from 'next/server'
import { snapshotGetByCard } from '@/lib/db'

export async function GET(req: NextRequest) {
  const cardPcId = new URL(req.url).searchParams.get('cardPcId') ?? ''
  if (!cardPcId) return NextResponse.json({ snapshots: [] })
  return NextResponse.json({ snapshots: snapshotGetByCard(cardPcId) })
}
