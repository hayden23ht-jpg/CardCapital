
import { NextResponse } from 'next/server'

// TopGuard product data - fetched from ShopHardGuard's public Shopify API
// The browser-side fetch hits shophardguard.com/products/topguard.json directly
// since Shopify product JSON endpoints are public and CORS-enabled for browsers

export async function GET() {
  try {
    // Try to fetch live from Shopify
    const res = await fetch('https://shophardguard.com/products/topguard.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://shophardguard.com/',
      },
      next: { revalidate: 3600 },
    })

    if (res.ok) {
      const data = await res.json()
      const product = data.product ?? {}
      const variants = (product.variants ?? []).map((v: any) => ({
        id: v.id,
        title: v.title,
        option1: v.option1,
        option2: v.option2,
        available: v.available,
        imageId: v.image_id,
      }))
      const images = (product.images ?? []).map((img: any) => ({
        id: img.id,
        src: img.src,
        variantIds: img.variant_ids ?? [],
        alt: img.alt ?? '',
      }))

      return NextResponse.json({
        live: true,
        title: product.title,
        variants,
        images,
        productUrl: 'https://shophardguard.com/products/topguard',
      })
    }
  } catch {}

  // Fallback: return product URL so client can fetch directly
  return NextResponse.json({
    live: false,
    productUrl: 'https://shophardguard.com/products/topguard',
    variants: [],
    images: [],
  })
}
