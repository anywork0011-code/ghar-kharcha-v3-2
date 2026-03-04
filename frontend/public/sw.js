// 🏠 घर खर्चा — Service Worker v3.0
const CACHE = 'ghar-kharcha-v3'

self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

// ── Push received ─────────────────────────────────────────────────────────────
self.addEventListener('push', e => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch { d = {} }

  const title = d.title || '⏰ Deadline — घर खर्चा'
  const opts  = {
    body:    d.body || 'एक payment deadline आली आहे!',
    icon:    '/favicon.svg',
    badge:   '/favicon.svg',
    tag:     d.tag || 'gk-deadline',
    vibrate: [200,100,200,100,300],
    requireInteraction: true,
    data:    d,
    actions: [
      { action:'view',      title:'📋 नोंद पहा'  },
      { action:'whatsapp',  title:'📲 WhatsApp'  },
      { action:'call',      title:'📞 Call करा'  },
    ],
  }
  e.waitUntil(self.registration.showNotification(title, opts))
})

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  const action = e.action
  const d      = e.notification.data || {}
  e.notification.close()

  if (action === 'whatsapp' && d.phone) {
    const clean = d.phone.replace(/\D/g,'')
    const num   = clean.startsWith('91') ? clean : '91'+clean
    const msg   = `🏠 *घर खर्चा Reminder*\n\n📋 *${d.name||''}*\n💰 रक्कम: *₹${Number(d.amount||0).toLocaleString('en-IN')}*\n⏰ Deadline: ${d.deadline||''}\n\nकृपया लवकर settle करा!`
    e.waitUntil(clients.openWindow('https://wa.me/'+num+'?text='+encodeURIComponent(msg)))
    return
  }
  if (action === 'call' && d.phone) {
    e.waitUntil(clients.openWindow('tel:'+d.phone))
    return
  }
  // Default — open app, pass expenseId so it can highlight that record
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      for (const c of list) {
        if ('focus' in c) {
          c.postMessage({ type:'OPEN_EXPENSE', expenseId: d.expenseId })
          return c.focus()
        }
      }
      return clients.openWindow('/?expense='+d.expenseId)
    })
  )
})

// ── Periodic background sync (Chrome Android) ─────────────────────────────────
self.addEventListener('periodicsync', e => {
  if (e.tag === 'gk-deadlines') e.waitUntil(bgCheckDeadlines())
})

async function bgCheckDeadlines() {
  try {
    const cache  = await caches.open(CACHE)
    const res    = await cache.match('gk-user')
    if (!res) return
    const user   = await res.json()
    const resp   = await fetch('/api/expenses/deadlines?userId='+user._id)
    const due    = await resp.json()
    for (const exp of (due||[])) {
      const d    = new Date(exp.deadline.split('/').reverse().join('-'))
      const now  = new Date(); now.setHours(0,0,0,0)
      const diff = Math.floor((d-now)/(864e5))
      const lbl  = diff<0 ? Math.abs(diff)+' दिवस उशीर!' : diff===0 ? 'आज Deadline!' : diff+' दिवस बाकी'
      await self.registration.showNotification('⏰ '+lbl+' — '+exp.name, {
        body:    '💰 ₹'+Number(exp.amount).toLocaleString('en-IN')+' | 📅 '+exp.deadline,
        icon:    '/favicon.svg', badge:'/favicon.svg',
        tag:     'gk-exp-'+exp._id,
        vibrate: [200,100,200], requireInteraction:true,
        data:    { expenseId:exp._id, phone:exp.phone||'', amount:exp.amount, name:exp.name, deadline:exp.deadline },
        actions: [{action:'view',title:'📋 पहा'},{action:'whatsapp',title:'📲 WhatsApp'},{action:'call',title:'📞 Call'}],
      })
    }
  } catch(err) { console.log('SW bg check err:', err) }
}
