import { useState } from 'react'
import Calendar, { fmtDMY, parseDMY } from './Calendar.jsx'
import { apiGetExpenses } from '../api.js'

const MONTHS = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर']
const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN')
const TYPE_LBL   = { pay:'भरावे लागेल', receive:'मिळणार' }
const STATUS_LBL = { paid:'भरले', unpaid:'बाकी', received:'मिळाले', not_received:'मिळणे बाकी' }
const STATUS_CLR = { paid:'#16a34a', unpaid:'#dc2626', received:'#16a34a', not_received:'#d97706' }
const STATUS_BG  = { paid:'#dcfce7', unpaid:'#fee2e2', received:'#dcfce7', not_received:'#fef9c3' }

function buildHTML(data, label, userName) {
  const tPay=data.filter(e=>e.type==='pay').reduce((s,e)=>s+e.amount,0)
  const tRec=data.filter(e=>e.type==='receive').reduce((s,e)=>s+e.amount,0)
  const tPaid=data.filter(e=>e.paymentStatus==='paid').reduce((s,e)=>s+e.amount,0)
  const tUnpaid=data.filter(e=>e.paymentStatus==='unpaid').reduce((s,e)=>s+e.amount,0)
  const tRecvd=data.filter(e=>e.paymentStatus==='received').reduce((s,e)=>s+e.amount,0)
  const tNotRecvd=data.filter(e=>e.paymentStatus==='not_received').reduce((s,e)=>s+e.amount,0)
  const bal=tRec-tPay
  const rows=data.map((e,i)=>`<tr style="background:${i%2===0?'#fff':'#f9f9fc'}">
    <td>${e.date}</td><td><strong>${e.name}</strong></td>
    <td style="color:${e.type==='pay'?'#dc2626':'#16a34a'};font-weight:700">${TYPE_LBL[e.type]||e.type}</td>
    <td><span style="background:${STATUS_BG[e.paymentStatus]||'#fff'};color:${STATUS_CLR[e.paymentStatus]||'#666'};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">${STATUS_LBL[e.paymentStatus]||e.paymentStatus}</span></td>
    <td>${e.category}</td>
    <td style="text-align:right;font-weight:800;color:${e.type==='pay'?'#dc2626':'#16a34a'}">${fmt(e.amount)}</td>
    <td style="color:#888;font-size:11px">${e.note||'—'}</td></tr>`).join('')
  return `<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8"/>
<title>घर खर्चा — ${label}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:"Noto Sans Devanagari","Segoe UI",Arial,sans-serif;background:#fff;color:#111;font-size:13px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.no-print{background:#1a1a2e;color:#f1f0ff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;}
.no-print button{border:none;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
.hdr{background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;padding:22px 28px;display:flex;justify-content:space-between;align-items:flex-start;}
.hdr h1{font-size:24px;font-weight:800;}.hdr .sub{opacity:.9;font-size:12px;margin-top:4px;}
.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:18px 28px;background:#f8f8fc;border-bottom:2px solid #f0f0f5;}
.sc{background:#fff;border-radius:10px;padding:14px;box-shadow:0 1px 6px rgba(0,0,0,.07);}
.sc .lbl{font-size:10px;font-weight:700;color:#888;text-transform:uppercase;margin-bottom:6px;}
.sc .val{font-size:20px;font-weight:800;}.sc .sub{margin-top:6px;font-size:11px;line-height:2;}
table{width:100%;border-collapse:collapse;}thead tr{background:#f97316;}
thead th{color:#fff;padding:9px 10px;font-size:11px;font-weight:700;text-align:left;}
tbody td{padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;vertical-align:middle;}
.tbl-wrap{padding:0 28px 28px;}.tbl-hdr{padding:14px 0 8px;display:flex;justify-content:space-between;align-items:center;}
.footer{text-align:center;color:#aaa;font-size:10px;padding:14px;border-top:1px solid #eee;}
@media print{.no-print{display:none!important;}@page{margin:12mm;size:A4;}}</style></head><body>
<div class="no-print"><span style="font-size:14px;font-weight:800">🏠 घर खर्चा — ${label}</span>
<div style="display:flex;gap:8px"><button onclick="window.print()" style="background:#f97316;color:#fff">🖨️ PDF म्हणून Save करा</button><button onclick="window.close()" style="background:#374151;color:#fff">✕ बंद</button></div></div>
<div class="hdr"><div><h1>🏠 घर खर्चा</h1><p class="sub">खर्चाचा अहवाल — ${label}</p><p class="sub" style="opacity:.8">वापरकर्ता: ${userName||'—'}</p></div>
<div style="text-align:right;font-size:12px;opacity:.9;line-height:2"><div>दिनांक: ${fmtDMY(new Date())}</div><div>एकूण: ${data.length} नोंदी</div></div></div>
<div class="summary">
<div class="sc" style="border-left:4px solid #ef4444"><div class="lbl">↗ भरावे लागेल</div><div class="val" style="color:#ef4444">${fmt(tPay)}</div><div class="sub"><div style="color:#16a34a">✅ भरले: ${fmt(tPaid)}</div><div style="color:#dc2626">🔴 बाकी: ${fmt(tUnpaid)}</div></div></div>
<div class="sc" style="border-left:4px solid #16a34a"><div class="lbl">↙ मिळणार</div><div class="val" style="color:#16a34a">${fmt(tRec)}</div><div class="sub"><div style="color:#16a34a">✅ मिळाले: ${fmt(tRecvd)}</div><div style="color:#d97706">🟡 बाकी: ${fmt(tNotRecvd)}</div></div></div>
<div class="sc" style="border-left:4px solid ${bal>=0?'#6366f1':'#ef4444'}"><div class="lbl">निव्वळ शिल्लक</div><div class="val" style="color:${bal>=0?'#6366f1':'#ef4444'}">${bal>=0?'+':''}${fmt(bal)}</div><div class="sub" style="color:#888">${data.length} एकूण नोंदी</div></div></div>
<div class="tbl-wrap"><div class="tbl-hdr"><h2 style="font-size:14px;font-weight:700;color:#444">📋 नोंदींची यादी</h2><span style="font-size:11px;color:#888">${label}</span></div>
<table><thead><tr><th>तारीख</th><th>नाव</th><th>प्रकार</th><th>स्थिती</th><th>श्रेणी</th><th style="text-align:right">रक्कम</th><th>टीप</th></tr></thead>
<tbody>${rows||'<tr><td colspan="7" style="text-align:center;padding:30px;color:#aaa">कोणत्या नोंदी नाहीत</td></tr>'}</tbody></table></div>
<div class="footer">घर खर्चा v3.0 — ${fmtDMY(new Date())} रोजी तयार केले</div></body></html>`
}

export default function DownloadPage({ userId, userName, showToast }) {
  const today = new Date()
  const [mode,    setMode]    = useState('monthly')
  const [selMon,  setSelMon]  = useState(today.getMonth())
  const [selYr,   setSelYr]   = useState(today.getFullYear())
  const [startD,  setStartD]  = useState('')
  const [endD,    setEndD]    = useState(fmtDMY(today))
  const [showCalS,setShowCalS]= useState(false)
  const [showCalE,setShowCalE]= useState(false)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const getLabel = () => mode==='monthly' ? `${MONTHS[selMon]} ${selYr}` : `${startD||'...'} ते ${endD||'...'}`

  const getData = async () => {
    setLoading(true)
    try {
      let filters = {}
      if (mode==='monthly') {
        const s = `01/${String(selMon+1).padStart(2,'0')}/${selYr}`
        const lastDay = new Date(selYr, selMon+1, 0).getDate()
        const e2 = `${lastDay}/${String(selMon+1).padStart(2,'0')}/${selYr}`
        filters = { filter:'custom', startDate:s, endDate:e2 }
      } else if (startD && endD) {
        filters = { filter:'custom', startDate:startD, endDate:endD }
      }
      return await apiGetExpenses(userId, filters)
    } finally { setLoading(false) }
  }

  const handlePreview = async () => { const d = await getData(); setPreview(d) }

  const downloadCSV = async () => {
    const data = await getData()
    const label = getLabel()
    const rows = [['तारीख','नाव','प्रकार','स्थिती','श्रेणी','रक्कम','टीप'],
      ...data.map(e=>[e.date,e.name,TYPE_LBL[e.type]||e.type,STATUS_LBL[e.paymentStatus]||e.paymentStatus,e.category,e.amount,e.note||''])]
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`GharKharcha_${label.replace(/[\s/]/g,'_')}.csv`; a.click()
    showToast('CSV डाउनलोड झाले! 📊')
  }

  const downloadPDF = async () => {
    const data = await getData()
    const label = getLabel()
    const html = buildHTML(data, label, userName)
    const blob = new Blob([html],{type:'text/html;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const win = window.open(url,'_blank','width=920,height=700')
    if (!win) { const a=document.createElement('a');a.href=url;a.download=`GharKharcha_${label}.html`;a.click(); showToast('HTML file download करा → Print → Save as PDF') }
    else showToast('नवीन tab → 🖨️ बटण → Save as PDF 📄')
    setTimeout(()=>URL.revokeObjectURL(url),8000)
  }

  const calBtn = {width:'100%',background:'#22223a',border:'1px solid #2a2a40',borderRadius:10,padding:'10px 13px',fontSize:12,textAlign:'left',display:'flex',justifyContent:'space-between',alignItems:'center',color:'#f1f0ff'}

  return (
    <div style={{paddingBottom:20}} className="fade">
      <div style={{background:'#16161e',padding:'12px 16px',borderBottom:'1px solid #2a2a40'}}>
        <h2 style={{fontSize:20,fontWeight:800}}>📥 डाउनलोड करा</h2>
        <p style={{fontSize:12,color:'#6b6b88',marginTop:3}}>खर्चाचा अहवाल काढा</p>
      </div>
      <div style={{padding:'14px',display:'flex',flexDirection:'column',gap:13}}>
        <div style={{background:'rgba(59,130,246,.08)',border:'1px solid rgba(59,130,246,.25)',borderRadius:11,padding:'11px 13px'}}>
          <p style={{fontSize:11,color:'#60a5fa',fontWeight:700,marginBottom:3}}>💡 PDF कसे काम करते?</p>
          <p style={{fontSize:11,color:'#9b9bb8',lineHeight:1.8}}>PDF बटण → नवीन tab उघडेल → <strong style={{color:'#f97316'}}>🖨️ PDF म्हणून Save करा</strong> → Browser Print → Save as PDF</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'#1a1a25',borderRadius:12,padding:4,border:'1px solid #2a2a40'}}>
          {[['monthly','📅 महिनानिहाय'],['custom','🗓 कस्टम']].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{padding:'10px',borderRadius:9,fontWeight:700,fontSize:13,background:mode===m?'linear-gradient(135deg,#3b82f6,#1d4ed8)':'transparent',color:mode===m?'#fff':'#6b6b88'}}>{l}</button>
          ))}
        </div>

        {mode==='monthly' && (
          <div style={{background:'#1a1a25',borderRadius:13,padding:13,border:'1px solid #2a2a40'}}>
            <p style={{fontSize:10,color:'#6b6b88',fontWeight:700,marginBottom:9}}>महिना निवडा</p>
            <div style={{display:'flex',gap:5,marginBottom:10,flexWrap:'wrap'}}>
              {[2023,2024,2025,2026].map(y=>(
                <button key={y} onClick={()=>setSelYr(y)} style={{flex:1,padding:'6px 4px',borderRadius:7,fontSize:11,fontWeight:700,background:selYr===y?'#f97316':'#22223a',color:selYr===y?'#fff':'#9b9bb8',border:`1px solid ${selYr===y?'#f97316':'#2a2a40'}`}}>{y}</button>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}}>
              {MONTHS.map((m,i)=>(
                <button key={m} onClick={()=>setSelMon(i)} style={{padding:'7px 2px',borderRadius:7,fontSize:10,fontWeight:700,background:selMon===i?'#f97316':'#22223a',color:selMon===i?'#fff':'#9b9bb8',border:`1px solid ${selMon===i?'#f97316':'#2a2a40'}`}}>{m.slice(0,4)}</button>
              ))}
            </div>
          </div>
        )}

        {mode==='custom' && (
          <div style={{background:'#1a1a25',borderRadius:13,padding:13,border:'1px solid #2a2a40',display:'flex',flexDirection:'column',gap:10}}>
            <div>
              <p style={{fontSize:10,color:'#6b6b88',fontWeight:700,marginBottom:6}}>पासून</p>
              <button onClick={()=>setShowCalS(true)} style={{...calBtn,color:startD?'#f1f0ff':'#6b6b88'}}><span>{startD||'तारीख निवडा'}</span><span>📅</span></button>
            </div>
            <div>
              <p style={{fontSize:10,color:'#6b6b88',fontWeight:700,marginBottom:6}}>पर्यंत</p>
              <button onClick={()=>setShowCalE(true)} style={{...calBtn,color:endD?'#f1f0ff':'#6b6b88'}}><span>{endD||'तारीख निवडा'}</span><span>📅</span></button>
            </div>
          </div>
        )}

        <div style={{background:'rgba(249,115,22,.08)',border:'1px solid rgba(249,115,22,.25)',borderRadius:9,padding:'9px 13px',textAlign:'center'}}>
          <p style={{fontSize:13,color:'#f97316',fontWeight:700}}>📆 {getLabel()}</p>
        </div>

        <button onClick={handlePreview} disabled={loading} style={{background:'#22223a',color:'#9b9bb8',border:'1px solid #2a2a40',borderRadius:11,padding:'12px',fontSize:14,fontWeight:700}}>
          {loading?'⏳ लोड...':'👁️ आधावलोकन पहा'}
        </button>

        {preview && (
          <div style={{background:'#1a1a25',borderRadius:13,padding:13,border:'1px solid #2a2a40'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              {[['भरावे',preview.filter(e=>e.type==='pay').reduce((s,e)=>s+e.amount,0),'#ef4444'],['मिळणार',preview.filter(e=>e.type==='receive').reduce((s,e)=>s+e.amount,0),'#22c55e']].map(([l,v,c])=>(
                <div key={l} style={{textAlign:'center',background:'#22223a',borderRadius:9,padding:'9px'}}>
                  <div style={{fontSize:9,color:'#6b6b88',fontWeight:700}}>{l}</div>
                  <div style={{fontSize:14,fontWeight:800,color:c}}>{fmt(v)}</div>
                </div>
              ))}
            </div>
            <p style={{fontSize:11,color:'#6b6b88',textAlign:'center'}}>{preview.length} नोंदी सापडल्या</p>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <button onClick={downloadCSV} disabled={loading} style={{background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',borderRadius:12,padding:'13px',fontSize:14,fontWeight:800,boxShadow:'0 4px 16px rgba(34,197,94,.3)'}}>📊 CSV</button>
          <button onClick={downloadPDF} disabled={loading} style={{background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'#fff',borderRadius:12,padding:'13px',fontSize:14,fontWeight:800,boxShadow:'0 4px 16px rgba(239,68,68,.3)'}}>📄 PDF</button>
        </div>
      </div>
      {showCalS && <Calendar value={startD} onChange={v=>{setStartD(v);setShowCalS(false)}} onClose={()=>setShowCalS(false)}/>}
      {showCalE && <Calendar value={endD}   onChange={v=>{setEndD(v);setShowCalE(false)}}   onClose={()=>setShowCalE(false)}/>}
    </div>
  )
}
