'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface TCGSet { id:string; name:string; series:string; releaseDate:string; totalCards:number; logoUrl:string }

export default function SetsPage() {
  const [sets, setSets] = useState<TCGSet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/sets').then(r => r.json()).then(d => { setSets(d.sets ?? []); setLoading(false) })
  }, [])

  const filtered = sets.filter(s => !filter || s.name.toLowerCase().includes(filter.toLowerCase()) || s.series.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div style={{maxWidth:1280}}>
      <div className="fade-up" style={{marginBottom:'2rem',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:'JetBrains Mono',fontSize:'0.625rem',color:'var(--cyan)',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:'0.5rem'}}>Pokémon TCG</div>
          <h1 style={{fontWeight:900,fontSize:'2.5rem',letterSpacing:'-0.04em',color:'white',lineHeight:1}}>Set Browser</h1>
        </div>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:'0.625rem 1rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--muted)" strokeWidth="1.5"><circle cx="6" cy="6" r="4"/><path d="m10 10 2 2" strokeLinecap="round"/></svg>
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter sets…" style={{fontSize:'0.875rem',width:160}}/>
        </div>
      </div>
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1rem'}}>
          {[...Array(12)].map((_,i) => <div key={i} className="skeleton" style={{height:120,borderRadius:16}}/>)}
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1rem'}}>
          {filtered.map(set => (
            <Link key={set.id} href={`/sets/${set.id}`} style={{textDecoration:'none'}}>
              <div className="card-hover" style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:16,padding:'1.25rem',cursor:'pointer'}}>
                <div style={{height:48,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'0.875rem'}}>
                  {set.logoUrl ? (
                    <Image src={set.logoUrl} alt={set.name} width={120} height={48} style={{objectFit:'contain',filter:'brightness(0.9)'}} unoptimized/>
                  ) : (
                    <div style={{fontWeight:700,fontSize:'0.875rem',color:'var(--cyan)',textAlign:'center'}}>{set.name}</div>
                  )}
                </div>
                <div style={{fontWeight:600,fontSize:'0.875rem',color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:'0.25rem'}}>{set.name}</div>
                <div style={{fontSize:'0.6875rem',color:'var(--muted)'}}>{set.series} · {set.releaseDate?.split('/')[0]}</div>
                <div style={{fontFamily:'JetBrains Mono',fontSize:'0.625rem',color:'var(--cyan)',marginTop:'0.375rem'}}>{set.totalCards} cards</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
