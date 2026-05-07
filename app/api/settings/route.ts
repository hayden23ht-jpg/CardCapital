
import { NextRequest, NextResponse } from 'next/server'
import { settingsGet, settingsUpdate } from '@/lib/db'

export async function GET() {
  const settings = settingsGet()
  return NextResponse.json({
    ...settings,
    apiStatus: {
      pricecharting: !!process.env.PRICECHARTING_API_TOKEN,
      pokemontcg: true,
      ebay: !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
    }
  })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const settings = settingsUpdate(body)
  return NextResponse.json(settings)
}
