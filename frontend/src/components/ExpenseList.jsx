import { useState } from 'react'
import ExpenseItem from './ExpenseItem.jsx'
import Calendar from './Calendar.jsx'

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN')

export default function ExpenseList({ expenses, filters, setFilters, onDelete, onEdit, onStatusChange, adminView, loading }) {
  const [showCalS, setShowCalS] = useState(false)
  const [showCalE, setShowCalE] = useState(false)
  const [showFilt, setShowFilt] = useState(false)
  const set = (k,v) => setFilters(f=>({...f,[k]:v}))
  const tPay = expenses.filter(e=>e.type==='pay').reduce((s,e)=>s+e.amount,0)
  const tRec = expenses.filter(e=>e.type==='receive').reduce((s,e)=>s+e.amount,0)

  return (
    <div style={{paddingBottom:20}} className="fade">
      <div style={{background:'var(--surface)',padding:'12px 14px',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:50}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <h2 style={{fontSize:19,fontWeight:800}}>📋 सर्व नोंदी</h2>
          <button onClick={()=>setShowFilt(!showFilt)} style={{background:showFilt?'#f97316':'#1e1e2a',color:showFilt?'#fff':'#9b9bb8',border:`1px solid ${showFilt?'#f97316':'#2a2a40'}`,borderRadius:9,padding:'5px 11px',fontSize:11,fontWeight:700}}>
            🔧 {showFilt?'बंद':'फिल्टर'}
          </button>
        </div>
        <input value={filters.search||''} onChange={e=>set('search',e.target.value)} placeholder="🔍 शोधा..."
          style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:9,padding:'9px 12px',color:'var(--text)',fontSize:12}}/>
        {showFilt && (
          <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:9}}>
            <div>
              <p style={{fontSize:10,color:'var(--muted)',fontWeight:700,marginBottom:5}}>कालावधी</p>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {[['all','सर्व'],['today','आज'],['week','आठवडा'],['month','महिना'],['custom','📅 कस्टम']].map(([id,l])=>(
                  <button key={id} onClick={()=>set('filter',id)} style={{padding:'5px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:filters.filter===id?'#f97316':'#1e1e2a',color:filters.filter===id?'#fff':'#9b9bb8',border:`1px solid ${filters.filter===id?'#f97316':'#2a2a40'}`}}>{l}</button>
                ))}
              </div>
            </div>
            {filters.filter==='custom' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[['startDate','पासून',showCalS,setShowCalS],['endDate','पर्यंत',showCalE,setShowCalE]].map(([k,l,show,setShow])=>(
                  <div key={k}>
                    <p style={{fontSize:10,color:'var(--muted)',fontWeight:700,marginBottom:4}}>{l}</p>
                    <button onClick={()=>setShow(true)} style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 10px',color:filters[k]?'#f1f0ff':'#6b6b88',fontSize:11,textAlign:'left',display:'flex',justifyContent:'space-between'}}>
                      <span>{filters[k]||'तारीख'}</span><span>📅</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div>
              <p style={{fontSize:10,color:'var(--muted)',fontWeight:700,marginBottom:5}}>स्थिती</p>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {[['','सर्व'],['unpaid','🔴 बाकी'],['paid','✅ भरले'],['not_received','🟡 Pending'],['received','✅ मिळाले']].map(([id,l])=>(
                  <button key={id} onClick={()=>set('statusFilter',id)} style={{padding:'5px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:(filters.statusFilter||'')===id?'#6366f1':'#1e1e2a',color:(filters.statusFilter||'')===id?'#fff':'#9b9bb8',border:`1px solid ${(filters.statusFilter||'')===id?'#6366f1':'#2a2a40'}`}}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <p style={{fontSize:10,color:'var(--muted)',fontWeight:700,marginBottom:5}}>क्रमवारी</p>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {[['date_desc','नवीन'],['date_asc','जुने'],['amount_desc','₹↓'],['amount_asc','₹↑'],['name_asc','अ-ज्ञ']].map(([id,l])=>(
                  <button key={id} onClick={()=>set('sortBy',id)} style={{padding:'5px 10px',borderRadius:20,fontSize:10,fontWeight:700,background:filters.sortBy===id?'#3b82f6':'#1e1e2a',color:filters.sortBy===id?'#fff':'#9b9bb8',border:`1px solid ${filters.sortBy===id?'#3b82f6':'#2a2a40'}`}}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {expenses.length>0 && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',background:'var(--card)',borderBottom:'1px solid var(--border)',padding:'8px 14px'}}>
          {[{l:'भरावे',v:fmt(tPay),c:'#ef4444'},{l:'मिळणार',v:fmt(tRec),c:'#22c55e'},{l:'शिल्लक',v:(tRec-tPay>=0?'+':'')+fmt(Math.abs(tRec-tPay)),c:tRec-tPay>=0?'#22c55e':'#ef4444'}].map((s,i)=>(
            <div key={s.l} style={{textAlign:'center',borderRight:i<2?'1px solid #2a2a40':'none'}}>
              <div style={{fontSize:9,color:'var(--muted)',fontWeight:700}}>{s.l}</div>
              <div style={{fontSize:12,fontWeight:800,color:s.c,marginTop:1}}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{padding:'10px 13px',display:'flex',flexDirection:'column',gap:7}}>
        {loading ? (
          <div style={{textAlign:'center',padding:'50px'}}><div style={{width:28,height:28,border:'3px solid #2a2a40',borderTop:'3px solid #f97316',borderRadius:'50%',margin:'0 auto',animation:'spin 0.8s linear infinite'}}/></div>
        ) : expenses.length===0 ? (
          <div style={{textAlign:'center',padding:'50px 20px'}}>
            <div style={{fontSize:38,marginBottom:10}}>🔍</div>
            <p style={{color:'var(--muted)'}}>कोणत्या नोंदी सापडल्या नाहीत</p>
          </div>
        ) : expenses.map(e=>(
          <ExpenseItem key={e._id} expense={e} onDelete={onDelete} onEdit={onEdit} onStatusChange={onStatusChange} adminView={adminView}/>
        ))}
      </div>

      {showCalS && <Calendar value={filters.startDate} onChange={v=>{set('startDate',v);setShowCalS(false)}} onClose={()=>setShowCalS(false)}/>}
      {showCalE && <Calendar value={filters.endDate}   onChange={v=>{set('endDate',v);setShowCalE(false)}}   onClose={()=>setShowCalE(false)}/>}
    </div>
  )
}
