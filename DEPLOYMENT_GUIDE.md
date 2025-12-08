# Step-by-Step Deployment Guide

## Overview
This guide will help you deploy your changes to Vercel so they appear on https://kpi-tracker-six.vercel.app/

---

## Step 1: Open Terminal/Command Prompt

1. **Windows**: Press `Win + R`, type `cmd` or `powershell`, press Enter
2. **Or**: Open VS Code terminal (Ctrl + `)

---

## Step 2: Navigate to Your Project

```bash
cd c:\Users\coenie\kpi-tracker
```

---

## Step 3: Check Git Status

See what files have changed:

```bash
git status
```

You should see files like:
- `app/dashboard/page.tsx`
- `app/admin/page.tsx`
- `app/lib/supabase.ts`
- `migration-new-site-tickets.sql`
- etc.

---

## Step 4: Add All Changes to Git

Stage all your changes:

```bash
git add .
```

This adds all modified and new files to be committed.

---

## Step 5: Commit Your Changes

Create a commit with a descriptive message:

```bash
git commit -m "Add New Site ticket type with file uploads and image attachments"
```

---

## Step 6: Push to GitHub/GitLab

Push your changes to the remote repository:

```bash
git push
```

**If this is your first push or you need to set upstream:**
```bash
git push -u origin main
```
(or `master` if that's your branch name)

**Note**: You may be prompted for your GitHub/GitLab credentials.

---

## Step 7: Vercel Auto-Deployment

Vercel automatically detects pushes to your repository and deploys:

1. **Wait 1-2 minutes** after pushing
2. Go to: https://vercel.com/dashboard
3. Find your `kpi-tracker` project
4. You'll see a new deployment starting automatically
5. Wait for it to complete (usually 1-3 minutes)

---

## Step 8: Manual Deployment (If Auto-Deploy Doesn't Work)

If Vercel doesn't auto-deploy:

1. Go to: https://vercel.com/dashboard
2. Click on your **kpi-tracker** project
3. Click the **"Deployments"** tab
4. Click the **"..."** menu on the latest deployment
5. Click **"Redeploy"**
6. Or click **"Create Deployment"** → Select your branch → **"Deploy"**

---

## Step 9: Verify Deployment

1. **Wait for deployment to complete** (check Vercel dashboard - should show "Ready")
2. Visit: https://kpi-tracker-six.vercel.app/
3. **Hard refresh** your browser:
   - **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
   - **Mac**: `Cmd + Shift + R`
4. **Log in** to your account
5. **Test the new features**:
   - Click "Open New Ticket"
   - Check if "New Site" appears in the Type dropdown
   - Try creating a New Site ticket
   - Try uploading files/images

---

## Troubleshooting

### If changes don't appear:

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
2. **Check Vercel deployment logs**: 
   - Go to Vercel dashboard → Your project → Deployments → Click on latest deployment → View logs
3. **Check for build errors**: Look for red error messages in Vercel logs
4. **Verify files were pushed**: 
   ```bash
   git log --oneline -5
   ```
   Should show your latest commit

### If git push fails:

1. **Check if you're authenticated**:
   ```bash
   git config --global user.name
   git config --global user.email
   ```

2. **Set credentials if needed**:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. **Check remote repository**:
   ```bash
   git remote -v
   ```
   Should show your GitHub/GitLab URL

### If Vercel build fails:

1. Check the build logs in Vercel dashboard
2. Common issues:
   - Missing environment variables (check Vercel project settings)
   - TypeScript errors (fix in code)
   - Missing dependencies (run `npm install` locally first)

---

## Quick Command Summary

```bash
# Navigate to project
cd c:\Users\coenie\kpi-tracker

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Add New Site ticket type with file uploads and image attachments"

# Push to remote
git push

# (If first time or branch issue)
git push -u origin main
```

---

## After Deployment

Once deployed, make sure you've also:

1. ✅ **Run the migration SQL** in Supabase (from `migration-new-site-tickets.sql`)
2. ✅ **Created the `tickets` storage bucket** in Supabase Dashboard → Storage
3. ✅ **Set bucket to Public**

Without these, file uploads won't work!

---

## Need Help?

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Git Help**: https://git-scm.com/doc
