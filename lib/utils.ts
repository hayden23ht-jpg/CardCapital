
export const fmt = (p: number | null | undefined): string => {
  if (p == null) return '—'
  if (p >= 1000000) return `$${(p / 1000000).toFixed(2)}M`
  if (p >= 1000) return `$${(p / 1000).toFixed(1)}k`
  return `$${p.toFixed(2)}`
}

export const fmtPct = (p: number | null | undefined): string => {
  if (p == null) return '—'
  return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`
}

export const scoreColor = (s: number): string =>
  s >= 75 ? '#00FF94' : s >= 55 ? '#00E5FF' : s >= 40 ? '#FFB830' : '#FF3B5C'

export const recColor = (r: string): string => ({
  BUY: '#00FF94', HOLD: '#00E5FF', SELL: '#FF3B5C', WATCH: '#FFB830'
}[r] ?? '#aaa')

export const recBg = (r: string): string => ({
  BUY: 'rgba(0,255,148,0.12)', HOLD: 'rgba(0,229,255,0.12)',
  SELL: 'rgba(255,59,92,0.12)', WATCH: 'rgba(255,184,48,0.12)'
}[r] ?? 'rgba(255,255,255,0.06)')
