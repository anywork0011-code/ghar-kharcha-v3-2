# 🏠 घर खर्चा v3.0

**Frontend → Netlify | Backend → Render | DB → MongoDB Atlas**

---

## 📁 Project Structure

```
ghar-kharcha-v3/
├── backend/          ← Deploy to Render
│   ├── index.js      ← Express + MongoDB server
│   └── package.json
└── frontend/         ← Deploy to Netlify
    ├── src/
    │   ├── api.js    ← All API calls (set VITE_API_URL here)
    │   └── ...
    └── package.json
```

---

## 🚀 Step 1 — Deploy Backend to Render (Free)

1. Go to [render.com](https://render.com) → Sign up (free)
2. New → **Web Service**
3. Connect your GitHub repo (or upload the `backend/` folder)
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Environment:** Node
5. Click **Deploy**
6. Copy your URL: `https://your-app-name.onrender.com`

> ✅ MongoDB is already connected — same Atlas DB as before.
> Admin is auto-seeded: **Navnath / 12345**

---

## 🚀 Step 2 — Deploy Frontend to Netlify

1. Go to [netlify.com](https://netlify.com) → New Site
2. Connect GitHub repo or drag `frontend/` folder
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. **Environment Variables** → Add:
   ```
   VITE_API_URL = https://your-app-name.onrender.com
   ```
   (Replace with your actual Render URL from Step 1)
5. Deploy!

---

## 💻 Local Development

```bash
# Terminal 1 — Backend
cd backend
npm install
node index.js        # runs on :3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev          # runs on :5173 (proxies /api to :3001)
```

No need to set VITE_API_URL locally — vite.config.js handles the proxy.

---

## 🔑 Default Login

| नाव     | पासवर्ड | भूमिका   |
|---------|---------|---------|
| Navnath | 12345   | 👑 Admin |

Admin panel मधून नवीन users तयार करा.

---

## ✅ Features

- मराठी UI
- Pay / Receive tracking (भरावे लागेल / मिळणार)
- Payment status: Paid ✅ / Unpaid 🔴 / Received ✅ / Pending 🟡
- Status changes only via Edit form (no accidental toggles)
- Calendar date picker
- 5-year summary on dashboard
- Filters: today/week/month/custom, status, sort
- PDF export (HTML print → Save as PDF, perfect Marathi)
- CSV export
- Admin: per-user summaries, user management
- Data in MongoDB Atlas (persistent, multi-device)
