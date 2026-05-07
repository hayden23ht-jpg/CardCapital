
import { NextRequest, NextResponse } from 'next/server'
import { watchlistUpdate, watchlistDelete } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const item = watchlistUpdate(params.id, body)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  watchlistDelete(params.id)
  return NextResponse.json({ ok: true })
}
