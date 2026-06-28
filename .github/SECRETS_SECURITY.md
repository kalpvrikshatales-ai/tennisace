# Secrets & Security Management

## ✅ Current Status

**Good news:** No secrets are currently committed to git.

- ✅ `backend/.env` — NOT in git (ignored by .gitignore)
- ✅ `frontend/.env.local` — NOT in git (ignored by .gitignore)
- ✅ Only `.env.example` in git (safe, no real keys)

## Secrets Checklist

| Secret | Location | Status | Action |
|--------|----------|--------|--------|
| TENNIS_API_KEY | backend/.env | ✅ Safe | Never share publicly |
| SUPABASE_ANON_KEY | backend/.env | ✅ Safe | Okay to be in .env, restricted by RLS |
| SUPABASE_SERVICE_ROLE_KEY | backend/.env | 🔴 **SECRET** | Keep private, only on Render |
| VAPID_PRIVATE_KEY | backend/.env | 🔴 **SECRET** | Keep private, only on Render |
| VAPID_EMAIL | backend/.env | ✅ Safe | Your email is fine |

## Best Practices

### 1. Never Commit Secrets
- ❌ DON'T: `git add backend/.env`
- ❌ DON'T: Paste API keys in code comments
- ✅ DO: Use environment variables only

### 2. Manage Secrets in CI/CD
- **Vercel**: Settings > Environment Variables (encrypted)
- **Render**: Environment tab (encrypted)
- **GitHub Actions**: Settings > Secrets and variables (encrypted)

### 3. .env Files
Each developer has their own local `.env` file:

```bash
# backend/.env (local only, never committed)
TENNIS_API_KEY=your_key_here
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_secret_key
VAPID_PUBLIC_KEY=your_key_here
VAPID_PRIVATE_KEY=your_secret_key
VAPID_EMAIL=your_email@example.com
```

### 4. Example Files
Template files (`.env.example`) show structure but no real values:

```bash
# backend/.env.example (safe to commit)
TENNIS_API_KEY=your_key_here
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
# ... etc
```

New developers copy template:
```bash
cp backend/.env.example backend/.env
# Then fill in with real values
```

## If a Secret Is Accidentally Committed

**DON'T PANIC.** Follow these steps:

### Option 1: Rotate the Key (Safe, Recommended)
1. **Go to the service** (Tennis API, Supabase, etc.)
2. **Regenerate/rotate the key** (invalidate old one)
3. **Update in Vercel/Render** with new key
4. **Document in changelog:** "Rotated TENNIS_API_KEY"

This makes the leaked key useless.

### Option 2: Rewrite Git History (Advanced, Requires Force Push)
Only if secret is truly sensitive and recently committed:

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove file from all history
git filter-repo --invert-paths --path backend/.env

# Force push (requires approval)
git push origin main --force-with-lease
```

**WARNING:** This rewrites git history. All developers must re-clone. Use only if necessary.

## Key Rotation Schedule

| Key | Rotation Frequency | Reason |
|-----|-------------------|--------|
| TENNIS_API_KEY | Every 6 months | General best practice |
| SUPABASE_SERVICE_ROLE_KEY | Annually | High sensitivity |
| VAPID_PRIVATE_KEY | Never (unless compromised) | Stable, low-risk |

## Monitoring & Alerts

**GitHub Secret Scanning:**
- Go to Settings > Security > Secret scanning
- Enables GitHub to scan commits for exposed keys
- Alerts you if secrets are detected

**Manual Check:**
```bash
# Search git history for exposed secrets
git log -p | grep -i "api_key\|secret\|password"
```

Should return nothing if secrets are properly managed.

## Access Control

| Role | Has Access To |
|------|---|
| Developer (local) | Own `.env` file, local testing only |
| CI/CD (GitHub Actions) | Secrets in GitHub (encrypted) |
| Vercel | Environment variables via dashboard |
| Render | Environment variables via dashboard |
| You (maintainer) | All of the above |

## Compliance

- ✅ GDPR compliant (no personal data in secrets)
- ✅ No hardcoded credentials
- ✅ Encrypted secrets in transit
- ✅ Secrets stored in platform vaults (Vercel, Render)

## Questions?

If unsure whether something is a secret:
1. **Can it authenticate or authorize?** → Secret (don't share)
2. **Is it unique per environment?** → Secret (don't hardcode)
3. **Does service docs say "keep private"?** → Secret (protect it)

When in doubt, treat it as a secret.
