# Render Environment Variables Setup

## Production Environment Variables

Go to **Render Dashboard > tennisace-backend > Environment** and add these as environment variables.

**⚠️ IMPORTANT: Use Render's secure secrets, not plaintext values**

### Required Variables

| Variable | Source | Format |
|----------|--------|--------|
| `TENNIS_API_KEY` | From backend/.env | Plain text |
| `SUPABASE_URL` | From Supabase project | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | From Supabase dashboard | JWT token |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase dashboard | JWT token (keep secret!) |
| `VAPID_PUBLIC_KEY` | Generated (already have) | Plain text |
| `VAPID_PRIVATE_KEY` | Generated (already have) | Plain text (secure in Render!) |
| `VAPID_EMAIL` | Your email | `mailto:kalpvrikshatales@gmail.com` |

### Steps to Configure

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "tennisace-backend" service
   - Go to "Environment" tab

2. **Add Each Variable**
   - Click "Add Environment Variable"
   - Enter Name (e.g., `TENNIS_API_KEY`)
   - Enter Value (copy from current backend/.env)
   - Click "Save Changes"

3. **For Secret Values**
   - `SUPABASE_SERVICE_ROLE_KEY` — Should be marked as encrypted
   - `VAPID_PRIVATE_KEY` — Should be marked as encrypted
   - Render automatically encrypts these

4. **Get Supabase Keys**
   - Supabase Dashboard > Project Settings > API
   - Copy these keys:
     - `Project URL` → `SUPABASE_URL`
     - `anon public` → `SUPABASE_ANON_KEY`
     - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

5. **Trigger Redeploy**
   - After all variables are set, Render auto-redeploys
   - Or manually: Service > Manual Deploy

### Verify Configuration

After deployment:
```bash
curl https://tennisace-backend.onrender.com/health
# Should return: {"status":"ok"}

curl https://tennisace-backend.onrender.com/
# Should return: {"app":"TennisAce","domain":"tennisace.live","status":"live"}
```

## Testing Live

Once both Vercel and Render are configured:

1. **Check live matches load:**
   - Visit https://tennisace.live
   - Go to "Live" tab
   - Should show current matches or "No matches live right now"

2. **Check network requests:**
   - Open DevTools (F12)
   - Go to Network tab
   - Refresh page
   - Look for requests to `/matches`, `/feed/results`, `/feed/fixtures`
   - Should be `200 OK` with JSON responses

3. **Check backend is reachable:**
   - Open DevTools Console
   - Type: `fetch('https://tennisace-backend.onrender.com/health').then(r => r.json()).then(console.log)`
   - Should log: `{status: "ok"}`

## Security Notes

- Never commit `backend/.env` to git
- Render encrypts secret env vars automatically
- Don't share SUPABASE_SERVICE_ROLE_KEY with anyone
- Rotate API keys every 6 months

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend returns 500 error | Check logs: Service > Logs tab |
| Frontend can't reach backend | Check NEXT_PUBLIC_API_URL in Vercel |
| Missing environment variables | Verify all vars are set in Render |
| CORS errors | Check `allowed_origins` in backend/app/main.py |
