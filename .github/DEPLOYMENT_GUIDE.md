# TennisAce Deployment & Operations Guide

Complete setup guide for deploying TennisAce to production.

## 📋 Quick Start Checklist

### Phase 1: GitHub Setup (10 min)
- [ ] Read: [GitHub Actions Setup](SECRETS_SETUP.md)
- [ ] Add secrets to GitHub (Vercel token, Render webhook)
- [ ] Test: Push to main → should auto-deploy

### Phase 2: Vercel Setup (5 min)
- [ ] Read: [Vercel Environment Setup](VERCEL_ENV_SETUP.md)
- [ ] Add `NEXT_PUBLIC_API_URL` env var
- [ ] Add `NEXT_PUBLIC_VAPID_KEY` env var
- [ ] Trigger redeploy

### Phase 3: Render Setup (5 min)
- [ ] Read: [Render Environment Setup](RENDER_ENV_SETUP.md)
- [ ] Add 7 environment variables (TENNIS_API_KEY, Supabase, VAPID, etc.)
- [ ] Render auto-redeploys

### Phase 4: Sentry Setup (5 min)
- [ ] Read: [Sentry Error Tracking](SENTRY_SETUP.md)
- [ ] Create Sentry account (free tier)
- [ ] Add Sentry DSNs to Vercel & Render
- [ ] Test error capture

### Phase 5: Code Quality (5 min)
- [ ] Read: [Linting & Formatting](LINTING_SETUP.md)
- [ ] Run `npm run lint:fix` in frontend
- [ ] Run `black app/` in backend
- [ ] Commit changes

### Phase 6: Security (5 min)
- [ ] Read: [Secrets Management](SECRETS_SECURITY.md)
- [ ] Read: [Git Hooks Setup](SETUP_HOOKS.md)
- [ ] (Optional) Install pre-commit hook
- [ ] Verify no .env files in git

**Total Time: ~35 minutes**

---

## 🚀 Deployment Process

### Automated (CI/CD)
```bash
git push origin main
```
→ GitHub Actions automatically:
1. Deploys frontend to Vercel
2. Deploys backend to Render
3. Runs health checks
4. Creates deployment summary

### Manual Verification
```bash
# Check frontend
curl https://tennisace.live

# Check backend
curl https://tennisace-backend.onrender.com/health
```

---

## 🔑 Environment Variables

### Vercel (Frontend)
```
NEXT_PUBLIC_API_URL=https://tennisace-backend.onrender.com
NEXT_PUBLIC_VAPID_KEY=your_vapid_public_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_frontend_dsn (optional)
```

### Render (Backend)
```
TENNIS_API_KEY=your_key
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_secret
VAPID_PUBLIC_KEY=your_key
VAPID_PRIVATE_KEY=your_secret
VAPID_EMAIL=your_email
SENTRY_DSN=your_sentry_backend_dsn (optional)
```

### GitHub (Secrets for Actions)
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
RENDER_DEPLOY_HOOK
```

---

## 📊 Monitoring & Debugging

### Check Deployment Status
- **Vercel**: https://vercel.com/tennisace-frontend/deployments
- **Render**: https://dashboard.render.com → tennisace-backend → Logs
- **GitHub Actions**: https://github.com/kalpvrikshatales-ai/tennisace/actions

### View Errors
- **Frontend errors**: Sentry dashboard (https://sentry.io)
- **Backend errors**: Render logs + Sentry
- **Network issues**: Browser DevTools → Network tab

### Common Issues

| Problem | Solution |
|---------|----------|
| Frontend shows "No matches" | Check NEXT_PUBLIC_API_URL in Vercel |
| Backend returns 500 | Check Render logs for env var errors |
| CORS error | Verify backend CORS config includes tennisace.live |
| Sentry not capturing | Check DSN is correct in env vars |
| Linting fails in CI | Run locally `npm run lint:fix`, commit, push |

---

## 🔐 Security Checklist

- [ ] No `.env` files committed to git
- [ ] Secrets only in Vercel/Render/GitHub dashboards
- [ ] SUPABASE_SERVICE_ROLE_KEY never in frontend
- [ ] VAPID_PRIVATE_KEY never shared publicly
- [ ] API keys rotated every 6 months
- [ ] Pre-commit hooks installed (optional)

---

## 📈 Performance Monitoring

Track these metrics:
- **Lighthouse score**: Vercel Analytics dashboard
- **Backend latency**: Sentry Performance tab
- **Error rate**: Sentry Issues tab (should be <1%)
- **Uptime**: Render status page

---

## 🛠️ Development Workflow

### Local Setup
```bash
# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:3000

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# → http://localhost:8000
```

### Before Committing
```bash
# Frontend
npm run lint:fix
npm run build

# Backend
black app/
python -m py_compile app/**/*.py
```

### Commit & Push
```bash
git add .
git commit -m "Description of changes"
git push origin main
# Auto-deploys via GitHub Actions
```

---

## 📚 Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## ❓ Need Help?

Check the specific guide for your issue:
- Deployment: See `SECRETS_SETUP.md`
- Frontend config: See `VERCEL_ENV_SETUP.md`
- Backend config: See `RENDER_ENV_SETUP.md`
- Errors: See `SENTRY_SETUP.md`
- Code style: See `LINTING_SETUP.md`
- Security: See `SECRETS_SECURITY.md`

---

**Last Updated:** 2026-06-28  
**Status:** All systems operational ✅
