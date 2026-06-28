# 🎾 TennisAce Team Onboarding Guide

**For: New Engineers, Managers, DevOps**

---

## ⏱️ Time Required: 30 minutes

---

## ✅ ONBOARDING CHECKLIST

### **STEP 1: Account Access (5 minutes)**

- [ ] **GitHub**
  - Request: kalpvrikshatales-ai/tennisace repo access
  - Visit: https://github.com/kalpvrikshatales-ai/tennisace
  - Clone: `git clone https://github.com/kalpvrikshatales-ai/tennisace.git`

- [ ] **Vercel (Frontend)**
  - Request: Access to tennisace project
  - Visit: https://vercel.com/dashboard
  - Role: Can view deployments & logs

- [ ] **Render (Backend)**
  - Request: Access to tennisace service
  - Visit: https://dashboard.render.com
  - Role: Can view logs & metrics

- [ ] **Supabase (Database)**
  - Request: Access to tennisace project
  - Visit: https://app.supabase.com
  - Role: Can view data & backups

- [ ] **Upstash (Redis)**
  - Request: Access to tennisace-redis database
  - Visit: https://console.upstash.com
  - Role: Can view usage & clear cache

- [ ] **Sentry (Error Tracking)**
  - Request: Access to tennisace project
  - Visit: https://sentry.io
  - Role: Can view errors & create alerts

### **STEP 2: Documentation Review (10 minutes)**

- [ ] Read NOTION_HUB.md (full project overview)
- [ ] Review DEPLOYMENT_GUIDE.md (how to deploy)
- [ ] Understand system architecture
- [ ] Know how to access each service

### **STEP 3: Local Setup (10 minutes)**

```bash
# Clone repo
git clone https://github.com/kalpvrikshatales-ai/tennisace.git
cd tennisace

# Frontend setup
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000

# Backend setup (in another terminal)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload  # Runs on http://localhost:8000
```

### **STEP 4: Verify Access (5 minutes)**

- [ ] Can clone & build locally
- [ ] Can access all 6 service dashboards
- [ ] Can view production logs
- [ ] Can access documentation

### **STEP 5: First Task**

- [ ] Deploy a dummy change to verify CI/CD works
  - Edit a comment in code
  - Push to main
  - Watch Vercel/Render auto-deploy
  - Verify change is live

---

## 🚀 DAY 1 TASKS

**Task 1: Learn the Stack (1 hour)**
- Read architecture section of NOTION_HUB
- Understand Frontend → Backend → Database flow
- Know where Redis cache sits

**Task 2: Understand Deployments (30 min)**
- Watch a deployment in Vercel
- Watch a deployment in Render
- Read deployment logs
- Know how to rollback

**Task 3: Navigate Services (30 min)**
- Open each dashboard (6 total)
- Find the key information
- Know where to look for errors
- Know where to look for metrics

**Task 4: Set Up Local Dev (1 hour)**
- Clone repo
- Install dependencies
- Run frontend locally
- Run backend locally
- Make a test change
- Verify it works locally

**Task 5: Understand Monitoring (30 min)**
- Log into Sentry
- See how errors are tracked
- Understand performance metrics
- Know how to set up alerts

---

## 🎯 WEEK 1 GOALS

**Goal 1: Can Deploy Code**
- Understand git workflow
- Know how auto-deploy works
- Can push to main confidently
- Can rollback if needed

**Goal 2: Can Monitor Production**
- Know where to find logs
- Can read error traces
- Can spot performance issues
- Can create Sentry alerts

**Goal 3: Can Understand Architecture**
- Know all services and what they do
- Understand data flow
- Can explain Redis caching
- Can explain performance optimizations

**Goal 4: Can Handle Common Tasks**
- Add environment variable
- Clear Redis cache
- Rollback deployment
- Read & fix errors
- Deploy urgent fix

**Goal 5: Can Onboard Others**
- Know this checklist
- Can explain system to someone else
- Can guide new person through setup

---

## 📞 WHO TO ASK

**For Code Questions:**
- GitHub Issues: https://github.com/kalpvrikshatales-ai/tennisace/issues
- Code review: Create PR and request review

**For Deployment Questions:**
- Check Vercel/Render dashboards
- Read DEPLOYMENT_GUIDE.md

**For Architecture Questions:**
- Read NOTION_HUB.md System Architecture section
- Ask senior engineer

**For Error Questions:**
- Check Sentry dashboard
- Read error logs in Vercel/Render
- Check error traceback

**For Performance Questions:**
- Check Render Metrics tab
- Check Sentry Performance tab
- Review optimization decisions in NOTION_HUB

---

## ✨ YOU'RE READY WHEN

✅ You can deploy code to production  
✅ You can read and understand error logs  
✅ You can explain the system architecture  
✅ You know how each service works  
✅ You know what to do when something breaks  
✅ You can help onboard the next person  

---

**Questions? Check NOTION_HUB.md or ask the team!**
