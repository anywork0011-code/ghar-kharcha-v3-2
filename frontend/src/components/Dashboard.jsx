import { useState } from 'react'
import ExpenseItem from './ExpenseItem.jsx'

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN')

export default function Dashboard({ todayExpenses, summary, yearlyData, onDelete, onEdit, onStatusChange, userName }) {
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
