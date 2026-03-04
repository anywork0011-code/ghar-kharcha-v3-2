const express   = require('express')
const mongoose  = require('mongoose')
const cors      = require('cors')
const webpush   = require('web-push')
const cron      = require('node-cron')

const app = express()
app.use(cors())
app.use(express.json())

// ── MongoDB ───────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI ||
  'mongodb+srv://gharKharcha:Navnath%401998@cluster0.mex5j4z.mongodb.net/gharKharcha?appName=Cluster0'
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err))

// ── VAPID Setup ───────────────────────────────────────────────────────────────
// These keys are unique to your app — never change them or all subscriptions break
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC  || 'BJAzPJmjC3OMCLTc4rIWI__mK4qvlTQe3xkHehfhMJzLkAVRSODMNlLYdP6dC9lD9cCZ9kxhjyyJ8v7O1qt2M9I'
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || 'PCpTLjpcgYLnaoPuuW6FLpYuq85u1M_v32nOJ8pBwkQ'
webpush.setVapidDetails('mailto:gharapp@example.com', VAPID_PUBLIC, VAPID_PRIVATE)

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════
const userSchema = new mongoose.Schema({
  username:       { type: String, required: true, unique: true, trim: true },
  password:       { type: String, required: true },
  displayName:    { type: String, default: '' },
  role:           { type: String, enum: ['admin','user'], default: 'user' },
  active:         { type: Boolean, default: true },
  whatsappNumber: { type: String, default: '' },
  createdAt:      { type: Date, default: Date.now },
})
const User = mongoose.model('User', userSchema)

const expenseSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:          { type: String, required: true },
  amount:        { type: Number, required: true },
  type:          { type: String, enum: ['pay','receive'], default: 'pay' },
  paymentStatus: { type: String, enum: ['paid','unpaid','received','not_received'], default: 'unpaid' },
  category:      { type: String, default: 'सामान्य' },
  note:          { type: String, default: '' },
  phone:         { type: String, default: '' },
  deadline:      { type: String, default: '' },  // DD/MM/YYYY
  date:          { type: String, required: true },
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now },
  createdBy:     { type: String, default: '' },
  modifiedBy:    { type: String, default: '' },
  modifiedAt:    { type: Date },
})
const Expense = mongoose.model('Expense', expenseSchema)

// Push subscriptions — one per user (browser endpoint)
const pushSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscription: { type: Object, required: true },
  createdAt:    { type: Date, default: Date.now },
})
const PushSub = mongoose.model('PushSub', pushSchema)

// ── Seed admin ────────────────────────────────────────────────────────────────
mongoose.connection.once('open', async () => {
  const exists = await User.findOne({ username: 'Navnath' })
  if (!exists) {
    await User.create({ username:'Navnath', password:'12345', displayName:'नवनाथ', role:'admin' })
    console.log('✅ Admin seeded: Navnath / 12345')
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function parseDate(str) {
  if (!str) return null
  const [dd,mm,yyyy] = str.split('/')
  return new Date(`${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`)
}
function todayStr() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
function calcSummary(expenses) {
  return {
    totalPay:         expenses.filter(e=>e.type==='pay').reduce((s,e)=>s+e.amount,0),
    totalReceive:     expenses.filter(e=>e.type==='receive').reduce((s,e)=>s+e.amount,0),
    totalPaid:        expenses.filter(e=>e.type==='pay'&&e.paymentStatus==='paid').reduce((s,e)=>s+e.amount,0),
    totalUnpaid:      expenses.filter(e=>e.type==='pay'&&e.paymentStatus==='unpaid').reduce((s,e)=>s+e.amount,0),
    totalReceived:    expenses.filter(e=>e.type==='receive'&&e.paymentStatus==='received').reduce((s,e)=>s+e.amount,0),
    totalNotReceived: expenses.filter(e=>e.type==='receive'&&e.paymentStatus==='not_received').reduce((s,e)=>s+e.amount,0),
    balance:          expenses.filter(e=>e.type==='receive').reduce((s,e)=>s+e.amount,0) -
                      expenses.filter(e=>e.type==='pay').reduce((s,e)=>s+e.amount,0),
    count:            expenses.length,
  }
}

const STATUS_LABEL = {
  paid:'भरले ✅', unpaid:'देणे बाकी 🟡',
  received:'मिळाले ✅', not_received:'मिळणे बाकी 🟡',
}

// Build the exact WhatsApp / push notification message
function buildMsg(exp) {
  const amt      = Number(exp.amount||0).toLocaleString('en-IN')
  const status   = STATUS_LABEL[exp.paymentStatus] || exp.paymentStatus
  const deadline = exp.deadline ? `\n⏰ अंतिम तारीख: ${exp.deadline}` : ''
  const note     = exp.note     ? `\n📝 टीप: ${exp.note}`             : ''
  return `📋 *${exp.name}*\n💰 रक्कम: ₹${amt}\n📊 स्थिती: ${status}\n📅 तारीख: ${exp.date}${deadline}${note}\n_Sent via घर खर्चा App_`
}

// Send push to a single subscription, remove if expired/invalid
async function sendPush(sub, payload) {
  try {
    await webpush.sendNotification(sub.subscription, JSON.stringify(payload))
    return true
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      // Subscription expired — remove it
      await PushSub.findByIdAndDelete(sub._id)
      console.log('🗑️  Removed expired subscription', sub._id)
    } else {
      console.error('Push send error:', err.statusCode, err.message)
    }
    return false
  }
}

// ── Core reminder logic ──────────────────────────────────────────────────────
// daysFilter: 0 = today only, 1 = tomorrow only, 2 = day-after-tomorrow only
// pass null to send all (overdue + today + tomorrow + day after)
async function sendDeadlineReminders(daysFilter = null) {
  const label = daysFilter === 0 ? 'TODAY' : daysFilter === 1 ? 'TOMORROW' : daysFilter === 2 ? 'DAY AFTER' : 'ALL'
  console.log(`🔔 [${label}] Deadline check:`, new Date().toLocaleTimeString('en-IN', { timeZone:'Asia/Kolkata' }))

  const allPending = await Expense.find({
    deadline:      { $ne: '' },
    paymentStatus: { $in: ['unpaid', 'not_received'] },
  })

  const nowDay = new Date(); nowDay.setHours(0,0,0,0)

  const due = allPending.filter(e => {
    const d = parseDate(e.deadline)
    if (!d) return false
    const diff = Math.floor((d - nowDay) / (1000*60*60*24))
    if (daysFilter === null) return diff <= 2          // all: overdue + today + next 2 days
    return diff === daysFilter                          // exact day match
  })

  console.log(`📋 Matching expenses: ${due.length}`)
  let sent = 0

  for (const exp of due) {
    const subs = await PushSub.find({ userId: exp.userId })
    if (!subs.length) continue

    const d    = parseDate(exp.deadline)
    const diff = Math.floor((d - nowDay) / (1000*60*60*24))
    const lbl  = diff < 0  ? `${Math.abs(diff)} दिवस उशीर!`
               : diff === 0 ? 'आज Deadline! 🔴'
               : diff === 1 ? 'उद्या Deadline ⚠️'
               :              'परवा Deadline ⏰'

    const payload = {
      title:     `⏰ ${lbl} — ${exp.name}`,
      body:      `💰 ₹${Number(exp.amount).toLocaleString('en-IN')} | 📅 ${exp.deadline}`,
      tag:       `gk-${exp._id}-${diff}`,  // unique tag per day so multiple don't collapse
      expenseId: String(exp._id),
      phone:     exp.phone || '',
      amount:    exp.amount,
      name:      exp.name,
      deadline:  exp.deadline,
      date:      exp.date,
      note:      exp.note || '',
      paymentStatus: exp.paymentStatus,
    }

    for (const sub of subs) {
      const ok = await sendPush(sub, payload)
      if (ok) sent++
    }
  }

  console.log(`✅ Sent ${sent} push notifications`)
  return { checked: due.length, sent }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRON — runs every day at 9:00 AM
// ═══════════════════════════════════════════════════════════════════════════════
// ── TODAY deadline → 3 reminders: 9 AM, 1 PM, 6 PM IST ─────────────────────
cron.schedule('0 9  * * *', () => sendDeadlineReminders(0).catch(console.error), { timezone:'Asia/Kolkata' })
cron.schedule('0 13 * * *', () => sendDeadlineReminders(0).catch(console.error), { timezone:'Asia/Kolkata' })
cron.schedule('0 18 * * *', () => sendDeadlineReminders(0).catch(console.error), { timezone:'Asia/Kolkata' })

// ── TOMORROW / DAY-AFTER deadline → once at 9:30 AM IST ─────────────────────
cron.schedule('30 9 * * *', () => sendDeadlineReminders(1).catch(console.error), { timezone:'Asia/Kolkata' })
cron.schedule('30 9 * * *', () => sendDeadlineReminders(2).catch(console.error), { timezone:'Asia/Kolkata' })

console.log('⏰ Cron scheduled (IST):')
console.log('   Today deadline    → 9:00 AM, 1:00 PM, 6:00 PM')
console.log('   Tomorrow deadline → 9:30 AM')
console.log('   Day-after deadline→ 9:30 AM')

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username: username?.trim(), password, active: true })
    if (!user) return res.status(401).json({ error: 'चुकीचे नाव किंवा पासवर्ड' })
    res.json({ _id: user._id, username: user.username, displayName: user.displayName, role: user.role, whatsappNumber: user.whatsappNumber || '' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({ role:'user' }, '-password').sort({ createdAt:1 })
    res.json(users)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, displayName } = req.body
    if (!username||!password) return res.status(400).json({ error: 'नाव आणि पासवर्ड आवश्यक' })
    const exists = await User.findOne({ username: username.trim() })
    if (exists) return res.status(400).json({ error: 'हे नाव आधीच वापरात आहे' })
    const user = await User.create({ username: username.trim(), password, displayName: displayName||username.trim(), role:'user' })
    const { password: _, ...out } = user.toObject()
    res.status(201).json(out)
  } catch (err) { res.status(400).json({ error: err.message }) }
})

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    await Expense.deleteMany({ userId: req.params.id })
    await PushSub.deleteMany({ userId: req.params.id })
    res.json({ success: true })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

app.patch('/api/users/:id/whatsapp', async (req, res) => {
  try {
    const { whatsappNumber } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, { whatsappNumber }, { new:true })
    res.json({ _id: user._id, whatsappNumber: user.whatsappNumber })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// PUSH SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Return VAPID public key so frontend can subscribe
app.get('/api/push/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC })
})

// Save browser push subscription
app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body
    if (!userId||!subscription) return res.status(400).json({ error: 'userId + subscription required' })
    await PushSub.findOneAndUpdate(
      { userId },
      { userId, subscription, createdAt: new Date() },
      { upsert: true, new: true }
    )
    console.log('✅ Push subscription saved for user', userId)
    res.json({ success: true })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// Remove subscription (user disables notifications)
app.delete('/api/push/unsubscribe', async (req, res) => {
  try {
    const { userId } = req.body
    await PushSub.deleteMany({ userId })
    res.json({ success: true })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// Manually trigger reminders (for testing, or called by admin)
app.post('/api/push/test', async (req, res) => {
  try {
    const { userId } = req.body
    const subs = await PushSub.find({ userId })
    if (!subs.length) return res.status(404).json({ error: 'No subscription found for this user' })
    const payload = {
      title:     '🔔 Test — घर खर्चा',
      body:      'Push notifications काम करत आहेत! ✅',
      tag:       'gk-test',
      expenseId: null,
      phone: '', amount: 0, name: 'Test', deadline: '', date: todayStr(), note: '', paymentStatus: 'unpaid',
    }
    let sent = 0
    for (const sub of subs) { if (await sendPush(sub, payload)) sent++ }
    res.json({ success: true, sent })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Manually run deadline check now (for testing)
app.post('/api/push/run-now', async (req, res) => {
  try {
    const result = await sendDeadlineReminders()
    res.json({ success: true, ...result })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/expenses/today', async (req, res) => {
  try {
    const { userId } = req.query
    const q = { date: todayStr() }
    if (userId) q.userId = userId
    const expenses = await Expense.find(q).sort({ createdAt:-1 }).limit(30)
    res.json(expenses)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/expenses/summary', async (req, res) => {
  try {
    const { userId, period } = req.query
    const q = {}; if (userId) q.userId = userId
    let expenses = await Expense.find(q)
    const now = new Date()
    if (period==='today') {
      const t = todayStr()
      expenses = expenses.filter(e => e.date === t)
    } else if (period==='month') {
      const m = new Date(now); m.setMonth(now.getMonth()-1)
      expenses = expenses.filter(e => { const d=parseDate(e.date); return d&&d>=m&&d<=now })
    }
    res.json(calcSummary(expenses))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/expenses/yearly', async (req, res) => {
  try {
    const { userId } = req.query
    const q = {}; if (userId) q.userId = userId
    const all = await Expense.find(q)
    const now = new Date()
    const result = []
    for (let i=4; i>=0; i--) {
      const yr   = now.getFullYear() - i
      const list = all.filter(e => { const d=parseDate(e.date); return d&&d.getFullYear()===yr })
      result.push({ year:yr, count:list.length, ...calcSummary(list) })
    }
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/expenses/deadlines', async (req, res) => {
  try {
    const { userId } = req.query
    const q = {}; if (userId) q.userId = userId
    const all = await Expense.find({ ...q, deadline: { $ne:'' }, paymentStatus: { $in:['unpaid','not_received'] } })
    const today = new Date(); today.setHours(23,59,59,999)
    const due = all.filter(e => { const d=parseDate(e.deadline); return d&&d<=today })
    res.json(due)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/expenses', async (req, res) => {
  try {
    const { userId, filter, startDate, endDate, sortBy, search, statusFilter } = req.query
    const q = {}; if (userId) q.userId = userId
    let expenses = await Expense.find(q).sort({ createdAt:-1 })
    const now = new Date(); now.setHours(23,59,59,999)
    if (filter==='today') {
      const t = todayStr()
      expenses = expenses.filter(e => e.date===t)
    } else if (filter==='week') {
      const w = new Date(); w.setDate(w.getDate()-7); w.setHours(0,0,0,0)
      expenses = expenses.filter(e => { const d=parseDate(e.date); return d&&d>=w&&d<=now })
    } else if (filter==='month') {
      const m = new Date(); m.setMonth(m.getMonth()-1); m.setHours(0,0,0,0)
      expenses = expenses.filter(e => { const d=parseDate(e.date); return d&&d>=m&&d<=now })
    } else if (filter==='custom' && startDate && endDate) {
      const s=parseDate(startDate); const ef=parseDate(endDate)
      if (s&&ef) { ef.setHours(23,59,59,999); expenses = expenses.filter(e => { const d=parseDate(e.date); return d&&d>=s&&d<=ef }) }
    }
    if (search) {
      const sq = search.toLowerCase()
      expenses = expenses.filter(e => e.name.toLowerCase().includes(sq)||e.category.toLowerCase().includes(sq))
    }
    if (statusFilter) expenses = expenses.filter(e => e.paymentStatus===statusFilter)
    if (sortBy==='amount_asc')   expenses.sort((a,b) => a.amount-b.amount)
    else if (sortBy==='amount_desc') expenses.sort((a,b) => b.amount-a.amount)
    else if (sortBy==='name_asc')    expenses.sort((a,b) => a.name.localeCompare(b.name,'mr'))
    else if (sortBy==='date_asc')    expenses.sort((a,b) => (parseDate(a.date)||0)-(parseDate(b.date)||0))
    res.json(expenses)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/expenses', async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, createdAt: new Date(), updatedAt: new Date() })
    res.status(201).json(expense)
  } catch (err) { res.status(400).json({ error: err.message }) }
})

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const update = { ...req.body, updatedAt: new Date(), modifiedAt: new Date() }
    const expense = await Expense.findByIdAndUpdate(req.params.id, update, { new:true })
    if (!expense) return res.status(404).json({ error: 'Not found' })
    res.json(expense)
  } catch (err) { res.status(400).json({ error: err.message }) }
})

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/summary', async (req, res) => {
  try {
    const users = await User.find({ role:'user', active:true })
    const result = []
    for (const u of users) {
      const exp = await Expense.find({ userId: u._id })
      result.push({ user:{ _id:u._id, username:u.username, displayName:u.displayName, whatsappNumber:u.whatsappNumber||'' }, ...calcSummary(exp) })
    }
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status:'ok', time: new Date().toISOString() }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`))
