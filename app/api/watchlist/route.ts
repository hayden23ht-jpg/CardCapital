
import { NextRequest, NextResponse } from 'next/server'
import { watchlistGetAll, watchlistCreate } from '@/lib/db'

export async function GET() {
  return NextResponse.json({ items: watchlistGetAll() })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.cardName) return NextResponse.json({ error: 'cardName required' }, { status: 400 })
  const item = watchlistCreate({
    cardName: body.cardName,
    setName: body.setName ?? null,
    cardNumber: body.cardNumber ?? null,
    imageUrl: body.imageUrl ?? null,
    targetBuyPrice: body.targetBuyPrice != null ? Number(body.targetBuyPrice) : null,
    targetSellPrice: body.targetSellPrice != null ? Number(body.targetSellPrice) : null,
    currentPrice: body.currentPrice != null ? Number(body.currentPrice) : null,
    notes: body.notes ?? null,
    alertEnabled: body.alertEnabled ?? true,
  })
  return NextResponse.json(item)
}
