// ExpenseDetail.jsx  — Full record view with audit trail + actions

const fmt  = n => '₹' + Number(n||0).toLocaleString('en-IN')
const fmtDT = d => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
       + ' ' + dt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
}

const STATUS_CFG = {
  paid:         { label:'✅ भरले',        color:'#22c55e' },
  unpaid:       { label:'🔴 बाकी',        color:'#ef4444' },
  received:     { label:'✅ मिळाले',      color:'#22c55e' },
  not_received: { label:'🟡 मिळणे बाकी', color:'#f59e0b' },
}
const CAT_ICONS = {'सामान्य':'📦','अन्न':'🍽️','वाहतूक':'🚗','किराणा':'🛒','औषध':'💊','बिले':'💡','खरेदी':'🛍️','मनोरंजन':'🎬','शिक्षण':'📚','पगार':'💰','भाडे':'🏠','इतर':'📌'}

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


export default function ExpenseDetail({ expense: e, onClose, onEdit, onDelete }) {
  if (!e) return null
  const isPay  = e.type === 'pay'
  const status = STATUS_CFG[e.paymentStatus] || STATUS_CFG.unpaid

  const row = (label, value, color) => (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'9px 0',borderBottom:'1px solid #22223a'}}>
      <span style={{fontSize:11,color:'var(--muted)',fontWeight:600,minWidth:110}}>{label}</span>
      <span style={{fontSize:12,fontWeight:700,color:color||'#f1f0ff',textAlign:'right',flex:1,marginLeft:8}}>{value||'—'}</span>
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:299,background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)'}}/>

      {/* Sheet */}
      <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,zIndex:300,background:'var(--card)',borderRadius:'22px 22px 0 0',border:'1px solid var(--border)',maxHeight:'88dvh',overflowY:'auto',animation:'slideUp .32s cubic-bezier(.34,1.1,.64,1)'}}>

        {/* Handle */}
        <div style={{width:36,height:4,background:'#2a2a40',borderRadius:4,margin:'14px auto 0'}}/>

        {/* Header */}
        <div style={{padding:'14px 16px 12px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'flex-start',gap:12}}>
          <div style={{width:46,height:46,borderRadius:13,flexShrink:0,background:isPay?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)',border:`1px solid ${isPay?'#ef444428':'#22c55e28'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
            {CAT_ICONS[e.category]||'📌'}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontWeight:800,fontSize:16,color:'var(--text)',wordBreak:'break-word'}}>{e.name}</p>
            <p style={{fontSize:22,fontWeight:800,color:isPay?'#ef4444':'#22c55e',marginTop:2}}>{isPay?'−':'+'} {fmt(e.amount)}</p>
          </div>
          <button onClick={onClose} style={{background:'var(--card2)',border:'1px solid var(--border)',color:'var(--text2)',width:32,height:32,borderRadius:9,fontSize:16,flexShrink:0}}>✕</button>
        </div>

        {/* Details */}
        <div style={{padding:'4px 16px 8px'}}>
          {row('📅 तारीख',      e.date)}
          {row('🔖 प्रकार',     isPay ? '↗ भरावे लागेल' : '↙ मिळणार', isPay?'#ef4444':'#22c55e')}
          {row('💰 स्थिती',     status.label, status.color)}
          {row('🗂️ श्रेणी',    `${CAT_ICONS[e.category]||''} ${e.category||'—'}`)}
          {e.deadline && row('⏰ Deadline',   e.deadline, '#f59e0b')}
          {e.phone    && row('📞 संपर्क',     e.phone, '#60a5fa')}
          {e.note     && row('📝 टीप',        e.note)}

          {/* Audit trail */}
          <div style={{background:'var(--surface)',borderRadius:11,padding:'10px 12px',marginTop:12,border:'1px solid var(--border)'}}>
            <p style={{fontSize:10,color:'var(--muted)',fontWeight:700,letterSpacing:1.2,marginBottom:8}}>📋 AUDIT TRAIL</p>
            {row('🕒 तयार केले',   fmtDT(e.createdAt))}
            {e.createdBy  && row('👤 तयार केले by', e.createdBy)}
            {e.modifiedAt && row('✏️ बदलले',       fmtDT(e.modifiedAt))}
            {e.modifiedBy && row('👤 बदलले by',    e.modifiedBy)}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{padding:'10px 14px 28px',display:'flex',flexDirection:'column',gap:9}}>

          {/* Call + WhatsApp (if phone exists) */}
          {e.phone && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
              <a href={`tel:${e.phone}`}
                style={{padding:'12px',background:'rgba(96,165,250,.08)',border:'1px solid rgba(96,165,250,.25)',borderRadius:11,color:'#60a5fa',fontSize:12,fontWeight:700,textAlign:'center',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                📞 Call करा
              </a>
              <a href={buildWA(e.phone, e)} target="_blank" rel="noopener noreferrer"
                style={{padding:'12px',background:'rgba(37,211,102,.08)',border:'1px solid rgba(37,211,102,.25)',borderRadius:11,color:'#25d366',fontSize:12,fontWeight:700,textAlign:'center',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
          )}

          {/* Edit + Delete */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:9}}>
            {onEdit && (
              <button onClick={()=>{onEdit(e);onClose()}}
                style={{padding:'12px',background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.25)',borderRadius:11,color:'#3b82f6',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                ✏️ बदला
              </button>
            )}
            {onDelete && (
              <button onClick={()=>{if(window.confirm('ही नोंद काढायची आहे?')){onDelete(e._id);onClose()}}}
                style={{padding:'12px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.25)',borderRadius:11,color:'#ef4444',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                🗑️ काढा
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
