interface Props { rec: string; size?: 'sm' | 'md' | 'lg' }
const colors: Record<string, { bg: string; color: string; border: string }> = {
  BUY:   { bg:'rgba(0,255,148,0.12)', color:'#00FF94', border:'rgba(0,255,148,0.25)' },
  HOLD:  { bg:'rgba(0,229,255,0.12)', color:'#00E5FF', border:'rgba(0,229,255,0.25)' },
  SELL:  { bg:'rgba(255,59,92,0.12)', color:'#FF3B5C', border:'rgba(255,59,92,0.25)' },
  WATCH: { bg:'rgba(255,184,48,0.12)', color:'#FFB830', border:'rgba(255,184,48,0.25)' },
}
const sizes = { sm:'0.5625rem', md:'0.75rem', lg:'0.875rem' }
export default function RecBadge({ rec, size = 'sm' }: Props) {
  const c = colors[rec] ?? colors.HOLD
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:6,background:c.bg,border:`1px solid ${c.border}`,fontFamily:'JetBrains Mono',fontSize:sizes[size],fontWeight:700,letterSpacing:'0.1em',color:c.color}}>
      <span style={{width:5,height:5,borderRadius:'50%',background:c.color,boxShadow:`0 0 5px ${c.color}`,display:'inline-block'}}/>
      {rec}
    </span>
  )
}
