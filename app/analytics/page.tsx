'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

const fmt = (n:number|null) => { if(n==null)return'—'; if(Math.abs(n)>=1000000)return`$${(n/1000000).toFixed(2)}M`; if(Math.abs(n)>=1000)return`$${(n/1000).toFixed(1)}k`; return`$${n.toFixed(2)}` }
const pct = (n:number) => `${n>=0?'+':''}${n.toFixed(1)}%`

export default function AnalyticsPage() {
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetch('/api/portfolio').then(r=>r.json()).then(setPortfolio).finally(()=>setLoading(false))
  },[])

  if(loading) return <div style={{padding:'4rem',textAlign:'center'}}><div className="skeleton" style={{height:200,borderRadius:16}}/></div>

  const items = portfolio?.items??[]
  if(items.length===0) return (
    <div style={{maxWidth:1280}}>
      <div className="fade-up" style={{marginBottom:'2rem'}}>
        <div className="label" style={{marginBottom:'0.5rem'}}>Portfolio Analysis</div>
        <h1 className="display" style={{fontSize:'2.875rem',color:'white',lineHeight:1}}>Analytics</h1>
      </div>
      <div style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-xl)',padding:'4rem',textAlign:'center'}}>
        <div style={{fontSize:'3rem',opacity:0.12,marginBottom:'1rem'}}>📈</div>
        <div style={{fontWeight:700,fontSize:'1.25rem',color:'white',marginBottom:'0.5rem',letterSpacing:'-0.02em'}}>No portfolio data yet</div>
        <div style={{color:'var(--ink3)',marginBottom:'1.5rem',fontSize:'0.9375rem'}}>Add cards to your portfolio to see P&L analytics.</div>
        <Link href="/portfolio" className="btn btn-gold">+ Add Cards</Link>
      </div>
    </div>
  )

  const itemsWithPnl = items.map((i:any)=>({
    ...i,
    val: i.currentValue??i.purchasePrice,
    pnl: ((i.currentValue??i.purchasePrice)-i.purchasePrice)*i.quantity,
    roi: i.purchasePrice>0?((i.currentValue??i.purchasePrice)-i.purchasePrice)/i.purchasePrice*100:0,
  }))

  const winners = [...itemsWithPnl].filter((i:any)=>i.pnl>0).sort((a:any,b:any)=>b.pnl-a.pnl).slice(0,5)
  const losers  = [...itemsWithPnl].filter((i:any)=>i.pnl<0).sort((a:any,b:any)=>a.pnl-b.pnl).slice(0,5)
  const byStatus = ['Holding','Listed','Grading','Sold','Watchlist'].map(s=>({
    name:s, value:items.filter((i:any)=>i.status===s).length
  })).filter(s=>s.value>0)

  const totalInvested = portfolio?.totalInvested??0
  const totalValue    = portfolio?.totalValue??0
  const totalPnl      = portfolio?.pnl??0
  const roi           = totalInvested>0?totalPnl/totalInvested*100:0

  const COLORS = ['var(--gold)','var(--blue)','var(--purple)','var(--emerald)','var(--red)']

  const barData = itemsWithPnl.slice(0,8).map((i:any)=>({ name:i.cardName.split(' ').slice(0,2).join(' '), pnl:i.pnl }))

  return (
    <div style={{maxWidth:1280}}>
      <div className="fade-up" style={{marginBottom:'2rem',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div>
          <div className="label" style={{marginBottom:'0.5rem'}}>Portfolio Analysis</div>
          <h1 className="display" style={{fontSize:'2.875rem',color:'white',lineHeight:1}}>Analytics</h1>
        </div>
        <Link href="/portfolio" className="btn btn-ghost btn-sm">Manage Portfolio →</Link>
      </div>

      {/* KPIs */}
      <div className="fade-up-1" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem',marginBottom:'2rem'}}>
        {[
          {label:'Total Value',val:fmt(totalValue),color:'var(--gold)'},
          {label:'Invested',val:fmt(totalInvested),color:'white'},
          {label:'Total P&L',val:fmt(totalPnl),color:totalPnl>=0?'var(--emerald)':'var(--red)'},
          {label:'Overall ROI',val:pct(roi),color:roi>=0?'var(--emerald)':'var(--red)'},
        ].map(s=>(
          <div key={s.label} style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-md)',padding:'1.25rem'}}>
            <div className="label" style={{marginBottom:'0.75rem'}}>{s.label}</div>
            <div style={{fontFamily:'DM Mono,monospace',fontWeight:700,fontSize:'1.75rem',color:s.color,letterSpacing:'-0.03em'}}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:'1.25rem',marginBottom:'1.25rem'}}>
        {/* Bar chart P&L per card */}
        <div style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',padding:'1.5rem'}}>
          <div className="label" style={{marginBottom:'1rem'}}>P&L by Card</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{top:4,right:4,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="name" tick={{fill:'rgba(242,240,232,0.28)',fontSize:9,fontFamily:'DM Mono,monospace'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'rgba(242,240,232,0.28)',fontSize:9,fontFamily:'DM Mono,monospace'}} tickFormatter={v=>`$${v>=0?'':'-'}${Math.abs(v)>=1000?(Math.abs(v)/1000).toFixed(0)+'k':Math.abs(v).toFixed(0)}`} axisLine={false} tickLine={false} width={44}/>
              <Tooltip formatter={(v:any)=>fmt(v)} contentStyle={{background:'rgba(10,12,18,0.97)',border:'1px solid var(--line-gold)',borderRadius:10,fontFamily:'DM Mono,monospace',fontSize:'0.75rem'}}/>
              <Bar dataKey="pnl" name="P&L" radius={[4,4,0,0]}>
                {barData.map((d:any,i:number)=>(
                  <cell key={i} fill={d.pnl>=0?'var(--emerald)':'var(--red)'} fillOpacity={0.8}/>
                ) as any)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart by status */}
        <div style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',padding:'1.5rem',display:'flex',flexDirection:'column',alignItems:'center'}}>
          <div className="label" style={{marginBottom:'1rem',alignSelf:'flex-start'}}>By Status</div>
          <PieChart width={180} height={140}>
            <Pie data={byStatus} cx={90} cy={70} innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
              {byStatus.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]} fillOpacity={0.8}/>)}
            </Pie>
          </PieChart>
          <div style={{display:'flex',flexDirection:'column',gap:'0.375rem',alignSelf:'stretch',marginTop:'0.5rem'}}>
            {byStatus.map((s:any,i:number)=>(
              <div key={s.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:COLORS[i%COLORS.length]}}/>
                  <span style={{fontSize:'0.75rem',color:'var(--ink2)'}}>{s.name}</span>
                </div>
                <span style={{fontFamily:'DM Mono,monospace',fontSize:'0.75rem',fontWeight:600,color:'white'}}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Winners & Losers */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>
        {[
          {title:'🏆 Top Winners',items:winners,positive:true},
          {title:'📉 Biggest Losers',items:losers,positive:false},
        ].map(section=>(
          <div key={section.title} style={{background:'var(--bg1)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
            <div style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid var(--line)'}}>
              <div className="label">{section.title}</div>
            </div>
            <div style={{padding:'0.75rem'}}>
              {section.items.length===0?(
                <div style={{padding:'2rem',textAlign:'center',color:'var(--ink3)',fontSize:'0.875rem'}}>No data yet</div>
              ):section.items.map((item:any)=>(
                <div key={item.id} style={{display:'flex',alignItems:'center',gap:'0.75rem',padding:'0.625rem 0.5rem',borderRadius:8,transition:'background 0.12s'}}>
                  <div style={{width:32,height:44,borderRadius:5,overflow:'hidden',background:'rgba(255,255,255,0.05)',flexShrink:0,position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {item.imageUrl?<Image src={item.imageUrl} alt={item.cardName} fill style={{objectFit:'cover'}} sizes="32px" unoptimized/>:<span style={{fontSize:'1rem',opacity:0.2}}>🃏</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:'0.875rem',color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.cardName}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.5rem',color:'var(--ink3)'}}>{item.setName??'—'} · {item.grade?`${item.gradeCompany} ${item.grade}`:item.condition}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.875rem',fontWeight:700,color:section.positive?'var(--emerald)':'var(--red)'}}>{item.pnl>=0?'+':''}{fmt(item.pnl)}</div>
                    <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.5625rem',color:'var(--ink3)'}}>{pct(item.roi)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
