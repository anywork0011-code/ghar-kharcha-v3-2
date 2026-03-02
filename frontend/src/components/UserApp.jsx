import { useState, useEffect, useCallback } from 'react'
import Dashboard    from './Dashboard.jsx'
import ExpenseList  from './ExpenseList.jsx'
import AddExpense   from './AddExpense.jsx'
import DownloadPage from './DownloadPage.jsx'
import {
  apiGetToday, apiGetExpenses, apiGetSummary, apiGetYearly,
  apiAddExpense, apiUpdateExpense, apiDeleteExpense, apiUpdateStatus,
} from '../api.js'

export default function UserApp({ user, onLogout, showToast }) {
  const [tab,      setTab]     = useState('home')
  const [todayExp, setToday]   = useState([])
  const [allExp,   setAll]     = useState([])
  const [summary,  setSummary] = useState({})
  const [yearly,   setYearly]  = useState([])
  const [editItem, setEdit]    = useState(null)
  const [saving,   setSaving]  = useState(false)
  const [listLoad, setListLoad]= useState(false)
  const [filters,  setFilters] = useState({ filter:'all', sortBy:'date_desc', search:'', startDate:'', endDate:'', statusFilter:'' })

  const uid = user._id

  const refresh = useCallback(async () => {
    try {
      const [t, s, y] = await Promise.all([
        apiGetToday(uid),
        apiGetSummary(uid, 'all'),
        apiGetYearly(uid),
      ])
      setToday(t); setSummary(s); setYearly(y)
    } catch (e) { showToast('डेटा लोड झाला नाही: '+e.message, 'error') }
  }, [uid])

  const refreshList = useCallback(async () => {
    setListLoad(true)
    try { setAll(await apiGetExpenses(uid, filters)) }
    catch (e) { showToast('डेटा लोड झाला नाही', 'error') }
    finally { setListLoad(false) }
  }, [uid, filters])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => { if (tab==='list') refreshList() }, [tab, filters, refreshList])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editItem) {
        await apiUpdateExpense(editItem._id, { ...data, userId: uid })
        showToast('नोंद बदलली! ✏️')
      } else {
        await apiAddExpense({ ...data, userId: uid })
        showToast('नोंद जोडली! ✅')
      }
      setEdit(null)
      await refresh()
      if (tab==='list') await refreshList()
      setTab('home')
    } catch (e) { showToast('Error: '+e.message, 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try {
      await apiDeleteExpense(id)
      showToast('नोंद काढली! 🗑️')
      await refresh()
      if (tab==='list') await refreshList()
    } catch (e) { showToast('Error: '+e.message, 'error') }
  }

  const handleEdit = (e) => { setEdit(e); setTab('add') }

  const handleStatus = async (id, paymentStatus) => {
    try {
      await apiUpdateStatus(id, paymentStatus)
      await refresh()
      if (tab === 'list') await refreshList()
    } catch (e) { showToast('Error: ' + e.message, 'error') }
  }

  const navItems = [
    { id:'home',     icon:'🏠', label:'मुख्य' },
    { id:'list',     icon:'📋', label:'सर्व'  },
    { id:'add',      icon:'➕', label:'',      special:true },
    { id:'download', icon:'📥', label:'काढा'  },
  ]

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100dvh',overflow:'hidden'}}>
      {/* Top bar */}
      <div style={{flexShrink:0,background:'rgba(15,15,19,.96)',backdropFilter:'blur(10px)',borderBottom:'1px solid #2a2a40',padding:'9px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#f97316,#ef4444)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>🏠</div>
          <div>
            <p style={{fontSize:12,fontWeight:800,lineHeight:1}}>घर खर्चा</p>
            <p style={{fontSize:10,color:'#6b6b88'}}>{user.displayName||user.username}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',color:'#ef4444',borderRadius:7,padding:'5px 10px',fontSize:11,fontWeight:700}}>
          बाहेर पडा
        </button>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:'auto',paddingBottom:64}}>
        {tab==='home'     && <Dashboard todayExpenses={todayExp} summary={summary} yearlyData={yearly} onDelete={handleDelete} onEdit={handleEdit} onStatusChange={handleStatus} userName={user.displayName||user.username}/>}
        {tab==='list'     && <ExpenseList expenses={allExp} filters={filters} setFilters={setFilters} onDelete={handleDelete} onEdit={handleEdit} onStatusChange={handleStatus} loading={listLoad}/>}
        {tab==='add'      && <AddExpense editExpense={editItem} onSave={handleSave} onCancel={()=>{setEdit(null);setTab('home')}} userId={uid} loading={saving}/>}
        {tab==='download' && <DownloadPage userId={uid} userName={user.displayName||user.username} showToast={showToast}/>}
      </div>

      {/* Bottom Nav */}
      <nav style={{flexShrink:0,background:'rgba(22,22,30,.98)',backdropFilter:'blur(20px)',borderTop:'1px solid #2a2a40',display:'flex',alignItems:'center',justifyContent:'space-around',padding:'5px 0 12px'}}>
        {navItems.map(t=>(
          <button key={t.id} onClick={()=>{if(t.id!=='add')setEdit(null);setTab(t.id)}}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,background:t.special?'linear-gradient(135deg,#f97316,#ef4444)':'transparent',borderRadius:t.special?'50%':7,width:t.special?48:54,height:t.special?48:'auto',marginTop:t.special?'-14px':0,padding:t.special?0:'4px 8px',boxShadow:t.special?'0 4px 20px rgba(249,115,22,.5)':'none',color:tab===t.id?(t.special?'#fff':'#f97316'):'#6b6b88',justifyContent:'center'}}>
            <span style={{fontSize:t.special?19:16}}>{t.icon}</span>
            {!t.special && <span style={{fontSize:9,fontWeight:700}}>{t.label}</span>}
          </button>
        ))}
      </nav>
    </div>
  )
}
