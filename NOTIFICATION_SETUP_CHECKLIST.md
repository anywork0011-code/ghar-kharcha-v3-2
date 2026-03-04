# 🔔 Push Notifications Troubleshooting Guide

## ✅ Steps to Fix Notifications on Netlify

### 1. **Check Netlify Environment Variables**
Go to your Netlify site:
- **Site Settings → Environment**
- Make sure you have:
  ```
  VITE_API_URL = https://your-backend-url.onrender.com
  ```
- **Redeploy** the frontend after adding/updating this variable

### 2. **Check Backend VAPID Keys**
Ensure your backend has these environment variables set on Render:
- `VAPID_PUBLIC` = Your public VAPID key
- `VAPID_PRIVATE` = Your private VAPID key

These must match the ones hardcoded in `backend/index.js` line 19-20

### 3. **Verify Service Worker File**
The `public/sw.js` file must exist and be publicly accessible:
- Check: Visit `https://your-netlify-site.netlify.app/sw.js`
- You should see the service worker code, not a 404

### 4. **Check Browser Console (Dev Tools)**
When you try to enable notifications, you should see:
```
📋 Service Worker path: /sw.js Scope: /
📋 API Base URL: https://your-backend-url.onrender.com
✅ Service Worker registered: ...
🔑 Fetching VAPID key from: https://your-backend-url.onrender.com/api/push/vapid-public-key
✅ VAPID key received: ...
✅ Subscription created: ...
💾 Saving subscription to backend...
✅ Subscription saved
```

If you see errors, note them and check below.

### 5. **Check Backend CORS**
The backend (`backend/index.js`) has `app.use(cors())` which should allow requests.
Make sure your backend is running and accessible.

### 6. **Test the Backend API Endpoints Directly**

Open your browser console and test:

```javascript
// Test 1: Check if VAPID key endpoint works
fetch('https://your-backend-url.onrender.com/api/push/vapid-public-key')
  .then(r => r.json())
  .then(d => console.log('VAPID Key:', d))
  .catch(e => console.error('Error:', e))

// Test 2: Check if backend is alive
fetch('https://your-backend-url.onrender.com/api/expenses')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Backend down:', e))
```

---

## 🐛 Common Issues & Solutions

### Issue: "Port 5173 is in use"
**Solution**: Netlify automatically handles port assignment. This only happens locally.

### Issue: Service Worker not registering
**Cause**: Wrong path or file not found
**Solution**: 
- Make sure `public/sw.js` exists
- In Netlify deploy logs, check if `public/` files are being copied

### Issue: VAPID key 404
**Cause**: Backend not deployed or VITE_API_URL not set
**Solution**:
1. Deploy backend to Render
2. Set `VITE_API_URL` in Netlify environment variables
3. Redeploy frontend

### Issue: Notification appears but data is missing
**Cause**: Subscription saved but notification payload is wrong
**Check**: Run test notification from `/api/push/test` endpoint

### Issue: "Permission नाकारले"
**Cause**: Browser blocked notifications
**Solution**: 
- Chrome: Settings → Privacy → Site Settings → Notifications → Find your site → Allow
- Or reload page and grant permission when prompted

---

## 📋 Deployment Checklist

- [ ] Backend deployed to Render (or similar service)
- [ ] Backend `VAPID_PUBLIC` and `VAPID_PRIVATE` environment variables set
- [ ] Netlify environment variable `VITE_API_URL` set to your backend URL
- [ ] Frontend rebuilt and redeployed on Netlify
- [ ] `public/sw.js` file exists in frontend project
- [ ] Browser allows notifications for your site
- [ ] Service worker registered (check DevTools → Application → Service Workers)
- [ ] Subscription saved to backend (check MongoDB for `pushSubscription` collection)

---

## 🧪 Testing Notifications Locally

Run locally:
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Then open `http://localhost:5173` and try enabling notifications.

Check browser console for detailed logs.

---

## 📞 If Still Not Working

Open browser DevTools (F12) → Console → and try enabling notifications.
Share the **complete error message** from the console.

The new logging will help identify exactly where it's failing:
1. Service Worker registration
2. VAPID key fetch
3. Subscription creation
4. Backend save
