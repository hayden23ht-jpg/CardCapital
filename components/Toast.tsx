'use client'
interface Props{message:string;type?:'success'|'error'|'info';onDismiss:()=>void}
export default function Toast({message,type='success',onDismiss}:Props){
  return <div className={`toast${type==='error'?' toast-err':type==='info'?' toast-info':''}`} onClick={onDismiss}>
    <span style={{fontSize:'16px',flexShrink:0}}>{type==='success'?'✓':type==='error'?'✗':'ℹ'}</span>
    {message}
  </div>
}
