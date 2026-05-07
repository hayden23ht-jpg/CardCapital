'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface ShopVariant {
  id: number
  title: string
  option1: string | null
  option2: string | null
  available: boolean
  imageId: number | null
}

interface ShopImage {
  id: number
  src: string
  variantIds: number[]
  alt: string
}

interface Color {
  id: string
  name: string
  imageUrl: string | null
  hex: string
  border: string
  description: string
  variantId?: number
}

// Fallback colors matching known TopGuard product line
const FALLBACK_COLORS: Color[] = [
  { id:'clear',   name:'Crystal Clear',  imageUrl:null, hex:'rgba(220,235,255,0.22)', border:'rgba(180,210,240,0.55)', description:'Classic transparent — card is the star' },
  { id:'black',   name:'Matte Black',    imageUrl:null, hex:'rgba(18,18,22,0.93)',   border:'rgba(40,40,50,0.95)',    description:'Sleek, premium stealth look' },
  { id:'white',   name:'Pearl White',    imageUrl:null, hex:'rgba(242,240,236,0.92)', border:'rgba(200,195,185,0.85)', description:'Clean gallery aesthetic' },
  { id:'gold',    name:'Gold Holo',      imageUrl:null, hex:'rgba(201,168,76,0.88)', border:'rgba(180,140,50,0.92)',  description:'Luxury collector edition' },
  { id:'red',     name:'Crimson',        imageUrl:null, hex:'rgba(175,28,38,0.90)',  border:'rgba(145,20,28,0.95)',   description:'Bold, eye-catching display' },
  { id:'blue',    name:'Sapphire',       imageUrl:null, hex:'rgba(28,75,175,0.90)', border:'rgba(20,55,145,0.95)',   description:'Cool, professional tone' },
  { id:'green',   name:'Emerald',        imageUrl:null, hex:'rgba(22,110,55,0.90)', border:'rgba(16,85,42,0.95)',    description:'Natural, earthy elegance' },
  { id:'purple',  name:'Royal Purple',   imageUrl:null, hex:'rgba(95,38,155,0.90)', border:'rgba(75,28,125,0.95)',   description:'Regal, distinguished finish' },
  { id:'galaxy',  name:'Galaxy Holo',    imageUrl:null, hex:'rgba(15,8,45,0.92)',   border:'rgba(120,80,200,0.6)',   description:'Signature Galaxy Holo sparkle finish' },
  { id:'rose',    name:'Rose Quartz',    imageUrl:null, hex:'rgba(205,112,155,0.88)', border:'rgba(175,80,125,0.92)', description:'Soft, elegant accent' },
  { id:'teal',    name:'Teal Wave',      imageUrl:null, hex:'rgba(18,140,132,0.90)', border:'rgba(14,110,102,0.95)', description:'Modern, fresh collector style' },
  { id:'silver',  name:'Silver Storm',   imageUrl:null, hex:'rgba(155,160,170,0.90)', border:'rgba(125,130,140,0.95)', description:'Metallic chrome finish' },
]

function GalaxyOverlay() {
  return (
    <div style={{
      position:'absolute', inset:0, borderRadius:'inherit', overflow:'hidden', pointerEvents:'none',
      background:'linear-gradient(135deg, rgba(120,80,200,0.4) 0%, rgba(200,50,150,0.3) 25%, rgba(50,150,220,0.35) 50%, rgba(80,200,120,0.3) 75%, rgba(200,150,50,0.4) 100%)',
      mixBlendMode:'screen',
    }}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.15) 0%, transparent 50%)'}}/>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 70% 60%, rgba(150,100,255,0.2) 0%, transparent 50%)'}}/>
    </div>
  )
}

function TopGuardContent() {
  const sp = useSearchParams()
  const cardName = sp.get('name') ?? ''
  const cardImg  = sp.get('img') ?? ''

  const [colors, setColors]           = useState<Color[]>(FALLBACK_COLORS)
  const [shopImages, setShopImages]   = useState<ShopImage[]>([])
  const [selected, setSelected]       = useState<Color>(FALLBACK_COLORS[0])
  const [hovered, setHovered]         = useState<Color | null>(null)
  const [rating, setRating]           = useState<Record<string, number>>({})
  const [loadingShop, setLoadingShop] = useState(true)
  const [pickedCard, setPickedCard]   = useState<{name:string;img:string}|null>(
    cardImg ? { name: cardName, img: cardImg } : null
  )
  const [searchQ, setSearchQ]         = useState(cardName)
  const [searchRes, setSearchRes]     = useState<any[]>([])
  const [searching, setSearching]     = useState(false)

  // Fetch live product data from Shopify (client-side, public endpoint)
  useEffect(() => {
    const fetchShopify = async () => {
      try {
        // Shopify product JSON is publicly accessible from the browser
        const res = await fetch('https://shophardguard.com/products/topguard.json', {
          headers: { 'Accept': 'application/json' },
        })
        if (!res.ok) throw new Error('blocked')
        const data = await res.json()
        const product = data.product ?? {}
        const images: ShopImage[] = (product.images ?? []).map((img: any) => ({
          id: img.id,
          src: img.src,
          variantIds: img.variant_ids ?? [],
          alt: img.alt ?? '',
        }))
        const variants: ShopVariant[] = (product.variants ?? [])

        setShopImages(images)

        // Build colors from real variants + images
        if (variants.length > 0) {
          const built: Color[] = variants.slice(0, 16).map((v, i) => {
            const img = images.find(im => im.variantIds.includes(v.id)) ?? images[i] ?? null
            const fallback = FALLBACK_COLORS[i % FALLBACK_COLORS.length]
            return {
              id: String(v.id),
              name: v.title || v.option1 || `Color ${i+1}`,
              imageUrl: img?.src ?? null,
              hex: fallback.hex,
              border: fallback.border,
              description: `TopGuard ${v.option1 ?? v.title} — Premium card protection`,
              variantId: v.id,
            }
          })
          setColors(built)
          setSelected(built[0])
        }
      } catch {
        // Shopify blocked server-side but may work client-side; keep fallback colors
      } finally {
        setLoadingShop(false)
      }
    }
    fetchShopify()
  }, [])

  const searchCards = async () => {
    if (searchQ.length < 2) return
    setSearching(true)
    const d = await fetch(`/api/cards/search?q=${encodeURIComponent(searchQ)}`).then(r => r.json()).catch(() => ({ cards: [] }))
    setSearchRes((d.cards ?? []).filter((c: any) => c.imageUrl).slice(0, 12))
    setSearching(false)
  }

  const activeColor = hovered ?? selected
  const isGalaxy = activeColor.id.toLowerCase().includes('galaxy') ||
                   activeColor.name.toLowerCase().includes('galaxy') ||
                   activeColor.name.toLowerCase().includes('holo')

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="fu" style={{ marginBottom: '2rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.5rem' }}>
          <Link href="/search" style={{ fontSize:'12px', color:'var(--t4)', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 10L4 6l4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back
          </Link>
          <span style={{ color:'var(--bdr2)', fontSize:'12px' }}>/</span>
          <span style={{ fontSize:'13px', color:'var(--t3)' }}>TopGuard Try-On</span>
        </div>
        <h1 className="display" style={{ fontSize:'3.5rem', color:'var(--t1)', lineHeight:0.9, letterSpacing:'0.04em', marginBottom:'0.5rem' }}>TOPGUARD TRY-ON</h1>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <p style={{ color:'var(--t3)', fontSize:'14px' }}>
            See which TopGuard color looks best on your card. Powered by&nbsp;
            <a href="https://shophardguard.com/products/topguard" target="_blank" rel="noopener noreferrer" style={{ color:'var(--gold)', textDecoration:'none', fontWeight:600 }}>ShopHardGuard.com</a>
          </p>
          {loadingShop && (
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:12, height:12, border:'2px solid rgba(201,168,76,0.15)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
              <span className="mono" style={{ fontSize:'10px', color:'var(--t4)', letterSpacing:'0.08em' }}>LOADING LIVE PRODUCT DATA</span>
            </div>
          )}
          {!loadingShop && shopImages.length > 0 && (
            <span className="mono" style={{ fontSize:'10px', color:'var(--green)', letterSpacing:'0.08em' }}>✓ LIVE SHOPIFY DATA</span>
          )}
        </div>
      </div>

      {/* Card picker */}
      {!pickedCard && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--bdrg)', borderRadius:'var(--radius)', padding:'1.5rem', marginBottom:'1.5rem' }}>
          <div className="display" style={{ fontSize:'1.125rem', letterSpacing:'0.04em', marginBottom:'1rem' }}>PICK A CARD TO TRY ON</div>
          <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem' }}>
            <input className="inp" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchCards()}
              placeholder="Search a Pokémon card…" style={{ flex:1 }} autoFocus/>
            <button className="btn btn-gold" onClick={searchCards} style={{ borderRadius:10, padding:'10px 20px' }}>
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>
          {searchRes.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'0.75rem', maxHeight:280, overflowY:'auto' }}>
              {searchRes.map((card: any) => (
                <div key={card.pcId ?? card.tcgId}
                  onClick={() => setPickedCard({ name: card.name, img: card.imageUrl })}
                  style={{ cursor:'pointer', borderRadius:10, overflow:'hidden', border:'1px solid var(--bdr)', background:'var(--bg3)', transition:'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bdrg)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bdr)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                  <Image src={card.imageUrl} alt={card.name} width={100} height={139} style={{ width:'100%', height:'auto', objectFit:'contain', display:'block' }} unoptimized/>
                  <div style={{ padding:'5px 6px', fontSize:'10px', fontWeight:600, color:'var(--t2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{card.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pickedCard && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 400px', gap:'1.5rem', alignItems:'start' }}>

          {/* Left: Try-on viewer */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:'var(--radius)', padding:'2rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
              <div>
                <div className="display" style={{ fontSize:'1.5rem', letterSpacing:'0.04em', lineHeight:1 }}>{pickedCard.name}</div>
                <div style={{ marginTop:'0.25rem', fontSize:'13px', color:'var(--t3)' }}>
                  Viewing: <span style={{ color:'var(--gold)', fontWeight:600 }}>{activeColor.name}</span>
                </div>
              </div>
              <button onClick={() => setPickedCard(null)} className="btn btn-ghost btn-sm">Change Card</button>
            </div>

            {/* Visual try-on */}
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:440, position:'relative', flexDirection:'column', gap:'1.5rem' }}>

              {/* If we have a real product image, show it beside the card */}
              <div style={{ display:'flex', gap:'3rem', alignItems:'center', justifyContent:'center' }}>

                {/* The card in the TopGuard sleeve */}
                <div style={{ position:'relative', width:220, height:310 }}>
                  {/* Sleeve body */}
                  <div style={{
                    position:'absolute', inset:0,
                    borderRadius:16,
                    background: activeColor.hex,
                    border: `3px solid ${activeColor.border}`,
                    boxShadow: `0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px ${activeColor.border}`,
                  }}>
                    {/* Galaxy shimmer */}
                    {isGalaxy && <GalaxyOverlay/>}
                    {/* Corner grips */}
                    {['0 0','0 auto','auto 0','auto auto'].map((pos, i) => (
                      <div key={i} style={{
                        position:'absolute',
                        top: i < 2 ? 4 : 'auto', bottom: i >= 2 ? 4 : 'auto',
                        left: i % 2 === 0 ? 4 : 'auto', right: i % 2 === 1 ? 4 : 'auto',
                        width:20, height:20,
                        borderRadius: i === 0 ? '4px 0 0 0' : i === 1 ? '0 4px 0 0' : i === 2 ? '0 0 0 4px' : '0 0 4px 0',
                        background: `rgba(0,0,0,0.25)`,
                        border: `1.5px solid rgba(255,255,255,0.15)`,
                      }}/>
                    ))}
                    {/* Card window */}
                    <div style={{
                      position:'absolute',
                      top:'8%', left:'7%', right:'7%', bottom:'8%',
                      borderRadius:9,
                      overflow:'hidden',
                      background:'rgba(0,0,0,0.08)',
                    }}>
                      {pickedCard.img ? (
                        <Image src={pickedCard.img} alt={pickedCard.name} fill
                          style={{ objectFit:'contain' }} unoptimized/>
                      ) : (
                        <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', opacity:0.2 }}>🃏</div>
                      )}
                    </div>
                    {/* Gloss */}
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'42%', background:'linear-gradient(180deg,rgba(255,255,255,0.09) 0%,transparent 100%)', borderRadius:'14px 14px 0 0', pointerEvents:'none' }}/>
                    {/* Brand label */}
                    <div style={{ position:'absolute', bottom:6, left:0, right:0, textAlign:'center' }}>
                      <span className="mono" style={{ fontSize:'8px', letterSpacing:'0.22em', color:`rgba(255,255,255,${activeColor.id==='clear'?'0.3':'0.4'})`, textTransform:'uppercase' }}>
                        TopGuard · HardGuard™
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real product image from Shopify (if available) */}
                {activeColor.imageUrl && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem' }}>
                    <div className="mono" style={{ fontSize:'9px', color:'var(--t4)', letterSpacing:'0.12em' }}>ACTUAL PRODUCT</div>
                    <div style={{ width:160, height:160, borderRadius:12, overflow:'hidden', border:'1px solid var(--bdrg)', background:'var(--bg3)', position:'relative' }}>
                      <img src={activeColor.imageUrl} alt={activeColor.name}
                        style={{ width:'100%', height:'100%', objectFit:'contain' }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}/>
                    </div>
                    <a href="https://shophardguard.com/products/topguard" target="_blank" rel="noopener noreferrer"
                      className="mono" style={{ fontSize:'10px', color:'var(--gold)', textDecoration:'none', letterSpacing:'0.08em' }}>
                      VIEW ON SITE →
                    </a>
                  </div>
                )}
              </div>

              {/* Ground shadow */}
              <div style={{ width:180, height:18, background:activeColor.hex, borderRadius:'50%', filter:'blur(16px)', opacity:0.25 }}/>
            </div>

            {/* Color info + rating */}
            <div style={{ marginTop:'1rem', padding:'1rem', background:'var(--bg3)', borderRadius:12, border:'1px solid var(--bdr)', display:'flex', alignItems:'center', gap:'1rem' }}>
              <div style={{ width:36, height:36, borderRadius:9, background:activeColor.hex, border:`2px solid ${activeColor.border}`, flexShrink:0, boxShadow:isGalaxy?'0 0 16px rgba(120,80,200,0.5)':'none' }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:'14px', color:'var(--t1)', marginBottom:2 }}>{activeColor.name}</div>
                <div style={{ fontSize:'12px', color:'var(--t3)' }}>{activeColor.description}</div>
              </div>
              <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                {[1,2,3,4,5].map(star => (
                  <span key={star} onClick={() => setRating(r => ({ ...r, [activeColor.id]: star }))}
                    style={{ fontSize:'18px', cursor:'pointer', color:(rating[activeColor.id]??0)>=star?'var(--gold)':'var(--bdr2)', transition:'color 0.1s', lineHeight:1 }}>★</span>
                ))}
              </div>
            </div>

            <a href="https://shophardguard.com/products/topguard" target="_blank" rel="noopener noreferrer"
              className="btn btn-gold"
              style={{ width:'100%', marginTop:'1rem', borderRadius:10, padding:'0.875rem', fontSize:'14px', justifyContent:'center', textDecoration:'none' }}>
              Shop TopGuard on ShopHardGuard.com →
            </a>
          </div>

          {/* Right: color selector */}
          <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
            <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:'var(--radius)', padding:'1.25rem' }}>
              <div className="display" style={{ fontSize:'1.125rem', letterSpacing:'0.04em', marginBottom:'0.25rem' }}>
                {loadingShop ? 'LOADING COLORS…' : shopImages.length > 0 ? 'TOPGUARD COLORS (LIVE)' : 'TOPGUARD COLORS'}
              </div>
              <div className="mono" style={{ fontSize:'9px', color:'var(--t4)', letterSpacing:'0.1em', marginBottom:'1rem' }}>HOVER TO PREVIEW · CLICK TO SELECT · ★ TO RATE</div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.5rem' }}>
                {colors.map(c => {
                  const isSel = selected.id === c.id
                  const rated = rating[c.id]
                  const isGal = c.name.toLowerCase().includes('galaxy') || c.name.toLowerCase().includes('holo')
                  return (
                    <div key={c.id}
                      onClick={() => setSelected(c)}
                      onMouseEnter={() => setHovered(c)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        padding:'0.625rem', borderRadius:10, cursor:'pointer',
                        border:`1px solid ${isSel ? c.border : 'var(--bdr)'}`,
                        background: isSel ? `${c.hex}25` : 'var(--bg3)',
                        transition:'all 0.15s',
                        outline: isSel ? `1px solid ${c.border}` : 'none',
                        outlineOffset: 1,
                      }}>
                      {/* Color swatch or real product image */}
                      <div style={{ width:'100%', aspectRatio:'1', borderRadius:8, overflow:'hidden', marginBottom:'0.5rem', position:'relative', border:`2px solid ${c.border}`, boxShadow:isSel?`0 0 16px ${c.hex}60`:'none', transition:'box-shadow 0.2s' }}>
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt={c.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; (e.currentTarget.parentElement as HTMLElement).style.background=c.hex }}/>
                        ) : (
                          <div style={{ width:'100%', height:'100%', background:c.hex, position:'relative' }}>
                            {isGal && <GalaxyOverlay/>}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:'11px', fontWeight:isSel?600:500, color:isSel?'var(--t1)':'var(--t3)', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                      {rated && <div style={{ textAlign:'center', fontSize:'11px', color:'var(--gold)', marginTop:2 }}>{'★'.repeat(rated)}</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Your ratings */}
            {Object.keys(rating).length > 0 && (
              <div style={{ background:'var(--bg2)', border:'1px solid var(--bdrg)', borderRadius:'var(--radius)', padding:'1.25rem' }}>
                <div className="display" style={{ fontSize:'1.0625rem', letterSpacing:'0.04em', marginBottom:'0.875rem' }}>YOUR RATINGS</div>
                {Object.entries(rating).sort((a, b) => b[1] - a[1]).map(([id, stars]) => {
                  const col = colors.find(c => c.id === id)
                  if (!col) return null
                  return (
                    <div key={id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'7px 8px', borderRadius:8, background:selected.id===id?'rgba(201,168,76,0.06)':'transparent', marginBottom:3 }}>
                      <div style={{ width:22, height:22, borderRadius:6, background:col.hex, border:`1.5px solid ${col.border}`, flexShrink:0, overflow:'hidden', position:'relative' }}>
                        {col.imageUrl && <img src={col.imageUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>}
                      </div>
                      <span style={{ fontSize:'13px', fontWeight:500, flex:1, color:'var(--t2)' }}>{col.name}</span>
                      <span style={{ color:'var(--gold)', fontSize:'13px' }}>{'★'.repeat(stars)}</span>
                    </div>
                  )
                })}
                <div className="mono" style={{ fontSize:'9px', color:'var(--t4)', marginTop:'0.625rem', letterSpacing:'0.08em' }}>Save screenshot to share with friends</div>
              </div>
            )}

            {/* Product info */}
            <div style={{ background:'var(--bg2)', border:'1px solid var(--bdr)', borderRadius:'var(--radius)', padding:'1.25rem' }}>
              <div className="display" style={{ fontSize:'1.0625rem', letterSpacing:'0.04em', marginBottom:'0.75rem' }}>ABOUT TOPGUARD</div>
              <div style={{ fontSize:'13px', color:'var(--t3)', lineHeight:1.6, marginBottom:'0.875rem' }}>
                Premium top loader protector by HardGuard™. Galaxy Holo & Gemstone finishes. Snap-Lock fit for standard top loaders. Includes top loader.
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'5px', marginBottom:'1rem' }}>
                {['Snap-Lock Fit — No movement inside','Impact & Scratch Resistant Shell','Premium Galaxy Holo & Gemstone Finishes','Standard Top Loader Included','PSA Submission Safe'].map(f => (
                  <div key={f} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'var(--t2)' }}>
                    <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--gold)', flexShrink:0 }}/>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                <a href="https://shophardguard.com/products/topguard" target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-sm" style={{ borderRadius:8, justifyContent:'center', textDecoration:'none' }}>Shop TopGuard</a>
                <a href="https://shophardguard.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ borderRadius:8, justifyContent:'center', textDecoration:'none' }}>All Products</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TopGuardPage() {
  return (
    <Suspense fallback={<div style={{ padding:'2rem', color:'var(--t4)' }}>Loading…</div>}>
      <TopGuardContent />
    </Suspense>
  )
}
