import { useState, useEffect, useCallback } from 'react'
import ExpenseList  from './ExpenseList.jsx'
import DownloadPage from './DownloadPage.jsx'
import { apiGetUsers, apiCreateUser, apiDeleteUser, apiAdminSummary, apiGetExpenses, apiSetWhatsapp } from '../api.js'

const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN')

export default function AdminApp({ user, onLogout, showToast }) {
  const [screen,    setScreen]   = useState('dash')
  const [selUser,   setSelUser]  = useState(null)
  const [summaries, setSummaries]= useState([])
  const [userExp,   setUserExp]  = useState([])
  const [expFilters,setExpFilters]= useState({filter:'all',sortBy:'date_desc',search:'',statusFilter:''})
  const [listLoad,  setListLoad] = useState(false)
  const [dashLoad,  setDashLoad] = useState(true)
  // create user form
  const [showForm, setShowForm]  = useState(false)
  const [nu, setNu] = useState(''); const [np, setNp] = useState(''); const [nd, setNd] = useState(''); const [cErr, setCErr] = useState(''); const [creating, setCreating] = useState(false)
  const [editWA, setEditWA]   = useState({})   // { userId: whatsappNumber being edited }
  const [savingWA, setSavingWA] = useState(null) // userId currently saving

  const reload = useCallback(async () => {
    setDashLoad(true)
    try { setSummaries(await apiAdminSummary()) }
    catch (e) { showToast('डेटा लोड झाला नाही: '+e.message, 'error') }
    finally { setDashLoad(false) }
  }, [])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    if (selUser && screen==='view') {
      setListLoad(true)
      apiGetExpenses(selUser._id, expFilters)
        .then(setUserExp)
        .catch(e => showToast('Error: '+e.message,'error'))
        .finally(() => setListLoad(false))
    }
  }, [selUser, screen, expFilters])

  const totals = summaries.reduce((acc, u) => ({
    pay:         acc.pay         + (u.totalPay||0),
    receive:     acc.receive     + (u.totalReceive||0),
    paid:        acc.paid        + (u.totalPaid||0),
    unpaid:      acc.unpaid      + (u.totalUnpaid||0),
    received:    acc.received    + (u.totalReceived||0),
    notReceived: acc.notReceived + (u.totalNotReceived||0),
  }), {pay:0,receive:0,paid:0,unpaid:0,received:0,notReceived:0})

  const handleCreate = async () => {
    if (!nu.trim()||!np.trim()) { setCErr('नाव आणि पासवर्ड आवश्यक'); return }
    setCreating(true); setCErr('')
    try {
      await apiCreateUser({ username:nu.trim(), password:np, displayName:nd||nu.trim() })
      showToast('नवीन वापरकर्ता जोडला! 👤')
      setNu(''); setNp(''); setNd(''); setShowForm(false); reload()
    } catch (e) { setCErr(e.message) }
    finally { setCreating(false) }
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('हा वापरकर्ता आणि त्याच्या सर्व नोंदी काढायच्या आहेत?')) return
    try {
      await apiDeleteUser(id)
      showToast('वापरकर्ता काढला! 🗑️'); reload()
    } catch (e) { showToast('Error: '+e.message,'error') }
  }

  const handleSetWhatsapp = async (userId) => {
    const num = editWA[userId]
    if (num === undefined) return
    setSavingWA(userId)
    try {
      await apiSetWhatsapp(userId, num)
      showToast('WhatsApp नंबर save झाला! 📲')
      setEditWA(prev => { const n={...prev}; delete n[userId]; return n })
      reload()
    } catch (e) { showToast('Error: '+e.message, 'error') }
    finally { setSavingWA(null) }
  }

  const inp = {width:'100%',background:'#1a1a25',border:'1px solid #2a2a40',borderRadius:10,padding:'11px 13px',color:'#f1f0ff',fontSize:13}

  const Spinner = () => <div style={{textAlign:'center',padding:'50px'}}><div style={{width:28,height:28,border:'3px solid #2a2a40',borderTop:'3px solid #a855f7',borderRadius:'50%',margin:'0 auto',animation:'spin 0.8s linear infinite'}}/></div>

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100dvh',overflow:'hidden'}}>
      {/* Top bar */}
      <div style={{flexShrink:0,background:'rgba(15,15,19,.96)',backdropFilter:'blur(10px)',borderBottom:'1px solid #2a2a40',padding:'9px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#f97316,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>👑</div>
          <div>
            <p style={{fontSize:12,fontWeight:800,lineHeight:1}}>Admin Panel</p>
            <p style={{fontSize:10,color:'#a855f7'}}>{user.displayName||user.username}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',color:'#ef4444',borderRadius:7,padding:'5px 10px',fontSize:11,fontWeight:700}}>बाहेर पडा</button>
      </div>

      <div style={{flex:1,overflowY:'auto',paddingBottom:64}}>

        {/* ── DASHBOARD ── */}
        {screen==='dash' && (
          <div className="fade">
            {dashLoad ? <Spinner/> : (
              <>
                <div style={{background:'linear-gradient(160deg,#1e1e2a 0%,#16161e 100%)',padding:'14px 14px 18px',borderBottom:'1px solid #2a2a40',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:-40,right:-40,width:130,height:130,background:'radial-gradient(circle,rgba(168,85,247,.15) 0%,transparent 70%)',borderRadius:'50%',pointerEvents:'none'}}/>
                  <p style={{fontSize:11,color:'#a855f7',fontWeight:700,letterSpacing:1.4}}>👑 प्रशासक डॅशबोर्ड</p>
                  <div style={{display:'flex',gap:10,marginTop:12}}>
                    <div style={{flex:1,background:'rgba(239,68,68,.08)',borderRadius:13,padding:'11px',border:'1px solid rgba(239,68,68,.2)'}}>
                      <p style={{fontSize:10,color:'#ef4444',fontWeight:700,marginBottom:4}}>↗ भरावे लागेल</p>
                      <p style={{fontSize:20,fontWeight:800,color:'#ef4444',lineHeight:1}}>{fmt(totals.pay)}</p>
                      <div style={{display:'flex',gap:4,marginTop:6,flexWrap:'wrap'}}>
                        <span style={{fontSize:9,color:'#22c55e',background:'rgba(34,197,94,.1)',padding:'2px 6px',borderRadius:20,border:'1px solid rgba(34,197,94,.2)'}}>✅ {fmt(totals.paid)}</span>
                        <span style={{fontSize:9,color:'#ef4444',background:'rgba(239,68,68,.1)',padding:'2px 6px',borderRadius:20,border:'1px solid rgba(239,68,68,.2)'}}>🔴 {fmt(totals.unpaid)}</span>
                      </div>
                    </div>
                    <div style={{flex:1,background:'rgba(34,197,94,.08)',borderRadius:13,padding:'11px',border:'1px solid rgba(34,197,94,.2)'}}>
                      <p style={{fontSize:10,color:'#22c55e',fontWeight:700,marginBottom:4}}>↙ मिळणार</p>
                      <p style={{fontSize:20,fontWeight:800,color:'#22c55e',lineHeight:1}}>{fmt(totals.receive)}</p>
                      <div style={{display:'flex',gap:4,marginTop:6,flexWrap:'wrap'}}>
                        <span style={{fontSize:9,color:'#22c55e',background:'rgba(34,197,94,.1)',padding:'2px 6px',borderRadius:20,border:'1px solid rgba(34,197,94,.2)'}}>✅ {fmt(totals.received)}</span>
                        <span style={{fontSize:9,color:'#f59e0b',background:'rgba(245,158,11,.1)',padding:'2px 6px',borderRadius:20,border:'1px solid rgba(245,158,11,.2)'}}>🟡 {fmt(totals.notReceived)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{marginTop:10,background:(totals.receive-totals.pay)>=0?'rgba(34,197,94,.06)':'rgba(239,68,68,.06)',borderRadius:11,padding:'8px 13px',border:`1px solid ${(totals.receive-totals.pay)>=0?'rgba(34,197,94,.15)':'rgba(239,68,68,.15)'}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <p style={{fontSize:11,color:'#9b9bb8',fontWeight:600}}>निव्वळ शिल्लक (सर्व)</p>
                    <p style={{fontSize:16,fontWeight:800,color:(totals.receive-totals.pay)>=0?'#22c55e':'#ef4444'}}>{(totals.receive-totals.pay)>=0?'+':''}{fmt(totals.receive-totals.pay)}</p>
                  </div>
                </div>

                <div style={{padding:'12px 13px 0'}}>
                  <p style={{fontSize:10,color:'#6b6b88',fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',marginBottom:9}}>👥 वापरकर्त्यांचा सारांश</p>
                  {summaries.length===0 ? (
                    <div style={{textAlign:'center',padding:'30px',background:'#1a1a25',borderRadius:14,border:'1px dashed #2a2a40'}}>
                      <p style={{color:'#6b6b88'}}>अजून वापरकर्ते नाहीत</p>
                      <button onClick={()=>setScreen('users')} style={{marginTop:12,background:'#a855f7',color:'#fff',borderRadius:9,padding:'8px 16px',fontSize:12,fontWeight:700}}>+ वापरकर्ता जोडा</button>
                    </div>
                  ) : summaries.map(us=>(
                    <div key={us.user._id} style={{background:'#1a1a25',borderRadius:14,border:'1px solid #2a2a40',overflow:'hidden',marginBottom:9}}>
                      <div style={{padding:'11px 13px 9px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                          <div>
                            <p style={{fontWeight:800,fontSize:14}}>{us.user.displayName||us.user.username}</p>
                            <p style={{fontSize:10,color:'#6b6b88'}}>@{us.user.username} • {us.count} नोंदी</p>
                          </div>
                          <p style={{fontWeight:800,fontSize:14,color:us.balance>=0?'#22c55e':'#ef4444'}}>{us.balance>=0?'+':''}{fmt(us.balance)}</p>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:9}}>
                          <div style={{background:'rgba(239,68,68,.06)',borderRadius:9,padding:'7px 9px',border:'1px solid rgba(239,68,68,.15)'}}>
                            <p style={{fontSize:9,color:'#9b9bb8',marginBottom:2}}>↗ भरावे लागेल</p>
                            <p style={{fontSize:12,fontWeight:800,color:'#ef4444'}}>{fmt(us.totalPay)}</p>
                            <div style={{display:'flex',gap:4,marginTop:3,flexWrap:'wrap'}}>
                              <span style={{fontSize:9,color:'#22c55e'}}>✅ {fmt(us.totalPaid)}</span>
                              <span style={{fontSize:9,color:'#ef4444'}}>🔴 {fmt(us.totalUnpaid)}</span>
                            </div>
                          </div>
                          <div style={{background:'rgba(34,197,94,.06)',borderRadius:9,padding:'7px 9px',border:'1px solid rgba(34,197,94,.15)'}}>
                            <p style={{fontSize:9,color:'#9b9bb8',marginBottom:2}}>↙ मिळणार</p>
                            <p style={{fontSize:12,fontWeight:800,color:'#22c55e'}}>{fmt(us.totalReceive)}</p>
                            <div style={{display:'flex',gap:4,marginTop:3,flexWrap:'wrap'}}>
                              <span style={{fontSize:9,color:'#22c55e'}}>✅ {fmt(us.totalReceived)}</span>
                              <span style={{fontSize:9,color:'#f59e0b'}}>🟡 {fmt(us.totalNotReceived)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{display:'flex',borderTop:'1px solid #2a2a40',background:'#16161e'}}>
                        {us.user.whatsappNumber && <span style={{padding:'9px 10px',fontSize:10,color:'#25d366',display:'flex',alignItems:'center',gap:3,borderRight:'1px solid #2a2a40'}}>📲 {us.user.whatsappNumber}</span>}
                        <button onClick={()=>{setSelUser(us.user);setScreen('view')}} style={{flex:1,padding:'9px',background:'transparent',color:'#3b82f6',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:4,borderRight:'1px solid #2a2a40'}}>📋 नोंदी</button>
                        <button onClick={()=>{setSelUser(us.user);setScreen('download')}} style={{flex:1,padding:'9px',background:'transparent',color:'#22c55e',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>📥 डाउनलोड</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── USER MANAGEMENT ── */}
        {screen==='users' && (
          <div className="fade">
            <div style={{background:'#16161e',padding:'12px 14px',borderBottom:'1px solid #2a2a40'}}>
              <h2 style={{fontSize:19,fontWeight:800}}>👥 वापरकर्ते</h2>
            </div>
            <div style={{padding:'13px'}}>
              <button onClick={()=>setShowForm(!showForm)} style={{width:'100%',background:showForm?'#22223a':'linear-gradient(135deg,#a855f7,#7c3aed)',color:'#fff',borderRadius:11,padding:'12px',fontSize:14,fontWeight:800,marginBottom:13}}>
                {showForm?'✕ बंद करा':'➕ नवीन वापरकर्ता जोडा'}
              </button>
              {showForm && (
                <div style={{background:'#1a1a25',borderRadius:13,padding:13,border:'1px solid #2a2a40',marginBottom:13}} className="fade">
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div><label style={{fontSize:10,color:'#9b9bb8',fontWeight:700,display:'block',marginBottom:5}}>वापरकर्ता नाव *</label><input value={nu} onChange={e=>setNu(e.target.value)} placeholder="Username" style={inp}/></div>
                    <div><label style={{fontSize:10,color:'#9b9bb8',fontWeight:700,display:'block',marginBottom:5}}>पासवर्ड *</label><input type="password" value={np} onChange={e=>setNp(e.target.value)} placeholder="पासवर्ड" style={inp}/></div>
                    <div><label style={{fontSize:10,color:'#9b9bb8',fontWeight:700,display:'block',marginBottom:5}}>प्रदर्शन नाव</label><input value={nd} onChange={e=>setNd(e.target.value)} placeholder="उदा. रमेश, सुनीता..." style={inp}/></div>
                    {cErr && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:8,padding:'8px 11px',fontSize:11,color:'#ef4444'}}>⚠️ {cErr}</div>}
                    <button onClick={handleCreate} disabled={creating} style={{background:'linear-gradient(135deg,#a855f7,#7c3aed)',color:'#fff',borderRadius:9,padding:'11px',fontSize:13,fontWeight:800,opacity:creating?.7:1}}>
                      {creating?'⏳ जोडतो...':'✅ वापरकर्ता जोडा'}
                    </button>
                  </div>
                </div>
              )}
              <div style={{display:'flex',flexDirection:'column',gap:9}}>
                {summaries.map(us=>(
                  <div key={us.user._id} style={{background:'#1a1a25',borderRadius:13,border:'1px solid #2a2a40',overflow:'hidden'}}>
                    <div style={{padding:'11px 13px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div><p style={{fontWeight:800,fontSize:14}}>{us.user.displayName||us.user.username}</p><p style={{fontSize:10,color:'#6b6b88'}}>@{us.user.username}</p></div>
                      <span style={{fontSize:10,color:'#22c55e',background:'rgba(34,197,94,.1)',padding:'3px 9px',borderRadius:20,border:'1px solid rgba(34,197,94,.2)'}}>सक्रिय</span>
                    </div>
                    {/* WhatsApp config */}
                    <div style={{padding:'9px 13px',borderTop:'1px solid #2a2a40',background:'#16161e'}}>
                      <p style={{fontSize:10,color:'#6b6b88',fontWeight:700,marginBottom:6}}>📲 Reminder WhatsApp नंबर</p>
                      {editWA[us.user._id] !== undefined ? (
                        <div style={{display:'flex',gap:6}}>
                          <input
                            type="tel" inputMode="tel"
                            value={editWA[us.user._id]}
                            onChange={ev => setEditWA(prev => ({...prev, [us.user._id]: ev.target.value}))}
                            placeholder="9999999999"
                            style={{flex:1,background:'#22223a',border:'1px solid #2a2a40',borderRadius:8,padding:'7px 10px',color:'#f1f0ff',fontSize:12}}
                          />
                          <button onClick={()=>handleSetWhatsapp(us.user._id)} disabled={savingWA===us.user._id}
                            style={{background:'#25d366',color:'#fff',borderRadius:8,padding:'7px 12px',fontSize:11,fontWeight:800,flexShrink:0,opacity:savingWA===us.user._id?.7:1}}>
                            {savingWA===us.user._id?'⏳':'✅'}
                          </button>
                          <button onClick={()=>setEditWA(prev=>{const n={...prev};delete n[us.user._id];return n})}
                            style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',color:'#ef4444',borderRadius:8,padding:'7px 10px',fontSize:11,fontWeight:700,flexShrink:0}}>✕</button>
                        </div>
                      ) : (
                        <button onClick={()=>setEditWA(prev=>({...prev,[us.user._id]:us.user.whatsappNumber||''}))}
                          style={{width:'100%',background:'rgba(37,211,102,.08)',border:'1px solid rgba(37,211,102,.25)',borderRadius:8,padding:'7px',color:'#25d366',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          {us.user.whatsappNumber ? `📲 ${us.user.whatsappNumber}` : '+ WhatsApp नंबर जोडा'}
                        </button>
                      )}
                    </div>
                    <div style={{display:'flex',borderTop:'1px solid #2a2a40',background:'#0f0f13'}}>
                      <button onClick={()=>{setSelUser(us.user);setScreen('view')}} style={{flex:1,padding:'8px',background:'transparent',color:'#3b82f6',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:4,borderRight:'1px solid #2a2a40'}}>📋 नोंदी</button>
                      <button onClick={()=>handleDeleteUser(us.user._id)} style={{flex:1,padding:'8px',background:'transparent',color:'#ef4444',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>🗑️ काढा</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW USER EXPENSES ── */}
        {screen==='view' && selUser && (
          <div className="fade">
            <div style={{background:'#16161e',padding:'12px 14px',borderBottom:'1px solid #2a2a40'}}>
              <button onClick={()=>setScreen('dash')} style={{background:'#1e1e2a',border:'1px solid #2a2a40',color:'#9b9bb8',borderRadius:8,padding:'5px 10px',fontSize:12,marginBottom:9}}>← मागे</button>
              <h2 style={{fontSize:17,fontWeight:800}}>📋 {selUser.displayName||selUser.username} च्या नोंदी</h2>
            </div>
            <ExpenseList expenses={userExp} filters={expFilters} setFilters={setExpFilters} adminView={true} loading={listLoad}/>
          </div>
        )}

        {/* ── DOWNLOAD ── */}
        {screen==='download' && selUser && (
          <div className="fade">
            <div style={{background:'#16161e',padding:'12px 14px',borderBottom:'1px solid #2a2a40'}}>
              <button onClick={()=>setScreen('dash')} style={{background:'#1e1e2a',border:'1px solid #2a2a40',color:'#9b9bb8',borderRadius:8,padding:'5px 10px',fontSize:12,marginBottom:9}}>← मागे</button>
              <h2 style={{fontSize:17,fontWeight:800}}>📥 {selUser.displayName||selUser.username} — डाउनलोड</h2>
            </div>
            <DownloadPage userId={selUser._id} userName={selUser.displayName||selUser.username} showToast={showToast}/>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav style={{flexShrink:0,background:'rgba(22,22,30,.98)',backdropFilter:'blur(20px)',borderTop:'1px solid #2a2a40',display:'flex',alignItems:'center',justifyContent:'space-around',padding:'5px 0 12px'}}>
        {[{id:'dash',icon:'🏠',label:'डॅशबोर्ड'},{id:'users',icon:'👥',label:'वापरकर्ते'}].map(t=>(
          <button key={t.id} onClick={()=>setScreen(t.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,background:'transparent',borderRadius:7,width:80,padding:'4px 8px',color:screen===t.id?'#a855f7':'#6b6b88'}}>
            <span style={{fontSize:20}}>{t.icon}</span>
            <span style={{fontSize:9,fontWeight:700}}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
