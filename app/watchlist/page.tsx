'use client'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'

interface WatchItem {
  id:string; cardName:string; setName:string|null; imageUrl:string|null
  targetBuyPrice:number|null; targetSellPrice:number|null; currentPrice:number|null
  notes:string|null; alertEnabled:boolean; createdAt:string
}

const fmt=(n:number|null)=>{if(n==null)return'—';if(n>=1000)return`$${(n/1000).toFixed(1)}k`;return`$${n.toFixed(2)}`}

const EMPTY={cardName:'',setName:'',targetBuyPrice:'',targetSellPrice:'',currentPrice:'',notes:'',imageUrl:''}

export default function WatchlistPage() {
  const [items,setItems] = useState<WatchItem[]>([])
  const [loading,setLoading] = useState(true)
  const [showModal,setShowModal] = useState(false)
  const [editItem,setEditItem] = useState<WatchItem|null>(null)
  const [form,setForm] = useState({...EMPTY})
  const [saving,setSaving] = useState(false)
  const [deleteConfirm,setDeleteConfirm] = useState<string|null>(null)
  const {toast,showToast} = useToast()

  const load = useCallback(async()=>{
    try { const d=await fetch('/api/watchlist').then(r=>r.json()); setItems(d.items??[]) }
    catch { showToast('Failed to load','error') }
    finally { setLoading(false) }
  },[showToast])
  useEffect(()=>{load()},[load])

  const f=(k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>setForm(p=>({...p,[k]:e.target.value}))

  const openAdd=()=>{ setEditItem(null); setForm({...EMPTY}); setShowModal(true) }
  const openEdit=(item:WatchItem)=>{ setEditItem(item); setForm({cardName:item.cardName,setName:item.setName??'',targetBuyPrice:item.targetBuyPrice!=null?String(item.targetBuyPrice):'',targetSellPrice:item.targetSellPrice!=null?String(item.targetSellPrice):'',currentPrice:item.currentPrice!=null?String(item.currentPrice):'',notes:item.notes??'',imageUrl:item.imageUrl??''}); setShowModal(true) }
  const closeModal=()=>{setShowModal(false);setEditItem(null)}

  const save=async()=>{
    if(!form.cardName.trim()){showToast('Card name required','error');return}
    setSaving(true)
    try {
      const payload={cardName:form.cardName.trim(),setName:form.setName||null,imageUrl:form.imageUrl||null,targetBuyPrice:form.targetBuyPrice?parseFloat(form.targetBuyPrice):null,targetSellPrice:form.targetSellPrice?parseFloat(form.targetSellPrice):null,currentPrice:form.currentPrice?parseFloat(form.currentPrice):null,notes:form.notes||null,alertEnabled:true}
      let res:Response
      if(editItem) { res=await fetch(`/api/watchlist/${editItem.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}) }
      else { res=await fetch('/api/watchlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}) }
      if(!res.ok) throw new Error(`HTTP ${res.status}`)
      const saved=await res.json()
      if(editItem) { setItems(p=>p.map(i=>i.id===editItem.id?saved:i)); showToast(`${saved.cardName} updated`) }
      else { setItems(p=>[saved,...p]); showToast(`${saved.cardName} added to watchlist`) }
      closeModal()
    } catch(e){showToast(`Save failed: ${e}`,'error')}
    finally{setSaving(false)}
  }

  const remove=async(id:string)=>{
    const item=items.find(i=>i.id===id)
    try { await fetch(`/api/watchlist/${id}`,{method:'DELETE'}); setItems(p=>p.filter(i=>i.id!==id)); showToast(`${item?.cardName??'Card'} removed`) }
    catch{showToast('Delete failed','error')}
    setDeleteConfirm(null)
  }

  return (
    <div style={{maxWidth:1100}}>
      {toast&&<Toast message={toast.message} type={toast.type} onDismiss={()=>{}}/>}

      <div className="fade-up" style={{marginBottom:'2rem',display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
        <div>
          <div className="section-label" style={{marginBottom:'0.5rem'}}>Price Alerts</div>
          <h1 style={{fontWeight:900,fontSize:'2.5rem',letterSpacing:'-0.04em',color:'white',lineHeight:1}}>Watchlist</h1>
        </div>
        <button className="btn btn-ghost" onClick={openAdd} style={{color:'var(--amber)',borderColor:'rgba(255,167,38,0.25)',background:'rgba(255,167,38,0.08)'}}>◉ Add to Watchlist</button>
      </div>

      {!loading&&items.length===0&&(
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:20,padding:'4rem',textAlign:'center'}}>
          <div style={{fontSize:'3rem',opacity:0.12,marginBottom:'1rem'}}>◉</div>
          <div style={{fontWeight:700,fontSize:'1.25rem',color:'white',marginBottom:'0.5rem',letterSpacing:'-0.02em'}}>Nothing on your watchlist</div>
          <div style={{color:'var(--muted)',marginBottom:'1.5rem',fontSize:'0.9375rem'}}>Search for cards and click <strong style={{color:'var(--amber)'}}>+ Watch</strong>, or add manually.</div>
          <button className="btn btn-ghost" onClick={openAdd} style={{color:'var(--amber)',borderColor:'rgba(255,167,38,0.25)'}}>+ Add Your First Card</button>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1rem'}}>
        {items.map((item,i)=>{
          const upside=item.targetBuyPrice&&item.targetSellPrice?((item.targetSellPrice-item.targetBuyPrice)/item.targetBuyPrice*100):null
          const atTarget=item.currentPrice!=null&&item.targetBuyPrice!=null&&item.currentPrice<=item.targetBuyPrice
          const confirmDel=deleteConfirm===item.id
          return (
            <div key={item.id} style={{background:'var(--bg2)',border:`1px solid ${atTarget?'rgba(0,255,148,0.3)':'var(--border)'}`,borderRadius:16,padding:'1.25rem',animationDelay:`${i*0.04}s`,animation:'fadeUp 0.4s ease both',position:'relative'}}>
              {atTarget&&<div style={{position:'absolute',top:-1,left:16,right:16,height:2,background:'linear-gradient(90deg,transparent,var(--green),transparent)',borderRadius:1}}/>}
              <div style={{display:'flex',gap:'0.875rem',marginBottom:'1rem'}}>
                <div style={{width:50,height:70,borderRadius:8,overflow:'hidden',background:'rgba(255,255,255,0.05)',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                  {item.imageUrl?<Image src={item.imageUrl} alt={item.cardName} fill style={{objectFit:'cover'}} sizes="50px" unoptimized onError={()=>{}}/>:<span style={{fontSize:'1.5rem',opacity:0.15}}>🃏</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:'0.9375rem',letterSpacing:'-0.02em',color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.cardName}</div>
                  {item.setName&&<div style={{fontSize:'0.6875rem',color:'var(--muted)',marginTop:2}}>{item.setName}</div>}
                  {atTarget&&<div style={{marginTop:'0.375rem',fontFamily:'JetBrains Mono',fontSize:'0.5625rem',fontWeight:700,color:'var(--green)',letterSpacing:'0.08em'}}>🎯 AT TARGET PRICE</div>}
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginBottom:'0.75rem'}}>
                <div style={{background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'0.625rem'}}>
                  <div style={{fontFamily:'JetBrains Mono',fontSize:'0.45rem',color:'var(--faint)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:4}}>Buy Under</div>
                  <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:'1rem',color:'var(--amber)'}}>{fmt(item.targetBuyPrice)}</div>
                </div>
                <div style={{background:'rgba(0,255,148,0.04)',borderRadius:8,padding:'0.625rem'}}>
                  <div style={{fontFamily:'JetBrains Mono',fontSize:'0.45rem',color:'var(--faint)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:4}}>Sell Target</div>
                  <div style={{fontFamily:'JetBrains Mono',fontWeight:700,fontSize:'1rem',color:'var(--green)'}}>{fmt(item.targetSellPrice)}</div>
                </div>
              </div>
              {upside!=null&&<div style={{fontFamily:'JetBrains Mono',fontSize:'0.6875rem',color:'var(--green)',marginBottom:'0.5rem',fontWeight:600}}>Est. upside: +{upside.toFixed(0)}%</div>}
              {item.notes&&<div style={{fontSize:'0.75rem',color:'var(--muted)',marginBottom:'0.875rem',lineHeight:1.4}}>{item.notes}</div>}

              {confirmDel?(
                <div style={{display:'flex',gap:'0.5rem'}}>
                  <button className="btn btn-danger btn-sm" onClick={()=>remove(item.id)} style={{flex:1}}>Confirm Delete</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setDeleteConfirm(null)}>Cancel</button>
                </div>
              ):(
                <div style={{display:'flex',gap:'0.5rem'}}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(item)} style={{flex:1,color:'var(--cyan)',borderColor:'rgba(0,212,255,0.2)'}}>Edit</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setDeleteConfirm(item.id)} style={{flex:1,color:'var(--red)',borderColor:'rgba(255,69,96,0.2)'}}>Remove</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showModal&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)closeModal()}}>
          <div className="modal">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
              <h2 style={{fontWeight:800,fontSize:'1.375rem',letterSpacing:'-0.03em',color:'white'}}>{editItem?'Edit Watchlist Item':'Add to Watchlist'}</h2>
              <button onClick={closeModal} style={{background:'none',border:'none',color:'var(--muted)',fontSize:'1.5rem',lineHeight:1,cursor:'pointer'}}>×</button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                <div><label className="label">Card Name *</label><input className="input" value={form.cardName} onChange={f('cardName')} placeholder="e.g. Charizard" autoFocus/></div>
                <div><label className="label">Set Name</label><input className="input" value={form.setName} onChange={f('setName')} placeholder="e.g. Base Set"/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
                <div><label className="label">Current Price ($)</label><input className="input mono" type="number" value={form.currentPrice} onChange={f('currentPrice')} placeholder="0.00"/></div>
                <div><label className="label">Buy Under ($)</label><input className="input mono" type="number" value={form.targetBuyPrice} onChange={f('targetBuyPrice')} placeholder="0.00"/></div>
                <div><label className="label">Sell Target ($)</label><input className="input mono" type="number" value={form.targetSellPrice} onChange={f('targetSellPrice')} placeholder="0.00"/></div>
              </div>
              <div><label className="label">Image URL</label><input className="input" value={form.imageUrl} onChange={f('imageUrl')} placeholder="Optional"/></div>
              <div><label className="label">Notes</label><textarea className="input" value={form.notes} onChange={f('notes')} placeholder="Why are you watching this?" rows={2} style={{resize:'vertical'}}/></div>
            </div>
            <div style={{display:'flex',gap:'0.75rem',marginTop:'1.5rem',paddingTop:'1.25rem',borderTop:'1px solid var(--border)'}}>
              <button className="btn" onClick={save} disabled={saving} style={{flex:1,justifyContent:'center',background:'var(--amber)',color:'#030508',opacity:saving?0.6:1}}>
                {saving?'Saving…':editItem?'Save Changes':'Add to Watchlist'}
              </button>
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
