'use client'
import{useState,useCallback}from'react'
export function useToast(){
  const[toast,setToast]=useState<{message:string;type:'success'|'error'|'info'}|null>(null)
  const showToast=useCallback((message:string,type:'success'|'error'|'info'='success')=>{
    setToast({message,type});setTimeout(()=>setToast(null),4000)
  },[])
  return{toast,showToast}
}
