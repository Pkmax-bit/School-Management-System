# Frontend Deployment Checklist - School Management System

## Current Status
- ✅ Backend deployed and working: https://school-management-backend-7yfd.onrender.com
- ✅ Backend health check: 200 OK
- ❌ Frontend not working (JWT expired errors in logs)

## 🔍 Issue Analysis

From backend logs, we see:
- Frontend calls to `/api/auth/me` returning 401 Unauthorized
- JWT tokens are expired: "token has invalid claims: token is expired"
- Notifications endpoint has 307 redirect (trailing slash issue)

## ✅ Deployment Checklist

### 1. Frontend Service on Render
- [ ] Go to Render Dashboard
- [ ] Check if Frontend service exists
- [ ] If not, create new Web Service for frontend
- [ ] Connect to GitHub repository: `Pkmax-bit/School-Management-System`
- [ ] Set branch: `master`
- [ ] Build Command: `cd frontend && npm install --production=false && npm run build`
- [ ] Start Command: `cd frontend && npm start`

### 2. Environment Variables (Critical)
Set these in Render Frontend service:

```
NEXT_PUBLIC_API_URL=https://school-management-backend-7yfd.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://okauzglpkrdatujkqczc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rYXV6Z2xwa3JkYXR1amtxY3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNTc2NDIsImV4cCI6MjA3NjYzMzY0Mn0.wrDH2RNrGm-vQWBY4-JJE9_zASE2ImjE6O5upogUxfQ
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 3. Build Configuration
- [ ] Build Command: `cd frontend && npm install --production=false && npm run build`
- [ ] Start Command: `cd frontend && npm start`
- [ ] Node Version: `20.x`
- [ ] Build Timeout: Default (15 minutes)

### 4. Testing Steps

#### 4.1 Check Build Logs
- [ ] Go to Render Service → Events
- [ ] Check latest deployment logs
- [ ] Look for build errors or warnings

#### 4.2 Test Frontend URL
- [ ] Get frontend URL from Render (should be something like: `https://school-management-frontend.onrender.com`)
- [ ] Open URL in browser
- [ ] Should load without errors

#### 4.3 Test API Connection
- [ ] Open browser console (F12)
- [ ] Check for network errors
- [ ] Should see API calls to backend URL

#### 4.4 Test Authentication
- [ ] Try to login/register
- [ ] Check if JWT tokens are generated correctly
- [ ] Should not see "token expired" errors

### 5. Common Issues & Fixes

#### Issue: Build Fails
**Symptoms:** Build logs show ESLint errors
**Fix:**
- ESLint is already configured to ignore during builds
- Check `next.config.ts` has `ignoreDuringBuilds: true`

#### Issue: API Connection Fails
**Symptoms:** Frontend loads but can't connect to backend
**Fix:**
- Check `NEXT_PUBLIC_API_URL` is correct
- Ensure backend is running and accessible
- Check CORS settings in backend

#### Issue: JWT Token Expired
**Symptoms:** 401 Unauthorized errors immediately after login
**Fix:**
- Check `SUPABASE_JWT_SECRET` in backend environment
- Verify JWT expiration time (currently 90 minutes)
- Check system clock/timezone

#### Issue: White Screen / No Content
**Symptoms:** Frontend loads but shows blank page
**Fix:**
- Check browser console for JavaScript errors
- Verify all required environment variables are set
- Check Next.js build output

#### Issue: 307 Redirect on Notifications
**Symptoms:** `/api/notifications?read=false` redirects to `/api/notifications/?read=false`
**Fix:**
- This is normal - trailing slash redirect
- Frontend should handle redirects automatically

### 6. Debug Commands

#### Check Backend Status
```bash
curl https://school-management-backend-7yfd.onrender.com/api/health
curl https://school-management-backend-7yfd.onrender.com/api/debug
```

#### Check Frontend Build
```bash
# Locally test build
cd frontend
npm install
npm run build
npm start
```

#### Check Environment Variables
```bash
# In Render dashboard, verify these variables exist:
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 7. Performance Optimization

After successful deployment:
- [ ] Enable caching in Next.js
- [ ] Set up CDN if needed
- [ ] Monitor response times
- [ ] Check bundle size

### 8. Monitoring

- [ ] Set up uptime monitoring
- [ ] Monitor error rates
- [ ] Check logs regularly
- [ ] Set up alerts for downtime

## 🚀 Quick Deploy Steps

1. **Create Frontend Service on Render**
2. **Set Environment Variables** (most important)
3. **Deploy**
4. **Test API connection**
5. **Test authentication flow**

## 📞 Support

If issues persist:
1. Check Render service logs
2. Test backend connectivity
3. Verify environment variables
4. Check browser network tab for failed requests

## Expected URLs After Deployment

- **Frontend:** `https://school-management-frontend-[random].onrender.com`
- **Backend:** `https://school-management-backend-7yfd.onrender.com`
- **Health Check:** `https://school-management-backend-7yfd.onrender.com/api/health`

---

**Last Updated:** January 5, 2026
**Status:** Backend ✅ | Frontend ❌ (needs deployment)
