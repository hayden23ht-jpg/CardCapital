
import { NextRequest, NextResponse } from 'next/server'
import { pcGetById, pcSearch } from '@/lib/pricecharting'
import { tcgGetCard } from '@/lib/pokemontcg'
import { scoreCard } from '@/lib/scoring'
import { snapshotSave } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url)
  const pcId = url.searchParams.get('pcId') ?? ''
  const tcgId = url.searchParams.get('tcgId') ?? ''

  try {
    const [pcRes, tcgRes] = await Promise.allSettled([
      pcId ? pcGetById(pcId) : Promise.resolve(null),
      tcgId ? tcgGetCard(tcgId) : Promise.resolve(null),
    ])

    let pcData = pcRes.status === 'fulfilled' ? pcRes.value : null
    const tcgData = tcgRes.status === 'fulfilled' ? tcgRes.value : null

    // Fallback search if no PC data
    if (!pcData && tcgData) {
      const results = await pcSearch(tcgData.name, 1)
      pcData = results[0] ?? null
    }

    const releaseYear = tcgData?.releaseDate ? parseInt(tcgData.releaseDate.split('/')[0]) : null
    const score = scoreCard({
      rawPrice: pcData?.rawPrice ?? null,
      psa10Price: pcData?.psa10Price ?? null,
      psa9Price: pcData?.psa9Price ?? null,
      gradedPrice: pcData?.gradedPrice ?? null,
      volume: pcData?.volume ?? 0,
      rarity: tcgData?.rarity ?? '',
      releaseYear,
    })

    // Save snapshot for price history
    if (pcData?.id && (pcData.rawPrice || pcData.psa10Price)) {
      try {
        snapshotSave({
          cardPcId: pcData.id,
          rawPrice: pcData.rawPrice,
          psa9Price: pcData.psa9Price,
          psa10Price: pcData.psa10Price,
        })
      } catch { /* non-fatal */ }
    }

    const name = tcgData?.name ?? pcData?.name ?? 'Unknown'
    return NextResponse.json({
      name,
      setName: tcgData?.setName ?? pcData?.consoleName?.replace(/pokemon ?/gi, '').trim() ?? '',
      number: tcgData?.number ?? null,
      rarity: tcgData?.rarity ?? null,
      imageUrl: tcgData?.imageUrl ?? null,
      imageHiRes: tcgData?.imageUrlHiRes ?? null,
      artist: tcgData?.artist ?? null,
      types: tcgData?.types ?? null,
      releaseDate: tcgData?.releaseDate ?? null,
      rawPrice: pcData?.rawPrice ?? null,
      psa9Price: pcData?.psa9Price ?? null,
      psa10Price: pcData?.psa10Price ?? null,
      gradedPrice: pcData?.gradedPrice ?? null,
      tcgplayerMarket: tcgData?.tcgplayerMarket ?? null,
      cardmarketAvg: tcgData?.cardmarketAvg ?? null,
      volume: pcData?.volume ?? 0,
      score,
      pcId: pcData?.id ?? null,
      tcgId: tcgData?.id ?? null,
      searchUrl: pcData?.searchUrl ?? `https://www.pricecharting.com/search-products?q=${encodeURIComponent(name)}&type=prices`,
      links: {
        pricecharting: pcData?.searchUrl ?? `https://www.pricecharting.com/search-products?q=${encodeURIComponent(name)}&type=prices`,
        tcgplayer: `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(name)}`,
        ebay: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(name + ' pokemon card')}&_sacat=183454`,
        cardmarket: `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodeURIComponent(name)}`,
        psapop: `https://www.psacard.com/pop/tcg-cards/pokemon/${encodeURIComponent(name.toLowerCase().replace(/ /g, '-'))}`,
      }
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
