import { useState } from 'react'

const CAT_ICONS = {'सामान्य':'📦','अन्न':'🍽️','वाहतूक':'🚗','किराणा':'🛒','औषध':'💊','बिले':'💡','खरेदी':'🛍️','मनोरंजन':'🎬','शिक्षण':'📚','पगार':'💰','भाडे':'🏠','इतर':'📌'}
const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN')

const STATUS_CFG = {
  paid:         { label:'✅ भरले',        color:'#22c55e', bg:'rgba(34,197,94,.12)',  border:'rgba(34,197,94,.3)'  },
  unpaid:       { label:'🔴 बाकी',        color:'#ef4444', bg:'rgba(239,68,68,.12)',  border:'rgba(239,68,68,.3)'  },
  received:     { label:'✅ मिळाले',      color:'#22c55e', bg:'rgba(34,197,94,.12)',  border:'rgba(34,197,94,.3)'  },
  not_received: { label:'🟡 मिळणे बाकी', color:'#f59e0b', bg:'rgba(245,158,11,.12)', border:'rgba(245,158,11,.3)' },
}

export default function ExpenseItem({ expense: e, onEdit, onDelete, onStatusChange, adminView }) {
  const [conf, setConf] = useState(false)
  const [busy, setBusy] = useState(false)

  const isPay  = e.type === 'pay'
  const status = STATUS_CFG[e.paymentStatus] || STATUS_CFG.unpaid

  // Button is shown ONLY when status is pending (unpaid / not_received)
  // Once paid/received → button disappears. Use Edit to revert.
  const isPending = e.paymentStatus === 'unpaid' || e.paymentStatus === 'not_received'
  const markDoneLabel = isPay ? '✅ Paid करा' : '✅ Received करा'
  const markDoneNext  = isPay ? 'paid' : 'received'

  const handleMarkDone = async () => {
    if (!onStatusChange) return
    setBusy(true)
    try { await onStatusChange(e._id, markDoneNext) }
    finally { setBusy(false) }
  }

  const handleDelete = () => {
    if (conf) { onDelete?.(e._id); setConf(false) }
    else { setConf(true); setTimeout(() => setConf(false), 2800) }
  }

  // How many action buttons are visible
  const hasMarkDone = !adminView && isPending && !!onStatusChange
  const hasEdit     = !adminView && !!onEdit
  const hasDelete   = !adminView && !!onDelete
  const hasActions  = hasMarkDone || hasEdit || hasDelete

  return (
    <div style={{background:'#1a1a25', borderRadius:14, border:'1px solid #2a2a40', overflow:'hidden'}}>

      {/* ── Info row ── */}
      <div style={{padding:'11px 13px', display:'flex', alignItems:'center', gap:11}}>
        <div style={{width:40, height:40, borderRadius:11, flexShrink:0,
          background: isPay ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.1)',
          border:`1px solid ${isPay ? '#ef444428' : '#22c55e28'}`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:17}}>
          {CAT_ICONS[e.category] || '📌'}
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
            <p style={{fontWeight:700, fontSize:14, color:'#f1f0ff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'56%'}}>{e.name}</p>
            <p style={{fontWeight:800, fontSize:15, color:isPay?'#ef4444':'#22c55e', flexShrink:0}}>{isPay?'−':'+'} {fmt(e.amount)}</p>
          </div>
          <div style={{display:'flex', gap:5, marginTop:4, flexWrap:'wrap', alignItems:'center'}}>
            <span style={{fontSize:9, color:'#6b6b88', background:'#22223a', padding:'2px 7px', borderRadius:20}}>{e.category}</span>
            <span style={{fontSize:9, color:'#6b6b88'}}>📅 {e.date}</span>
            <span style={{fontSize:9, fontWeight:700, color:status.color, background:status.bg, padding:'2px 7px', borderRadius:20, border:`1px solid ${status.border}`}}>
              {status.label}
            </span>
          </div>
          {e.note && <p style={{fontSize:10, color:'#9b9bb8', marginTop:3, fontStyle:'italic'}}>"{e.note}"</p>}
        </div>
      </div>

      {/* ── Action row ── */}
      {hasActions && (
        <div style={{display:'flex', borderTop:'1px solid #2a2a40', background:'#16161e'}}>

          {/* ✅ Mark as Paid/Received — ONLY visible when pending, hidden once done */}
          {hasMarkDone && (
            <button
              onClick={handleMarkDone}
              disabled={busy}
              style={{
                flex: 1.6,
                padding: '10px 6px',
                background: busy ? 'rgba(34,197,94,.05)' : 'rgba(34,197,94,.08)',
                color: '#22c55e',
                fontSize: 11, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                borderRight: (hasEdit || hasDelete) ? '1px solid #2a2a40' : 'none',
                opacity: busy ? 0.6 : 1,
                transition: 'background .15s',
              }}
            >
              {busy ? '⏳' : markDoneLabel}
            </button>
          )}

          {/* ✏️ Edit */}
          {hasEdit && (
            <button
              onClick={() => onEdit(e)}
              style={{
                flex: 1,
                padding: '10px',
                background: 'transparent',
                color: '#3b82f6',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                borderRight: hasDelete ? '1px solid #2a2a40' : 'none',
              }}
            >
              ✏️ बदला
            </button>
          )}

          {/* 🗑️ Delete */}
          {hasDelete && (
            <button
              onClick={handleDelete}
              style={{
                flex: 1,
                padding: '10px',
                background: conf ? 'rgba(239,68,68,.12)' : 'transparent',
                color: '#ef4444',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                transition: 'background .2s',
              }}
            >
              🗑️ {conf ? 'खात्री?' : 'काढा'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
