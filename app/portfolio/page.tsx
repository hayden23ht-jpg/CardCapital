'use client'
import{useEffect,useState,useCallback}from'react'
import Image from'next/image'
import Toast from'@/components/Toast'
import{useToast}from'@/hooks/useToast'
import Link from'next/link'

interface Item{id:string;cardName:string;setName:string|null;cardNumber:string|null;imageUrl:string|null;condition:string;gradeCompany:string|null;grade:string|null;quantity:number;purchasePrice:number;currentValue:number|null;targetPrice:number|null;notes:string|null;status:string;purchaseDate:string;createdAt:string}

const fmt=(n:number|null|undefined)=>{if(n==null)return'—';if(Math.abs(n)>=1e6)return`$${(n/1e6).toFixed(2)}M`;if(Math.abs(n)>=1000)return`$${(n/1000).toFixed(1)}k`;return`$${n.toFixed(2)}`}
const pct=(n:number)=>`${n>=0?'+':''}${n.toFixed(1)}%`
const rc=(n:number)=>n>=0?'var(--green)':'var(--red)'

const CONDITIONS=['Raw','Near Mint','Lightly Played','Moderately Played','Heavily Played','Damaged']
const STATUSES=['Holding','Listed','Sold','Grading','Watchlist']
const GRADERS=['PSA','CGC','BGS','SGC','CSG']
const GRADES=['','1','1.5','2','2.5','3','3.5','4','4.5','5','5.5','6','6.5','7','7.5','8','8.5','9','9.5','10']
const EMPTY={cardName:'',setName:'',cardNumber:'',imageUrl:'',condition:'Raw',gradeCompany:'',grade:'',quantity:'1',purchasePrice:'',purchaseDate:new Date().toISOString().split('T')[0],currentValue:'',targetPrice:'',notes:'',status:'Holding'}
const statusColor=(s:string)=>({'Holding':'var(--blue)','Listed':'var(--gold)','Sold':'var(--green)','Grading':'var(--purple)','Watchlist':'var(--t3)'}[s]??'var(--t3)')

export default function PortfolioPage(){
  const[items,setItems]=useState<Item[]>([])
  const[stats,setStats]=useState({totalInvested:0,totalValue:0,pnl:0})
  const[loading,setLoading]=useState(true)
  const[modal,setModal]=useState(false)
  const[editItem,setEditItem]=useState<Item|null>(null)
  const[form,setForm]=useState({...EMPTY})
  const[saving,setSaving]=useState(false)
  const[delConfirm,setDelConfirm]=useState<string|null>(null)
  const[sort,setSort]=useState<'date'|'value'|'pnl'|'roi'>('date')
  const[filter,setFilter]=useState('all')
  const{toast,showToast}=useToast()

  const load=useCallback(async()=>{
    const d=await fetch('/api/portfolio').then(r=>r.json()).catch(()=>({items:[],totalInvested:0,totalValue:0,pnl:0}))
    setItems(d.items??[]);setStats({totalInvested:d.totalInvested??0,totalValue:d.totalValue??0,pnl:d.pnl??0})
    setLoading(false)
  },[])
  useEffect(()=>{load()},[load])

  const recalc=(current:Item[])=>{
    const ti=current.reduce((s,i)=>s+i.purchasePrice*i.quantity,0)
    const tv=current.reduce((s,i)=>s+(i.currentValue??i.purchasePrice)*i.quantity,0)
    setStats({totalInvested:ti,totalValue:tv,pnl:tv-ti})
  }

  const openAdd=()=>{setEditItem(null);setForm({...EMPTY});setModal(true)}
  const openEdit=(item:Item)=>{
    setEditItem(item)
    setForm({cardName:item.cardName,setName:item.setName??'',cardNumber:item.cardNumber??'',imageUrl:item.imageUrl??'',condition:item.condition,gradeCompany:item.gradeCompany??'',grade:item.grade??'',quantity:String(item.quantity),purchasePrice:String(item.purchasePrice),purchaseDate:item.purchaseDate?.split('T')[0]??new Date().toISOString().split('T')[0],currentValue:item.currentValue!=null?String(item.currentValue):'',targetPrice:item.targetPrice!=null?String(item.targetPrice):'',notes:item.notes??'',status:item.status})
    setModal(true)
  }

  const f=(k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>setForm(p=>({...p,[k]:e.target.value}))

  const save=async()=>{
    if(!form.cardName.trim()){showToast('Card name required','error');return}
    if(!form.purchasePrice||isNaN(Number(form.purchasePrice))){showToast('Purchase price required','error');return}
    setSaving(true)
    try{
      const payload={cardName:form.cardName.trim(),setName:form.setName.trim()||null,cardNumber:form.cardNumber.trim()||null,imageUrl:form.imageUrl.trim()||null,condition:form.condition,gradeCompany:form.gradeCompany||null,grade:form.grade||null,quantity:Math.max(1,parseInt(form.quantity)||1),purchasePrice:parseFloat(form.purchasePrice),purchaseDate:form.purchaseDate||new Date().toISOString(),currentValue:form.currentValue?parseFloat(form.currentValue):null,targetPrice:form.targetPrice?parseFloat(form.targetPrice):null,notes:form.notes.trim()||null,status:form.status}
      const url=editItem?`/api/portfolio/${editItem.id}`:'/api/portfolio'
      const method=editItem?'PATCH':'POST'
      const res=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      if(!res.ok)throw new Error(`HTTP ${res.status}`)
      const saved=await res.json()
      let updated:Item[]
      if(editItem){updated=items.map(i=>i.id===editItem.id?saved:i);showToast(`${saved.cardName} updated`)}
      else{updated=[saved,...items];showToast(`${saved.cardName} added to portfolio`)}
      setItems(updated);recalc(updated);setModal(false)
    }catch(e){showToast(`Save failed: ${e}`,'error')}
    finally{setSaving(false)}
  }

  const del=async(id:string)=>{
    const item=items.find(i=>i.id===id)
    try{await fetch(`/api/portfolio/${id}`,{method:'DELETE'});const u=items.filter(i=>i.id!==id);setItems(u);recalc(u);showToast(`${item?.cardName??'Card'} removed`)}
    catch{showToast('Delete failed','error')}
    setDelConfirm(null)
  }

  const roi=stats.totalInvested>0?stats.pnl/stats.totalInvested*100:0

  const filtered=items
    .filter(i=>filter==='all'||i.status===filter)
    .sort((a,b)=>{
      const av=a.currentValue??a.purchasePrice,bv=b.currentValue??b.purchasePrice
      if(sort==='value')return bv*b.quantity-av*a.quantity
      if(sort==='pnl')return((bv-b.purchasePrice)*b.quantity)-((av-a.purchasePrice)*a.quantity)
      if(sort==='roi')return(b.purchasePrice>0?(bv-b.purchasePrice)/b.purchasePrice:0)-(a.purchasePrice>0?(av-a.purchasePrice)/a.purchasePrice:0)
      return(b.createdAt??'').localeCompare(a.createdAt??'')
    })

  return(
    <div style={{maxWidth:1380}}>
      {toast&&<Toast message={toast.message} type={toast.type} onDismiss={()=>{}}/>}

      <div className="fu" style={{marginBottom:'2rem',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div>
          <div className="label" style={{marginBottom:'0.5rem'}}>Inventory Management</div>
          <h1 className="display" style={{fontSize:'3.5rem',color:'var(--t1)',lineHeight:0.9,letterSpacing:'0.04em'}}>PORTFOLIO</h1>
        </div>
        <div style={{display:'flex',gap:'0.625rem'}}>
          <Link href="/analytics" className="btn btn-outline btn-sm">Analytics →</Link>
          <button className="btn btn-gold" onClick={openAdd}>+ Add Card</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="fu1" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'0.875rem',marginBottom:'1.75rem'}}>
        {[
          {label:'Portfolio Value',value:fmt(stats.totalValue),color:'var(--gold)',sub:`${items.length} cards`},
          {label:'Total Invested',value:fmt(stats.totalInvested),color:'var(--t1)',sub:'Cost basis'},
          {label:'Unrealized P&L',value:fmt(stats.pnl),color:rc(stats.pnl),sub:pct(roi)+' ROI'},
          {label:'Avg ROI',value:pct(items.length?items.reduce((s,i)=>{const v=i.currentValue??i.purchasePrice;return s+((v-i.purchasePrice)/i.purchasePrice*100)},0)/items.length:0),color:items.length?rc(items.reduce((s,i)=>{const v=i.currentValue??i.purchasePrice;return s+((v-i.purchasePrice)/i.purchasePrice*100)},0)/items.length):rc(0),sub:'Per card'},
        ].map(s=>(
          <div key={s.label} style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:'var(--radius)',padding:'1.125rem',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${s.color}60,transparent)`}}/>
            <div className="label" style={{marginBottom:'0.625rem'}}>{s.label}</div>
            {loading?<div className="skel" style={{height:28,marginBottom:4}}/>:<div className="display" style={{fontSize:'1.875rem',color:s.color,letterSpacing:'0.02em',marginBottom:'0.2rem'}}>{s.value}</div>}
            <div style={{fontSize:'11px',color:'var(--t4)'}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter + sort bar */}
      <div className="fu2" style={{display:'flex',gap:'0.75rem',marginBottom:'1.25rem',alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:'4px',background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:3}}>
          {['all',...STATUSES].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} className="mono"
              style={{padding:'5px 12px',borderRadius:7,fontSize:'10px',fontWeight:500,background:filter===s?'var(--bg5)':'transparent',border:`1px solid ${filter===s?'var(--bdrg)':'transparent'}`,color:filter===s?'var(--gold)':'var(--t4)',cursor:'pointer',transition:'all 0.15s',letterSpacing:'0.08em',textTransform:'capitalize'}}>
              {s==='all'?'All':s}
            </button>
          ))}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:'4px',background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:9,padding:3}}>
          {[{k:'date',l:'Date'},{k:'value',l:'Value'},{k:'pnl',l:'P&L'},{k:'roi',l:'ROI'}].map(s=>(
            <button key={s.k} onClick={()=>setSort(s.k as any)} className="mono"
              style={{padding:'5px 12px',borderRadius:7,fontSize:'10px',fontWeight:500,background:sort===s.k?'var(--bg5)':'transparent',border:`1px solid ${sort===s.k?'var(--bdr2)':'transparent'}`,color:sort===s.k?'var(--t1)':'var(--t4)',cursor:'pointer',transition:'all 0.15s',letterSpacing:'0.08em'}}>
              {s.l}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!loading&&items.length===0&&(
        <div style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:'var(--radius)',padding:'4rem',textAlign:'center'}}>
          <div className="display" style={{fontSize:'3rem',color:'var(--t4)',letterSpacing:'0.04em',marginBottom:'1rem',opacity:0.2}}>◆</div>
          <div style={{fontWeight:700,fontSize:'1.25rem',color:'var(--t1)',marginBottom:'0.5rem'}}>Portfolio is empty</div>
          <div style={{color:'var(--t3)',marginBottom:'1.5rem',fontSize:'14px'}}>Search for cards and click <strong style={{color:'var(--green)'}}>+ Own</strong>, or add manually.</div>
          <button className="btn btn-gold" onClick={openAdd}>+ Add First Card</button>
        </div>
      )}

      {/* Table */}
      {filtered.length>0&&(
        <div className="fu3" style={{background:'var(--bg2)',border:'1px solid var(--bdr)',borderRadius:'var(--radius)',overflow:'hidden'}}>
          <table className="tbl">
            <thead><tr>
              <th style={{width:52}}></th>
              <th>Card</th>
              <th>Grade</th>
              <th style={{textAlign:'right'}}>Qty</th>
              <th style={{textAlign:'right'}}>Cost</th>
              <th style={{textAlign:'right'}}>Value</th>
              <th style={{textAlign:'right'}}>P&L</th>
              <th style={{textAlign:'right'}}>ROI</th>
              <th>Status</th>
              <th style={{width:110}}>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((item,i)=>{
                const val=item.currentValue??item.purchasePrice
                const ip=(val-item.purchasePrice)*item.quantity
                const ir=item.purchasePrice>0?(val-item.purchasePrice)/item.purchasePrice*100:0
                const delConf=delConfirm===item.id
                return(
                  <tr key={item.id} style={{animationDelay:`${i*0.03}s`,animation:'fadeUp 0.35s ease both'}}>
                    <td>
                      <div style={{width:42,height:58,borderRadius:7,overflow:'hidden',background:'var(--bg3)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {item.imageUrl?<Image src={item.imageUrl} alt={item.cardName} fill style={{objectFit:'cover'}} sizes="42px" unoptimized onError={()=>{}}/>:<span style={{fontSize:'1.1rem',opacity:0.15}}>🃏</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{fontWeight:600,fontSize:'13px',color:'var(--t1)'}}>{item.cardName}</div>
                      <div className="mono" style={{fontSize:'9px',color:'var(--t4)'}}>{[item.setName,item.cardNumber?`#${item.cardNumber}`:null].filter(Boolean).join(' · ')}</div>
                    </td>
                    <td style={{fontSize:'12px',color:item.grade?'var(--gold)':'var(--t3)',fontWeight:item.grade?600:400,fontFamily:item.grade?'JetBrains Mono':'inherit'}}>
                      {item.grade?`${item.gradeCompany} ${item.grade}`:item.condition}
                    </td>
                    <td className="mono" style={{textAlign:'right',fontSize:'12px'}}>{item.quantity}</td>
                    <td className="mono" style={{textAlign:'right',fontSize:'12px',color:'var(--t3)'}}>{fmt(item.purchasePrice*item.quantity)}</td>
                    <td className="mono" style={{textAlign:'right',fontSize:'12px',color:'var(--gold)',fontWeight:600}}>{fmt(val*item.quantity)}</td>
                    <td className="mono" style={{textAlign:'right',fontSize:'13px',fontWeight:700,color:rc(ip)}}>{ip>=0?'+':''}{fmt(ip)}</td>
                    <td className="mono" style={{textAlign:'right',fontSize:'12px',color:rc(ir),fontWeight:500}}>{pct(ir)}</td>
                    <td>
                      <span className="mono" style={{fontSize:'9px',fontWeight:500,padding:'2px 7px',borderRadius:4,background:`${statusColor(item.status)}15`,color:statusColor(item.status),letterSpacing:'0.06em',border:`1px solid ${statusColor(item.status)}30`}}>{item.status}</span>
                    </td>
                    <td>
                      {delConf?(
                        <div style={{display:'flex',gap:'3px'}}>
                          <button className="btn btn-sm" onClick={()=>del(item.id)} style={{background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:7,color:'var(--red)',fontSize:'11px',padding:'4px 8px'}}>Confirm</button>
                          <button className="btn btn-ghost btn-xs" onClick={()=>setDelConfirm(null)}>✕</button>
                        </div>
                      ):(
                        <div style={{display:'flex',gap:'3px'}}>
                          <button className="btn btn-ghost btn-xs" onClick={()=>openEdit(item)} style={{color:'var(--blue)',fontSize:'11px'}}>Edit</button>
                          <button className="btn btn-ghost btn-xs" onClick={()=>setDelConfirm(item.id)} style={{color:'var(--red)',fontSize:'11px'}}>Del</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal&&(
        <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
              <h2 className="display" style={{fontSize:'1.5rem',letterSpacing:'0.04em'}}>{editItem?'EDIT CARD':'ADD CARD'}</h2>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:'var(--t4)',fontSize:'1.5rem',lineHeight:1,cursor:'pointer',padding:'0.25rem'}}>×</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                <div><label className="label">Card Name *</label><input className="inp" value={form.cardName} onChange={f('cardName')} placeholder="e.g. Charizard" autoFocus/></div>
                <div><label className="label">Set Name</label><input className="inp" value={form.setName} onChange={f('setName')} placeholder="e.g. Base Set"/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                <div><label className="label">Card #</label><input className="inp" value={form.cardNumber} onChange={f('cardNumber')} placeholder="e.g. 4/102"/></div>
                <div><label className="label">Condition</label><select className="inp" value={form.condition} onChange={f('condition')}>{CONDITIONS.map(c=><option key={c} value={c} style={{background:'var(--bg2)'}}>{c}</option>)}</select></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                <div><label className="label">Grade Company</label><select className="inp" value={form.gradeCompany} onChange={f('gradeCompany')}><option value="" style={{background:'var(--bg2)'}}>Not graded</option>{GRADERS.map(g=><option key={g} value={g} style={{background:'var(--bg2)'}}>{g}</option>)}</select></div>
                <div><label className="label">Grade</label><select className="inp" value={form.grade} onChange={f('grade')}><option value="" style={{background:'var(--bg2)'}}>—</option>{GRADES.filter(g=>g).map(g=><option key={g} value={g} style={{background:'var(--bg2)'}}>{g}</option>)}</select></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'0.75rem'}}>
                <div><label className="label">Purchase Price ($) *</label><input className="inp mono" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={f('purchasePrice')} placeholder="0.00"/></div>
                <div><label className="label">Current Value ($)</label><input className="inp mono" type="number" min="0" step="0.01" value={form.currentValue} onChange={f('currentValue')} placeholder="Same as cost"/></div>
                <div><label className="label">Target Sell ($)</label><input className="inp mono" type="number" min="0" step="0.01" value={form.targetPrice} onChange={f('targetPrice')} placeholder="Optional"/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
                <div><label className="label">Quantity</label><input className="inp mono" type="number" min="1" value={form.quantity} onChange={f('quantity')}/></div>
                <div><label className="label">Purchase Date</label><input className="inp" type="date" value={form.purchaseDate} onChange={f('purchaseDate')}/></div>
                <div><label className="label">Status</label><select className="inp" value={form.status} onChange={f('status')}>{STATUSES.map(s=><option key={s} value={s} style={{background:'var(--bg2)'}}>{s}</option>)}</select></div>
              </div>
              <div><label className="label">Card Image URL</label><input className="inp" value={form.imageUrl} onChange={f('imageUrl')} placeholder="https://images.pokemontcg.io/…"/></div>
              <div><label className="label">Notes</label><textarea className="inp" value={form.notes} onChange={f('notes')} placeholder="Optional notes…" rows={2} style={{resize:'vertical'}}/></div>
            </div>
            <div style={{display:'flex',gap:'0.625rem',marginTop:'1.5rem',paddingTop:'1.25rem',borderTop:'1px solid var(--bdr)'}}>
              <button className="btn btn-gold" onClick={save} disabled={saving} style={{flex:1,borderRadius:10,padding:'0.75rem',opacity:saving?0.6:1,justifyContent:'center'}}>
                {saving?<><div style={{width:14,height:14,border:'2px solid rgba(6,6,7,0.2)',borderTopColor:'#060607',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/> Saving…</>:(editItem?'Save Changes':'Add to Portfolio')}
              </button>
              <button className="btn btn-outline" onClick={()=>setModal(false)} style={{borderRadius:10}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
