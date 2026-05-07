
import { NextRequest, NextResponse } from 'next/server'
import { portfolioUpdate, portfolioDelete } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const item = portfolioUpdate(params.id, body)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  portfolioDelete(params.id)
  return NextResponse.json({ ok: true })
}
