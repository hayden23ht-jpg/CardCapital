'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const fmt = (n: number | null) => { if (n == null) return '—'; if (Math.abs(n) >= 1000000) return `$${(n/1000000).toFixed(2)}M`; if (Math.abs(n) >= 1000) return `$${(n/1000).toFixed(1)}k`; return `$${n.toFixed(2)}` }
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
const scoreColor = (s: number) => s >= 75 ? 'var(--emerald)' : s >= 55 ? 'var(--gold)' : s >= 40 ? 'var(--blue)' : 'var(--red)'
const recCls = (r: string) => r === 'BUY' ? 'buy' : r === 'HOLD' ? 'hold' : r === 'SELL' ? 'sell' : 'watch'

// Animated counter
function Counter({ target, prefix = '', suffix = '', duration = 1200 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0)
  const raf = useRef<number>()
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      setVal(target * (1 - Math.pow(1 - t, 3)))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration])
  const display = target >= 1000 ? `${(val/1000).toFixed(1)}k` : target >= 100 ? Math.round(val).toString() : val.toFixed(2)
  return <>{prefix}{display}{suffix}</>
}

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tip" style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
      <div style={{ color: 'var(--ink3)', marginBottom: 6, fontFamily: 'DM Mono,monospace', fontSize: '0.625rem' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: 'var(--ink2)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: p.color }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function CommandCenter() {
  const [market, setMarket] = useState<any>(null)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [trending, setTrending] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState('')

  useEffect(() => {
    setNow(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    Promise.all([
      fetch('/api/market').then(r => r.json()),
      fetch('/api/portfolio').then(r => r.json()),
      fetch('/api/trending').then(r => r.json()),
      fetch('/api/prices/chart?days=30').then(r => r.json()),
    ]).then(([m, p, t, c]) => {
      setMarket(m)
      setPortfolio(p)
      setTrending(t.trending?.slice(0, 4) ?? [])
      setChartData(c.points ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const port = portfolio
  const roi = port && port.totalInvested > 0 ? (port.pnl / port.totalInvested * 100) : 0
  const sentimentLabel = !market ? '—' : market.sentiment >= 60 ? 'BULLISH' : market.sentiment >= 40 ? 'NEUTRAL' : 'BEARISH'
  const sentimentColor = !market ? 'var(--ink3)' : market.sentiment >= 60 ? 'var(--emerald)' : market.sentiment >= 40 ? 'var(--gold)' : 'var(--red)'

  // Ticker data
  const tickerItems = (market?.cards ?? []).slice(0, 8).map((c: any) => ({
    name: c.name.split(' - ')[0], price: c.rawPrice, change: (Math.random() - 0.4) * 15
  }))

  return (
    <div style={{ maxWidth: 1360 }}>

      {/* Header */}
      <div className="fade-up" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div className="label" style={{ marginBottom: '0.5rem' }}>Pokémon Card Intelligence · {now}</div>
          <h1 className="display" style={{ fontSize: '2.875rem', color: 'white', lineHeight: 1 }}>
            Command Center
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/market" className="btn btn-ghost btn-sm">📊 Market Intel</Link>
          <Link href="/deals" className="btn btn-gold btn-sm">⚡ Find Deals</Link>
        </div>
      </div>

      {/* Ticker tape */}
      {tickerItems.length > 0 && (
        <div className="fade-up-1 ticker-wrap" style={{ background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 10, padding: '0.5rem 0', marginBottom: '2rem', overflow: 'hidden' }}>
          <div className="ticker-inner">
            {[...tickerItems, ...tickerItems].map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0 2rem', borderRight: '1px solid var(--line)', whiteSpace: 'nowrap' }}>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--gold)' }}>{item.name}</span>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.6875rem', color: 'white' }}>{fmt(item.price)}</span>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.5625rem', color: item.change >= 0 ? 'var(--emerald)' : 'var(--red)', fontWeight: 600 }}>
                  {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.875rem', marginBottom: '2rem' }}>
        {[
          { label: 'Portfolio Value', val: port?.totalValue ?? 0, prefix: '$', color: 'var(--gold)', note: `${port?.items?.length ?? 0} cards` },
          { label: 'Total Invested', val: port?.totalInvested ?? 0, prefix: '$', color: 'white', note: 'Cost basis' },
          { label: 'Unrealized P&L', val: Math.abs(port?.pnl ?? 0), prefix: (port?.pnl ?? 0) >= 0 ? '+$' : '-$', color: (port?.pnl ?? 0) >= 0 ? 'var(--emerald)' : 'var(--red)', note: `${pct(roi)} ROI` },
          { label: 'Market Sentiment', raw: sentimentLabel, color: sentimentColor, note: `${market?.sentiment ?? 0}% bullish` },
          { label: 'Avg Card Price', val: market?.avgPrice ?? 0, prefix: '$', color: 'var(--blue)', note: `${market?.totalScanned ?? 0} scanned` },
          { label: 'Buy Signals', val: market?.buySignals ?? 0, prefix: '', suffix: ' cards', color: 'var(--emerald)', note: 'Active BUYs' },
        ].map((s: any, i) => (
          <div key={s.label} className="stat-card" style={{ '--accent-clr': s.color, background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '1rem' } as any}>
            <div className="label" style={{ marginBottom: '0.75rem' }}>{s.label}</div>
            {loading ? <div className="skeleton" style={{ height: 28, borderRadius: 6 }} /> : (
              <div style={{ fontFamily: 'DM Mono,monospace', fontWeight: 700, fontSize: '1.375rem', color: s.color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '0.25rem' }}>
                {s.raw ?? (s.val !== undefined ? <Counter target={s.val} prefix={s.prefix ?? ''} suffix={s.suffix ?? ''} /> : '—')}
              </div>
            )}
            <div style={{ fontSize: '0.6875rem', color: 'var(--ink3)' }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Main grid: chart + trending */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Market chart */}
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <div className="label" style={{ marginBottom: '0.25rem' }}>30-Day Market Index</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: '1.125rem', color: 'white' }}>Raw Price Trend</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {chartData.length > 0 && (() => {
                const first = chartData[0]?.raw ?? 0
                const last  = chartData[chartData.length - 1]?.raw ?? 0
                const change = first > 0 ? ((last - first) / first * 100) : 0
                return (
                  <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.875rem', fontWeight: 700, color: change >= 0 ? 'var(--emerald)' : 'var(--red)', padding: '0.25rem 0.75rem', borderRadius: 8, background: change >= 0 ? 'var(--emerald-dim)' : 'var(--red-dim)', border: `1px solid ${change >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                    {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
                  </div>
                )
              })()}
            </div>
          </div>
          {loading ? <div className="skeleton" style={{ height: 220 }} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRaw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4A843" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#D4A843" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPsa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'rgba(242,240,232,0.28)', fontSize: 10, fontFamily: 'DM Mono,monospace' }} interval={6} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(242,240,232,0.28)', fontSize: 10, fontFamily: 'DM Mono,monospace' }} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v.toFixed(0)}`} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(212,168,67,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="raw" name="Raw" stroke="#D4A843" strokeWidth={2} fill="url(#gRaw)" dot={false} activeDot={{ r: 4, fill: '#D4A843', stroke: 'var(--bg1)', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="psa10" name="PSA 10" stroke="#10B981" strokeWidth={2} fill="url(#gPsa)" dot={false} activeDot={{ r: 4, fill: '#10B981', stroke: 'var(--bg1)', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Trending sidebar */}
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="label">🔥 Trending Now</div>
            <Link href="/trending" style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.5625rem', color: 'var(--gold)', letterSpacing: '0.05em' }}>All →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {loading ? [...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />) :
              trending.map((card: any, i: number) => (
                <Link key={card.pcId} href={`/cards/${card.pcId}?pcId=${card.pcId}`}>
                  <div className="card-lift" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 10, cursor: 'pointer' }}>
                    <div style={{ width: 38, height: 52, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {card.imageUrl ? <Image src={card.imageUrl} alt={card.name} fill style={{ objectFit: 'cover' }} sizes="38px" unoptimized /> : <span style={{ fontSize: '1.25rem', opacity: 0.2 }}>🃏</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>
                      <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.5625rem', color: 'var(--ink3)', marginTop: 2 }}>{fmt(card.rawPrice)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.6875rem', fontWeight: 700, color: card.momentum7d >= 0 ? 'var(--emerald)' : 'var(--red)' }}>
                        {card.momentum7d >= 0 ? '▲' : '▼'} {Math.abs(card.momentum7d).toFixed(1)}%
                      </div>
                      <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.5rem', color: 'var(--ink3)', marginTop: 2 }}>7d</div>
                    </div>
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
      </div>

      {/* Set performance + Hot cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Set performance */}
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="label">Set Performance (30d)</div>
            <Link href="/market" style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.5625rem', color: 'var(--gold)' }}>Full Report →</Link>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Set</th>
                <th style={{ textAlign: 'right' }}>7d</th>
                <th style={{ textAlign: 'right' }}>30d</th>
                <th style={{ textAlign: 'right' }}>90d</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_,i) => (
                <tr key={i}><td colSpan={5}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td></tr>
              )) : (market?.setPerformance ?? []).slice(0, 6).map((s: any) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'white' }}>{s.name}</div>
                    <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.5rem', color: 'var(--ink3)' }}>{s.year}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono,monospace', fontSize: '0.8125rem', fontWeight: 600, color: s.growth7d >= 0 ? 'var(--emerald)' : 'var(--red)' }}>
                    {s.growth7d >= 0 ? '+' : ''}{s.growth7d.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono,monospace', fontSize: '0.8125rem', fontWeight: 700, color: s.growth30d >= 0 ? 'var(--emerald)' : 'var(--red)' }}>
                    {s.growth30d >= 0 ? '+' : ''}{s.growth30d.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono,monospace', fontSize: '0.8125rem', color: s.growth90d >= 0 ? 'var(--emerald)' : 'var(--red)' }}>
                    {s.growth90d >= 0 ? '+' : ''}{s.growth90d.toFixed(1)}%
                  </td>
                  <td><span className={`pill pill-${s.popular ? 'buy' : s.growth30d > 5 ? 'watch' : 'hold'}`}>{s.popular ? 'BUY' : s.growth30d > 5 ? 'WATCH' : 'HOLD'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hot opportunities */}
        <div style={{ background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="label">🔥 Top BUY Signals</div>
            <Link href="/deals" style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.5625rem', color: 'var(--gold)' }}>All Deals →</Link>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Card</th>
                <th style={{ textAlign: 'right' }}>Raw</th>
                <th style={{ textAlign: 'right' }}>PSA 10</th>
                <th style={{ textAlign: 'right' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_,i) => (
                <tr key={i}><td colSpan={4}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td></tr>
              )) : (market?.cards ?? []).filter((c: any) => c.rec === 'BUY').slice(0, 6).map((card: any) => (
                <tr key={card.id} onClick={() => window.location.href = `/cards/${card.id}?pcId=${card.id}`}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'white', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>
                    <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.5rem', color: 'var(--ink3)' }}>{card.consoleName?.replace(/pokemon ?/gi,'').slice(0,24)}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono,monospace', fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{fmt(card.rawPrice)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'DM Mono,monospace', fontSize: '0.875rem', color: 'var(--emerald)' }}>{fmt(card.psa10Price)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'DM Mono,monospace', fontSize: '0.875rem', fontWeight: 700, color: scoreColor(card.score) }}>{card.score}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick nav cards */}
      <div className="fade-up-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem' }}>
        {[
          { href: '/market',    title: 'Market Intelligence', desc: 'Full market analysis, set rankings, sentiment', icon: '📊', color: 'var(--gold)' },
          { href: '/trending',  title: 'Trending Cards',      desc: 'Cards gaining momentum this week',            icon: '🔥', color: 'var(--red)' },
          { href: '/topguard',  title: 'TopGuard Try-On',     desc: 'Preview ShopHardGuard protection products',   icon: '🛡', color: 'var(--blue)' },
          { href: '/analytics', title: 'Portfolio Analytics', desc: 'P&L breakdown, ROI, winners & losers',        icon: '📈', color: 'var(--emerald)' },
        ].map(card => (
          <Link key={card.href} href={card.href}>
            <div className="card-lift" style={{ background: 'var(--bg1)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '1.25rem', cursor: 'pointer', height: '100%' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{card.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: card.color, marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>{card.title}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--ink3)', lineHeight: 1.4 }}>{card.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
