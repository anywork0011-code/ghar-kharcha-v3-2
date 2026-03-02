import { useState, useEffect } from 'react'
import Calendar, { fmtDMY } from './Calendar.jsx'

const CAT_MR = {'सामान्य':'📦','अन्न':'🍽️','वाहतूक':'🚗','किराणा':'🛒','औषध':'💊','बिले':'💡','खरेदी':'🛍️','मनोरंजन':'🎬','शिक्षण':'📚','पगार':'💰','भाडे':'🏠','इतर':'📌'}
const CATS = Object.keys(CAT_MR)

export default function AddExpense({ editExpense, onSave, onCancel, userId, loading }) {
  const today = fmtDMY(new Date())
  const [form, setForm] = useState({
    name:'', amount:'', type:'pay', paymentStatus:'unpaid',
    category:'सामान्य', date:today, note:'', userId
  })
  const [showCal, setShowCal] = useState(false)
  const [errors, setErrors]   = useState({})

  useEffect(() => {
    if (editExpense) {
      setForm({
        name:editExpense.name||'', amount:String(editExpense.amount||''),
        type:editExpense.type||'pay', paymentStatus:editExpense.paymentStatus||'unpaid',
        category:editExpense.category||'सामान्य', date:editExpense.date||today,
        note:editExpense.note||'', userId,
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

  const dd = {width:'100%',background:'#1a1a25',border:'1px solid #2a2a40',borderRadius:12,padding:'12px 14px',color:'#f1f0ff',fontSize:13,appearance:'none',WebkitAppearance:'none',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%236b6b88' d='M5 7L0 2h10z'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 14px center'}
  const inp = err => ({width:'100%',background:'#1a1a25',border:`1px solid ${err?'#ef4444':'#2a2a40'}`,borderRadius:12,padding:'12px 14px',color:'#f1f0ff',fontSize:14})
  const statusOpts = form.type==='pay'
    ? [['unpaid','🔴 बाकी (Unpaid)'],['paid','✅ भरले (Paid)']]
    : [['not_received','🟡 मिळणे बाकी'],['received','✅ मिळाले (Received)']]

  return (
    <div style={{paddingBottom:20}} className="fade">
      <div style={{background:'#16161e',padding:'14px 16px 16px',borderBottom:'1px solid #2a2a40'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={onCancel} style={{background:'#1e1e2a',border:'1px solid #2a2a40',color:'#9b9bb8',borderRadius:9,padding:'6px 11px',fontSize:16}}>←</button>
          <div>
            <h2 style={{fontSize:20,fontWeight:800}}>{editExpense?'✏️ नोंद बदला':'➕ नवीन नोंद'}</h2>
            <p style={{fontSize:11,color:'#6b6b88'}}>{editExpense?'नोंद अपडेट करा':'खर्च किंवा उत्पन्न नोंदवा'}</p>
          </div>
        </div>
      </div>

      <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',gap:14}}>
        {/* Type */}
        <div>
          <label style={{fontSize:10,color:'#9b9bb8',fontWeight:700,display:'block',marginBottom:7}}>प्रकार</label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'#1a1a25',borderRadius:13,padding:4,border:'1px solid #2a2a40'}}>
            {[['pay','↗ भरावे लागेल'],['receive','↙ मिळणार']].map(([t,l])=>(
              <button key={t} onClick={()=>set('type',t)} style={{padding:'12px',borderRadius:10,fontWeight:700,fontSize:13,background:form.type===t?(t==='pay'?'linear-gradient(135deg,#ef4444,#dc2626)':'linear-gradient(135deg,#22c55e,#16a34a)'):'transparent',color:form.type===t?'#fff':'#6b6b88',boxShadow:form.type===t?'0 3px 10px rgba(0,0,0,.3)':'none'}}>{l}</button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label style={{fontSize:10,color:'#9b9bb8',fontWeight:700,display:'block',marginBottom:7}}>{form.type==='pay'?'💰 भरणे स्थिती':'💰 मिळणे स्थिती'}</label>
          <select value={form.paymentStatus} onChange={e=>set('paymentStatus',e.target.value)} style={{...dd,border:`1px solid ${form.paymentStatus==='paid'||form.paymentStatus==='received'?'#22c55e40':'#f59e0b40'}`}}>
            {statusOpts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {/* Name */}
        <div>
          <label style={{fontSize:10,color:'#9b9bb8',fontWeight:700,display:'block',marginBottom:7}}>नाव / तपशील</label>
          <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="उदा. भाजीपाला, वीज बिल..." style={inp(errors.name)}/>
          {errors.name && <p style={{fontSize:11,color:'#ef4444',marginTop:4}}>⚠ {errors.name}</p>}
        </div>

        {/* Amount */}
        <div>
          <label style={{fontSize:10,color:'#9b9bb8',fontWeight:700,display:'block',marginBottom:7}}>रक्कम (₹)</label>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'#9b9bb8',fontSize:16,fontWeight:700,pointerEvents:'none'}}>₹</span>
            <input type="number" inputMode="decimal" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.00" style={{...inp(errors.amount),paddingLeft:32}}/>
          </div>
          {errors.amount && <p style={{fontSize:11,color:'#ef4444',marginTop:4}}>⚠ {errors.amount}</p>}
        </div>

        {/* Date */}
        <div>
          <label style={{fontSize:10,color:'#9b9bb8',fontWeight:700,display:'block',marginBottom:7}}>📅 तारीख</label>
          <button onClick={()=>setShowCal(true)} style={{width:'100%',background:'#1a1a25',border:'1px solid #2a2a40',borderRadius:12,padding:'12px 14px',color:'#f1f0ff',fontSize:14,textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>{form.date}</span><span style={{fontSize:18}}>📅</span>
          </button>
        </div>

        {/* Category */}
        <div>
          <label style={{fontSize:10,color:'#9b9bb8',fontWeight:700,display:'block',marginBottom:7}}>प्रकार / श्रेणी</label>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:17,pointerEvents:'none'}}>{CAT_MR[form.category]}</span>
            <select value={form.category} onChange={e=>set('category',e.target.value)} style={{...dd,paddingLeft:40}}>
              {CATS.map(c=><option key={c} value={c}>{CAT_MR[c]} {c}</option>)}
            </select>
          </div>
        </div>

        {/* Note */}
        <div>
          <label style={{fontSize:10,color:'#9b9bb8',fontWeight:700,display:'block',marginBottom:7}}>टीप (ऐच्छिक)</label>
          <textarea value={form.note} onChange={e=>set('note',e.target.value)} placeholder="टीप लिहा..." rows={2} style={{...inp(false),resize:'none',lineHeight:1.6}}/>
        </div>

        <button onClick={()=>{if(validate())onSave({...form,amount:+form.amount})}} disabled={loading}
          style={{background:'linear-gradient(135deg,#f97316,#ef4444)',color:'#fff',borderRadius:13,padding:'14px',fontSize:15,fontWeight:800,boxShadow:'0 8px 24px rgba(249,115,22,.4)',opacity:loading?.7:1}}>
          {loading?'⏳ जतन...':(editExpense?'✅ नोंद अपडेट करा':'✅ नोंद जतन करा')}
        </button>
      </div>
      {showCal && <Calendar value={form.date} onChange={v=>set('date',v)} onClose={()=>setShowCal(false)}/>}
    </div>
  )
}
