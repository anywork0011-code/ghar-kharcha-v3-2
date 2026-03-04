import { useState } from 'react'
import ExpenseItem from './ExpenseItem.jsx'
import { parseDMY } from './Calendar.jsx'

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN')

export default function Dashboard({ todayExpenses, summary, yearlyData, deadlines, onDelete, onEdit, onStatusChange, userName, userWhatsapp }) {
  const [expandYr, setExpandYr] = useState(null)
  const pay=summary.totalPay||0, receive=summary.totalReceive||0
  const paid=summary.totalPaid||0, unpaid=summary.totalUnpaid||0
  const received=summary.totalReceived||0, notRecv=summary.totalNotReceived||0
  const balance=receive-pay

  return (
    <div style={{paddingBottom:20}}>
      {/* Hero */}
      <div style={{background:'linear-gradient(160deg,#1e1e2a 0%,#16161e 100%)',padding:'16px 16px 20px',borderBottom:'1px solid #2a2a40',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-40,right:-40,width:140,height:140,background:'radial-gradient(circle,rgba(249,115,22,.15) 0%,transparent 70%)',borderRadius:'50%',pointerEvents:'none'}}/>
        <p style={{fontSize:11,color:'#9b9bb8',fontWeight:700,letterSpacing:1.4}}>👋 नमस्कार, {userName}</p>
        <div style={{display:'flex',gap:10,marginTop:12}}>
          {/* Pay card */}
          <div style={{flex:1,background:'rgba(239,68,68,.08)',borderRadius:14,padding:'12px',border:'1px solid rgba(239,68,68,.2)'}}>
            <p style={{fontSize:10,color:'#ef4444',fontWeight:700,marginBottom:5}}>↗ भरावे लागेल</p>
            <p style={{fontSize:22,fontWeight:800,color:'#ef4444',lineHeight:1}}>{fmt(pay)}</p>
            <div style={{display:'flex',gap:5,marginTop:7,flexWrap:'wrap'}}>
              <span style={{fontSize:9,color:'#22c55e',background:'rgba(34,197,94,.1)',padding:'2px 7px',borderRadius:20,border:'1px solid rgba(34,197,94,.2)'}}>✅ {fmt(paid)}</span>
              <span style={{fontSize:9,color:'#ef4444',background:'rgba(239,68,68,.1)',padding:'2px 7px',borderRadius:20,border:'1px solid rgba(239,68,68,.2)'}}>🔴 {fmt(unpaid)}</span>
            </div>
          </div>
          {/* Receive card */}
          <div style={{flex:1,background:'rgba(34,197,94,.08)',borderRadius:14,padding:'12px',border:'1px solid rgba(34,197,94,.2)'}}>
            <p style={{fontSize:10,color:'#22c55e',fontWeight:700,marginBottom:5}}>↙ मिळणार</p>
            <p style={{fontSize:22,fontWeight:800,color:'#22c55e',lineHeight:1}}>{fmt(receive)}</p>
            <div style={{display:'flex',gap:5,marginTop:7,flexWrap:'wrap'}}>
              <span style={{fontSize:9,color:'#22c55e',background:'rgba(34,197,94,.1)',padding:'2px 7px',borderRadius:20,border:'1px solid rgba(34,197,94,.2)'}}>✅ {fmt(received)}</span>
              <span style={{fontSize:9,color:'#f59e0b',background:'rgba(245,158,11,.1)',padding:'2px 7px',borderRadius:20,border:'1px solid rgba(245,158,11,.2)'}}>🟡 {fmt(notRecv)}</span>
            </div>
          </div>
        </div>
        {/* Balance */}
        <div style={{marginTop:10,background:balance>=0?'rgba(34,197,94,.06)':'rgba(239,68,68,.06)',borderRadius:12,padding:'9px 14px',border:`1px solid ${balance>=0?'rgba(34,197,94,.15)':'rgba(239,68,68,.15)'}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontSize:11,color:'#9b9bb8',fontWeight:600}}>निव्वळ शिल्लक</p>
          <p style={{fontSize:18,fontWeight:800,color:balance>=0?'#22c55e':'#ef4444'}}>{balance>=0?'+':''}{fmt(balance)}</p>
        </div>
      </div>

      {/* 5-Year Summary */}
      {yearlyData?.length>0 && (
        <div style={{padding:'12px 14px 0'}}>
          <p style={{fontSize:10,color:'#6b6b88',fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',marginBottom:9}}>📊 गेल्या 5 वर्षांचा सारांश</p>
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {yearlyData.map(y=>(
              <div key={y.year} onClick={()=>setExpandYr(expandYr===y.year?null:y.year)}
                style={{background:'#1a1a25',borderRadius:13,border:'1px solid #2a2a40',overflow:'hidden',cursor:'pointer'}}>
                <div style={{padding:'10px 13px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:9}}>
                    <span style={{fontSize:13,fontWeight:800}}>{y.year}</span>
                    <span style={{fontSize:9,color:'#6b6b88',background:'#22223a',padding:'2px 7px',borderRadius:20}}>{y.count} नोंदी</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:12,fontWeight:800,color:(y.totalReceive-y.totalPay)>=0?'#22c55e':'#ef4444'}}>
                      {(y.totalReceive-y.totalPay)>=0?'+':''}{fmt(y.totalReceive-y.totalPay)}
                    </span>
                    <span style={{fontSize:11,color:'#6b6b88'}}>{expandYr===y.year?'▲':'▼'}</span>
                  </div>
                </div>
                {expandYr===y.year && (
                  <div style={{padding:'9px 13px 11px',borderTop:'1px solid #2a2a40',display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
                    <div style={{background:'rgba(239,68,68,.06)',borderRadius:9,padding:'8px 10px',border:'1px solid rgba(239,68,68,.15)'}}>
                      <p style={{fontSize:9,color:'#9b9bb8',marginBottom:2}}>भरावे लागेल</p>
                      <p style={{fontSize:13,fontWeight:800,color:'#ef4444'}}>{fmt(y.totalPay)}</p>
                      <div style={{fontSize:9,color:'#22c55e',marginTop:3}}>✅ {fmt(y.totalPaid)}</div>
                      <div style={{fontSize:9,color:'#ef4444'}}>🔴 {fmt(y.totalUnpaid)}</div>
                    </div>
                    <div style={{background:'rgba(34,197,94,.06)',borderRadius:9,padding:'8px 10px',border:'1px solid rgba(34,197,94,.15)'}}>
                      <p style={{fontSize:9,color:'#9b9bb8',marginBottom:2}}>मिळणार</p>
                      <p style={{fontSize:13,fontWeight:800,color:'#22c55e'}}>{fmt(y.totalReceive)}</p>
                      <div style={{fontSize:9,color:'#22c55e',marginTop:3}}>✅ {fmt(y.totalReceived)}</div>
                      <div style={{fontSize:9,color:'#f59e0b'}}>🟡 {fmt(y.totalNotReceived)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Deadline Reminders ── */}
      {deadlines && deadlines.length > 0 && (
        <div style={{padding:'12px 14px 0'}}>
          <p style={{fontSize:10,color:'#ef4444',fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',marginBottom:9}}>⚠️ Deadline येत आहे / उशीर ({deadlines.length})</p>
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {deadlines.map(e => {
              const d    = parseDMY(e.deadline)
              const now  = new Date(); now.setHours(0,0,0,0)
              const diff = Math.floor((d - now) / (1000*60*60*24))
              const isPay = e.type === 'pay'
              const urgentColor = diff < 0 ? '#ef4444' : diff === 0 ? '#ef4444' : '#f59e0b'
              const label = diff < 0 ? `${Math.abs(diff)} दिवस उशीर!` : diff === 0 ? 'आज Deadline!' : `${diff} दिवस बाकी`
              const phone = e.phone || userWhatsapp || ''
              function buildWA(ph) {
                const isPay2  = e.type === 'pay'
                const msg = `🏠 *घर खर्चा - Deadline Reminder*\n\n📋 *${e.name}*\n💰 रक्कम: *₹${Number(e.amount).toLocaleString('en-IN')}*\n⏰ Deadline: ${e.deadline}\n🔖 ${isPay2?'भरावे लागेल':'मिळणार'}\n\n_कृपया लवकर पूर्ण करा!_`
                const clean = ph.replace(/\D/g,'')
                const num   = clean.startsWith('91') ? clean : `91${clean}`
                return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
              }
              return (
                <div key={e._id} style={{background:'rgba(239,68,68,.06)',borderRadius:12,border:`1px solid ${diff<=0?'rgba(239,68,68,.3)':'rgba(245,158,11,.3)'}`,padding:'11px 13px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontWeight:700,fontSize:13,color:'#f1f0ff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.name}</p>
                      <p style={{fontSize:12,fontWeight:800,color:isPay?'#ef4444':'#22c55e',marginTop:2}}>{isPay?'−':'+'} ₹{Number(e.amount).toLocaleString('en-IN')}</p>
                    </div>
                    <span style={{fontSize:10,fontWeight:800,color:urgentColor,background:diff<=0?'rgba(239,68,68,.12)':'rgba(245,158,11,.12)',padding:'3px 9px',borderRadius:20,border:`1px solid ${urgentColor}40`,flexShrink:0,marginLeft:8}}>{label}</span>
                  </div>
                  {phone && (
                    <a href={buildWA(phone)} target="_blank" rel="noopener noreferrer"
                      style={{marginTop:8,display:'flex',alignItems:'center',justifyContent:'center',gap:5,background:'rgba(37,211,102,.1)',border:'1px solid rgba(37,211,102,.3)',borderRadius:8,padding:'7px',color:'#25d366',fontSize:11,fontWeight:700,textDecoration:'none'}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp Reminder पाठवा
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Today */}
      <div style={{padding:'12px 14px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9}}>
          <p style={{fontSize:10,color:'#6b6b88',fontWeight:700,letterSpacing:1.4,textTransform:'uppercase'}}>📝 आजच्या नोंदी</p>
          <span style={{fontSize:10,color:'#6b6b88',background:'#1e1e2a',padding:'2px 9px',borderRadius:20,border:'1px solid #2a2a40'}}>{todayExpenses.length}/30</span>
        </div>
        {todayExpenses.length===0 ? (
          <div style={{textAlign:'center',padding:'32px 16px',background:'#1a1a25',borderRadius:14,border:'1px dashed #2a2a40'}}>
            <div style={{fontSize:34,marginBottom:10}}>🌟</div>
            <p style={{color:'#6b6b88',fontSize:13}}>आज कोणत्या नोंदी नाहीत</p>
            <p style={{color:'#444460',fontSize:11,marginTop:3}}>➕ दाबा आणि पहिली नोंद जोडा!</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {todayExpenses.map(e=><ExpenseItem key={e._id} expense={e} onDelete={onDelete} onEdit={onEdit} onStatusChange={onStatusChange}/>)}
          </div>
        )}
      </div>
    </div>
  )
}
