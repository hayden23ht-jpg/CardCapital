import type { Metadata, Viewport } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'CardCapital — Professional Card Intelligence',
  description: 'Institutional-grade Pokémon card market intelligence platform.',
}
export const viewport: Viewport = { themeColor: '#080A0F' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Atmospheric backdrop */}
        <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}}>
          <div style={{position:'absolute',top:'-20%',left:'10%',width:'800px',height:'800px',background:'radial-gradient(ellipse,rgba(212,168,67,0.04) 0%,transparent 65%)',transform:'rotate(-10deg)'}}/>
          <div style={{position:'absolute',bottom:'-25%',right:'0%',width:'700px',height:'700px',background:'radial-gradient(ellipse,rgba(59,130,246,0.03) 0%,transparent 65%)'}}/>
          <div style={{position:'absolute',top:'50%',left:'45%',width:'600px',height:'600px',background:'radial-gradient(ellipse,rgba(16,185,129,0.02) 0%,transparent 70%)',transform:'translate(-50%,-50%)'}}/>
          <div className="grid-tex" style={{position:'absolute',inset:0,opacity:0.7}}/>
        </div>

        <div style={{position:'relative',zIndex:1,display:'flex',minHeight:'100vh'}}>
          <div className="hidden md:block"><Sidebar/></div>
          <main className="md:ml-[260px]" style={{flex:1,minHeight:'100vh',padding:'2.5rem',overflowX:'hidden'}}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
