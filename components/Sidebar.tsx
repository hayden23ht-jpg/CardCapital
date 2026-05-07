'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS = [
  {
    title: 'INTELLIGENCE',
    items: [
      { href: '/',          label: 'Command Center', icon: '◈' },
      { href: '/market',    label: 'Market Intel',   icon: '📊' },
      { href: '/trending',  label: 'Trending',       icon: '🔥', tag: 'HOT' },
      { href: '/deals',     label: 'Deal Scanner',   icon: '⚡', tag: 'NEW' },
    ]
  },
  {
    title: 'PORTFOLIO',
    items: [
      { href: '/portfolio', label: 'My Portfolio',   icon: '◆' },
      { href: '/watchlist', label: 'Watchlist',      icon: '◉' },
      { href: '/analytics', label: 'Analytics',      icon: '📈' },
    ]
  },
  {
    title: 'TOOLS',
    items: [
      { href: '/search',    label: 'Card Search',    icon: '⬡' },
      { href: '/sets',      label: 'Set Browser',    icon: '◫' },
      { href: '/topguard',  label: 'TopGuard Try-On',icon: '🛡', tag: 'NEW' },
      { href: '/settings',  label: 'Settings',       icon: '⚙' },
    ]
  }
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      position:'fixed',top:0,left:0,bottom:0,width:'var(--rail)',
      background:'rgba(8,10,15,0.98)',borderRight:'1px solid var(--line)',
      display:'flex',flexDirection:'column',zIndex:100,backdropFilter:'blur(24px)',
    }}>
      {/* Logo */}
      <div style={{padding:'1.75rem 1.5rem 1.375rem',borderBottom:'1px solid var(--line)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
          <div style={{
            width:40,height:40,borderRadius:10,flexShrink:0,
            background:'linear-gradient(135deg,var(--gold) 0%,#8B5E1A 100%)',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 0 0 1px rgba(212,168,67,0.4), 0 8px 24px rgba(212,168,67,0.2)',
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L4 18h14L11 2z" fill="#0A0C12" opacity="0.9"/>
              <path d="M7.5 14h7l-3.5-8-3.5 8z" fill="rgba(212,168,67,0.5)"/>
            </svg>
          </div>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'1.0625rem',color:'white',letterSpacing:'-0.02em',lineHeight:1}}>CardCapital</div>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.45rem',color:'var(--gold)',letterSpacing:'0.2em',marginTop:3,textTransform:'uppercase'}}>Card Intelligence</div>
          </div>
        </div>
      </div>

      {/* Live */}
      <div style={{padding:'0.625rem 1.5rem',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',gap:'0.625rem'}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:'var(--emerald)',boxShadow:'0 0 6px var(--emerald)',animation:'pulse 2.5s infinite',flexShrink:0}}/>
        <span style={{fontFamily:'DM Mono,monospace',fontSize:'0.5625rem',color:'var(--emerald)',letterSpacing:'0.12em',fontWeight:500}}>LIVE</span>
        <span style={{marginLeft:'auto',fontFamily:'DM Mono,monospace',fontSize:'0.45rem',color:'var(--ink4)',letterSpacing:'0.06em'}}>PriceCharting · TCG</span>
      </div>

      {/* Nav */}
      <nav style={{flex:1,padding:'0.875rem 0.75rem',overflowY:'auto',display:'flex',flexDirection:'column',gap:'1.25rem'}}>
        {SECTIONS.map(section => (
          <div key={section.title}>
            <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.45rem',fontWeight:500,color:'var(--ink4)',letterSpacing:'0.2em',padding:'0 0.625rem',marginBottom:'0.375rem'}}>{section.title}</div>
            <div style={{display:'flex',flexDirection:'column',gap:1}}>
              {section.items.map(item => {
                const active = item.href === '/' ? path === '/' : path.startsWith(item.href)
                return (
                  <Link key={item.href} href={item.href}>
                    <div style={{
                      display:'flex',alignItems:'center',gap:'0.625rem',
                      padding:'0.5rem 0.75rem',borderRadius:10,transition:'all 0.12s',
                      background:active?'rgba(212,168,67,0.08)':'transparent',
                      border:`1px solid ${active?'rgba(212,168,67,0.18)':'transparent'}`,
                      color:active?'var(--gold)':'var(--ink3)',position:'relative',cursor:'pointer',
                    }}>
                      {active && <div style={{position:'absolute',left:0,top:'25%',bottom:'25%',width:2,borderRadius:'0 2px 2px 0',background:'var(--gold)',boxShadow:'0 0 6px var(--gold)'}}/>}
                      <span style={{fontSize:'0.875rem',flexShrink:0,opacity:active?1:0.55}}>{item.icon}</span>
                      <span style={{fontSize:'0.8125rem',fontWeight:active?600:400,flex:1}}>{item.label}</span>
                      {item.tag && <span style={{fontFamily:'DM Mono,monospace',fontSize:'0.4rem',fontWeight:600,letterSpacing:'0.1em',padding:'2px 5px',borderRadius:4,background:item.tag==='HOT'?'rgba(239,68,68,0.15)':'rgba(212,168,67,0.12)',color:item.tag==='HOT'?'var(--red)':'var(--gold)'}}>{item.tag}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{padding:'0.875rem 1.5rem',borderTop:'1px solid var(--line)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontFamily:'DM Mono,monospace',fontSize:'0.45rem',color:'var(--ink4)',letterSpacing:'0.1em'}}>v3.0 · JSON DB</div>
          <div style={{display:'flex',gap:3}}>
            {['var(--gold)','var(--emerald)','var(--blue)','var(--purple)'].map((c,i)=>(
              <div key={i} style={{width:4,height:4,borderRadius:'50%',background:c,opacity:0.5}}/>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
