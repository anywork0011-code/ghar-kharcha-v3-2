const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')

const app = express()

// ── CORS — allow any origin (update in production if needed) ──────────────
app.use(cors())
app.use(express.json())

// ── MongoDB ───────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI ||
  'mongodb+srv://gharKharcha:Navnath%401998@cluster0.mex5j4z.mongodb.net/gharKharcha?appName=Cluster0'

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err))

// ══════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ══════════════════════════════════════════════════════════════════════════
const userSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, trim: true },
  password:    { type: String, required: true },
  displayName: { type: String, default: '' },
  role:        { type: String, enum: ['admin', 'user'], default: 'user' },
  active:      { type: Boolean, default: true },
  whatsappNumber: { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now },
})
const User = mongoose.model('User', userSchema)

// type: 'pay' = भरावे लागेल | 'receive' = मिळणार
// paymentStatus: 'paid' | 'unpaid' | 'received' | 'not_received'
const expenseSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:          { type: String, required: true },
  amount:        { type: Number, required: true },
  type:          { type: String, enum: ['pay', 'receive'], default: 'pay' },
  paymentStatus: { type: String, enum: ['paid', 'unpaid', 'received', 'not_received'], default: 'unpaid' },
  category:      { type: String, default: 'सामान्य' },
  note:          { type: String, default: '' },
  phone:         { type: String, default: '' },
  deadline:      { type: String, default: '' },  // DD/MM/YYYY optional
  date:          { type: String, required: true },  // DD/MM/YYYY
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now },
  createdBy:     { type: String, default: '' },   // username who created
  modifiedBy:    { type: String, default: '' },   // username who last modified
  modifiedAt:    { type: Date },
})
const Expense = mongoose.model('Expense', expenseSchema)

// Push notification subscriptions
const pushSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscription: { type: Object, required: true },  // browser push subscription object
  createdAt:    { type: Date, default: Date.now },
})
const PushSub = mongoose.model('PushSub', pushSchema)

// ── Seed admin on first run ───────────────────────────────────────────────
mongoose.connection.once('open', async () => {
  const exists = await User.findOne({ username: 'Navnath' })
  if (!exists) {
    await User.create({ username: 'Navnath', password: '12345', displayName: 'नवनाथ', role: 'admin' })
    console.log('✅ Admin seeded: Navnath / 12345')
  }
})

// ══════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════
function parseDate(str) {
  if (!str) return null
  const [dd, mm, yyyy] = str.split('/')
  return new Date(`${yyyy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`)
}
function todayStr() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
function calcSummary(expenses) {
  return {
    totalPay:          expenses.filter(e => e.type==='pay').reduce((s,e) => s+e.amount, 0),
    totalReceive:      expenses.filter(e => e.type==='receive').reduce((s,e) => s+e.amount, 0),
    totalPaid:         expenses.filter(e => e.type==='pay' && e.paymentStatus==='paid').reduce((s,e) => s+e.amount, 0),
    totalUnpaid:       expenses.filter(e => e.type==='pay' && e.paymentStatus==='unpaid').reduce((s,e) => s+e.amount, 0),
    totalReceived:     expenses.filter(e => e.type==='receive' && e.paymentStatus==='received').reduce((s,e) => s+e.amount, 0),
    totalNotReceived:  expenses.filter(e => e.type==='receive' && e.paymentStatus==='not_received').reduce((s,e) => s+e.amount, 0),
    balance:           expenses.filter(e => e.type==='receive').reduce((s,e)=>s+e.amount,0) - expenses.filter(e=>e.type==='pay').reduce((s,e)=>s+e.amount,0),
    count:             expenses.length,
  }
}

// ══════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username: username?.trim(), password, active: true })
    if (!user) return res.status(401).json({ error: 'चुकीचे नाव किंवा पासवर्ड' })
    res.json({ _id: user._id, username: user.username, displayName: user.displayName, role: user.role, whatsappNumber: user.whatsappNumber || '' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ══════════════════════════════════════════════════════════════════════════
// USERS  (admin only)
// ══════════════════════════════════════════════════════════════════════════
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }, '-password').sort({ createdAt: 1 })
    res.json(users)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, displayName } = req.body
    if (!username || !password) return res.status(400).json({ error: 'नाव आणि पासवर्ड आवश्यक' })
    const exists = await User.findOne({ username: username.trim() })
    if (exists) return res.status(400).json({ error: 'हे नाव आधीच वापरात आहे' })
    const user = await User.create({ username: username.trim(), password, displayName: displayName || username.trim(), role: 'user' })
    const { password: _, ...out } = user.toObject()
    res.status(201).json(out)
  } catch (err) { res.status(400).json({ error: err.message }) }
})

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    await Expense.deleteMany({ userId: req.params.id })
    res.json({ success: true })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ══════════════════════════════════════════════════════════════════════════
// EXPENSES
// ══════════════════════════════════════════════════════════════════════════
app.get('/api/expenses/today', async (req, res) => {
  try {
    const { userId } = req.query
    const q = { date: todayStr() }
    if (userId) q.userId = userId
    const expenses = await Expense.find(q).sort({ createdAt: -1 }).limit(30)
    res.json(expenses)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/expenses/summary', async (req, res) => {
  try {
    const { userId, period } = req.query
    const q = {}
    if (userId) q.userId = userId
    let expenses = await Expense.find(q)
    const now = new Date()
    if (period === 'today') {
      const t = todayStr()
      expenses = expenses.filter(e => e.date === t)
    } else if (period === 'month') {
      const m = new Date(now); m.setMonth(now.getMonth()-1)
      expenses = expenses.filter(e => { const d=parseDate(e.date); return d&&d>=m&&d<=now })
    }
    res.json(calcSummary(expenses))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/expenses/yearly', async (req, res) => {
  try {
    const { userId } = req.query
    const q = {}
    if (userId) q.userId = userId
    const all = await Expense.find(q)
    const now  = new Date()
    const result = []
    for (let i = 4; i >= 0; i--) {
      const yr   = now.getFullYear() - i
      const list = all.filter(e => { const d=parseDate(e.date); return d&&d.getFullYear()===yr })
      result.push({ year: yr, count: list.length, ...calcSummary(list) })
    }
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/expenses', async (req, res) => {
  try {
    const { userId, filter, startDate, endDate, sortBy, search, statusFilter } = req.query
    const q = {}
    if (userId) q.userId = userId
    let expenses = await Expense.find(q).sort({ createdAt: -1 })

    const now = new Date(); now.setHours(23,59,59,999)

    if (filter === 'today') {
      const t = todayStr()
      expenses = expenses.filter(e => e.date === t)
    } else if (filter === 'week') {
      const w = new Date(); w.setDate(w.getDate()-7); w.setHours(0,0,0,0)
      expenses = expenses.filter(e => { const d=parseDate(e.date); return d&&d>=w&&d<=now })
    } else if (filter === 'month') {
      const m = new Date(); m.setMonth(m.getMonth()-1); m.setHours(0,0,0,0)
      expenses = expenses.filter(e => { const d=parseDate(e.date); return d&&d>=m&&d<=now })
    } else if (filter === 'custom' && startDate && endDate) {
      const s=parseDate(startDate); const ef=parseDate(endDate)
      if (s&&ef) { ef.setHours(23,59,59,999); expenses = expenses.filter(e => { const d=parseDate(e.date); return d&&d>=s&&d<=ef }) }
    }

    if (search) {
      const q2 = search.toLowerCase()
      expenses = expenses.filter(e => e.name.toLowerCase().includes(q2) || e.category.toLowerCase().includes(q2))
    }
    if (statusFilter) expenses = expenses.filter(e => e.paymentStatus === statusFilter)

    if (sortBy==='amount_asc')  expenses.sort((a,b) => a.amount-b.amount)
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
    const expense = await Expense.findByIdAndUpdate(req.params.id, update, { new: true })
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

// ══════════════════════════════════════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════════════════════════════════════
app.get('/api/admin/summary', async (req, res) => {
  try {
    const users = await User.find({ role: 'user', active: true })
    const result = []
    for (const u of users) {
      const exp = await Expense.find({ userId: u._id })
      result.push({
        user: { _id: u._id, username: u.username, displayName: u.displayName },
        ...calcSummary(exp),
      })
    }
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Update user whatsapp number (admin)
app.patch('/api/users/:id/whatsapp', async (req, res) => {
  try {
    const { whatsappNumber } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, { whatsappNumber }, { new: true })
    res.json({ _id: user._id, whatsappNumber: user.whatsappNumber })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// Get deadlines due today or overdue for a user (for reminders)
app.get('/api/expenses/deadlines', async (req, res) => {
  try {
    const { userId } = req.query
    const q = {}
    if (userId) q.userId = userId
    const all = await Expense.find({ ...q, deadline: { $ne: '' } })
    const today = new Date(); today.setHours(23, 59, 59, 999)
    const due = all.filter(e => {
      if (!e.deadline) return false
      const d = parseDate(e.deadline)
      return d && d <= today && e.paymentStatus !== 'paid' && e.paymentStatus !== 'received'
    })
    res.json(due)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Push Notification Subscriptions ──────────────────────────────────────────
app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body
    // Upsert — one subscription per user (replace old)
    await PushSub.findOneAndUpdate(
      { userId },
      { userId, subscription, createdAt: new Date() },
      { upsert: true, new: true }
    )
    res.json({ success: true })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

app.delete('/api/push/unsubscribe', async (req, res) => {
  try {
    const { userId } = req.body
    await PushSub.deleteMany({ userId })
    res.json({ success: true })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// Called by a cron job or client to trigger deadline notifications
app.post('/api/push/send-deadline-reminders', async (req, res) => {
  try {
    const now   = new Date(); now.setHours(23,59,59,999)
    const soon  = new Date(); soon.setDate(soon.getDate()+1); soon.setHours(23,59,59,999)
    // Find all expenses with a deadline within next 24h or already overdue, not yet paid
    const expenses = await Expense.find({
      deadline: { $ne: '' },
      paymentStatus: { $in: ['unpaid', 'not_received'] }
    })
    const due = expenses.filter(e => {
      if (!e.deadline) return false
      const d = parseDate(e.deadline)
      return d && d <= soon
    })
    const results = []
    for (const exp of due) {
      const subs = await PushSub.find({ userId: exp.userId })
      for (const sub of subs) {
        results.push({ expenseId: exp._id, name: exp.name, deadline: exp.deadline, amount: exp.amount, phone: exp.phone || '' })
      }
    }
    // Return due items with subscription info so client can display
    res.json({ due: results, count: results.length })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
