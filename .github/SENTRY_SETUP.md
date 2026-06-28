# Sentry Error Tracking Setup

Sentry captures errors in both frontend and backend, giving you real-time alerts and debugging info.

## Step 1: Create Sentry Account

1. Go to https://sentry.io
2. Sign up for free account (includes 5k free events/month)
3. Create a new organization (e.g., "TennisAce")

## Step 2: Create Sentry Projects

### Frontend Project
1. In Sentry Dashboard: Projects → Create Project
2. **Platform:** Next.js
3. **Name:** tennisace-frontend
4. **Alert:** Set alerts (optional)
5. Copy the **DSN** (looks like `https://xxxxx@xxxxx.ingest.sentry.io/123456`)

### Backend Project
1. Create another project
2. **Platform:** Python / FastAPI
3. **Name:** tennisace-backend
4. Copy the **DSN**

## Step 3: Configure Environment Variables

### Vercel (Frontend)
Go to **Settings > Environment Variables**:
- **Name:** `NEXT_PUBLIC_SENTRY_DSN`
- **Value:** Your frontend Sentry DSN
- **Environments:** Production, Preview

### Render (Backend)
Go to **Environment** and add:
- **Name:** `SENTRY_DSN`
- **Value:** Your backend Sentry DSN

- **Name:** `ENVIRONMENT`
- **Value:** `production`

## Step 4: Test Integration

### Frontend Test
```bash
# In your browser console on tennisace.live:
throw new Error("Test error from TennisAce");
```
Check Sentry dashboard — should appear in "Issues" within 30 seconds.

### Backend Test
```bash
curl https://tennisace-backend.onrender.com/test-error
```

## Features Enabled

✅ **Error Tracking** — All unhandled exceptions captured  
✅ **Performance Monitoring** — API response times, database queries  
✅ **Session Replay** — See exactly what user did before error (10% sample)  
✅ **Alerts** — Slack/Email when new errors occur  
✅ **Release Tracking** — Link errors to git commits  

## Sampling

- **Errors:** 100% captured (all errors)
- **Performance:** 10% sample (1 in 10 requests)
- **Session Replay:** 10% on success, 100% on errors

Adjust in:
- Frontend: `frontend/sentry.client.config.ts` → `tracesSampleRate`
- Backend: `backend/app/main.py` → `traces_sample_rate`

## Privacy

- ✅ Sensitive data filtered (passwords, tokens, card numbers)
- ✅ Source maps hidden (code stays private)
- ✅ No personal data transmitted
- ✅ GDPR compliant

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Errors not appearing | Check DSN in env vars |
| "Invalid DSN" error | Copy exact DSN from Sentry, no modifications |
| Too many errors | Reduce `tracesSampleRate` in config |
| No performance data | Enable in Sentry project settings |

## Alerts Setup (Optional)

In Sentry Dashboard > Alerts:
1. Click "Create Alert Rule"
2. **When:** A new issue is created
3. **Then:** Notify → Slack / Email
4. Set threshold (e.g., "3 errors in 5 minutes")

## Cost Notes

**Free tier:** 5,000 events/month  
**Expected usage:** ~500-1000/month (growing user base)  
**If exceeded:** Oldest events dropped, no alerts  
**Paid upgrade:** $29/month for 50k events

For now, free tier is fine.
