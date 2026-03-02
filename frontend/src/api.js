// ─────────────────────────────────────────────────────────────────────────────
// api.js  —  All backend calls in one place
//
// HOW TO SET YOUR BACKEND URL:
//   1. After deploying backend to Render, copy your URL e.g. https://ghar-kharcha-api.onrender.com
//   2. In Netlify → Site settings → Environment variables, add:
//        VITE_API_URL = https://ghar-kharcha-api.onrender.com
//   3. Redeploy frontend
//
//   For local development, vite.config.js proxies /api to localhost:3001
// ─────────────────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL || 'https://gharkharcha.onrender.com'

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

const get  = (path)       => req('GET',    path)
const post = (path, body) => req('POST',   path, body)
const put  = (path, body) => req('PUT',    path, body)
const del  = (path)       => req('DELETE', path)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const apiLogin = (username, password) =>
  post('/api/auth/login', { username, password })

// ── Users ─────────────────────────────────────────────────────────────────────
export const apiGetUsers    = ()                          => get('/api/users')
export const apiCreateUser  = (data)                     => post('/api/users', data)
export const apiDeleteUser  = (id)                       => del(`/api/users/${id}`)

// ── Expenses ──────────────────────────────────────────────────────────────────
export const apiGetToday   = (userId)                    => get(`/api/expenses/today?userId=${userId}`)
export const apiGetSummary = (userId, period = 'all')    => get(`/api/expenses/summary?userId=${userId}&period=${period}`)
export const apiGetYearly  = (userId)                    => get(`/api/expenses/yearly?userId=${userId}`)

export const apiGetExpenses = (userId, filters = {}) => {
  const p = new URLSearchParams({ userId, ...filters })
  // remove empty values
  for (const [k, v] of [...p.entries()]) { if (!v) p.delete(k) }
  return get(`/api/expenses?${p.toString()}`)
}

export const apiAddExpense    = (data)       => post('/api/expenses', data)
export const apiUpdateExpense = (id, data)   => put(`/api/expenses/${id}`, data)
export const apiDeleteExpense = (id)         => del(`/api/expenses/${id}`)

// ── Admin ─────────────────────────────────────────────────────────────────────
export const apiAdminSummary = () => get('/api/admin/summary')

// Quick status update (paid/received/unpaid/not_received)
export const apiUpdateStatus = (id, paymentStatus) => put(`/api/expenses/${id}`, { paymentStatus })
