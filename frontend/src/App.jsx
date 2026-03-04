import { useState } from 'react'
import useTheme from './useTheme.js'
import LoginScreen from './components/LoginScreen.jsx'
import UserApp     from './components/UserApp.jsx'
import AdminApp    from './components/AdminApp.jsx'

function Toast({ toast }) {
  return (
    <div style={{
      position:'fixed', top:16, left:'50%', zIndex:9999,
      background:'#1e1e2a',
      border:`2px solid ${toast.type==='error'?'#ef4444':'#22c55e'}`,
      color:'#f1f0ff', padding:'10px 22px', borderRadius:30,
      fontSize:13, fontWeight:700,
      boxShadow:'0 8px 32px rgba(0,0,0,.5)',
      whiteSpace:'nowrap', pointerEvents:'none',
      transition:'opacity .3s, transform .3s',
      opacity: toast.show ? 1 : 0,
      transform: toast.show ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-60px)',
    }}>{toast.msg}</div>
  )
}

export default function App() {
  // Only the session (who is logged in) is stored in localStorage — NOT the data
  // All actual data lives in MongoDB via the API
  const [theme, setTheme] = useTheme()
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('gk_session')) } catch { return null }
  })
  const [toast, setToast] = useState({ show:false, msg:'', type:'success' })

  const showToast = (msg, type = 'success') => {
    setToast({ show:true, msg, type })
    setTimeout(() => setToast(t => ({ ...t, show:false })), 2800)
  }

  const handleLogin = (u) => {
    localStorage.setItem('gk_session', JSON.stringify(u))
    setUser(u)
  }
  const handleLogout = () => {
    localStorage.removeItem('gk_session')
    setUser(null)
  }

  return (
    <>
      <Toast toast={toast}/>
      {!user
        ? <LoginScreen onLogin={handleLogin} showToast={showToast}/>
        : user.role === 'admin'
          ? <AdminApp  user={user} onLogout={handleLogout} showToast={showToast}/>
          : <UserApp   user={user} onLogout={handleLogout} showToast={showToast} theme={theme} setTheme={setTheme}/>
      }
    </>
  )
}
