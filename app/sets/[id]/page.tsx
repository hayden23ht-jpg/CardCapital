'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import CardImage from '@/components/CardImage'
import { fmt } from '@/lib/utils'

interface SetCard { id:string; name:string; number:string; rarity:string; imageUrl:string; setName:string; tcgplayerMarket:number|null; score:number }

export default function SetDetailPage() {
  const { id } = useParams() as { id:string }
  const [cards, setCards] = useState<SetCard[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'number'|'score'|'price'>('number')

  useEffect(() => {
    fetch(`/api/sets/${id}`).then(r => r.json()).then(d => { setCards(d.cards ?? []); setLoading(false) })
  }, [id])

  const sorted = [...cards].sort((a,b) => {
    if (sort==='score') return b.score - a.score
    if (sort==='price') return (b.tcgplayerMarket??0)-(a.tcgplayerMarket??0)
    return parseInt(a.number)||0 - (parseInt(b.number)||0)
  })

  return (
    <div style={{maxWidth:1280}}>
      <Link href="/sets" style={{color:'var(--muted)',textDecoration:'none',fontSize:'0.8125rem',display:'inline-flex',alignItems:'center',gap:'0.375rem',marginBottom:'1.5rem',opacity:0.7}}>← All Sets</Link>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <h1 style={{fontWeight:900,fontSize:'2rem',letterSpacing:'-0.04em',color:'white'}}>{cards[0]?.setName ?? id}</h1>
        <div style={{display:'flex',gap:'0.375rem'}}>
          {(['number','score','price'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)} style={{padding:'0.375rem 0.875rem',borderRadius:8,fontSize:'0.8125rem',fontWeight:500,background:sort===s?'var(--cyan-dim, rgba(0,229,255,0.12))':'rgba(255,255,255,0.04)',border:`1px solid ${sort===s?'rgba(0,229,255,0.3)':'var(--border)'}`,color:sort===s?'var(--cyan)':'var(--muted)',cursor:'pointer',transition:'all 0.15s'}}>
              {s==='number'?'#':s==='score'?'Score':'Price'}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'0.875rem'}}>
          {[...Array(20)].map((_,i) => <div key={i} className="skeleton" style={{height:220,borderRadius:12}}/>)}
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'0.875rem'}}>
          {sorted.map(card => (
            <Link key={card.id} href={`/cards/${card.id}?tcgId=${card.id}`} style={{textDecoration:'none'}}>
              <div className="card-hover" style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
                <div style={{height:140,background:'linear-gradient(135deg,rgba(0,229,255,0.05),rgba(0,80,200,0.04))',display:'flex',alignItems:'center',justifyContent:'center',padding:'0.75rem'}}>
                  <CardImage src={card.imageUrl} alt={card.name} width={88} height={120}/>
                </div>
                <div style={{padding:'0.625rem'}}>
                  <div style={{fontWeight:600,fontSize:'0.8125rem',color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:'0.125rem'}}>{card.name}</div>
                  <div style={{fontSize:'0.5625rem',color:'var(--muted)'}}>#{card.number} · {card.rarity?.split(' ').slice(-1)[0]}</div>
                  {card.tcgplayerMarket && <div style={{fontFamily:'JetBrains Mono',fontSize:'0.75rem',color:'var(--cyan)',marginTop:'0.25rem',fontWeight:700}}>{fmt(card.tcgplayerMarket)}</div>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
