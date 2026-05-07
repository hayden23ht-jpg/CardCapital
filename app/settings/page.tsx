'use client'
import { useEffect, useState } from 'react'

interface Settings {
  gradingCost:number; ebayFeePercent:number; targetProfitPct:number; minRoiPct:number; preferredCondition:string
  apiStatus:{ pricecharting:boolean; pokemontcg:boolean; ebay:boolean }
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => { fetch('/api/settings').then(r => r.json()).then(setS) }, [])

  const save = async () => {
    if (!s) return
    await fetch('/api/settings', { method:'PATCH', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ gradingCost:s.gradingCost, ebayFeePercent:s.ebayFeePercent, targetProfitPct:s.targetProfitPct, minRoiPct:s.minRoiPct, preferredCondition:s.preferredCondition }) })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  if (!s) return <div style={{padding:'2rem',color:'var(--muted)'}}>Loading…</div>

  return (
    <div style={{maxWidth:800}}>
      <div className="fade-up" style={{marginBottom:'2rem'}}>
        <div style={{fontFamily:'JetBrains Mono',fontSize:'0.625rem',color:'var(--cyan)',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:'0.5rem'}}>Configuration</div>
        <h1 style={{fontWeight:900,fontSize:'2.5rem',letterSpacing:'-0.04em',color:'white',lineHeight:1}}>Settings</h1>
      </div>

      {/* API Status */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:20,padding:'1.5rem',marginBottom:'1.5rem'}}>
        <div style={{fontWeight:700,fontSize:'1rem',marginBottom:'1rem'}}>API Key Status</div>
        {[
          { label:'PriceCharting API', ok:s.apiStatus.pricecharting, note:'Required for pricing data' },
          { label:'Pokémon TCG API', ok:s.apiStatus.pokemontcg, note:'Card images & metadata (free)' },
          { label:'eBay Browse API', ok:s.apiStatus.ebay, note:'Optional — live eBay data' },
        ].map(api => (
          <div key={api.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.75rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
            <div>
              <div style={{fontWeight:600,fontSize:'0.9375rem'}}>{api.label}</div>
              <div style={{fontSize:'0.75rem',color:'var(--muted)',marginTop:2}}>{api.note}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.375rem 0.875rem',borderRadius:8,background:api.ok?'rgba(0,255,148,0.08)':'rgba(255,59,92,0.08)',border:`1px solid ${api.ok?'rgba(0,255,148,0.2)':'rgba(255,59,92,0.2)'}`}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:api.ok?'var(--green)':'var(--red)',boxShadow:`0 0 6px ${api.ok?'var(--green)':'var(--red)'}`}}/>
              <span style={{fontFamily:'JetBrains Mono',fontSize:'0.625rem',fontWeight:700,color:api.ok?'var(--green)':'var(--red)',letterSpacing:'0.08em'}}>{api.ok?'CONNECTED':'NOT SET'}</span>
            </div>
          </div>
        ))}
        <div style={{marginTop:'1rem',padding:'0.875rem',background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid var(--border)'}}>
          <div style={{fontFamily:'JetBrains Mono',fontSize:'0.625rem',color:'var(--muted)',letterSpacing:'0.08em',marginBottom:'0.25rem'}}>To update API keys, edit your .env file:</div>
          <div style={{fontFamily:'JetBrains Mono',fontSize:'0.75rem',color:'var(--cyan)'}}>PRICECHARTING_API_TOKEN=your_token_here</div>
        </div>
      </div>

      {/* Calculation settings */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:20,padding:'1.5rem',marginBottom:'1.5rem'}}>
        <div style={{fontWeight:700,fontSize:'1rem',marginBottom:'1rem'}}>Grading & Fee Calculator</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'1rem'}}>
          {[
            { key:'gradingCost', label:'Grading Cost ($)', note:'Per card, e.g. PSA standard' },
            { key:'ebayFeePercent', label:'eBay Fee (%)', note:'Final value fee + PayPal' },
            { key:'targetProfitPct', label:'Target Profit (%)', note:'Minimum upside to flag BUY' },
            { key:'minRoiPct', label:'Min ROI (%)', note:'Minimum acceptable ROI' },
          ].map(f => (
            <div key={f.key}>
              <div style={{fontSize:'0.6875rem',color:'var(--muted)',fontFamily:'JetBrains Mono',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'0.375rem'}}>{f.label}</div>
              <input type="number" value={(s as any)[f.key]} step="0.1"
                onChange={e => setS(p => p ? ({...p, [f.key]:parseFloat(e.target.value)}) : p)}
                style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',borderRadius:8,padding:'0.625rem 0.875rem',color:'white',fontFamily:'JetBrains Mono',fontSize:'1rem'}}/>
              <div style={{fontSize:'0.625rem',color:'var(--muted)',marginTop:'0.25rem'}}>{f.note}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:'1rem'}}>
          <div style={{fontSize:'0.6875rem',color:'var(--muted)',fontFamily:'JetBrains Mono',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'0.375rem'}}>Preferred Condition</div>
          <select value={s.preferredCondition} onChange={e => setS(p => p ? ({...p, preferredCondition:e.target.value}) : p)}
            style={{background:'rgba(255,255,255,0.06)',border:'1px solid var(--border)',borderRadius:8,padding:'0.625rem 0.875rem',color:'white',fontFamily:'Outfit',fontSize:'0.9375rem',width:240}}>
            {['Near Mint','Lightly Played','Moderately Played','Heavily Played'].map(c => <option key={c} value={c} style={{background:'#0C1120'}}>{c}</option>)}
          </select>
        </div>
        <button onClick={save} style={{marginTop:'1.25rem',padding:'0.75rem 2rem',background:saved?'var(--green)':'var(--cyan)',border:'none',borderRadius:9999,color:'#04050A',fontWeight:700,fontSize:'0.9375rem',transition:'background 0.2s'}}>
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* About */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:20,padding:'1.5rem'}}>
        <div style={{fontWeight:700,fontSize:'1rem',marginBottom:'0.75rem'}}>About CardCapital</div>
        <div style={{color:'var(--muted)',fontSize:'0.875rem',lineHeight:1.6}}>
          CardCapital uses the PriceCharting API for live pricing data and the free Pokémon TCG API for card images and metadata.
          Price history is stored locally in SQLite and grows as you browse cards. No data is sent externally beyond API calls.
        </div>
        <div style={{marginTop:'0.875rem',fontFamily:'JetBrains Mono',fontSize:'0.6875rem',color:'var(--muted)'}}>Stack: Next.js 14 · Prisma · SQLite · Recharts · PriceCharting API · Pokémon TCG API</div>
      </div>
    </div>
  )
}
