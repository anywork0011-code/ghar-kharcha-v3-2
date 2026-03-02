import { useState } from 'react'
import { apiLogin } from '../api.js'

export default function LoginScreen({ onLogin, showToast }) {
  const [un, setUn]       = useState('')
  const [pw, setPw]       = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr]     = useState('')

  const go = async () => {
    if (!un.trim() || !pw) { setErr('नाव आणि पासवर्ड टाका'); return }
    setLoading(true); setErr('')
    try {
      const user = await apiLogin(un.trim(), pw)
      onLogin(user)
    } catch (e) {
      setErr(e.message || 'चुकीचे नाव किंवा पासवर्ड')
    } finally { setLoading(false) }
  }

  const inp = { width:'100%',background:'#1a1a25',border:'1px solid #2a2a40',borderRadius:12,padding:'13px 16px',color:'#f1f0ff',fontSize:15 }

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 22px',position:'relative',overflow:'hidden',background:'#0f0f13'}}>
      <div style={{position:'absolute',top:-80,right:-80,width:240,height:240,background:'radial-gradient(circle,rgba(249,115,22,.12) 0%,transparent 70%)',borderRadius:'50%',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-80,left:-80,width:200,height:200,background:'radial-gradient(circle,rgba(59,130,246,.08) 0%,transparent 70%)',borderRadius:'50%',pointerEvents:'none'}}/>

      <div style={{width:'100%',animation:'fadeUp .4s ease'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:72,height:72,borderRadius:22,margin:'0 auto 12px',background:'linear-gradient(135deg,#f97316,#ef4444)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,boxShadow:'0 8px 32px rgba(249,115,22,.4)'}}>🏠</div>
          <h1 style={{fontSize:28,fontWeight:800}}>घर खर्चा</h1>
          <p style={{fontSize:12,color:'#6b6b88',marginTop:5}}>तुमचे घरगुती खर्च व्यवस्थापन</p>
        </div>

        <div style={{background:'#1a1a25',borderRadius:20,padding:'24px 20px',border:'1px solid #2a2a40',boxShadow:'0 16px 48px rgba(0,0,0,.4)'}}>
          <p style={{fontSize:11,color:'#9b9bb8',fontWeight:700,letterSpacing:1.2,marginBottom:16}}>🔐 प्रवेश करा</p>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:'#9b9bb8',fontWeight:700,display:'block',marginBottom:6}}>वापरकर्ता नाव</label>
            <input value={un} onChange={e=>setUn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="Username" style={inp} autoComplete="username"/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:11,color:'#9b9bb8',fontWeight:700,display:'block',marginBottom:6}}>पासवर्ड</label>
            <div style={{position:'relative'}}>
              <input value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} type={showPw?'text':'password'} placeholder="पासवर्ड" style={{...inp,paddingRight:46}} autoComplete="current-password"/>
              <button onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'transparent',color:'#6b6b88',fontSize:16}}>{showPw?'🙈':'👁️'}</button>
            </div>
          </div>
          {err && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:9,padding:'9px 12px',marginBottom:14,fontSize:12,color:'#ef4444'}}>⚠️ {err}</div>}
          <button onClick={go} disabled={loading} style={{width:'100%',background:'linear-gradient(135deg,#f97316,#ef4444)',color:'#fff',borderRadius:12,padding:'14px',fontSize:15,fontWeight:800,boxShadow:'0 8px 24px rgba(249,115,22,.4)',opacity:loading?.7:1}}>
            {loading ? '⏳ प्रवेश...' : '✅ प्रवेश करा'}
          </button>
          {/* <div style={{marginTop:14,padding:'10px 12px',background:'#0f0f13',borderRadius:9,border:'1px solid #2a2a40'}}>
            <p style={{fontSize:11,color:'#6b6b88',fontWeight:700,marginBottom:4}}>🔑 Default Admin:</p>
            <button onClick={()=>{setUn('Navnath');setPw('12345')}} style={{background:'transparent',color:'#f97316',fontSize:12,fontWeight:700,padding:0}}>👑 Navnath / 12345</button>
          </div> */}
        </div>
      </div>
    </div>
  )
}
