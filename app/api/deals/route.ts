
import {NextResponse} from 'next/server'
import {pcSearch} from '@/lib/pricecharting'
import {tcgSearch} from '@/lib/pokemontcg'
import {scoreCard} from '@/lib/scoring'

const SCANS=['Charizard','Lugia','Umbreon','Pikachu','Mewtwo','Blastoise','Rayquaza','Gengar','Dragonite','Espeon']

export async function GET() {
  try {
    const idx=Math.floor(Date.now()/300000)%SCANS.length
    const q=SCANS[idx]
    const [pc,tcg]=await Promise.allSettled([pcSearch(q,20),tcgSearch(q)])
    const pcCards=pc.status==='fulfilled'?pc.value:[]
    const tcgCards=tcg.status==='fulfilled'?tcg.value:[]

    const deals=pcCards
      .filter(p=>p.rawPrice&&p.psa10Price&&p.rawPrice>0&&p.psa10Price>p.rawPrice*1.5)
      .map(p=>{
        const match=tcgCards.find(t=>t.name.toLowerCase().includes(p.name.split(' ')[0].toLowerCase()))
        const sc=scoreCard({rawPrice:p.rawPrice,psa10Price:p.psa10Price,psa9Price:p.psa9Price,gradedPrice:p.gradedPrice,volume:p.volume,rarity:match?.rarity??'',releaseYear:null})
        return {
          pcId:p.id,name:p.name,setName:p.consoleName.replace(/pokemon ?/gi,'').trim(),
          imageUrl:match?.imageUrl??null,rawPrice:p.rawPrice,psa10Price:p.psa10Price,
          volume:p.volume,score:sc.total,recommendation:sc.recommendation,
          estimatedUpside:sc.estimatedUpside,netProfit:sc.netProfit,buyUnder:sc.buyUnder,
          reason:sc.reason,searchUrl:p.searchUrl,
          spreadMultiple:p.rawPrice>0?Math.round(p.psa10Price/p.rawPrice*10)/10:0,
        }
      })
      .filter(d=>d.recommendation==='BUY'&&d.estimatedUpside&&d.estimatedUpside>15)
      .sort((a,b)=>(b.estimatedUpside||0)-(a.estimatedUpside||0))
      .slice(0,12)

    return NextResponse.json({deals,query:q,total:deals.length})
  } catch(err) {
    return NextResponse.json({deals:[],error:String(err)})
  }
}
