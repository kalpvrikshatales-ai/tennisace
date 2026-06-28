# GitHub Actions Secrets Setup

This file documents the secrets you need to configure in GitHub for auto-deployment.

## Required Secrets

Add these to **Settings > Secrets and variables > Actions**:

### Frontend (Vercel)
- **VERCEL_TOKEN** — Personal access token from Vercel dashboard (https://vercel.com/account/tokens)
- **VERCEL_ORG_ID** — Found in Vercel project settings
- **VERCEL_PROJECT_ID** — Found in Vercel project settings

### Backend (Render)
- **RENDER_DEPLOY_HOOK** — Deploy hook URL from Render service dashboard
  - In Render dashboard: Service > Settings > Deploy Hooks > Copy webhook URL

## How to Get These Values

### Vercel Token & IDs
1. Go to https://vercel.com/account/tokens
2. Create a new token (Personal Access Token)
3. Copy the token value → add as `VERCEL_TOKEN`
4. In your Vercel project dashboard, go to Settings
5. Copy Project ID → add as `VERCEL_PROJECT_ID`
6. Copy Org ID → add as `VERCEL_ORG_ID`

### Render Deploy Hook
1. Go to https://dashboard.render.com
2. Select "tennisace-backend" service
3. Go to Settings → Deploy hooks
4. Copy the webhook URL → add as `RENDER_DEPLOY_HOOK`

## Testing the Workflow

Once secrets are configured:
```bash
git push origin main
```

This triggers:
1. Frontend deployment to Vercel (prod)
2. Backend deployment to Render
3. Health checks on both endpoints
4. Slack notification (optional — not yet configured)

## Notes
- **⚠️ DO NOT commit secrets to git** — GitHub Actions secrets are encrypted
- Workflow only runs on `main` branch pushes
- PRs trigger lint/type-check only (no deployment)
- Health checks wait 30s for deployment to stabilize
