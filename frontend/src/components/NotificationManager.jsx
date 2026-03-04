// NotificationManager.jsx
// Clean ON/OFF toggle for push notifications

import { useState, useEffect } from 'react'

const BASE = import.meta.env.VITE_API_URL || ''

// ── Helpers ───────────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g,'+').replace(/_/g,'/')
  const raw     = window.atob(base64)
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
}

async function getVapidKey() {
  const res = await fetch(`${BASE}/api/push/vapid-public-key`)
  return (await res.json()).publicKey
}

async function subscribeBrowser(reg, vapidKey) {
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing
  return reg.pushManager.subscribe({
    userVisibleOnly:      true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  })
}

async function saveToBackend(userId, subscription) {
  await fetch(`${BASE}/api/push/subscribe`, {
    method: 'POST', headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
  })
}

async function removeFromBackend(userId) {
  await fetch(`${BASE}/api/push/unsubscribe`, {
    method: 'DELETE', headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ userId }),
  })
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'default'
  return await Notification.requestPermission()
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NotificationManager({ user, showToast, onOpenExpense }) {
  const [on,      setOn]      = useState(false)
  const [loading, setLoading] = useState(false)
  const [perm,    setPerm]    = useState('default')
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

  // On mount: check current state
  useEffect(() => {
    if (!supported) return
    setPerm(Notification.permission)
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setOn(!!sub))
    ).catch(() => {})

    // Listen for SW → app messages (notification click)
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type === 'OPEN_EXPENSE' && onOpenExpense) onOpenExpense(e.data.expenseId)
    })
  }, [])

  const handleToggle = async () => {
    if (loading) return
    setLoading(true)
    try {
      if (on) {
        // ── TURN OFF ──────────────────────────────────────────────────────
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
        await removeFromBackend(user._id)
        setOn(false)
        showToast('🔕 Notifications बंद केले')
      } else {
        // ── TURN ON ───────────────────────────────────────────────────────
        // 1. Ask permission
        const p = await Notification.requestPermission()
        setPerm(p)
        if (p !== 'granted') {
          showToast('Permission नाकारले — Chrome Settings मध्ये allow करा', 'error')
          return
        }
        // 2. Register SW
        const reg = await navigator.serviceWorker.register('/sw.js', { scope:'/' })
        await navigator.serviceWorker.ready
        // 3. Get VAPID key + subscribe
        const vapidKey = await getVapidKey()
        const sub      = await subscribeBrowser(reg, vapidKey)
        // 4. Save to backend
        await saveToBackend(user._id, sub)
        setOn(true)
        showToast('🔔 Notifications चालू! Deadline आल्यावर notify होईल ✅')
      }
    } catch (err) {
      console.error('Notification toggle error:', err)
      showToast('Error: ' + err.message, 'error')
    } finally { setLoading(false) }
  }

  const handleTest = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${BASE}/api/push/test`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId: user._id }),
      })
      const data = await res.json()
      if (data.sent > 0) showToast('🔔 Test notification पाठवले! काही सेकंदात येईल ⬆️')
      else showToast('Subscription सापडले नाही — आधी ON करा', 'error')
    } catch (err) { showToast('Error: '+err.message,'error') }
    finally { setLoading(false) }
  }

  // iOS / unsupported
  if (!supported) return (
    <div style={styles.wrap('#6b6b88','rgba(107,107,136,.08)','rgba(107,107,136,.2)')}>
      <span style={{fontSize:18}}>ℹ️</span>
      <p style={{fontSize:11,color:'#6b6b88',flex:1}}>Push notifications फक्त Android Chrome मध्ये काम करतात</p>
    </div>
  )

  // Permission permanently denied
  if (perm === 'denied') return (
    <div style={styles.wrap('#ef4444','rgba(239,68,68,.06)','rgba(239,68,68,.2)')}>
      <span style={{fontSize:18}}>🔕</span>
      <div style={{flex:1}}>
        <p style={{fontSize:11,color:'#ef4444',fontWeight:700}}>Notifications blocked</p>
        <p style={{fontSize:10,color:'#9b9bb8',marginTop:2}}>Chrome → Site Settings → Notifications → Allow करा</p>
      </div>
    </div>
  )

  return (
    <div style={styles.wrap(
      on ? '#22c55e' : '#f59e0b',
      on ? 'rgba(34,197,94,.06)' : 'rgba(245,158,11,.06)',
      on ? 'rgba(34,197,94,.2)'  : 'rgba(245,158,11,.2)',
    )}>
      {/* Bell icon */}
      <span style={{fontSize:18,flexShrink:0}}>{on ? '🔔' : '🔕'}</span>

      {/* Label */}
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:11,fontWeight:700,color:on?'#22c55e':'#f59e0b'}}>
          {on ? 'Notifications चालू आहेत ✅' : 'Notifications बंद आहेत'}
        </p>
        <p style={{fontSize:10,color:'#6b6b88',marginTop:1,lineHeight:1.5}}>
          {on
            ? 'Deadline आज → 9AM 1PM 6PM | उद्या/परवा → 9:30AM'
            : 'Enable करा — app बंद असले तरी reminder येईल'}
        </p>
      </div>

      {/* Buttons */}
      <div style={{display:'flex',gap:6,flexShrink:0}}>
        {on && (
          <button onClick={handleTest} disabled={loading}
            style={styles.btn('#3b82f6','rgba(59,130,246,.15)','rgba(59,130,246,.3)')}>
            {loading ? '⏳' : '🧪'}
          </button>
        )}
        {/* ON/OFF Toggle */}
        <button onClick={handleToggle} disabled={loading} style={{
          padding:'7px 14px', borderRadius:20, fontSize:11, fontWeight:800, cursor:'pointer',
          border:'none', fontFamily:'inherit', flexShrink:0,
          background: on
            ? 'rgba(239,68,68,.15)'
            : 'linear-gradient(135deg,#f59e0b,#f97316)',
          color:  on ? '#ef4444' : '#fff',
          boxShadow: on ? 'none' : '0 4px 14px rgba(249,115,22,.35)',
          opacity: loading ? .6 : 1,
          transition: 'all .2s',
        }}>
          {loading ? '⏳' : on ? 'बंद करा' : 'चालू करा'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  wrap: (color, bg, border) => ({
    margin:'8px 14px 4px',
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 13,
    padding: '10px 13px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  }),
  btn: (color, bg, border) => ({
    background: bg, border:`1px solid ${border}`, color,
    borderRadius:8, padding:'6px 10px', fontSize:12,
    fontWeight:700, cursor:'pointer', fontFamily:'inherit',
  }),
}
