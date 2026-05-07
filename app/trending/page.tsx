'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const fmt = (n:number|null) => { if(n==null)return'—'; if(n>=1000)return`$${(n/1000).toFixed(1)}k`; return`$${n.toFixed(2)}` }
const scoreColor = (s:number) => s>=75?'var(--emerald)':s>=55?'var(--gold)':s>=40?'var(--blue)':'var(--red)'

export default function TrendingPage() {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try { const d = await fetch('/api/trending').then(r=>r.json()); setCards(d.trending??[]) }
    catch {}
    finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  const top = cards.filter(c=>c.momentum7d>0).slice(0,3)
  const rising = cards.filter(c=>c.momentum30d>10)
  const watchCards = cards.filter(c=>c.momentum7d<0&&c.momentum30d>5)

  return (
    <div style={{maxWidth:1280}}>
      <div className="fade-up" style={{marginBottom:'2rem',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div>
          <div className="label" style={{marginBottom:'0.5rem'}}>7-Day Momentum Analysis</div>
          <h1 className="display" style={{fontSize:'2.875rem',color:'white',lineHeight:1}}>Trending Cards</h1>
          <p style={{color:'var(--ink3)',fontSize:'0.9375rem',marginTop:'0.375rem'}}>Cards gaining momentum this week — and what could follow next</p>
        </div>
        <button onClick={load} className="btn btn-ghost btn-sm" style={{color:'var(--red)',borderColor:'rgba(239,68,68,0.25)'}}>
          {loading?'Loading…':'↻ Refresh'}
        </button>
      </div>

      {/* Top 3 hero cards */}
      <div className="fade-up-1" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginBottom:'2rem'}}>
        {loading?[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:280,borderRadius:'var(--r-lg)'}}/>)
        :top.map((card,i)=>(
          <Link key={card.pcId} href={`/cards/${card.pcId}?pcId=${card.pcId}`}>
            <div className="card-lift" style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',overflow:'hidden',height:'100%',cursor:'pointer'}}>
              <div style={{height:180,background:'linear-gradient(135deg,rgba(239,68,68,0.08),rgba(212,168,67,0.05))',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                {card.imageUrl?<Image src={card.imageUrl} alt={card.name} width={108} height={150} style={{objectFit:'contain',filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.7))'}} unoptimized/>:<div style={{fontSize:'3.5rem',opacity:0.1}}>🃏</div>}
                <div style={{position:'absolute',top:'0.75rem',left:'0.75rem',background:'rgba(8,10,15,0.9)',backdropFilter:'blur(8px)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:'3px 8px',fontFamily:'DM Mono,monospace',fontSize:'0.75rem',fontWeight:700,color:'var(--red)'}}>#{i+1} TRENDING</div>
                <div style={{position:'absolute',top:'0.75rem',right:'0.75rem',background:'rgba(8,10,15,0.9)',border:`1px solid ${scoreColor(card.score)}30`,borderRadius:8,padding:'3px 8px',fontFamily:'DM Mono,monospace',fontSize:'0.75rem',fontWeight:700,color:scoreColor(card.score)}}>{card.score}</div>
              </div>
              <div style={{padding:'1rem'}}>
                <div style={{fontWeight:700,fontSize:'0.9375rem',letterSpacing:'-0.02em',color:'white',marginBottom:'0.25rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.name}</div>
                <div style={{fontSize:'0.6875rem',color:'var(--ink3)',marginBottom:'0.875rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.setName}</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div className="label" style={{marginBottom:'0.25rem'}}>7d momentum</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:'1.125rem',fontWeight:700,color:card.momentum7d>=0?'var(--emerald)':'var(--red)'}}>
                      {card.momentum7d>=0?'▲':'▼'} {Math.abs(card.momentum7d).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className="label" style={{marginBottom:'0.25rem'}}>Raw price</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:'1.125rem',fontWeight:700,color:'var(--gold)'}}>{fmt(card.rawPrice)}</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>

        {/* Rising 30d */}
        <div style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
          <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid var(--line)'}}>
            <div className="label">📈 Rising Hard — 30d Gainers</div>
          </div>
          <table className="tbl">
            <thead><tr><th></th><th>Card</th><th style={{textAlign:'right'}}>7d</th><th style={{textAlign:'right'}}>30d</th><th style={{textAlign:'right'}}>Price</th></tr></thead>
            <tbody>
              {loading?[...Array(5)].map((_,i)=><tr key={i}><td colSpan={5}><div className="skeleton" style={{height:16,borderRadius:4}}/></td></tr>)
              :rising.slice(0,6).map((card,i)=>(
                <tr key={card.pcId} onClick={()=>window.location.href=`/cards/${card.pcId}?pcId=${card.pcId}`}>
                  <td style={{width:44}}>
                    <div style={{width:32,height:44,borderRadius:5,overflow:'hidden',background:'rgba(255,255,255,0.05)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {card.imageUrl?<Image src={card.imageUrl} alt={card.name} fill style={{objectFit:'cover'}} sizes="32px" unoptimized/>:<span style={{fontSize:'1rem',opacity:0.2}}>🃏</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{fontWeight:600,fontSize:'0.8125rem',color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>{card.name}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.5rem',color:'var(--ink3)'}}>{card.setName?.slice(0,20)}</div>
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.8125rem',fontWeight:600,color:card.momentum7d>=0?'var(--emerald)':'var(--red)'}}>{card.momentum7d>=0?'+':''}{card.momentum7d.toFixed(1)}%</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.875rem',fontWeight:700,color:'var(--emerald)'}}>+{card.momentum30d.toFixed(1)}%</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.875rem',color:'var(--gold)',fontWeight:600}}>{fmt(card.rawPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards that could follow */}
        <div style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
          <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid var(--line)'}}>
            <div className="label">🎯 Could Follow the Trend</div>
            <div style={{fontSize:'0.75rem',color:'var(--ink3)',marginTop:'0.25rem'}}>Strong 30d momentum, 7d pullback — watch for entry</div>
          </div>
          <table className="tbl">
            <thead><tr><th></th><th>Card</th><th style={{textAlign:'right'}}>7d</th><th style={{textAlign:'right'}}>30d</th><th>Signal</th></tr></thead>
            <tbody>
              {loading?[...Array(5)].map((_,i)=><tr key={i}><td colSpan={5}><div className="skeleton" style={{height:16,borderRadius:4}}/></td></tr>)
              :watchCards.slice(0,6).map((card)=>(
                <tr key={card.pcId} onClick={()=>window.location.href=`/cards/${card.pcId}?pcId=${card.pcId}`}>
                  <td style={{width:44}}>
                    <div style={{width:32,height:44,borderRadius:5,overflow:'hidden',background:'rgba(255,255,255,0.05)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {card.imageUrl?<Image src={card.imageUrl} alt={card.name} fill style={{objectFit:'cover'}} sizes="32px" unoptimized/>:<span style={{fontSize:'1rem',opacity:0.2}}>🃏</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{fontWeight:600,fontSize:'0.8125rem',color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>{card.name}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.5rem',color:'var(--ink3)'}}>{card.setName?.slice(0,20)}</div>
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.8125rem',color:'var(--red)',fontWeight:600}}>{card.momentum7d.toFixed(1)}%</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.875rem',fontWeight:700,color:'var(--emerald)'}}>+{card.momentum30d.toFixed(1)}%</td>
                  <td><span className="pill pill-watch">WATCH</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
