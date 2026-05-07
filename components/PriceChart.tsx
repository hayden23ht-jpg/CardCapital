'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

interface Snap { fetchedAt: string; rawPrice: number | null; psa10Price: number | null }
interface Props { snapshots: Snap[] }

const fmt = (v: number) => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v.toFixed(0)}`

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{background:'rgba(4,5,10,0.97)',border:'1px solid rgba(0,229,255,0.2)',borderRadius:10,padding:'0.75rem 1rem',fontSize:'0.8125rem'}}>
      <div style={{fontFamily:'JetBrains Mono',fontSize:'0.6875rem',color:'var(--muted)',marginBottom:4}}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:p.color}}/>
          <span style={{color:'rgba(255,255,255,0.6)'}}>{p.name}:</span>
          <span style={{fontFamily:'JetBrains Mono',fontWeight:700,color:p.color}}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function PriceChart({ snapshots }: Props) {
  if (!snapshots.length) return (
    <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:'0.875rem'}}>
      No price history yet. Data builds over time as you view cards.
    </div>
  )
  const data = snapshots.map(s => ({
    date: new Date(s.fetchedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}),
    Raw: s.rawPrice, 'PSA 10': s.psa10Price,
  }))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{top:8,right:8,left:0,bottom:0}}>
        <defs>
          <linearGradient id="gRaw" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.2}/><stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="gPsa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00FF94" stopOpacity={0.2}/><stop offset="95%" stopColor="#00FF94" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
        <XAxis dataKey="date" tick={{fill:'rgba(255,255,255,0.25)',fontSize:10,fontFamily:'JetBrains Mono'}} axisLine={false} tickLine={false}/>
        <YAxis tick={{fill:'rgba(255,255,255,0.25)',fontSize:10,fontFamily:'JetBrains Mono'}} tickFormatter={fmt} axisLine={false} tickLine={false} width={50}/>
        <Tooltip content={<Tip/>} cursor={{stroke:'rgba(0,229,255,0.15)',strokeWidth:1,strokeDasharray:'4 4'}}/>
        <Area type="monotone" dataKey="Raw" stroke="#00E5FF" strokeWidth={2} fill="url(#gRaw)" dot={false} activeDot={{r:4,fill:'#00E5FF',stroke:'var(--bg2)',strokeWidth:2}}/>
        <Area type="monotone" dataKey="PSA 10" stroke="#00FF94" strokeWidth={2} fill="url(#gPsa)" dot={false} activeDot={{r:4,fill:'#00FF94',stroke:'var(--bg2)',strokeWidth:2}}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}
