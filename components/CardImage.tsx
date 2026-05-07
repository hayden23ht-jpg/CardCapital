'use client'
import Image from 'next/image'
import{useState}from'react'
interface Props{src:string|null;alt:string;width?:number;height?:number;style?:React.CSSProperties}
export default function CardImage({src,alt,width=200,height=280,style}:Props){
  const[err,setErr]=useState(false)
  if(!src||err)return(
    <div style={{width,height,background:'var(--bg3)',border:'1px solid var(--bdr)',borderRadius:10,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,...style}}>
      <span style={{fontSize:'2rem',opacity:0.12}}>🃏</span>
      <span className="mono" style={{fontSize:'9px',color:'var(--t4)',letterSpacing:'0.1em'}}>NO IMAGE</span>
    </div>
  )
  return<Image src={src} alt={alt} width={width} height={height}
    style={{objectFit:'contain',borderRadius:10,...style}} onError={()=>setErr(true)} unoptimized/>
}
