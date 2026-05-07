'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href:'/', label:'Home', icon:'◈' },
  { href:'/search', label:'Search', icon:'⬡' },
  { href:'/opportunities', label:'Deals', icon:'⚡' },
  { href:'/portfolio', label:'Portfolio', icon:'◆' },
  { href:'/watchlist', label:'Watch', icon:'◉' },
]

export default function BottomNav() {
  const p = usePathname()
  return (
    <nav style={{position:'fixed',bottom:0,left:0,right:0,background:'rgba(3,5,8,0.97)',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',zIndex:100,backdropFilter:'blur(20px)',paddingBottom:'env(safe-area-inset-bottom)'}}>
      {NAV.map(item => {
        const active = item.href==='/'?p==='/':p.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href} style={{flex:1,textDecoration:'none',display:'flex',flexDirection:'column',alignItems:'center',padding:'0.5rem 0 0.375rem',color:active?'var(--cyan)':'var(--muted)'}}>
            <span style={{fontSize:'1.125rem',lineHeight:1,filter:active?'drop-shadow(0 0 5px var(--cyan))':'none'}}>{item.icon}</span>
            <span style={{fontFamily:'JetBrains Mono',fontSize:'0.4375rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:3}}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
