# Complete Step-by-Step Deployment Guide

## Current Problem
- Your local code has changes that aren't on GitHub yet
- GitHub has some changes you don't have locally
- You need to merge them together, then push

---

## STEP 1: Open PowerShell

1. Press the **Windows key** (between Ctrl and Alt)
2. Type: `powershell`
3. Press **Enter**
4. A blue/black window will open - this is PowerShell

---

## STEP 2: Navigate to Your Project

In PowerShell, type this **exactly** and press Enter:

```powershell
cd c:\Users\coenie\kpi-tracker
```

**What you should see:**
```
PS C:\Users\coenie\kpi-tracker>
```

If you see an error, make sure you typed it correctly (copy-paste is best).

---

## STEP 3: Check What Files Have Changed

Type this and press Enter:

```powershell
git status
```

**What you should see:**
- A list of files that say "modified" or "new file"
- Files like:
  - `app/dashboard/page.tsx`
  - `app/admin/page.tsx`
  - `app/lib/supabase.ts`
  - etc.

**If you see "nothing to commit"**: Your changes are already committed, skip to Step 5.

---

## STEP 4: Add All Your Changes

Type this and press Enter:

```powershell
git add .
```

**What you should see:**
- Usually no output (this is normal)
- Or it might list files being added

---

## STEP 5: Commit Your Changes

Type this and press Enter:

```powershell
git commit -m "Add New Site ticket type and file uploads"
```

**What you should see:**
```
[main abc1234] Add New Site ticket type and file uploads
 X files changed, Y insertions(+), Z deletions(-)
```

---

## STEP 6: Pull Remote Changes (IMPORTANT!)

This gets the latest code from GitHub:

```powershell
git pull origin main
```

**What might happen:**

### Scenario A: No Conflicts (Easiest)
You'll see:
```
Updating abc1234..def5678
Fast-forward
 app/some-file.tsx | 5 +++++
 1 file changed, 5 insertions(+)
```

**If you see this:** ✅ Success! Go to Step 7.

### Scenario B: Merge Conflicts (Need to Fix)
You'll see:
```
Auto-merging app/dashboard/page.tsx
CONFLICT (content): Merge conflict in app/dashboard/page.tsx
Automatic merge failed; fix conflicts and then commit the result.
```

**If you see this:** ⚠️ You have conflicts. Go to **STEP 6B** below.

### Scenario C: Already Up to Date
You'll see:
```
Already up to date.
```

**If you see this:** ✅ Good! Go to Step 7.

---

## STEP 6B: Fix Merge Conflicts (If Needed)

If you got conflicts in Step 6:

### 6B.1: See Which Files Have Conflicts

```powershell
git status
```

Look for files that say "both modified" - these have conflicts.

### 6B.2: Open the Conflicted File

1. Open VS Code (or your code editor)
2. Open the file that has conflicts (e.g., `app/dashboard/page.tsx`)
3. Look for these markers:

```
<<<<<<< HEAD
Your local changes here
=======
Remote changes here
>>>>>>> origin/main
```

### 6B.3: Resolve the Conflict

You have 3 options:

**Option 1: Keep Your Changes**
- Delete everything from `<<<<<<<` to `=======`
- Delete the `=======` line
- Delete everything from `=======` to `>>>>>>>`
- Keep only your local changes

**Option 2: Keep Remote Changes**
- Delete everything from `<<<<<<<` to `=======`
- Delete the `<<<<<<<` line
- Delete everything from `=======` to `>>>>>>>`
- Keep only the remote changes

**Option 3: Keep Both (Combine)**
- Delete the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
- Keep both sets of changes, arranged how you want

### 6B.4: Save the File

Press `Ctrl + S` to save

### 6B.5: Mark Conflicts as Resolved

For each file you fixed, run:

```powershell
git add app/dashboard/page.tsx
```

(Replace with the actual file name)

Or add all fixed files at once:

```powershell
git add .
```

### 6B.6: Complete the Merge

```powershell
git commit -m "Merge remote changes with local updates"
```

**What you should see:**
```
Merge made by the 'ort' strategy.
```

---

## STEP 7: Push to GitHub

Now push your code:

```powershell
git push origin main
```

**What you should see:**

### Success:
```
Enumerating objects: 50, done.
Counting objects: 100% (50/50), done.
Delta compression using up to 8 threads
Compressing objects: 100% (30/30), done.
Writing objects: 100% (35/35), 5.23 KiB | 5.23 MiB/s, done.
Total 35 (delta 15), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (15/15), completed with 5 local objects.
To https://github.com/coeniebernhardt-ai/Tracker-API.git
   abc1234..def5678  main -> main
```

**If you see this:** ✅ Success! Go to Step 8.

### If You Still Get Rejected Error:
The remote might have new changes. Try:

```powershell
git pull origin main --rebase
git push origin main
```

---

## STEP 8: Wait for Vercel to Deploy

1. **Open your browser**
2. **Go to**: https://vercel.com/coenie-bernhardts-projects/kpi-tracker/deployments
3. **Look for a new deployment** (should appear within 1-2 minutes)
4. **Watch the status**:
   - It will say "Building..." (yellow/orange)
   - Then "Ready" (green checkmark) ✅

**This usually takes 1-3 minutes.**

---

## STEP 9: Verify Deployment

### 9.1: Check Deployment Status

In Vercel dashboard, make sure the latest deployment shows:
- ✅ **Status**: "Ready" (green)
- ✅ **Environment**: "Production"
- ✅ **Created**: "Just now" or "1 minute ago"

### 9.2: Test Your Site

1. **Visit**: https://kpi-tracker-six.vercel.app/
2. **Hard refresh** your browser:
   - **Windows**: Press `Ctrl + Shift + R`
   - **Mac**: Press `Cmd + Shift + R`
3. **Log in** to your account
4. **Click "Open New Ticket"**
5. **Check the Type dropdown** - you should see:
   - Hardware
   - Software
   - **New Site** ← This should be there!

---

## STEP 10: If "New Site" Doesn't Appear

### Check 1: Deployment Status
- Go back to Vercel dashboard
- Make sure deployment is "Ready" (not "Building" or "Error")

### Check 2: Browser Cache
- Try **incognito/private mode**:
  - Chrome: `Ctrl + Shift + N`
  - Edge: `Ctrl + Shift + P`
  - Firefox: `Ctrl + Shift + P`
- Visit the site in incognito mode

### Check 3: Check Build Logs
1. In Vercel dashboard, click on the latest deployment
2. Click "Build Logs" tab
3. Look for any **red error messages**
4. If you see errors, share them and I can help fix

### Check 4: Verify Code Was Pushed
```powershell
git log --oneline -3
```

You should see your latest commit at the top.

---

## Quick Reference: All Commands in Order

Copy and paste these one by one:

```powershell
# Navigate to project
cd c:\Users\coenie\kpi-tracker

# Check status
git status

# Add all changes
git add .

# Commit
git commit -m "Add New Site ticket type and file uploads"

# Pull remote changes
git pull origin main

# (If conflicts, fix them, then:)
# git add .
# git commit -m "Merge remote changes"

# Push to GitHub
git push origin main

# Check deployment
# (Go to Vercel dashboard in browser)
```

---

## Common Error Messages & Solutions

### Error: "fatal: not a git repository"
**Solution**: Make sure you're in the right folder. Run `cd c:\Users\coenie\kpi-tracker` again.

### Error: "Please tell me who you are"
**Solution**: Run these commands:
```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Error: "Permission denied"
**Solution**: You need to authenticate with GitHub. You might need to:
- Use a Personal Access Token instead of password
- Set up SSH keys
- Use GitHub Desktop app

### Error: "Updates were rejected"
**Solution**: You need to pull first. Run:
```powershell
git pull origin main
```
Then try pushing again.

---

## Need Help?

If you get stuck at any step:
1. **Copy the exact error message** you see
2. **Tell me which step** you're on
3. **Share what you see** when you run `git status`

I'll help you fix it!
