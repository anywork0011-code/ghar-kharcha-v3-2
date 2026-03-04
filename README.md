# 🏠 घर खर्चा v3.0

**Frontend → Netlify | Backend → Render | DB → MongoDB Atlas**
**Push Notifications → Web Push (VAPID) | Cron → node-cron**

---

## 🚀 Deploy Steps

### Step 1 — Backend → Render

1. [render.com](https://render.com) → New Web Service
2. Upload / connect `backend/` folder
3. **Build Command:** `npm install`
4. **Start Command:** `node index.js`
5. **Environment Variables** add:
   ```
   MONGO_URI     = mongodb+srv://gharKharcha:...
   VAPID_PUBLIC  = BJAzPJmjC3OMCLTc4rIWI__mK4qvlTQe3xkHehfhMJzLkAVRSODMNlLYdP6dC9lD9cCZ9kxhjyyJ8v7O1qt2M9I
   VAPID_PRIVATE = PCpTLjpcgYLnaoPuuW6FLpYuq85u1M_v32nOJ8pBwkQ
   ```
6. Deploy → copy URL: `https://your-app.onrender.com`

### Step 2 — Frontend → Netlify

1. [netlify.com](https://netlify.com) → New Site → upload `frontend/`
2. **Build:** `npm run build` | **Publish:** `dist`
3. **Environment Variables:**
   ```
   VITE_API_URL = https://your-app.onrender.com
   ```
4. Deploy!

---

## 🔔 Push Notification Flow

```
User opens app → clicks "Enable"
  → Browser asks permission
  → SW registered
  → VAPID public key fetched from backend
  → Browser subscribed (endpoint created)
  → Subscription saved to MongoDB

Backend cron (9:00 AM + 6:00 PM IST daily):
  → Find all expenses with deadline today/tomorrow, unpaid
  → For each → find user's push subscription
  → webpush.sendNotification() → Google FCM → Android Chrome
  → Notification appears even if app is closed

User taps notification:
  → 📋 View  → app opens, shows that expense
  → 📲 WA    → WhatsApp opens with pre-filled message
  → 📞 Call  → app opens (call tap needed in app)
```

---

## 🧪 Testing Push

After deploying, call this API to send a test notification:
```
POST https://your-app.onrender.com/api/push/test
{ "userId": "USER_ID_FROM_MONGODB" }
```

Or tap "🧪 Test" button in the app after enabling notifications.

---

## 🔑 Login

| नाव     | पासवर्ड | भूमिका   |
|---------|---------|---------|
| Navnath | 12345   | 👑 Admin |

---

## ⚠️ Important — VAPID Keys

**Never change VAPID keys after first deploy.**
If you change them, all existing browser subscriptions break and users must re-enable notifications.

The keys in `.env.example` are pre-generated for this app. Use them as-is.
