'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'

interface Card {
  pcId:string|null; name:string; setName:string; imageUrl:string|null
  number:string|null; rarity:string|null; tcgId:string|null
  rawPrice:number|null; psa9Price:number|null; psa10Price:number|null
  score:number; recommendation:string; estimatedUpside:number|null; searchUrl:string
}

const fmt=(n:number|null)=>{if(n==null)return'—';if(n>=1000000)return`$${(n/1000000).toFixed(2)}M`;if(n>=1000)return`$${(n/1000).toFixed(1)}k`;return`$${n.toFixed(2)}`}
const recCls=(r:string)=>r==='BUY'?'green':r==='HOLD'?'cyan':r==='SELL'?'red':'amber'
const scoreColor=(s:number)=>s>=75?'var(--green)':s>=55?'var(--cyan)':s>=40?'var(--amber)':'var(--red)'

export default function SearchPage() {
  const [query,setQuery]=useState('')
  const [results,setResults]=useState<Card[]>([])
  const [loading,setLoading]=useState(false)
  const [searched,setSearched]=useState(false)
  const {toast,showToast}=useToast()

  const search=useCallback(async(q:string)=>{
    if(q.length<2){setResults([]);setSearched(false);return}
    setLoading(true);setSearched(true)
    try{const d=await fetch(`/api/cards/search?q=${encodeURIComponent(q)}`).then(r=>r.json());setResults(d.cards??[])}
    catch{showToast('Search failed','error');setResults([])}
    finally{setLoading(false)}
  },[showToast])

  useEffect(()=>{const t=setTimeout(()=>search(query),420);return()=>clearTimeout(t)},[query,search])

  const addWatch=async(c:Card)=>{
    try{await fetch('/api/watchlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cardName:c.name,setName:c.setName,cardNumber:c.number,imageUrl:c.imageUrl,currentPrice:c.rawPrice})}); showToast(`${c.name} added to watchlist`)}
    catch{showToast('Failed to add','error')}
  }
  const addPort=async(c:Card)=>{
    const p=c.rawPrice??0
    try{await fetch('/api/portfolio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cardName:c.name,setName:c.setName,cardNumber:c.number,imageUrl:c.imageUrl,purchasePrice:p,currentValue:p})}); showToast(`${c.name} added to portfolio`)}
    catch{showToast('Failed to add','error')}
  }

  return (
    <div style={{maxWidth:1280}}>
      {toast&&<Toast message={toast.message} type={toast.type} onDismiss={()=>{}}/>}

      <div className="fade-up" style={{marginBottom:'2rem',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div>
          <div className="section-label" style={{marginBottom:'0.5rem'}}>PriceCharting + Pokémon TCG API</div>
          <h1 style={{fontWeight:900,fontSize:'2.5rem',letterSpacing:'-0.04em',color:'white',lineHeight:1}}>Card Search</h1>
        </div>
        {searched&&!loading&&<div style={{fontFamily:'JetBrains Mono',fontSize:'0.75rem',color:'var(--faint)'}}>{results.length} results</div>}
      </div>

      {/* Search */}
      <div style={{background:'var(--bg2)',border:`1px solid ${query?'rgba(0,212,255,0.35)':'var(--border2)'}`,boxShadow:query?'0 0 0 3px rgba(0,212,255,0.07)':'none',borderRadius:16,padding:'1rem 1.25rem',display:'flex',alignItems:'center',gap:'0.875rem',marginBottom:'1.25rem',transition:'all 0.2s'}}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="rgba(0,212,255,0.5)" strokeWidth="1.5"><circle cx="8" cy="8" r="5.5"/><path d="m13 13 2.5 2.5" strokeLinecap="round"/></svg>
        <input value={query} onChange={e=>setQuery(e.target.value)} autoFocus placeholder="Search any Pokémon card — Charizard, Lugia, Pikachu Illustrator, Shadowless…" style={{flex:1,fontSize:'1rem',fontWeight:500,background:'transparent',border:'none',outline:'none',color:'var(--text)'}}/>
        {loading&&<div style={{width:16,height:16,border:'2px solid rgba(0,212,255,0.15)',borderTopColor:'var(--cyan)',borderRadius:'50%',animation:'spin 0.7s linear infinite',flexShrink:0}}/>}
        {query&&!loading&&<button onClick={()=>{setQuery('');setResults([]);setSearched(false)}} style={{background:'none',border:'none',color:'var(--muted)',fontSize:'1.5rem',lineHeight:1,cursor:'pointer',padding:0,flexShrink:0}}>×</button>}
      </div>

      {/* Quick searches */}
      {!searched&&(
        <div className="fade-up-1" style={{marginBottom:'2rem',display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
          <span style={{fontSize:'0.75rem',color:'var(--faint)',alignSelf:'center',marginRight:'0.25rem'}}>Popular:</span>
          {['Charizard','Lugia','Pikachu Illustrator','Umbreon','Mewtwo','Blastoise','Rayquaza','Gengar','Dragonite'].map(q=>(
            <button key={q} onClick={()=>setQuery(q)} className="btn btn-ghost btn-sm">{q}</button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!searched&&!loading&&(
        <div className="fade-up-2" style={{textAlign:'center',padding:'5rem 2rem'}}>
          <div style={{fontSize:'5rem',opacity:0.06,marginBottom:'1.5rem'}}>⬡</div>
          <div style={{fontWeight:800,fontSize:'1.375rem',color:'white',marginBottom:'0.5rem',letterSpacing:'-0.03em'}}>Search any Pokémon card</div>
          <div style={{color:'var(--muted)',fontSize:'0.9375rem'}}>Live prices · Card images · BUY/HOLD/SELL signals · Grading upside</div>
        </div>
      )}

      {searched&&!loading&&results.length===0&&(
        <div style={{textAlign:'center',padding:'4rem',color:'var(--muted)'}}>
          <div style={{fontSize:'2rem',opacity:0.2,marginBottom:'1rem'}}>🔍</div>
          No results found. Try a different search term.
        </div>
      )}

      {/* Results grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'1rem'}}>
        {results.map((card,i)=>(
          <div key={card.pcId??card.tcgId??i} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden',animationDelay:`${i*0.04}s`,animation:'fadeUp 0.4s ease both',display:'flex',flexDirection:'column'}}>

            {/* Image */}
            <div style={{height:172,background:`linear-gradient(135deg,rgba(0,212,255,0.06),rgba(0,80,200,0.04))`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'}}>
              {card.imageUrl?<Image src={card.imageUrl} alt={card.name} width={108} height={150} style={{objectFit:'contain',filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.7))'}} unoptimized onError={()=>{}}/>:<div style={{fontSize:'3.5rem',opacity:0.1}}>🃏</div>}
              {/* Score badge */}
              <div style={{position:'absolute',top:'0.75rem',right:'0.75rem',background:'rgba(3,5,8,0.92)',backdropFilter:'blur(8px)',border:`1px solid ${scoreColor(card.score)}30`,borderRadius:8,padding:'4px 8px'}}>
                <div style={{fontFamily:'JetBrains Mono',fontSize:'0.75rem',fontWeight:700,color:scoreColor(card.score)}}>{card.score}</div>
              </div>
              {card.rarity&&<div style={{position:'absolute',bottom:'0.75rem',left:'0.75rem',background:'rgba(3,5,8,0.88)',backdropFilter:'blur(8px)',borderRadius:6,padding:'2px 7px',fontFamily:'JetBrains Mono',fontSize:'0.45rem',color:'var(--muted)',letterSpacing:'0.08em',textTransform:'uppercase'}}>{card.rarity}</div>}
            </div>

            {/* Info */}
            <div style={{padding:'1rem',display:'flex',flexDirection:'column',flex:1}}>
              <div style={{fontWeight:700,fontSize:'0.9375rem',letterSpacing:'-0.02em',color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:'0.2rem'}}>{card.name}</div>
              <div style={{fontSize:'0.6875rem',color:'var(--muted)',marginBottom:'0.875rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.setName}{card.number?` · #${card.number}`:''}</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:card.estimatedUpside?'0.375rem':'0.875rem'}}>
                <span className={`pill pill-${recCls(card.recommendation)}`}>{card.recommendation}</span>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:'1.0625rem',color:'white',letterSpacing:'-0.02em'}}>{fmt(card.rawPrice)}</div>
                  {card.psa10Price&&<div style={{fontFamily:'JetBrains Mono',fontSize:'0.625rem',color:'var(--green)',marginTop:1}}>PSA10: {fmt(card.psa10Price)}</div>}
                </div>
              </div>
              {card.estimatedUpside!=null&&card.estimatedUpside>0&&(
                <div style={{fontFamily:'JetBrains Mono',fontSize:'0.625rem',color:'var(--green)',fontWeight:600,marginBottom:'0.875rem'}}>↑ Est. {card.estimatedUpside}% grading upside</div>
              )}
              <div style={{display:'flex',gap:'0.5rem',marginTop:'auto'}}>
                <Link href={`/cards/${card.pcId??card.tcgId}?pcId=${card.pcId??''}&tcgId=${card.tcgId??''}`} className="btn btn-primary btn-sm" style={{flex:1,justifyContent:'center',fontSize:'0.75rem'}}>View</Link>
                <button className="btn btn-ghost btn-sm" onClick={()=>addWatch(card)} style={{flex:1,fontSize:'0.75rem',color:'var(--amber)',borderColor:'rgba(255,167,38,0.2)'}}>◉ Watch</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>addPort(card)} style={{flex:1,fontSize:'0.75rem',color:'var(--green)',borderColor:'rgba(0,255,148,0.2)'}}>+ Own</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
