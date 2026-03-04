// NotificationManager.jsx
// Handles: SW registration, push notification permission, deadline polling

import { useEffect, useRef } from 'react'
import { apiGetDeadlines } from '../api.js'
import { parseDMY, fmtDMY } from './Calendar.jsx'

// Cache user in SW cache so background sync can use it
async function cacheUserForSW(user) {
  try {
    const cache = await caches.open('ghar-kharcha-v3')
    await cache.put('gk-user', new Response(JSON.stringify(user), { headers: { 'Content-Type': 'application/json' } }))
  } catch {}
}

// Register service worker
async function registerSW() {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    console.log('✅ SW registered')
    return reg
  } catch (err) {
    console.log('SW registration failed:', err)
    return null
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied')  return 'denied'
  const result = await Notification.requestPermission()
  return result
}

// Show a local notification (no server needed)
async function showLocalNotification(title, options) {
  if (!('serviceWorker' in navigator)) return
  if (Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(title, options)
  } catch {}
}

// Register periodic background sync (Chrome Android only)
async function registerPeriodicSync(reg) {
  if (!('periodicSync' in reg)) return
  try {
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' })
    if (status.state === 'granted') {
      await reg.periodicSync.register('gk-deadlines', { minInterval: 6 * 60 * 60 * 1000 }) // every 6h
      console.log('✅ Periodic sync registered')
    }
  } catch {}
}

// Listen for SW messages (e.g. OPEN_EXPENSE from notification click)
function listenSWMessages(onOpenExpense) {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'OPEN_EXPENSE' && onOpenExpense) {
      onOpenExpense(e.data.expenseId)
    }
  })
}

// Check for due deadlines and fire notifications
async function checkAndNotifyDeadlines(userId, shownRef) {
  if (Notification.permission !== 'granted') return
  try {
    const due = await apiGetDeadlines(userId)
    for (const exp of (due || [])) {
      const key  = `${exp._id}-${exp.deadline}`
      if (shownRef.current.has(key)) continue  // don't re-notify same item this session
      shownRef.current.add(key)

      const d    = parseDMY(exp.deadline)
      const now  = new Date(); now.setHours(0,0,0,0)
      const diff = Math.floor((d - now) / (1000*60*60*24))
      const lbl  = diff < 0 ? `${Math.abs(diff)} दिवस उशीर!` : diff === 0 ? 'आज Deadline!' : `${diff} दिवस बाकी`

      await showLocalNotification(`⏰ ${lbl} — ${exp.name}`, {
        body:    `💰 ₹${Number(exp.amount).toLocaleString('en-IN')} | 📅 Deadline: ${exp.deadline}`,
        icon:    '/favicon.svg',
        badge:   '/favicon.svg',
        tag:     `gk-exp-${exp._id}`,
        vibrate: [200, 100, 200, 100, 300],
        requireInteraction: true,
        data: {
          expenseId: exp._id,
          phone:     exp.phone || '',
          amount:    exp.amount,
          name:      exp.name,
          deadline:  exp.deadline,
        },
        actions: [
          { action: 'view',      title: '📋 नोंद पहा' },
          { action: 'whatsapp',  title: '📲 WhatsApp'  },
          { action: 'call',      title: '📞 Call करा'  },
        ],
      })
    }
  } catch {}
}

export default function NotificationManager({ user, onOpenExpense }) {
  const shownRef = useRef(new Set())

  useEffect(() => {
    if (!user) return
    let interval

    async function init() {
      await cacheUserForSW(user)
      const reg = await registerSW()
      if (reg) {
        await registerPeriodicSync(reg)
        listenSWMessages(onOpenExpense)
      }

      // Check on load
      await checkAndNotifyDeadlines(user._id, shownRef)

      // Then check every 30 minutes while app is open
      interval = setInterval(() => {
        checkAndNotifyDeadlines(user._id, shownRef)
      }, 30 * 60 * 1000)
    }

    init()
    return () => clearInterval(interval)
  }, [user])

  return null  // invisible component
}
