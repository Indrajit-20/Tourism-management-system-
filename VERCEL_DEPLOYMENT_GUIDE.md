# ✅ Vercel Deployment Configuration Guide

## Your Backend URL (Render)
```
https://tourism-management-system-lsuj.onrender.com
```

## Step 1: Frontend Environment Files (✅ DONE)

### `.env` (Local Development) - ALREADY SET
```
VITE_API_URL=http://localhost:4000/api
```

### `.env.production` (Production/Vercel) - ✅ CREATED
```
VITE_API_URL=https://tourism-management-system-lsuj.onrender.com/api
```

---

## Step 2: Add Environment Variables to Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Click on your project: `tourism-management-system`
3. Go to **Settings** → **Environment Variables**
4. Add this variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://tourism-management-system-lsuj.onrender.com/api`
   - **Environments:** Select `Production`
5. Click **Save**

---

## Step 3: Add FRONTEND_URL to Render Backend

Your Render backend needs to know the Vercel frontend URL for CORS.

### Find Your Vercel Frontend URL:
1. Go to Vercel Dashboard
2. Click your project
3. Look for the URL (example: `https://your-project-name.vercel.app`)

### Set Render Environment Variables:
1. Go to your Render Dashboard: https://render.com/dashboard
2. Click your backend service: `tourism-management-system`
3. Go to **Environment** (on the left)
4. Add/Update:
   - **Key:** `FRONTEND_URL`
   - **Value:** `https://your-vercel-project.vercel.app` (your actual Vercel URL)
5. Click **Save**

---

## Step 4: Redeploy Both

### Frontend (Vercel):
- Just push to your GitHub repo (or redeploy manually from Vercel dashboard)
- Vercel will automatically build with the new `.env.production` file

### Backend (Render):
- Your environment variable change will trigger auto-deploy
- Or manually redeploy from Render dashboard

---

## Step 5: Test

1. Go to your Vercel frontend URL
2. Open Browser DevTools → **Network** tab
3. Try to fetch data
4. Check if API calls succeed (status 200, not CORS error)

---

## 🐛 If Still Getting CORS Error:

Check browser console for exact error message, then ensure:
- ✅ `VITE_API_URL` is set correctly in Vercel
- ✅ `FRONTEND_URL` is set correctly in Render
- ✅ Vercel URL matches exactly in Render's CORS config
- ✅ Both apps are redeployed

---

## Common Issues:

| Problem | Solution |
|---------|----------|
| Still seeing localhost URL | Clear browser cache, hard refresh (Ctrl+Shift+R) |
| CORS blocked error | Check FRONTEND_URL on Render backend |
| API returns 404 | Verify API endpoints exist in backend routes |
| 500 error | Check Render logs for backend errors |

