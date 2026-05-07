'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/useToast'
import Toast from '@/components/Toast'

const fmt = (n:number|null) => { if(n==null)return'—'; if(Math.abs(n)>=1000000)return`$${(n/1000000).toFixed(2)}M`; if(Math.abs(n)>=1000)return`$${(n/1000).toFixed(1)}k`; return`$${n.toFixed(2)}` }
const scoreColor = (s:number) => s>=75?'var(--emerald)':s>=55?'var(--gold)':s>=40?'var(--blue)':'var(--red)'

export default function DealsPage() {
  const [opps, setOpps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scan, setScan] = useState('')
  const [view, setView] = useState<'grid'|'list'>('grid')
  const [filter, setFilter] = useState<'all'|'buy'|'high-upside'>('all')
  const {toast,showToast} = useToast()

  const load = async () => {
    setLoading(true)
    try { const d = await fetch('/api/opportunities').then(r=>r.json()); setOpps(d.opportunities??[]); setScan(d.query??'') }
    catch { showToast('Failed to load','error') }
    finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  const addPort = async(o:any) => {
    try { await fetch('/api/portfolio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cardName:o.name,setName:o.setName,imageUrl:o.imageUrl,purchasePrice:o.rawPrice,currentValue:o.rawPrice})}); showToast(`${o.name} added to portfolio`) }
    catch { showToast('Failed','error') }
  }
  const addWatch = async(o:any) => {
    try { await fetch('/api/watchlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cardName:o.name,setName:o.setName,imageUrl:o.imageUrl,currentPrice:o.rawPrice,targetBuyPrice:o.buyUnder})}); showToast(`${o.name} added to watchlist`) }
    catch { showToast('Failed','error') }
  }

  const filtered = opps.filter(o => {
    if(filter==='buy') return o.recommendation==='BUY'
    if(filter==='high-upside') return (o.estimatedUpside??0)>=30
    return true
  })

  return (
    <div style={{maxWidth:1280}}>
      {toast&&<Toast message={toast.message} type={toast.type} onDismiss={()=>{}}/>}

      <div className="fade-up" style={{marginBottom:'2rem',display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'1rem'}}>
        <div>
          <div className="label" style={{marginBottom:'0.5rem'}}>Live Opportunity Scanner · <span style={{color:'var(--gold)'}}>{scan}</span></div>
          <h1 className="display" style={{fontSize:'2.875rem',color:'white',lineHeight:1}}>Deal Scanner</h1>
          <p style={{color:'var(--ink3)',fontSize:'0.9375rem',marginTop:'0.375rem'}}>Best raw-to-PSA10 flips ranked by estimated upside after fees</p>
        </div>
        <button onClick={load} className="btn btn-ghost-gold btn-sm" style={{flexShrink:0}}>
          {loading?'Scanning…':'↻ Refresh Scan'}
        </button>
      </div>

      {/* Filters */}
      <div className="fade-up-1" style={{display:'flex',gap:'0.75rem',marginBottom:'1.5rem',alignItems:'center'}}>
        <div style={{display:'flex',gap:'0.375rem'}}>
          {[['all','All Deals'],['buy','BUY Only'],['high-upside','30%+ Upside']] .map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k as any)} style={{padding:'0.4rem 1rem',borderRadius:9999,fontSize:'0.8125rem',fontWeight:500,background:filter===k?'var(--gold-dim)':'transparent',border:`1px solid ${filter===k?'var(--line-gold)':'var(--line)'}`,color:filter===k?'var(--gold)':'var(--ink3)',cursor:'pointer',transition:'all 0.15s'}}>{l}</button>
          ))}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:'0.375rem'}}>
          {(['grid','list'] as const).map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:'0.4rem 0.75rem',borderRadius:8,background:view===v?'var(--gold-dim)':'transparent',border:`1px solid ${view===v?'var(--line-gold)':'var(--line)'}`,color:view===v?'var(--gold)':'var(--ink3)',cursor:'pointer',fontSize:'0.875rem'}}>{v==='grid'?'⊞':'≡'}</button>
          ))}
        </div>
      </div>

      {loading?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
          {[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:320,borderRadius:'var(--r-lg)'}}/>)}
        </div>
      ):filtered.length===0?(
        <div style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-xl)',padding:'4rem',textAlign:'center'}}>
          <div style={{fontSize:'3rem',opacity:0.12,marginBottom:'1rem'}}>⚡</div>
          <div style={{fontWeight:700,fontSize:'1.125rem',color:'white',marginBottom:'0.5rem'}}>No deals match your filter</div>
          <button onClick={load} className="btn btn-ghost btn-sm" style={{marginTop:'1rem'}}>↻ Refresh</button>
        </div>
      ):view==='grid'?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'1rem'}}>
          {filtered.map((o,i)=>(
            <div key={o.pcId} className="card-lift" style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',overflow:'hidden',animationDelay:`${i*0.04}s`,animation:'fadeUp 0.4s ease both',display:'flex',flexDirection:'column'}}>
              <div style={{height:160,background:'linear-gradient(135deg,rgba(16,185,129,0.07),rgba(212,168,67,0.04))',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                {o.imageUrl?<Image src={o.imageUrl} alt={o.name} width={98} height={136} style={{objectFit:'contain',filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.7))'}} unoptimized/>:<div style={{fontSize:'3rem',opacity:0.1}}>🃏</div>}
                <div style={{position:'absolute',top:'0.75rem',left:'0.75rem',background:'rgba(8,10,15,0.9)',backdropFilter:'blur(8px)',border:`1px solid ${scoreColor(o.score)}30`,borderRadius:8,padding:'3px 8px',fontFamily:'DM Mono,monospace',fontSize:'0.6875rem',fontWeight:700,color:scoreColor(o.score)}}>{o.score}</div>
                {o.estimatedUpside!=null&&<div style={{position:'absolute',top:'0.75rem',right:'0.75rem',background:'rgba(8,10,15,0.9)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:8,padding:'3px 8px',fontFamily:'DM Mono,monospace',fontSize:'0.75rem',fontWeight:700,color:'var(--emerald)'}}>+{o.estimatedUpside}%</div>}
              </div>
              <div style={{padding:'1rem',flex:1,display:'flex',flexDirection:'column'}}>
                <div style={{fontWeight:700,fontSize:'0.9375rem',letterSpacing:'-0.02em',color:'white',marginBottom:'0.25rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.name}</div>
                <div style={{fontSize:'0.6875rem',color:'var(--ink3)',marginBottom:'0.875rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.setName}</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginBottom:'0.625rem'}}>
                  <div style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'0.5rem'}}>
                    <div className="label" style={{marginBottom:3,fontSize:'0.4rem'}}>Buy Raw</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:'0.9375rem',color:'white'}}>{fmt(o.rawPrice)}</div>
                  </div>
                  <div style={{background:'rgba(16,185,129,0.06)',borderRadius:8,padding:'0.5rem'}}>
                    <div className="label" style={{marginBottom:3,fontSize:'0.4rem',color:'rgba(16,185,129,0.5)'}}>PSA 10 Sell</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:'0.9375rem',color:'var(--emerald)'}}>{fmt(o.psa10Price)}</div>
                  </div>
                </div>
                {o.netProfit!=null&&<div style={{fontFamily:'DM Mono,monospace',fontSize:'0.6875rem',color:o.netProfit>0?'var(--emerald)':'var(--red)',fontWeight:700,marginBottom:'0.25rem'}}>Est. net: {o.netProfit>0?'+':''}{fmt(o.netProfit)} after fees</div>}
                {o.buyUnder&&<div style={{fontSize:'0.6875rem',color:'var(--gold)',marginBottom:'0.625rem'}}>Buy under {fmt(o.buyUnder)}</div>}
                <div style={{fontSize:'0.75rem',color:'var(--ink3)',lineHeight:1.4,marginBottom:'0.875rem',flex:1}}>{o.reason}</div>
                <div style={{display:'flex',gap:'0.5rem'}}>
                  <Link href={`/cards/${o.pcId}?pcId=${o.pcId}`} className="btn btn-gold btn-sm" style={{flex:1}}>Analyze</Link>
                  <button className="btn btn-ghost btn-sm" onClick={()=>addPort(o)} style={{flex:1,color:'var(--emerald)',borderColor:'rgba(16,185,129,0.2)'}}>+ Own</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>addWatch(o)} style={{flex:'none',color:'var(--gold)',borderColor:'var(--line-gold)'}}>◉</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ):(
        <div style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
          <table className="tbl">
            <thead><tr><th style={{width:52}}></th><th>Card</th><th style={{textAlign:'right'}}>Raw</th><th style={{textAlign:'right'}}>PSA10</th><th style={{textAlign:'right'}}>Net</th><th style={{textAlign:'right'}}>Upside</th><th>Rec</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map(o=>(
                <tr key={o.pcId}>
                  <td><div style={{width:38,height:52,borderRadius:6,overflow:'hidden',background:'rgba(255,255,255,0.05)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>{o.imageUrl?<Image src={o.imageUrl} alt={o.name} fill style={{objectFit:'cover'}} sizes="38px" unoptimized/>:<span style={{fontSize:'1.25rem',opacity:0.15}}>🃏</span>}</div></td>
                  <td><div style={{fontWeight:600,fontSize:'0.875rem',color:'white',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.name}</div><div style={{fontFamily:'DM Mono,monospace',fontSize:'0.5rem',color:'var(--ink3)'}}>{o.setName?.slice(0,24)}</div></td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.875rem',color:'white',fontWeight:600}}>{fmt(o.rawPrice)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.875rem',color:'var(--emerald)'}}>{fmt(o.psa10Price)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.875rem',fontWeight:700,color:o.netProfit>0?'var(--emerald)':'var(--red)'}}>{o.netProfit!=null?(o.netProfit>0?'+':'')+fmt(o.netProfit):'—'}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.875rem',fontWeight:700,color:'var(--emerald)'}}>{o.estimatedUpside!=null?`+${o.estimatedUpside}%`:'—'}</td>
                  <td><span className="pill pill-buy">BUY</span></td>
                  <td><div style={{display:'flex',gap:'0.375rem'}}><Link href={`/cards/${o.pcId}?pcId=${o.pcId}`} className="btn btn-gold btn-xs">View</Link><button className="btn btn-ghost btn-xs" onClick={()=>addPort(o)} style={{color:'var(--emerald)',borderColor:'rgba(16,185,129,0.2)'}}>+ Own</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
