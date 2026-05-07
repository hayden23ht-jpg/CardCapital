'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { useToast } from '@/hooks/useToast'
import Toast from '@/components/Toast'

const fmt = (n:number|null) => { if(n==null)return'—'; if(Math.abs(n)>=1000000)return`$${(n/1000000).toFixed(2)}M`; if(Math.abs(n)>=1000)return`$${(n/1000).toFixed(1)}k`; return`$${n.toFixed(2)}` }
const recCls = (r:string) => r==='BUY'?'buy':r==='HOLD'?'hold':r==='SELL'?'sell':'watch'
const scoreColor = (s:number) => s>=75?'var(--emerald)':s>=55?'var(--gold)':s>=40?'var(--blue)':'var(--red)'

function ChartTip({ active, payload, label }:any) {
  if (!active||!payload?.length) return null
  return (
    <div className="chart-tip" style={{padding:'0.75rem 1rem',fontSize:'0.75rem'}}>
      <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.5625rem',color:'var(--ink3)',marginBottom:6}}>{label}</div>
      {payload.map((p:any)=>(
        <div key={p.name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:p.color}}/>
          <span style={{color:'var(--ink2)',fontFamily:'DM Mono,monospace',fontSize:'0.6875rem'}}>{p.name}:</span>
          <span style={{fontWeight:700,color:p.color,fontFamily:'DM Mono,monospace'}}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function CardDetailPage() {
  const {id} = useParams() as {id:string}
  const sp = useSearchParams()
  const pcId  = sp.get('pcId')??''
  const tcgId = sp.get('tcgId')??''
  const [card, setCard]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState(30)
  const [chartData, setChartData] = useState<any[]>([])
  const [chartLoading, setChartLoading] = useState(false)
  const [addingPort, setAddingPort] = useState(false)
  const [portPrice, setPortPrice]   = useState('')
  const {toast, showToast} = useToast()

  useEffect(()=>{
    fetch(`/api/cards/${id}?pcId=${pcId}&tcgId=${tcgId}`)
      .then(r=>r.json())
      .then(d=>{ if(d.error) throw new Error(d.error); setCard(d) })
      .catch(e=>setError(String(e)))
      .finally(()=>setLoading(false))
  },[id,pcId,tcgId])

  useEffect(()=>{
    if(!pcId) return
    setChartLoading(true)
    fetch(`/api/prices/chart?pcId=${pcId}&days=${period}`)
      .then(r=>r.json())
      .then(d=>setChartData(d.points??[]))
      .catch(()=>{})
      .finally(()=>setChartLoading(false))
  },[pcId,period])

  const addPortfolio=async()=>{
    if(!card) return
    const price=parseFloat(portPrice)||card.rawPrice||0
    try {
      const res=await fetch('/api/portfolio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cardName:card.name,setName:card.setName,imageUrl:card.imageHiRes??card.imageUrl,purchasePrice:price,currentValue:card.rawPrice})})
      if(!res.ok) throw new Error()
      showToast(`${card.name} added to portfolio`)
      setAddingPort(false)
    } catch { showToast('Failed to add','error') }
  }
  const addWatchlist=async()=>{
    if(!card) return
    try {
      await fetch('/api/watchlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cardName:card.name,setName:card.setName,imageUrl:card.imageHiRes??card.imageUrl,currentPrice:card.rawPrice})})
      showToast(`${card.name} added to watchlist`)
    } catch { showToast('Failed','error') }
  }

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:'1rem'}}>
      <div style={{width:'2.5rem',height:'2.5rem',border:'2.5px solid rgba(212,168,67,0.15)',borderTopColor:'var(--gold)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <div className="label">Loading card data…</div>
    </div>
  )
  if(error||!card) return (<div><Link href="/search" style={{color:'var(--gold)'}}>← Back</Link><div style={{marginTop:'2rem',color:'var(--red)'}}>{error||'Not found'}</div></div>)

  const s = card.score
  const scoreC = scoreColor(s.total)
  const rawPrices = chartData.map((p:any)=>p.raw).filter(Boolean)
  const chartChange = rawPrices.length>=2 ? ((rawPrices[rawPrices.length-1]-rawPrices[0])/rawPrices[0]*100) : 0

  const scoreFactors = [
    {label:'PSA 10 Spread',   val:s.spreadScore,     color:'var(--gold)'},
    {label:'Market Liquidity',val:s.liquidityScore,   color:'var(--blue)'},
    {label:'Card Rarity',     val:s.rarityScore,      color:'var(--purple)'},
    {label:'Age Momentum',    val:s.momentumScore,    color:'var(--emerald)'},
    {label:'Price Stability', val:s.volatilityScore,  color:'var(--cyan)'},
    {label:'Data Confidence', val:s.confidenceScore,  color:'var(--ink2)'},
  ]

  return (
    <div style={{maxWidth:1100}}>
      {toast&&<Toast message={toast.message} type={toast.type} onDismiss={()=>{}}/>}

      {/* Breadcrumb */}
      <div className="fade-up" style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1.75rem'}}>
        <Link href="/search" style={{color:'var(--ink3)',fontSize:'0.8125rem',display:'flex',alignItems:'center',gap:'0.375rem'}}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 10L4 6l4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Card Search
        </Link>
        <span style={{color:'var(--line2)',fontSize:'0.75rem'}}>/</span>
        <span style={{fontSize:'0.8125rem',color:'var(--ink2)'}}>{card.name}</span>
      </div>

      {/* Hero */}
      <div className="fade-up-1" style={{display:'grid',gridTemplateColumns:'290px 1fr',gap:'1.5rem',marginBottom:'1.5rem'}}>

        {/* Left */}
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          {/* Card */}
          <div style={{background:'var(--bg1)',border:'1px solid var(--line-gold)',borderRadius:'var(--r-xl)',padding:'2rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'1.25rem',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:'20%',left:'50%',transform:'translateX(-50%)',width:180,height:180,background:`radial-gradient(ellipse,${scoreC}18 0%,transparent 70%)`,filter:'blur(24px)',pointerEvents:'none'}}/>
            <div style={{width:168,height:234,borderRadius:12,overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',flexShrink:0}}>
              {card.imageHiRes??card.imageUrl ? <Image src={card.imageHiRes??card.imageUrl} alt={card.name} fill style={{objectFit:'cover'}} sizes="168px" unoptimized/> : <span style={{fontSize:'4rem',opacity:0.1}}>🃏</span>}
            </div>
            {/* Score ring */}
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.625rem'}}>
              <div style={{position:'relative',width:88,height:88}}>
                <svg width="88" height="88" viewBox="0 0 88 88" style={{transform:'rotate(-90deg)'}}>
                  <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5"/>
                  <circle cx="44" cy="44" r="36" fill="none" stroke={scoreC} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${(s.total/100)*226.2} 226.2`}
                    style={{filter:`drop-shadow(0 0 6px ${scoreC})`,transition:'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)'}}/>
                </svg>
                <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                  <span style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:'1.5rem',color:scoreC,lineHeight:1}}>{s.total}</span>
                  <span className="label" style={{fontSize:'0.4rem',marginTop:2}}>SCORE</span>
                </div>
              </div>
              <span className={`pill pill-${recCls(s.recommendation)}`} style={{fontSize:'0.625rem',padding:'4px 12px'}}>{s.recommendation}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
            {addingPort ? (
              <div style={{background:'var(--bg1)',border:'1px solid var(--line-gold)',borderRadius:'var(--r-md)',padding:'1rem',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                <div style={{fontSize:'0.8125rem',fontWeight:600,color:'white'}}>Purchase price paid:</div>
                <input value={portPrice} onChange={e=>setPortPrice(e.target.value)} placeholder={`${fmt(card.rawPrice)}`}
                  className="field" style={{fontFamily:'DM Mono,monospace'}}/>
                <div style={{display:'flex',gap:'0.5rem'}}>
                  <button className="btn btn-emerald" onClick={addPortfolio} style={{flex:1,fontSize:'0.8125rem'}}>Confirm</button>
                  <button className="btn btn-ghost" onClick={()=>setAddingPort(false)} style={{flex:1,fontSize:'0.8125rem'}}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-emerald" onClick={()=>setAddingPort(true)} style={{width:'100%',fontSize:'0.875rem'}}>+ Add to Portfolio</button>
            )}
            <button className="btn btn-ghost-gold" onClick={addWatchlist} style={{width:'100%',fontSize:'0.875rem'}}>◉ Add to Watchlist</button>
            <Link href={`/topguard?name=${encodeURIComponent(card.name)}&img=${encodeURIComponent(card.imageHiRes??card.imageUrl??'')}`} className="btn btn-ghost" style={{width:'100%',fontSize:'0.875rem',color:'var(--blue)',borderColor:'rgba(59,130,246,0.25)'}}>
              🛡 TopGuard Try-On
            </Link>
          </div>
        </div>

        {/* Right */}
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <div style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-xl)',padding:'1.75rem',flex:1}}>
            <div className="label" style={{marginBottom:'0.375rem'}}>{card.setName}{card.number?` · #${card.number}`:''}</div>
            <h1 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'2.25rem',color:'white',lineHeight:1.1,letterSpacing:'-0.03em',marginBottom:'0.875rem'}}>{card.name}</h1>

            <div style={{display:'flex',alignItems:'center',gap:'0.625rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
              <span className={`pill pill-${recCls(s.recommendation)}`}>{s.recommendation}</span>
              {card.rarity&&<span className="pill pill-dim">{card.rarity}</span>}
              {card.releaseDate&&<span className="label" style={{marginBottom:0}}>{card.releaseDate}</span>}
              {card.types?.map((t:string)=><span key={t} className="pill pill-dim">{t}</span>)}
            </div>

            {/* Recommendation box */}
            <div style={{background:`rgba(${s.recommendation==='BUY'?'16,185,129':s.recommendation==='SELL'?'239,68,68':s.recommendation==='HOLD'?'59,130,246':'212,168,67'},0.06)`,border:`1px solid rgba(${s.recommendation==='BUY'?'16,185,129':s.recommendation==='SELL'?'239,68,68':s.recommendation==='HOLD'?'59,130,246':'212,168,67'},0.18)`,borderRadius:12,padding:'1rem',marginBottom:'1.5rem'}}>
              <div className="label" style={{color:scoreC,marginBottom:'0.375rem'}}>Recommendation: {s.recommendation}</div>
              <div style={{fontSize:'0.875rem',color:'rgba(242,240,232,0.7)',lineHeight:1.5}}>{s.reason}</div>
            </div>

            {/* Price grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'0.75rem',marginBottom:'1.5rem'}}>
              {[
                {label:'Raw / Ungraded', val:card.rawPrice,        color:'var(--gold)', main:true},
                {label:'Graded (avg)',   val:card.gradedPrice,      color:'white'},
                {label:'PSA 9',         val:card.psa9Price,         color:'var(--blue)'},
                {label:'PSA 10',        val:card.psa10Price,        color:'var(--emerald)'},
                {label:'TCGplayer Mkt', val:card.tcgplayerMarket,   color:'white'},
                {label:'Cardmarket',    val:card.cardmarketAvg,     color:'white'},
              ].filter(p=>p.val!=null&&p.val>0).map(p=>(
                <div key={p.label} style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--line)',borderRadius:10,padding:'0.875rem'}}>
                  <div className="label" style={{marginBottom:'0.5rem'}}>{p.label}</div>
                  <div style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:p.main?'1.5rem':'1.125rem',color:p.color,letterSpacing:'-0.02em'}}>{fmt(p.val)}</div>
                  {p.label==='PSA 10'&&card.rawPrice&&p.val&&<div style={{fontFamily:'DM Mono,monospace',fontSize:'0.5rem',color:'var(--ink3)',marginTop:3}}>{(p.val/card.rawPrice).toFixed(1)}× raw multiplier</div>}
                </div>
              ))}
            </div>

            {/* Grading calculator */}
            {card.rawPrice&&card.psa10Price&&s.netProfit!=null&&(
              <div style={{background:s.netProfit>0?'rgba(16,185,129,0.06)':'rgba(239,68,68,0.06)',border:`1px solid ${s.netProfit>0?'rgba(16,185,129,0.18)':'rgba(239,68,68,0.18)'}`,borderRadius:12,padding:'1rem'}}>
                <div className="label" style={{marginBottom:'0.75rem'}}>📊 Grading Calculator (after fees)</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem',textAlign:'center'}}>
                  {[
                    {label:'Net Profit',val:fmt(s.netProfit),color:s.netProfit>0?'var(--emerald)':'var(--red)'},
                    {label:'Est. Upside',val:s.estimatedUpside!=null?`${s.estimatedUpside}%`:'—',color:s.estimatedUpside&&s.estimatedUpside>0?'var(--emerald)':'var(--red)'},
                    {label:'Buy Under',val:fmt(s.buyUnder),color:'var(--gold)'},
                  ].map(c=>(
                    <div key={c.label}>
                      <div className="label" style={{marginBottom:'0.375rem'}}>{c.label}</div>
                      <div style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:'1.125rem',color:c.color}}>{c.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.5rem',color:'var(--ink3)',marginTop:'0.625rem'}}>After ~12.9% eBay fee + $25 grading cost · Not financial advice</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price chart */}
      <div className="fade-up-2" style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-xl)',padding:'1.75rem',marginBottom:'1.5rem'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
          <div>
            <div className="label" style={{marginBottom:'0.25rem'}}>Price History</div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1.125rem',color:'white',display:'flex',alignItems:'center',gap:'0.875rem'}}>
              Price Chart
              {chartData.length>0&&(
                <span style={{fontFamily:'DM Mono,monospace',fontSize:'0.8125rem',fontWeight:600,color:chartChange>=0?'var(--emerald)':'var(--red)',padding:'2px 8px',borderRadius:6,background:chartChange>=0?'var(--emerald-dim)':'var(--red-dim)'}}>
                  {chartChange>=0?'▲':'▼'} {Math.abs(chartChange).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div style={{display:'flex',gap:'0.375rem'}}>
            {[7,30,60,90].map(d=>(
              <button key={d} onClick={()=>setPeriod(d)} style={{padding:'0.375rem 0.875rem',borderRadius:8,fontSize:'0.8125rem',fontWeight:500,background:period===d?'var(--gold-dim)':'transparent',border:`1px solid ${period===d?'var(--line-gold)':'var(--line)'}`,color:period===d?'var(--gold)':'var(--ink3)',cursor:'pointer',transition:'all 0.15s',fontFamily:'DM Mono,monospace'}}>{d}d</button>
            ))}
          </div>
        </div>
        {chartLoading ? <div className="skeleton" style={{height:240}}/> : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
              <defs>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A843" stopOpacity={0.25}/><stop offset="100%" stopColor="#D4A843" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.2}/><stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:'rgba(242,240,232,0.28)',fontSize:10,fontFamily:'DM Mono,monospace'}} interval={Math.floor(chartData.length/7)} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'rgba(242,240,232,0.28)',fontSize:10,fontFamily:'DM Mono,monospace'}} tickFormatter={v=>v>=1000?`$${(v/1000).toFixed(0)}k`:`$${v.toFixed(0)}`} axisLine={false} tickLine={false} width={52}/>
              <Tooltip content={<ChartTip/>} cursor={{stroke:'rgba(212,168,67,0.2)',strokeWidth:1,strokeDasharray:'4 4'}}/>
              {card.rawPrice&&<ReferenceLine y={card.rawPrice} stroke="rgba(212,168,67,0.3)" strokeDasharray="4 4"/>}
              <Area type="monotone" dataKey="raw" name="Raw" stroke="#D4A843" strokeWidth={2} fill="url(#gR)" dot={false} activeDot={{r:4,fill:'#D4A843',stroke:'var(--bg1)',strokeWidth:2}}/>
              <Area type="monotone" dataKey="psa10" name="PSA 10" stroke="#10B981" strokeWidth={2} fill="url(#gP)" dot={false} activeDot={{r:4,fill:'#10B981',stroke:'var(--bg1)',strokeWidth:2}}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div className="label" style={{textAlign:'right',marginTop:'0.5rem',fontSize:'0.4rem'}}>* Trend estimated · real data builds as you browse cards over time</div>
      </div>

      {/* Score breakdown + links */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>
        {/* Score */}
        <div style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-xl)',padding:'1.75rem'}}>
          <div className="label" style={{marginBottom:'1.25rem'}}>Opportunity Breakdown</div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
            {scoreFactors.map((f,i)=>(
              <div key={f.label} style={{display:'grid',gridTemplateColumns:'140px 1fr 40px',alignItems:'center',gap:'0.875rem'}}>
                <div style={{fontSize:'0.8125rem',color:'var(--ink2)'}}>{f.label}</div>
                <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.06)',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${Math.max(0,Math.min(100,f.val))}%`,borderRadius:3,background:f.color,boxShadow:`0 0 8px ${f.color}40`,transition:`width 1.2s cubic-bezier(0.34,1.56,0.64,1) ${i*0.08}s`}}/>
                </div>
                <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.8125rem',fontWeight:700,color:f.color,textAlign:'right'}}>{Math.round(f.val)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* External links */}
        <div style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-xl)',padding:'1.75rem'}}>
          <div className="label" style={{marginBottom:'1.25rem'}}>View Comps & Market Data</div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.625rem'}}>
            {[
              {label:'PriceCharting Comps',href:card.links.pricecharting,color:'var(--gold)',desc:'Live sold data & comps'},
              {label:'TCGplayer Market',   href:card.links.tcgplayer,    color:'var(--blue)',desc:'Current listings & market price'},
              {label:'eBay Active Listings',href:card.links.ebay,        color:'var(--emerald)',desc:'Buy it now & auction comps'},
              {label:'Cardmarket Europe',  href:card.links.cardmarket,   color:'var(--ink2)',desc:'European market prices'},
              {label:'PSA Population Report',href:card.links.psapop,     color:'var(--purple)',desc:'Graded card supply data'},
            ].map(l=>(
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem 1rem',background:'rgba(255,255,255,0.03)',border:'1px solid var(--line)',borderRadius:10,textDecoration:'none',transition:'border-color 0.15s'}}>
                <div>
                  <div style={{fontSize:'0.875rem',fontWeight:600,color:l.color}}>{l.label}</div>
                  <div style={{fontSize:'0.6875rem',color:'var(--ink3)',marginTop:2}}>{l.desc}</div>
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--ink3)" strokeWidth="1.5"><path d="M2 10L10 2M10 2H5M10 2v5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
