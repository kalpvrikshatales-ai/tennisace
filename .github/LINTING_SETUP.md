# Code Quality: ESLint, Prettier, Black

Automated code linting and formatting keeps TennisAce code clean and consistent.

## Frontend (Next.js + TypeScript)

### Install Dependencies
```bash
cd frontend
npm install
```

### Commands

```bash
# Check for issues (no fixes)
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format all files
npm run format
```

### What Gets Checked

- **ESLint** — Type safety, unused variables, console.log in prod
- **Prettier** — Code formatting (indentation, line breaks, quotes)
- **TypeScript** — Type errors at build time

### Configuration Files

- `.eslintrc.json` — ESLint rules
- `.prettierrc.json` — Prettier formatting rules
- `.prettierignore` — Exclude node_modules, .next, etc.

### CI Integration

GitHub Actions runs `lint` on all PRs (see `.github/workflows/deploy.yml`).

## Backend (Python + FastAPI)

### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Commands

```bash
# Check style issues
pylint app/

# Auto-format code
black app/

# Check code complexity
flake8 app/
```

### What Gets Checked

- **Black** — Auto-formats to consistent style (100 char lines)
- **Pylint** — Bug detection, code smell warnings
- **Flake8** — Style guide compliance (PEP 8)

### Configuration Files

- `.pylintrc` — Pylint rules
- `pyproject.toml` — Black and isort config

### CI Integration

GitHub Actions runs Python syntax check on PRs.

## Pre-commit Hooks (Optional)

To auto-format on every commit:

```bash
# Install husky
npm install husky --save-dev
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npm run lint:fix && git add ."
```

Then every `git commit` will auto-format before committing.

## IDE Integration

### VS Code

Install extensions:
- **ESLint** by Microsoft
- **Prettier** by Prettier
- **Python** by Microsoft
- **Pylance** (optional, faster type checking)

Then add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "ms-python.python",
    "editor.formatOnSave": true
  }
}
```

### JetBrains (PyCharm, WebStorm)

- Settings > Languages & Frameworks > ESLint → Enable
- Settings > Languages & Frameworks > JavaScript > Prettier → Enable
- Right-click file > Reformat Code (Cmd+Option+L)

## Running in GitHub Actions

Linting runs automatically on:
- **Every PR** — Must pass before merge
- **Every push to main** — Part of deployment pipeline

If linting fails:
1. Run locally: `npm run lint:fix` (frontend) or `black app/` (backend)
2. Commit changes
3. Push again

## Common Issues

| Error | Fix |
|-------|-----|
| "Import order is wrong" | `black app/` or `npm run lint:fix` |
| "Line too long" | Prettier auto-wraps, or refactor |
| `any` type warning | Add explicit type or `# type: ignore` comment |
| Missing semicolon | Run formatter, it's auto-added |

## Slack Integration (Optional)

To post linting results to Slack:
1. Create Slack webhook at https://api.slack.com/apps
2. Add to GitHub Actions secrets: `SLACK_WEBHOOK_URL`
3. Add step to `.github/workflows/deploy.yml`

(Not configured yet, can add later if needed)

## Cost & Performance

- ✅ Zero cost (all tools are open-source)
- ✅ Fast (linting adds <2s to CI)
- ✅ Runs in parallel with tests
