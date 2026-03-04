import { useState, useEffect } from 'react'
import Calendar, { fmtDMY } from './Calendar.jsx'

const CAT_MR = {'सामान्य':'📦','अन्न':'🍽️','वाहतूक':'🚗','किराणा':'🛒','औषध':'💊','बिले':'💡','खरेदी':'🛍️','मनोरंजन':'🎬','शिक्षण':'📚','पगार':'💰','भाडे':'🏠','इतर':'📌'}
const CATS = Object.keys(CAT_MR)

export default function AddExpense({ editExpense, onSave, onCancel, userId, loading }) {
  const today = fmtDMY(new Date())
  const [form, setForm] = useState({
    name:'', amount:'', type:'pay', paymentStatus:'unpaid',
    category:'सामान्य', date:today, note:'', phone:'', deadline:'', userId
  })
  const [showCal, setShowCal] = useState(false)
  const [showDeadlineCal, setShowDeadlineCal] = useState(false)
  const [errors, setErrors]   = useState({})

  useEffect(() => {
    if (editExpense) {
      setForm({
        name:editExpense.name||'', amount:String(editExpense.amount||''),
        type:editExpense.type||'pay', paymentStatus:editExpense.paymentStatus||'unpaid',
        category:editExpense.category||'सामान्य', date:editExpense.date||today,
        note:editExpense.note||'', phone:editExpense.phone||'', deadline:editExpense.deadline||'', userId,
      })
    }
  }, [editExpense])

  const set = (k, v) => {
    setForm(f => {
      const n = {...f, [k]:v}
      if (k==='type') n.paymentStatus = v==='pay' ? 'unpaid' : 'not_received'
      return n
    })
    setErrors(e => ({...e, [k]:null}))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name='नाव आवश्यक आहे'
    if (!form.amount||isNaN(+form.amount)||+form.amount<=0) e.amount='योग्य रक्कम टाका'
    setErrors(e); return !Object.keys(e).length
  }

  const dd = {width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'12px 14px',color:'var(--text)',fontSize:13,appearance:'none',WebkitAppearance:'none',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%236b6b88' d='M5 7L0 2h10z'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 14px center'}
  const inp = err => ({width:'100%',background:'var(--card)',border:`1px solid ${err?'#ef4444':'#2a2a40'}`,borderRadius:12,padding:'12px 14px',color:'var(--text)',fontSize:14})
  const statusOpts = form.type==='pay'
    ? [['unpaid','🔴 बाकी (Unpaid)'],['paid','✅ भरले (Paid)']]
    : [['not_received','🟡 मिळणे बाकी'],['received','✅ मिळाले (Received)']]

  return (
    <div style={{paddingBottom:20}} className="fade">
      <div style={{background:'var(--surface)',padding:'14px 16px 16px',borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={onCancel} style={{background:'#1e1e2a',border:'1px solid var(--border)',color:'var(--text2)',borderRadius:9,padding:'6px 11px',fontSize:16}}>←</button>
          <div>
            <h2 style={{fontSize:20,fontWeight:800}}>{editExpense?'✏️ नोंद बदला':'➕ नवीन नोंद'}</h2>
            <p style={{fontSize:11,color:'var(--muted)'}}>{editExpense?'नोंद अपडेट करा':'खर्च किंवा उत्पन्न नोंदवा'}</p>
          </div>
        </div>
      </div>

      <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:14}}>
        {/* Type */}
        <div>
          <label style={{fontSize:10,color:'var(--text2)',fontWeight:700,display:'block',marginBottom:7}}>प्रकार</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'var(--card)',borderRadius:13,padding:4,border:'1px solid var(--border)'}}>
            {[['pay','↗ भरावे लागेल'],['receive','↙ मिळणार']].map(([t,l])=>(
              <button key={t} onClick={()=>set('type',t)} style={{padding:'12px',borderRadius:10,fontWeight:700,fontSize:13,background:form.type===t?(t==='pay'?'linear-gradient(135deg,#ef4444,#dc2626)':'linear-gradient(135deg,#22c55e,#16a34a)'):'transparent',color:form.type===t?'#fff':'#6b6b88',boxShadow:form.type===t?'0 3px 10px rgba(0,0,0,.3)':'none'}}>{l}</button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label style={{fontSize:10,color:'var(--text2)',fontWeight:700,display:'block',marginBottom:7}}>{form.type==='pay'?'💰 भरणे स्थिती':'💰 मिळणे स्थिती'}</label>
          <select value={form.paymentStatus} onChange={e=>set('paymentStatus',e.target.value)} style={{...dd,border:`1px solid ${form.paymentStatus==='paid'||form.paymentStatus==='received'?'#22c55e40':'#f59e0b40'}`}}>
            {statusOpts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {/* Name */}
        <div>
          <label style={{fontSize:10,color:'var(--text2)',fontWeight:700,display:'block',marginBottom:7}}>नाव / तपशील</label>
          <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="उदा. भाजीपाला, वीज बिल..." style={inp(errors.name)}/>
          {errors.name && <p style={{fontSize:11,color:'#ef4444',marginTop:4}}>⚠ {errors.name}</p>}
        </div>

        {/* Amount */}
        <div>
          <label style={{fontSize:10,color:'var(--text2)',fontWeight:700,display:'block',marginBottom:7}}>रक्कम (₹)</label>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'var(--text2)',fontSize:16,fontWeight:700,pointerEvents:'none'}}>₹</span>
            <input type="number" inputMode="decimal" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.00" style={{...inp(errors.amount),paddingLeft:32}}/>
          </div>
          {errors.amount && <p style={{fontSize:11,color:'#ef4444',marginTop:4}}>⚠ {errors.amount}</p>}
        </div>

        {/* Date */}
        <div>
          <label style={{fontSize:10,color:'var(--text2)',fontWeight:700,display:'block',marginBottom:7}}>📅 तारीख</label>
          <button onClick={()=>setShowCal(true)} style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'12px 14px',color:'var(--text)',fontSize:14,textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>{form.date}</span><span style={{fontSize:18}}>📅</span>
          </button>
        </div>

        {/* Category */}
        <div>
          <label style={{fontSize:10,color:'var(--text2)',fontWeight:700,display:'block',marginBottom:7}}>प्रकार / श्रेणी</label>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:17,pointerEvents:'none'}}>{CAT_MR[form.category]}</span>
            <select value={form.category} onChange={e=>set('category',e.target.value)} style={{...dd,paddingLeft:40}}>
              {CATS.map(c=><option key={c} value={c}>{CAT_MR[c]} {c}</option>)}
            </select>
          </div>
        </div>

        {/* Note */}
        <div>
          <label style={{fontSize:10,color:'var(--text2)',fontWeight:700,display:'block',marginBottom:7}}>टीप (ऐच्छिक)</label>
          <textarea value={form.note} onChange={e=>set('note',e.target.value)} placeholder="टीप लिहा..." rows={2} style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'12px 14px',color:'var(--text)',fontSize:14,resize:'none',lineHeight:1.6}}/>
        </div>

        {/* Phone with Contact Picker */}
        <div>
          <label style={{fontSize:10,color:'var(--text2)',fontWeight:700,display:'block',marginBottom:7}}>📞 संपर्क नंबर (ऐच्छिक)</label>
          <div style={{display:'flex',gap:8}}>
            <div style={{position:'relative',flex:1}}>
              <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'var(--text2)',fontSize:14,pointerEvents:'none'}}>📞</span>
              <input type="tel" inputMode="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="मोबाईल नंबर..." style={{width:'100%',background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'12px 14px',color:'var(--text)',fontSize:14,paddingLeft:36}}/>
            </div>
            {'contacts' in navigator && 'ContactsManager' in window && (
              <button type="button" onClick={async()=>{
                try {
                  const contacts = await navigator.contacts.select(['tel','name'],{multiple:false})
                  if (contacts && contacts[0]) {
                    const tel = contacts[0].tel?.[0] || ''
                    const nm  = contacts[0].name?.[0] || ''
                    if (tel) set('phone', tel.replace(/\s/g,''))
                    if (nm && !form.name) set('name', nm)
                  }
                } catch(e){ console.log('Contact picker cancelled') }
              }} style={{background:'rgba(96,165,250,.1)',border:'1px solid rgba(96,165,250,.3)',color:'#60a5fa',borderRadius:12,padding:'0 14px',fontSize:12,fontWeight:700,flexShrink:0,whiteSpace:'nowrap'}}>
                👤 Contacts
              </button>
            )}
          </div>
          <p style={{fontSize:10,color:'#444460',marginTop:4}}>
            {'contacts' in navigator && 'ContactsManager' in window ? '👆 "Contacts" बटण दाबून contact निवडा' : '📱 Android Chrome मध्ये contact picker उपलब्ध आहे'}
          </p>
        </div>

        {/* Deadline */}
        <div>
          <label style={{fontSize:10,color:'var(--text2)',fontWeight:700,display:'block',marginBottom:7}}>⏰ Deadline (ऐच्छिक)</label>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button onClick={()=>setShowDeadlineCal(true)} style={{flex:1,background:'var(--card)',border:`1px solid ${form.deadline?'#f59e0b40':'#2a2a40'}`,borderRadius:12,padding:'12px 14px',color:form.deadline?'#f59e0b':'#6b6b88',fontSize:13,textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>{form.deadline||'तारीख निवडा (optional)'}</span>
              <span style={{fontSize:16}}>⏰</span>
            </button>
            {form.deadline && (
              <button onClick={()=>set('deadline','')} style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',color:'#ef4444',borderRadius:9,padding:'10px 12px',fontSize:12,fontWeight:700,flexShrink:0}}>✕</button>
            )}
          </div>
          {form.deadline && <p style={{fontSize:10,color:'#f59e0b',marginTop:4}}>⚠️ या तारखेपर्यंत पूर्ण करणे आवश्यक</p>}
        </div>

        <button onClick={()=>{if(validate())onSave({...form,amount:+form.amount})}} disabled={loading}
          style={{background:'linear-gradient(135deg,#f97316,#ef4444)',color:'#fff',borderRadius:13,padding:'14px',fontSize:15,fontWeight:800,boxShadow:'0 8px 24px rgba(249,115,22,.4)',opacity:loading?.7:1}}>
          {loading?'⏳ जतन...':(editExpense?'✅ नोंद अपडेट करा':'✅ नोंद जतन करा')}
        </button>
      </div>
      {showCal && <Calendar value={form.date} onChange={v=>set('date',v)} onClose={()=>setShowCal(false)}/>}
      {showDeadlineCal && <Calendar value={form.deadline||today} onChange={v=>set('deadline',v)} onClose={()=>setShowDeadlineCal(false)}/>}
    </div>
  )
}
