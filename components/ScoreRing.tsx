interface Props{score:number;size?:number}
const c=(s:number)=>s>=75?'var(--green)':s>=55?'var(--gold)':s>=40?'var(--blue)':'var(--red)'
const l=(s:number)=>s>=75?'BUY':s>=55?'HOLD':s>=40?'WATCH':'SELL'
export default function ScoreRing({score,size=64}:Props){
  const col=c(score),r=size/2-5,circ=2*Math.PI*r,dash=(score/100)*circ
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
      <div style={{position:'relative',width:size,height:size}}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)'}}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={4}
            strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} className="ring-fill"
            style={{filter:`drop-shadow(0 0 5px ${col}80)`}}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span className="mono" style={{fontWeight:500,fontSize:size*0.22,color:col,lineHeight:1}}>{score}</span>
        </div>
      </div>
      <span className="mono" style={{fontSize:'9px',fontWeight:500,letterSpacing:'0.12em',color:col}}>{l(score)}</span>
    </div>
  )
}
