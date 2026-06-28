# 🔧 Render Environment Variable Setup (Step-by-Step)

## Your Redis URL (Copy This)
```
redis://default:g0AAAAAATy7AA1gcDFhYjkxMDQ0wY4Y20@MTUyY1Y1ZGNhYjY1OGVjOTM3A@ample-hookworm-81083.upstash.io:6379
```

---

## Step 1: Open Render Dashboard
```
https://dashboard.render.com
```

**What you should see:**
- Dark dashboard with "Services" in left sidebar
- Your deployed services listed

---

## Step 2: Click on Your Backend Service
In the services list, find and click:
- **Service name:** "tennisace" or "tennisace-api"
- This is the **Python FastAPI** backend (not the Next.js frontend)

**What you should see:**
- Service details page
- Tabs at top: Details, Environment, Logs, etc.

---

## Step 3: Click "Environment" Tab
At the top of the service page, you'll see several tabs:
- Details
- **Environment** ← Click this
- Logs
- etc.

**What you should see:**
- List of existing environment variables
- "Add Environment Variable" button (usually blue)

---

## Step 4: Click "Add Environment Variable" Button
Look for a button that says:
- "Add Environment Variable"
- or "+ Add"
- or "+ Variable"

Click it.

**What you should see:**
- A new row or form with two fields:
  - Field 1: Variable name (or "Key")
  - Field 2: Variable value (or "Value")

---

## Step 5: Fill in the Variable

### Field 1: Variable Name
```
UPSTASH_REDIS_URL
```

### Field 2: Variable Value
```
redis://default:g0AAAAAATy7AA1gcDFhYjkxMDQ0wY4Y20@MTUyY1Y1ZGNhYjY1OGVjOTM3A@ample-hookworm-81083.upstash.io:6379
```

**⚠️ Make sure:**
- Variable name is exactly: `UPSTASH_REDIS_URL`
- Value starts with: `redis://`
- No extra spaces or quotes

---

## Step 6: Save Changes
Look for a button:
- "Save" or "Save Changes" (usually blue/green)

Click it.

**What happens:**
- You might see a confirmation message
- Or a popup asking "Redeploy?"

---

## Step 7: Confirm Redeploy
If you see a popup asking:
- "Redeploy service?"
- "Deploy with new environment?"
- "Save and redeploy?"

**Click "Yes" or "Confirm"**

**What happens next:**
- Backend starts redeploying
- You'll see status: "Building..." → "Deploying..." → "Live" ✅

---

## Step 8: Wait for Deployment (2-5 minutes)

**Watch the deployment status:**
1. Look for a section that shows deployment progress
2. You'll see a timeline or status indicator
3. Wait until you see: ✅ **LIVE**

**You'll know it's done when:**
- Status shows "Live" with a green checkmark
- No more "Building" or "Deploying" messages

---

## Step 9: Verify (Run This Command)
Once you see ✅ LIVE status, come back to terminal and run:

```bash
cd /Users/parteek/tennisace
bash REDIS_VERIFICATION.sh
```

This will test if Redis is working correctly.

---

## 🆘 Troubleshooting

### "I can't find the Environment tab"
- Make sure you clicked on the **service** (not just the project)
- Look for tabs near the top of the page
- Try scrolling up

### "I can't find 'Add Environment Variable' button"
- Click on "Environment" tab first
- Scroll down on the Environment page
- Look for a blue button or "+ Add" link
- Sometimes it's labeled "Add Environment Variable"

### "The button doesn't do anything"
- Try refreshing the page (Ctrl+R or Cmd+R)
- Make sure you're logged into Render
- Try clicking again

### "After saving, nothing happens"
- Check if there's a popup asking about redeploy
- Click "Yes" to confirm redeploy
- Watch the deployment status (should update in a few seconds)

### "Status is still 'Building' after 5 minutes"
- This is normal - FastAPI builds take time
- Wait a bit longer
- Check Logs tab to see what's happening

---

## ✅ Done!
Once you see ✅ **LIVE** status, your Redis is configured!

Next: Run the verification script
```bash
bash REDIS_VERIFICATION.sh
```
