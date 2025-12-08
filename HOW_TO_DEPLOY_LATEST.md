# How to Deploy the Latest Code to Vercel

## Your Current Situation
- Your deployment is **"Stale"** (2 days old)
- The latest code changes are not deployed yet
- You need to trigger a new deployment

---

## Method 1: Push New Commit (Recommended - Triggers Auto-Deploy)

### Step 1: Open Terminal
Press `Win + R`, type `powershell`, press Enter

### Step 2: Run These Commands

```powershell
cd c:\Users\coenie\kpi-tracker
git add .
git commit -m "Deploy latest changes - New Site tickets and file uploads"
git push
```

### Step 3: Wait for Auto-Deployment
- Vercel will automatically detect the push
- Go to: https://vercel.com/coenie-bernhardts-projects/kpi-tracker/deployments
- You'll see a new deployment starting (usually within 1-2 minutes)
- Wait for it to show "Ready" (green checkmark)

---

## Method 2: Manual Deployment via Vercel Dashboard

### Step 1: Go to Deployments Page
1. Visit: https://vercel.com/coenie-bernhardts-projects/kpi-tracker/deployments
2. You should see a list of deployments

### Step 2: Create New Deployment
**Option A: Redeploy Latest**
1. Find the latest deployment (the one that's "Stale")
2. Click on it to open deployment details
3. Look for a **"Redeploy"** button (usually in the top right or in a menu)
4. Click **"Redeploy"**
5. Select the branch (usually `main`)
6. Click **"Redeploy"**

**Option B: Create New Deployment**
1. On the deployments page, look for a **"Create Deployment"** button (usually at the top)
2. Click it
3. Select:
   - **Branch**: `main` (or your default branch)
   - **Framework Preset**: Next.js (should auto-detect)
4. Click **"Deploy"**

### Step 3: Monitor Deployment
- You'll see the deployment progress
- Wait for it to complete (usually 1-3 minutes)
- Status will change from "Building" → "Ready"

---

## Method 3: Via Vercel CLI (If Installed)

If you have Vercel CLI installed:

```powershell
cd c:\Users\coenie\kpi-tracker
vercel --prod
```

---

## After Deployment

1. **Wait for "Ready" status** in Vercel dashboard
2. **Visit**: https://kpi-tracker-six.vercel.app/
3. **Hard refresh**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
4. **Test**: 
   - Log in
   - Click "Open New Ticket"
   - Check if "New Site" appears in Type dropdown

---

## Quick Links

- **Deployments Page**: https://vercel.com/coenie-bernhardts-projects/kpi-tracker/deployments
- **Project Overview**: https://vercel.com/coenie-bernhardts-projects/kpi-tracker
- **Live Site**: https://kpi-tracker-six.vercel.app/

---

## Troubleshooting

### If "Create Deployment" button is missing:
- Make sure you're logged into Vercel
- Check that you have the correct permissions for the project

### If deployment fails:
- Check the build logs in Vercel dashboard
- Look for error messages (usually red text)
- Common issues:
  - Missing environment variables
  - Build errors
  - TypeScript errors

### If changes still don't appear:
1. Clear browser cache completely
2. Try incognito/private browsing mode
3. Check that the deployment actually completed successfully
4. Verify the commit hash matches your latest code
