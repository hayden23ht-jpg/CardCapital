
import { NextRequest, NextResponse } from 'next/server'
import { portfolioGetAll, portfolioCreate } from '@/lib/db'

export async function GET() {
  const items = portfolioGetAll()
  const totalInvested = items.reduce((sum, i) => sum + i.purchasePrice * i.quantity, 0)
  const totalValue = items.reduce((sum, i) => sum + (i.currentValue ?? i.purchasePrice) * i.quantity, 0)
  return NextResponse.json({ items, totalInvested, totalValue, pnl: totalValue - totalInvested })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.cardName) return NextResponse.json({ error: 'cardName required' }, { status: 400 })
  const item = portfolioCreate({
    cardName: body.cardName,
    setName: body.setName ?? null,
    cardNumber: body.cardNumber ?? null,
    imageUrl: body.imageUrl ?? null,
    condition: body.condition ?? 'Raw',
    gradeCompany: body.gradeCompany ?? null,
    grade: body.grade ?? null,
    quantity: Number(body.quantity) || 1,
    purchasePrice: Number(body.purchasePrice) || 0,
    purchaseDate: body.purchaseDate ?? new Date().toISOString(),
    currentValue: body.currentValue != null ? Number(body.currentValue) : null,
    targetPrice: body.targetPrice != null ? Number(body.targetPrice) : null,
    notes: body.notes ?? null,
    status: body.status ?? 'Holding',
  })
  return NextResponse.json(item)
}
