// 🏠 घर खर्चा — Service Worker v3.0
// Handles Web Push notifications from backend

self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', e  => e.waitUntil(clients.claim()))

// ── Push event: backend sends → SW receives → shows notification ──────────────
self.addEventListener('push', e => {
  if (!e.data) return
  let d = {}
  try { d = e.data.json() } catch { return }

  const title = d.title || '⏰ घर खर्चा Reminder'
  const options = {
    body:               d.body || '',
    icon:               '/favicon.svg',
    badge:              '/favicon.svg',
    tag:                d.tag  || 'gk-reminder',
    vibrate:            [200, 100, 200, 100, 300],
    requireInteraction: true,   // stays until user taps
    data:               d,
    actions: [
      { action: 'view',     title: '📋 नोंद पहा' },
      { action: 'whatsapp', title: '📲 WhatsApp'  },
      { action: 'call',     title: '📞 Call करा'  },
    ],
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  const action = e.action
  const d      = e.notification.data || {}
  e.notification.close()

  if (action === 'whatsapp' && d.phone) {
    const statusMap = { paid:'भरले ✅', unpaid:'देणे बाकी 🟡', received:'मिळाले ✅', not_received:'मिळणे बाकी 🟡' }
    const amt  = Number(d.amount||0).toLocaleString('en-IN')
    const stat = statusMap[d.paymentStatus] || 'देणे बाकी 🟡'
    const dl   = d.deadline ? '\n⏰ अंतिम तारीख: ' + d.deadline : ''
    const nt   = d.note     ? '\n📝 टीप: '         + d.note     : ''
    const msg  = '📋 *' + d.name + '*\n💰 रक्कम: ₹' + amt + '\n📊 स्थिती: ' + stat + '\n📅 तारीख: ' + d.date + dl + nt + '\n_Sent via घर खर्चा App_'
    const clean = (d.phone).replace(/\D/g,'')
    const num   = clean.startsWith('91') ? clean : '91' + clean
    e.waitUntil(clients.openWindow('https://wa.me/' + num + '?text=' + encodeURIComponent(msg)))
    return
  }

  if (action === 'call' && d.phone) {
    // Open app first — then user can tap call (tel: can't be opened directly from SW)
    e.waitUntil(focusOrOpen('/?action=call&phone=' + encodeURIComponent(d.phone)))
    return
  }

  // Default: open / focus app and highlight the expense
  e.waitUntil(focusOrOpen('/?expense=' + (d.expenseId || '')))
})

function focusOrOpen(url) {
  return clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
    for (const c of list) {
      if ('focus' in c) {
        c.postMessage({ type:'OPEN_EXPENSE', expenseId: url.includes('expense=') ? url.split('expense=')[1] : null })
        return c.focus()
      }
    }
    return clients.openWindow(url)
  })
}
