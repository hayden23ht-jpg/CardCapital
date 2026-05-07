'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'

interface Opp { pcId:string; name:string; setName:string; imageUrl:string|null; rawPrice:number; psa10Price:number; score:number; recommendation:string; estimatedUpside:number|null; netProfit:number|null; buyUnder:number|null; reason:string; searchUrl:string }

const fmt=(n:number|null)=>{if(n==null)return'—';if(Math.abs(n)>=1000000)return`$${(n/1000000).toFixed(2)}M`;if(Math.abs(n)>=1000)return`$${(n/1000).toFixed(1)}k`;return`$${n.toFixed(2)}`}
const scoreColor=(s:number)=>s>=75?'var(--green)':s>=55?'var(--cyan)':s>=40?'var(--amber)':'var(--red)'

export default function OpportunitiesPage() {
  const [opps,setOpps]=useState<Opp[]>([])
  const [loading,setLoading]=useState(true)
  const [scanName,setScanName]=useState('')
  const {toast,showToast}=useToast()

  const load=async()=>{
    setLoading(true)
    try{const d=await fetch('/api/opportunities').then(r=>r.json());setOpps(d.opportunities??[]);setScanName(d.query??'')}
    catch{showToast('Failed to load','error')}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[])

  const addPort=async(o:Opp)=>{
    try{await fetch('/api/portfolio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cardName:o.name,setName:o.setName,imageUrl:o.imageUrl,purchasePrice:o.rawPrice,currentValue:o.rawPrice})}); showToast(`${o.name} added to portfolio`)}
    catch{showToast('Failed to add','error')}
  }
  const addWatch=async(o:Opp)=>{
    try{await fetch('/api/watchlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cardName:o.name,setName:o.setName,imageUrl:o.imageUrl,currentPrice:o.rawPrice,targetBuyPrice:o.buyUnder})}); showToast(`${o.name} added to watchlist`)}
    catch{showToast('Failed','error')}
  }

  return (
    <div style={{maxWidth:1280}}>
      {toast&&<Toast message={toast.message} type={toast.type} onDismiss={()=>{}}/>}

      <div className="fade-up" style={{marginBottom:'2rem',display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'1rem'}}>
        <div>
          <div className="section-label" style={{marginBottom:'0.5rem'}}>Live Market Scan · {scanName&&<span style={{color:'var(--cyan)'}}>{scanName}</span>}</div>
          <h1 style={{fontWeight:900,fontSize:'2.5rem',letterSpacing:'-0.04em',color:'white',lineHeight:1}}>Opportunities</h1>
          <p style={{color:'var(--muted)',fontSize:'0.9375rem',marginTop:'0.375rem'}}>Best raw-to-PSA10 flips ranked by estimated upside</p>
        </div>
        <button onClick={load} className="btn btn-ghost" style={{color:'var(--green)',borderColor:'rgba(0,255,148,0.25)',background:'rgba(0,255,148,0.06)',flexShrink:0}}>
          {loading?'⟳ Scanning…':'↻ Refresh'}
        </button>
      </div>

      {loading?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
          {[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:320,borderRadius:16}}/>)}
        </div>
      ):opps.length===0?(
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:20,padding:'4rem',textAlign:'center'}}>
          <div style={{fontSize:'3rem',opacity:0.12,marginBottom:'1rem'}}>⚡</div>
          <div style={{fontWeight:700,fontSize:'1.125rem',color:'white',marginBottom:'0.5rem',letterSpacing:'-0.02em'}}>No strong opportunities right now</div>
          <div style={{color:'var(--muted)',fontSize:'0.875rem',marginBottom:'1.5rem'}}>Market conditions may not favor flipping. Try refreshing.</div>
          <button onClick={load} className="btn btn-ghost">↻ Try Again</button>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
          {opps.map((o,i)=>(
            <div key={o.pcId} style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden',animationDelay:`${i*0.05}s`,animation:'fadeUp 0.4s ease both',display:'flex',flexDirection:'column'}}>
              
              {/* Image */}
              <div style={{height:160,background:'linear-gradient(135deg,rgba(0,255,148,0.06),rgba(0,80,200,0.04))',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                {o.imageUrl?<Image src={o.imageUrl} alt={o.name} width={100} height={138} style={{objectFit:'contain',filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.7))'}} unoptimized onError={()=>{}}/>:<div style={{fontSize:'3rem',opacity:0.1}}>🃏</div>}
                <div style={{position:'absolute',top:'0.75rem',left:'0.75rem',background:'rgba(3,5,8,0.9)',backdropFilter:'blur(8px)',border:`1px solid ${scoreColor(o.score)}30`,borderRadius:8,padding:'3px 8px',fontFamily:'JetBrains Mono',fontSize:'0.6875rem',fontWeight:700,color:scoreColor(o.score)}}>{o.score}</div>
                {o.estimatedUpside!=null&&<div style={{position:'absolute',top:'0.75rem',right:'0.75rem',background:'rgba(3,5,8,0.9)',backdropFilter:'blur(8px)',border:'1px solid rgba(0,255,148,0.3)',borderRadius:8,padding:'3px 8px',fontFamily:'JetBrains Mono',fontSize:'0.75rem',fontWeight:700,color:'var(--green)'}}>+{o.estimatedUpside}%</div>}
              </div>

              <div style={{padding:'1rem',flex:1,display:'flex',flexDirection:'column'}}>
                <div style={{fontWeight:700,fontSize:'0.9375rem',letterSpacing:'-0.02em',color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:'0.25rem'}}>{o.name}</div>
                <div style={{fontSize:'0.6875rem',color:'var(--muted)',marginBottom:'0.875rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.setName}</div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginBottom:'0.75rem'}}>
                  <div style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'0.625rem'}}>
                    <div style={{fontFamily:'JetBrains Mono',fontSize:'0.45rem',color:'var(--faint)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:3}}>Buy Raw</div>
                    <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:'0.9375rem',color:'white'}}>{fmt(o.rawPrice)}</div>
                  </div>
                  <div style={{background:'rgba(0,255,148,0.05)',borderRadius:8,padding:'0.625rem'}}>
                    <div style={{fontFamily:'JetBrains Mono',fontSize:'0.45rem',color:'var(--green)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:3}}>PSA 10</div>
                    <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:'0.9375rem',color:'var(--green)'}}>{fmt(o.psa10Price)}</div>
                  </div>
                </div>

                {o.netProfit!=null&&<div style={{fontFamily:'JetBrains Mono',fontSize:'0.6875rem',color:o.netProfit>0?'var(--green)':'var(--red)',fontWeight:700,marginBottom:'0.375rem'}}>Est. net: {o.netProfit>0?'+':''}{fmt(o.netProfit)} after fees</div>}
                {o.buyUnder&&<div style={{fontSize:'0.6875rem',color:'var(--amber)',marginBottom:'0.625rem'}}>Buy under {fmt(o.buyUnder)}</div>}
                <div style={{fontSize:'0.75rem',color:'var(--muted)',lineHeight:1.4,marginBottom:'0.875rem',flex:1}}>{o.reason}</div>

                <div style={{display:'flex',gap:'0.5rem'}}>
                  <Link href={`/cards/${o.pcId}?pcId=${o.pcId}`} className="btn btn-primary btn-sm" style={{flex:1,justifyContent:'center',fontSize:'0.75rem'}}>Analyze</Link>
                  <button className="btn btn-ghost btn-sm" onClick={()=>addPort(o)} style={{flex:1,fontSize:'0.75rem',color:'var(--green)',borderColor:'rgba(0,255,148,0.2)'}}>+ Own</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>addWatch(o)} style={{flex:1,fontSize:'0.75rem',color:'var(--amber)',borderColor:'rgba(255,167,38,0.2)'}}>◉</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
