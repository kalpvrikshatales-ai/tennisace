# Git Hooks Setup

## Optional: Auto-prevent Secret Commits

To prevent accidentally committing `.env` files, install a pre-commit hook:

### Step 1: Copy the Hook
```bash
cp .github/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Step 2: Test It
Try to commit a fake .env file:
```bash
echo "FAKE_SECRET=test" > test.env
git add test.env
git commit -m "Test"
# Should show: ❌ ERROR: You're about to commit a .env file!
```

If you see the error, hooks are working! Remove the test file:
```bash
git reset HEAD test.env
rm test.env
```

### Step 3: (Optional) Set Up Husky for Team

If you want all developers to use these hooks automatically:

```bash
# Install husky
npm install husky --save-dev

# Set up hooks directory
npx husky install

# Copy our hook
cp .github/pre-commit-hook.sh .husky/pre-commit

# Commit husky config
git add .husky/
git commit -m "Add git hooks via husky"
```

Then everyone runs `npm install` after cloning, and hooks auto-install.

## What the Hook Does

✅ **Prevents accidental commits of:**
- `backend/.env`
- `frontend/.env.local`
- Any `.env` files

⚠️ **Warns about potential secret patterns:**
- PRIVATE_KEY
- SECRET_KEY
- API_KEY

## Bypass (Emergency Only)

If you absolutely need to bypass (not recommended):
```bash
git commit --no-verify
```

**Only do this if you've double-checked the commit contains no secrets.**

## More Info

For production team workflows, consider:
- **detect-secrets** (scans for secret patterns)
- **git-secrets** (GitHub's tool)
- **TruffleHog** (deep git scanning)

For now, the basic hook is sufficient.
