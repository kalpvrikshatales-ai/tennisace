#!/bin/sh
# Pre-commit hook to prevent committing secrets

echo "Running pre-commit security checks..."

# Check for .env files in staging
if git diff --cached --name-only | grep -qE "\.env$|\.env\.local$"; then
    echo "❌ ERROR: You're about to commit a .env file!"
    echo "Secrets should never be committed to git."
    echo ""
    echo "To fix this:"
    echo "  1. git reset HEAD .env (or the file you tried to add)"
    echo "  2. Add .env to .gitignore"
    echo "  3. git add .gitignore"
    echo "  4. git commit -m 'Add .env to gitignore'"
    exit 1
fi

# Check for common secret patterns
if git diff --cached -S "PRIVATE_KEY\|SECRET_KEY\|API_KEY.*=" | grep -q .; then
    echo "⚠️  WARNING: Detected potential secret patterns"
    echo "Please verify you're not committing actual secret values."
    echo ""
    read -p "Continue commit anyway? (yes/no) " -n 3 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Pre-commit checks passed"
exit 0
