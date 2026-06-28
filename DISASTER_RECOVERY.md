# 🆘 TennisAce Disaster Recovery Guide

**Emergency Procedures & Recovery Plans**

---

## 🚨 SCENARIOS & SOLUTIONS

### **SCENARIO 1: Backend Down (500 Errors)**

**Symptoms:**
- Sentry shows spike in errors
- https://tennisace.onrender.com/health returns error
- Frontend can't fetch data

**Diagnosis (2 minutes):**
```bash
# Check Render status
curl https://tennisace.onrender.com/health
# If fails → backend is down

# Check Render logs
# Render dashboard → Logs tab → read error
```

**Quick Fix (5 minutes):**
1. Render dashboard → Services → tennisace
2. Click "Manual Deploy" (top right)
3. Wait 3 minutes for redeploy
4. Verify: https://tennisace.onrender.com/health

**Root Cause Fix (varies):**
- If code error: Fix code → push to GitHub → auto-redeploy
- If out of memory: Render auto-restarts or upgrade plan
- If DB connection: Check SUPABASE_URL in Environment
- If Redis connection: Check UPSTASH_REDIS_URL in Environment

**Prevention:**
- Monitor Sentry alerts daily
- Check Render metrics weekly
- Set up Sentry alert for 10+ errors in 5min

---

### **SCENARIO 2: Database Connection Lost**

**Symptoms:**
- GET /matches/live works
- GET /players/rankings fails (needs database)
- Error: "connection refused" or "timeout"

**Diagnosis (2 minutes):**
1. Check Supabase status: https://app.supabase.com
2. Check if service is paused or down
3. Render → Environment → verify SUPABASE_URL is correct

**Quick Fix (varies):**
- If Supabase is down: Wait for recovery (check status page)
- If wrong credentials: Get correct SUPABASE_URL from Supabase console
- If connection pool exhausted: Restart Render service

**Prevention:**
- Set up Supabase backup alerts
- Monitor connection count in Supabase
- Set reasonable pool size

---

### **SCENARIO 3: Redis Cache Down**

**Symptoms:**
- Rankings endpoint slow (no cache)
- Other endpoints fine
- Upstash dashboard shows service down

**Impact:**
- Moderate (cache miss means slower response, not broken)
- Rankings will still load from database
- Cache will rebuild once Redis is back

**Quick Fix (immediate):**
- No immediate action needed
- Redis will auto-restart on Upstash
- Rankings will use database temporarily

**Verification (5 minutes):**
```bash
# Test rankings still works (just slower)
curl https://tennisace.onrender.com/players/rankings?type=ATP
# Should still return data, just slow
```

**Full Recovery:**
- Wait 5 minutes for Upstash to restart
- Cache will rebuild automatically
- Performance returns to normal

---

### **SCENARIO 4: Frontend Down**

**Symptoms:**
- https://tennisace.live returns 404 or blank page
- Backend endpoints work fine
- Vercel shows failed deployment

**Diagnosis (2 minutes):**
1. Vercel dashboard → Deployments
2. Look for recent failed deployment (red X)
3. Click deployment to see error

**Common Causes:**
- Build failed (syntax error, missing dependency)
- Type error (TypeScript compilation)
- Missing environment variable

**Quick Fix (10 minutes):**
1. Vercel → Deployments
2. Find last successful deployment (green checkmark)
3. Click "Redeploy"
4. Wait 5 minutes
5. Verify: https://tennisace.live

**Root Cause Fix:**
1. Fix the code error
2. Push to GitHub
3. Vercel auto-redeploys
4. Verify

**Prevention:**
- Run `npm run build` locally before pushing
- Run tests before pushing
- Review error logs in Vercel

---

### **SCENARIO 5: High Error Rate (> 5%)**

**Symptoms:**
- Sentry shows many errors
- Some users report failures
- Frontend still works (mostly)

**Diagnosis (5 minutes):**
1. Sentry dashboard: See top errors
2. Check if all endpoints affected or just one
3. Check Render metrics for CPU/memory
4. Check recent code changes

**Quick Fix:**
- If memory high: Render will auto-restart
- If recent code broke it: Rollback to previous deploy
- If temporary spike: Monitor and wait

**Root Cause Analysis:**
1. Sentry → Find most common error
2. Read stack trace
3. Find code file & line
4. Fix issue
5. Push and redeploy

**Prevention:**
- Set Sentry alert for error spike
- Monitor error trends daily
- Test before pushing

---

### **SCENARIO 6: Slow Responses (> 1 second)**

**Symptoms:**
- Endpoints take > 1000ms to respond
- Users report slow page loads
- Render metrics show high CPU/memory

**Diagnosis (5 minutes):**
1. Render → Metrics → check CPU/Memory
2. Sentry → Performance → check slow endpoints
3. Render → Logs → look for slow queries

**Common Causes:**
- Database query slow (cache miss)
- High CPU usage (too many users)
- Network latency
- Memory exhausted

**Quick Fix:**
- If CPU high: Render auto-scales or restart
- If memory high: Render auto-restarts
- If cache expired: Will refill on next request
- If network: Check internet connection

**Root Cause:**
- If database slow: Add index or optimize query
- If code slow: Profile and optimize
- If consistently slow: Upgrade Render plan

**Prevention:**
- Monitor response time in Sentry
- Set alert for p95 > 500ms
- Monitor Render metrics weekly

---

### **SCENARIO 7: Deployment Takes Too Long**

**Symptoms:**
- Vercel/Render deployment stuck for > 10 minutes
- No progress shown
- Can't access app

**Diagnosis (2 minutes):**
1. Check Vercel/Render logs for last message
2. Usually shows what it's doing (building, deploying)
3. Sometimes gets stuck on dependency install

**Quick Fix (10 minutes):**
1. Vercel/Render dashboard
2. Click "Cancel Deployment"
3. Click "Redeploy" to retry
4. If still slow: Check dependencies in package.json/requirements.txt

**Prevention:**
- Keep dependencies minimal
- Don't add large packages
- Test builds locally before pushing

---

### **SCENARIO 8: Data Corruption or Loss**

**Symptoms:**
- Unexpected data changes
- Missing data
- Corrupted records

**Diagnosis (5 minutes):**
1. Check Supabase Data Browser
2. Look for suspicious records
3. Check recent changes in git log

**Recovery (varies):**
1. Supabase → Backups tab
2. Find backup before data loss
3. Contact Supabase support to restore from backup
4. Estimated time: 1-4 hours

**Prevention:**
- Supabase automatic daily backups (retention: 30 days)
- Manual backups before major changes
- No direct database edits (use API instead)

---

## 📋 RECOVERY PRIORITIES

**Priority 1 (Drop everything):**
- Backend completely down (0% uptime)
- Database gone (all data)
- Frontend completely inaccessible

**Priority 2 (ASAP, within 30 min):**
- High error rate (> 20%)
- Performance degradation (> 5x normal)
- Cache completely down

**Priority 3 (Urgent, within 2 hours):**
- Moderate error rate (5-20%)
- Moderate slowness (2-5x normal)
- Some features broken

**Priority 4 (Schedule):**
- Low error rate (< 5%)
- Minor slowness (< 2x normal)
- Edge case bugs

---

## 🔧 TOOLS & ACCESS

**For Backend Issues:**
- Render dashboard: https://dashboard.render.com
- Logs: Render → Logs tab
- Metrics: Render → Metrics tab
- Manual deploy: Click "Manual Deploy" button

**For Database Issues:**
- Supabase dashboard: https://app.supabase.com
- Backups: Supabase → Backups tab
- Data: Supabase → Data Editor

**For Cache Issues:**
- Upstash console: https://console.upstash.com
- CLI: Click "CLI" tab to run commands
- Clear cache: `DEL rankings:ATP` or `FLUSHALL`

**For Error Analysis:**
- Sentry: https://sentry.io
- Error details: Click any error to see stack trace
- Performance: Sentry → Performance tab

**For Frontend Issues:**
- Vercel dashboard: https://vercel.com/dashboard
- Logs: Vercel → Deployments → Click deployment
- Rollback: Click "Redeploy" on previous deployment

---

## ✅ MONTHLY DISASTER RECOVERY CHECKLIST

- [ ] Test backup restoration (Supabase)
- [ ] Verify all monitoring alerts work
- [ ] Review past incidents and improvements
- [ ] Test deployment rollback procedure
- [ ] Verify all service credentials are current
- [ ] Check backup retention is sufficient
- [ ] Update this guide with any learnings

---

## 📞 ESCALATION CONTACTS

**Can't access any dashboard?**
- Check GitHub credentials
- Reset password on respective service
- Contact service support if account compromised

**Data loss or corruption?**
- Stop all processes immediately
- Contact Supabase support ASAP
- Reference backup date/time
- Estimated recovery: 1-4 hours

**Sustained outage (> 1 hour)?**
- Check service status pages:
  - Render: https://render-status.com
  - Vercel: https://vercel-status.com
  - Supabase: https://status.supabase.com
  - Upstash: https://status.upstash.com
- Contact their support if service issue

---

**Last Updated:** June 28, 2026  
**Tested:** January 2026  
**Next Test:** August 28, 2026
