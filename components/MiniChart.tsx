'use client'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
interface Props { data:number[]; color:string; height?:number }
export default function MiniChart({ data, color, height=40 }: Props) {
  if (!data.length) return null
  const formatted = data.map((v,i)=>({v,i}))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false}
          activeDot={{r:3,fill:color,stroke:'var(--bg2)',strokeWidth:2}}/>
        <Tooltip content={()=>null}/>
      </LineChart>
    </ResponsiveContainer>
  )
}
