import { useState } from 'react'

const MONTHS = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर']
const DAYS   = ['र','सो','मं','बु','गु','शु','श']

export function fmtDMY(d) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
export function parseDMY(s) {
  if (!s) return new Date()
  const [dd,mm,yy] = s.split('/')
  return new Date(+yy, +mm-1, +dd)
}

export default function Calendar({ value, onChange, onClose }) {
  const sel  = parseDMY(value)
  const now  = new Date()
  const [v, setV] = useState({ y: sel.getFullYear(), m: sel.getMonth() })
  const first = new Date(v.y, v.m, 1).getDay()
  const days  = new Date(v.y, v.m+1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length:days }, (_,i)=>i+1)]
  const prev  = () => setV(x => x.m===0 ? {y:x.y-1,m:11} : {...x,m:x.m-1})
  const next  = () => setV(x => x.m===11? {y:x.y+1,m:0}  : {...x,m:x.m+1})
  const isSel = d => d && sel.getFullYear()===v.y && sel.getMonth()===v.m && sel.getDate()===d
  const isNow = d => d && now.getFullYear()===v.y && now.getMonth()===v.m && now.getDate()===d
  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:199,background:'rgba(0,0,0,.55)',backdropFilter:'blur(3px)'}}/>
      <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,zIndex:200,background:'#1a1a25',borderRadius:'22px 22px 0 0',border:'1px solid #2a2a40',padding:'16px 14px 28px',boxShadow:'0 -8px 40px rgba(0,0,0,.6)',animation:'slideUp .3s cubic-bezier(.34,1.2,.64,1)'}}>
        <div style={{width:36,height:4,background:'#2a2a40',borderRadius:4,margin:'0 auto 14px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <button onClick={prev} style={{background:'#22223a',border:'1px solid #2a2a40',color:'#f1f0ff',width:34,height:34,borderRadius:9,fontSize:17}}>‹</button>
          <div style={{textAlign:'center'}}>
            <p style={{fontWeight:800,fontSize:15}}>{MONTHS[v.m]}</p>
            <p style={{fontSize:11,color:'#9b9bb8'}}>{v.y}</p>
          </div>
          <button onClick={next} style={{background:'#22223a',border:'1px solid #2a2a40',color:'#f1f0ff',width:34,height:34,borderRadius:9,fontSize:17}}>›</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:5}}>
          {DAYS.map(d=><div key={d} style={{textAlign:'center',fontSize:10,color:'#6b6b88',fontWeight:700,padding:'3px 0'}}>{d}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
          {cells.map((d,i)=>(
            <button key={i} onClick={()=>{if(d){onChange(fmtDMY(new Date(v.y,v.m,d)));onClose()}}}
              style={{aspectRatio:'1',borderRadius:8,fontSize:12,fontWeight:600,padding:0,display:'flex',alignItems:'center',justifyContent:'center',
                background:isSel(d)?'linear-gradient(135deg,#f97316,#ef4444)':isNow(d)?'rgba(249,115,22,.15)':'transparent',
                color:isSel(d)?'#fff':isNow(d)?'#f97316':d?'#f1f0ff':'transparent',
                border:isNow(d)&&!isSel(d)?'1px solid #f97316':'1px solid transparent',
                boxShadow:isSel(d)?'0 3px 10px rgba(249,115,22,.4)':'none',
                cursor:d?'pointer':'default'}}>{d||''}</button>
          ))}
        </div>
        <button onClick={()=>{onChange(fmtDMY(new Date()));onClose()}}
          style={{width:'100%',marginTop:12,background:'#22223a',border:'1px solid #2a2a40',color:'#f97316',borderRadius:11,padding:'11px',fontSize:12,fontWeight:700}}>
          📅 आज ({fmtDMY(new Date())})
        </button>
      </div>
    </>
  )
}
