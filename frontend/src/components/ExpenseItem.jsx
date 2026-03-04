import { useState } from 'react'
import { parseDMY } from './Calendar.jsx'
import ExpenseDetail from './ExpenseDetail.jsx'

const CAT_ICONS = {'सामान्य':'📦','अन्न':'🍽️','वाहतूक':'🚗','किराणा':'🛒','औषध':'💊','बिले':'💡','खरेदी':'🛍️','मनोरंजन':'🎬','शिक्षण':'📚','पगार':'💰','भाडे':'🏠','इतर':'📌'}
const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN')

const STATUS_CFG = {
  paid:         { label:'✅ भरले',        color:'#22c55e', bg:'rgba(34,197,94,.12)',  border:'rgba(34,197,94,.3)'  },
  unpaid:       { label:'🔴 बाकी',        color:'#ef4444', bg:'rgba(239,68,68,.12)',  border:'rgba(239,68,68,.3)'  },
  received:     { label:'✅ मिळाले',      color:'#22c55e', bg:'rgba(34,197,94,.12)',  border:'rgba(34,197,94,.3)'  },
  not_received: { label:'🟡 मिळणे बाकी', color:'#f59e0b', bg:'rgba(245,158,11,.12)', border:'rgba(245,158,11,.3)' },
}

function deadlineStatus(deadline, paymentStatus) {
  if (!deadline) return null
  if (paymentStatus === 'paid' || paymentStatus === 'received') return null
  const d    = parseDMY(deadline)
  const now  = new Date(); now.setHours(0,0,0,0)
  const diff = Math.floor((d - now) / (1000*60*60*24))
  if (diff < 0)   return { label:`⚠️ ${Math.abs(diff)} दिवस उशीर!`, color:'#ef4444', bg:'rgba(239,68,68,.12)', border:'rgba(239,68,68,.3)', urgent:true }
  if (diff === 0) return { label:'🔴 आज Deadline!',                  color:'#ef4444', bg:'rgba(239,68,68,.12)', border:'rgba(239,68,68,.3)', urgent:true }
  if (diff <= 3)  return { label:`⏰ ${diff} दिवस बाकी`,             color:'#f59e0b', bg:'rgba(245,158,11,.12)', border:'rgba(245,158,11,.3)', urgent:false }
  return            { label:`📅 ${deadline} पर्यंत`,                 color:'#9b9bb8', bg:'rgba(155,155,184,.08)', border:'rgba(155,155,184,.2)', urgent:false }
}

const STATUS_WA = {
  paid:         'भरले ✅',
  unpaid:       'देणे बाकी 🟡',
  received:     'मिळाले ✅',
  not_received: 'मिळणे बाकी 🟡',
}

function buildWA(phone, e) {
  const amt      = Number(e.amount||0).toLocaleString('en-IN')
  const status   = STATUS_WA[e.paymentStatus] || e.paymentStatus
  const deadline = e.deadline ? `\n⏰ अंतिम तारीख: ${e.deadline}` : ''
  const note     = e.note     ? `\n📝 टीप: ${e.note}`            : ''
  const msg =
`📋 *${e.name}*
💰 रक्कम: ₹${amt}
📊 स्थिती: ${status}
📅 तारीख: ${e.date}${deadline}${note}
_Sent via घर खर्चा App_`
  const clean = phone.replace(/\D/g,'')
  const num   = clean.startsWith('91') ? clean : '91'+clean
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
}


export default function ExpenseItem({ expense: e, onEdit, onDelete, onStatusChange, adminView }) {
  const [conf,   setConf]   = useState(false)
  const [busy,   setBusy]   = useState(false)
  const [detail, setDetail] = useState(false)

  const isPay     = e.type === 'pay'
  const status    = STATUS_CFG[e.paymentStatus] || STATUS_CFG.unpaid
  const isPending = e.paymentStatus === 'unpaid' || e.paymentStatus === 'not_received'
  const dl        = deadlineStatus(e.deadline, e.paymentStatus)

  const handleMarkDone = async (ev) => {
    ev.stopPropagation()
    if (!onStatusChange) return
    setBusy(true)
    try { await onStatusChange(e._id, isPay ? 'paid' : 'received') }
    finally { setBusy(false) }
  }
  const handleDelete = (ev) => {
    ev.stopPropagation()
    if (conf) { onDelete?.(e._id); setConf(false) }
    else { setConf(true); setTimeout(() => setConf(false), 2800) }
  }

  const hasMarkDone = !adminView && isPending && !!onStatusChange
  const hasEdit     = !adminView && !!onEdit
  const hasDelete   = !adminView && !!onDelete
  const hasActions  = hasMarkDone || hasEdit || hasDelete

  return (
    <>
      <div
        onClick={() => setDetail(true)}
        style={{background:'#1a1a25', borderRadius:14, border:`1px solid ${dl?.urgent?'rgba(239,68,68,.35)':'#2a2a40'}`, overflow:'hidden', cursor:'pointer',
          boxShadow: dl?.urgent ? '0 0 0 1px rgba(239,68,68,.15)' : 'none',
          transition:'transform .1s', active:{transform:'scale(.98)'}}}
      >
        {/* Deadline urgent banner */}
        {dl?.urgent && (
          <div style={{background:dl.bg, borderBottom:`1px solid ${dl.border}`, padding:'5px 13px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <span style={{fontSize:10, fontWeight:800, color:dl.color}}>{dl.label}</span>
            {e.phone && (
              <a href={buildWA(e.phone, e)} target="_blank" rel="noopener noreferrer" onClick={ev=>ev.stopPropagation()}
                style={{fontSize:9, fontWeight:800, color:'#25d366', background:'rgba(37,211,102,.12)', padding:'2px 8px', borderRadius:20, border:'1px solid rgba(37,211,102,.3)', textDecoration:'none'}}>
                📲 Remind
              </a>
            )}
          </div>
        )}

        {/* Main info */}
        <div style={{padding:'11px 13px', display:'flex', alignItems:'center', gap:11}}>
          <div style={{width:40, height:40, borderRadius:11, flexShrink:0,
            background:isPay?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)',
            border:`1px solid ${isPay?'#ef444428':'#22c55e28'}`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:17}}>
            {CAT_ICONS[e.category]||'📌'}
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <p style={{fontWeight:700, fontSize:14, color:'#f1f0ff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'56%'}}>{e.name}</p>
              <p style={{fontWeight:800, fontSize:15, color:isPay?'#ef4444':'#22c55e', flexShrink:0}}>{isPay?'−':'+'} {fmt(e.amount)}</p>
            </div>
            <div style={{display:'flex', gap:5, marginTop:4, flexWrap:'wrap', alignItems:'center'}}>
              <span style={{fontSize:9, color:'#6b6b88', background:'#22223a', padding:'2px 7px', borderRadius:20}}>{e.category}</span>
              <span style={{fontSize:9, color:'#6b6b88'}}>📅 {e.date}</span>
              <span style={{fontSize:9, fontWeight:700, color:status.color, background:status.bg, padding:'2px 7px', borderRadius:20, border:`1px solid ${status.border}`}}>{status.label}</span>
              {dl && !dl.urgent && (
                <span style={{fontSize:9, fontWeight:700, color:dl.color, background:dl.bg, padding:'2px 7px', borderRadius:20, border:`1px solid ${dl.border}`}}>{dl.label}</span>
              )}
            </div>
            {e.phone && <p style={{fontSize:10, color:'#60a5fa', marginTop:3}}>📞 {e.phone}</p>}
            {e.note  && <p style={{fontSize:10, color:'#9b9bb8', marginTop:2, fontStyle:'italic'}}>"{e.note}"</p>}
          </div>
        </div>

        {/* WhatsApp row */}
        {e.phone && !adminView && (
          <div style={{padding:'0 13px 9px'}}>
            <a href={buildWA(e.phone, e)} target="_blank" rel="noopener noreferrer" onClick={ev=>ev.stopPropagation()}
              style={{display:'flex', alignItems:'center', justifyContent:'center', gap:5, padding:'7px', background:'rgba(37,211,102,.07)', border:'1px solid rgba(37,211,102,.2)', borderRadius:8, color:'#25d366', fontSize:11, fontWeight:700, textDecoration:'none'}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp पाठवा
            </a>
          </div>
        )}

        {/* Action buttons */}
        {hasActions && (
          <div style={{display:'flex', borderTop:'1px solid #2a2a40', background:'#16161e'}}>
            {hasMarkDone && (
              <button onClick={handleMarkDone} disabled={busy} style={{flex:1.6, padding:'10px 6px', background:busy?'rgba(34,197,94,.05)':'rgba(34,197,94,.08)', color:'#22c55e', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', gap:4, borderRight:(hasEdit||hasDelete)?'1px solid #2a2a40':'none', opacity:busy?.6:1}}>
                {busy ? '⏳' : isPay ? '✅ Paid करा' : '✅ Received करा'}
              </button>
            )}
            {hasEdit && (
              <button onClick={ev=>{ev.stopPropagation();onEdit(e)}} style={{flex:1, padding:'10px', background:'transparent', color:'#3b82f6', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4, borderRight:hasDelete?'1px solid #2a2a40':'none'}}>
                ✏️ बदला
              </button>
            )}
            {hasDelete && (
              <button onClick={handleDelete} style={{flex:1, padding:'10px', background:conf?'rgba(239,68,68,.12)':'transparent', color:'#ef4444', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4, transition:'background .2s'}}>
                🗑️ {conf?'खात्री?':'काढा'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail modal on card tap */}
      {detail && (
        <ExpenseDetail
          expense={e}
          onClose={()=>setDetail(false)}
          onEdit={hasEdit ? e2=>{onEdit(e2);setDetail(false)} : null}
          onDelete={hasDelete ? id=>{onDelete(id);setDetail(false)} : null}
        />
      )}
    </>
  )
}
