# Vercel Environment Variables Setup

## Production Environment Variables

Go to **Vercel Dashboard > Project Settings > Environment Variables** and set:

### Required Variables

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://tennisace-backend.onrender.com` | Production |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Development |
| `NEXT_PUBLIC_VAPID_KEY` | Copy from `backend/.env` | Production & Preview |

### Steps to Configure

1. **Get Render Backend URL**
   - Go to Render Dashboard > tennisace-backend service
   - Copy the service URL (should be `https://tennisace-backend.onrender.com` or similar)

2. **Add to Vercel**
   - Vercel Dashboard > tennisace project
   - Settings > Environment Variables
   - Click "Add New"
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://tennisace-backend.onrender.com` (use actual Render URL)
   - **Environments:** Select "Production" + "Preview"
   - Click Save

3. **Add VAPID Key**
   - Copy `VAPID_PUBLIC_KEY` from `backend/.env`
   - **Name:** `NEXT_PUBLIC_VAPID_KEY`
   - **Value:** Paste the VAPID public key
   - **Environments:** Production + Preview
   - Click Save

4. **Trigger Redeploy**
   - Vercel Dashboard > Deployments
   - Click the latest deployment > Redeploy
   - This rebuilds with the new env vars

## Testing

After deploying:
```bash
curl https://tennisace.live
curl https://tennisace-backend.onrender.com/health
```

Both should return `200 OK`.

## Troubleshooting

- **Frontend loads but shows "No matches live"?** → Backend URL is wrong
- **Check browser console** → `NEXT_PUBLIC_API_URL` should appear in network requests
- **Need to change after deploy?** → Just update env var and redeploy

## Notes

- `NEXT_PUBLIC_*` variables are visible to the browser (okay for public keys like VAPID)
- Never add secret API keys as `NEXT_PUBLIC_*`
- Backend URL should be the live Render service URL, not localhost
