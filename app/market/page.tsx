'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const fmt = (n:number|null) => { if(n==null)return'—'; if(Math.abs(n)>=1000000)return`$${(n/1000000).toFixed(2)}M`; if(Math.abs(n)>=1000)return`$${(n/1000).toFixed(1)}k`; return`$${n.toFixed(2)}` }

function BarTip({active,payload,label}:any) {
  if(!active||!payload?.length) return null
  return (
    <div className="chart-tip" style={{padding:'0.75rem 1rem'}}>
      <div className="label" style={{marginBottom:6,fontSize:'0.5rem'}}>{label}</div>
      {payload.map((p:any)=>(
        <div key={p.name} style={{fontFamily:'DM Mono,monospace',fontSize:'0.75rem',fontWeight:700,color:p.value>=0?'var(--emerald)':'var(--red)'}}>
          {p.name}: {p.value>=0?'+':''}{p.value?.toFixed(1)}%
        </div>
      ))}
    </div>
  )
}

export default function MarketPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [era, setEra] = useState<'all'|'vintage'|'modern'>('all')
  const [period, setPeriod] = useState<'7d'|'30d'|'90d'>('30d')

  const load = async () => {
    setLoading(true)
    try { const d = await fetch('/api/market').then(r=>r.json()); setData(d) }
    catch {}
    finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  const sets = (data?.setPerformance??[]).filter((s:any) => {
    if(era==='vintage') return s.year<2010
    if(era==='modern') return s.year>=2015
    return true
  })
  const growthKey = period==='7d'?'growth7d':period==='30d'?'growth30d':'growth90d'
  const barData = sets.slice(0,8).map((s:any)=>({ name:s.name.split(' ').slice(0,2).join(' '), growth: s[growthKey] }))

  const sentimentColor = data?.sentiment>=60?'var(--emerald)':data?.sentiment>=40?'var(--gold)':'var(--red)'
  const sentimentLabel = data?.sentiment>=60?'BULLISH':data?.sentiment>=40?'NEUTRAL':'BEARISH'

  return (
    <div style={{maxWidth:1280}}>
      {/* Header */}
      <div className="fade-up" style={{marginBottom:'2rem',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div>
          <div className="label" style={{marginBottom:'0.5rem'}}>Live Market Data · Scanning: <span style={{color:'var(--gold)'}}>{data?.query??'…'}</span></div>
          <h1 className="display" style={{fontSize:'2.875rem',color:'white',lineHeight:1}}>Market Intelligence</h1>
        </div>
        <button onClick={load} className="btn btn-ghost btn-sm" style={{color:'var(--gold)',borderColor:'var(--line-gold)'}}>
          {loading?'Scanning…':'↻ Refresh'}
        </button>
      </div>

      {/* Sentiment + Stats */}
      <div className="fade-up-1" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'2rem'}}>
        {[
          {label:'Market Sentiment',raw:sentimentLabel,color:sentimentColor,sub:`${data?.sentiment??0}% bullish signals`},
          {label:'Avg Card Price',val:data?.avgPrice,prefix:'$',color:'var(--gold)',sub:'Live PriceCharting avg'},
          {label:'Buy Signals Active',val:data?.buySignals,color:'var(--emerald)',sub:`of ${data?.totalScanned??0} cards scanned`},
          {label:'Sets Tracked',val:(data?.setPerformance?.length??0),color:'var(--blue)',sub:'Performance monitored'},
        ].map((s:any)=>(
          <div key={s.label} style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-md)',padding:'1.25rem',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${s.color}80,transparent)`}}/>
            <div className="label" style={{marginBottom:'0.75rem'}}>{s.label}</div>
            {loading?<div className="skeleton" style={{height:28,borderRadius:6}}/>:(
              <div style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:'1.5rem',color:s.color,letterSpacing:'-0.03em',lineHeight:1,marginBottom:'0.25rem'}}>
                {s.raw??(s.prefix??'')+String(s.val!=null?Math.round(s.val):'—')}
              </div>
            )}
            <div style={{fontSize:'0.6875rem',color:'var(--ink3)'}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two col: bar chart + set table */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem',marginBottom:'1.25rem'}}>

        {/* Bar chart */}
        <div style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',padding:'1.5rem'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
            <div className="label">Set Performance</div>
            <div style={{display:'flex',gap:'0.375rem'}}>
              {(['7d','30d','90d'] as const).map(p=>(
                <button key={p} onClick={()=>setPeriod(p)} style={{padding:'0.25rem 0.625rem',borderRadius:6,fontSize:'0.75rem',fontFamily:'DM Mono,monospace',background:period===p?'var(--gold-dim)':'transparent',border:`1px solid ${period===p?'var(--line-gold)':'var(--line)'}`,color:period===p?'var(--gold)':'var(--ink3)',cursor:'pointer'}}>{p}</button>
              ))}
            </div>
          </div>
          {loading?<div className="skeleton" style={{height:220}}/>:(
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{top:4,right:4,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="name" tick={{fill:'rgba(242,240,232,0.28)',fontSize:9,fontFamily:'DM Mono,monospace'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'rgba(242,240,232,0.28)',fontSize:9,fontFamily:'DM Mono,monospace'}} tickFormatter={v=>`${v>=0?'+':''}${v.toFixed(0)}%`} axisLine={false} tickLine={false} width={44}/>
                <Tooltip content={<BarTip/>}/>
                <Bar dataKey="growth" name={period} fill="var(--gold)" radius={[4,4,0,0]}
                  cells={barData.map((d:any,i:number)=>(
                    <cell key={i} fill={d.growth>=0?'var(--emerald)':'var(--red)'} fillOpacity={0.8}/>
                  ) as any)}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Market signals — top BUY cards */}
        <div style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
          <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div className="label">🔥 Top BUY Signals</div>
            <Link href="/deals" style={{fontFamily:'DM Mono,monospace',fontSize:'0.5rem',color:'var(--gold)',letterSpacing:'0.05em'}}>All Deals →</Link>
          </div>
          <table className="tbl">
            <thead><tr><th>Card</th><th style={{textAlign:'right'}}>Raw</th><th style={{textAlign:'right'}}>PSA10</th><th style={{textAlign:'right'}}>Score</th><th>Rec</th></tr></thead>
            <tbody>
              {loading?[...Array(5)].map((_,i)=>(
                <tr key={i}><td colSpan={5}><div className="skeleton" style={{height:16,borderRadius:4}}/></td></tr>
              )):(data?.cards??[]).filter((c:any)=>c.rec==='BUY').slice(0,6).map((card:any)=>(
                <tr key={card.id} onClick={()=>window.location.href=`/cards/${card.id}?pcId=${card.id}`}>
                  <td>
                    <div style={{fontWeight:600,fontSize:'0.8125rem',color:'white',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.name}</div>
                  </td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.8125rem',color:'white'}}>{fmt(card.rawPrice)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.8125rem',color:'var(--emerald)'}}>{fmt(card.psa10Price)}</td>
                  <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.875rem',fontWeight:700,color:card.score>=75?'var(--emerald)':card.score>=55?'var(--gold)':'var(--blue)'}}>{card.score}</td>
                  <td><span className="pill pill-buy">BUY</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full set table */}
      <div className="fade-up-3" style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
        <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div className="label">All Set Performance</div>
          <div style={{display:'flex',gap:'0.375rem'}}>
            {(['all','vintage','modern'] as const).map(e=>(
              <button key={e} onClick={()=>setEra(e)} style={{padding:'0.25rem 0.75rem',borderRadius:6,fontSize:'0.75rem',background:era===e?'var(--gold-dim)':'transparent',border:`1px solid ${era===e?'var(--line-gold)':'var(--line)'}`,color:era===e?'var(--gold)':'var(--ink3)',cursor:'pointer',textTransform:'capitalize'}}>{e}</button>
            ))}
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Set Name</th>
              <th>Year</th>
              <th style={{textAlign:'right'}}>7d</th>
              <th style={{textAlign:'right'}}>30d</th>
              <th style={{textAlign:'right'}}>90d</th>
              <th>Era Signal</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading?[...Array(6)].map((_,i)=>(
              <tr key={i}><td colSpan={7}><div className="skeleton" style={{height:20,borderRadius:4}}/></td></tr>
            )):sets.map((s:any)=>(
              <tr key={s.id}>
                <td style={{fontWeight:600,fontSize:'0.875rem',color:'white'}}>{s.name}</td>
                <td style={{fontFamily:'DM Mono,monospace',fontSize:'0.75rem',color:'var(--ink3)'}}>{s.year}</td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.8125rem',fontWeight:600,color:s.growth7d>=0?'var(--emerald)':'var(--red)'}}>
                  {s.growth7d>=0?'+':''}{s.growth7d.toFixed(1)}%
                </td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.875rem',fontWeight:700,color:s.growth30d>=0?'var(--emerald)':'var(--red)'}}>
                  {s.growth30d>=0?'+':''}{s.growth30d.toFixed(1)}%
                </td>
                <td style={{textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:'0.8125rem',color:s.growth90d>=0?'var(--emerald)':'var(--red)'}}>
                  {s.growth90d>=0?'+':''}{s.growth90d.toFixed(1)}%
                </td>
                <td><span className={`pill pill-${s.popular?'buy':s.growth30d>5?'watch':'hold'}`}>{s.popular?'HOT':s.growth30d>5?'RISING':'STABLE'}</span></td>
                <td>
                  <Link href={`/sets/${s.id}`} style={{fontFamily:'DM Mono,monospace',fontSize:'0.5rem',color:'var(--gold)',letterSpacing:'0.08em'}}>Browse →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
