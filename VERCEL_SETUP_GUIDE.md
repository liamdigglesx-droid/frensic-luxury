# Vercel Environment Variables Setup Guide

## Complete Step-by-Step Instructions

### Prerequisites
- You must have **Owner** or **Admin** access to your Vercel project
- You need the 3 Supabase credentials from your Supabase dashboard (see below for how to get them)

---

## Getting Your Supabase Credentials First

### 1. Log into Supabase
- Go to https://supabase.com/dashboard
- Click your project `jhgaoemlwjradmufigyh`

### 2. Navigate to API Settings
- Click **Settings** (gear icon) in the left sidebar
- Click **API** in the submenu
- You'll see a page with credentials

### 3. Copy the Three Required Values

**Value 1: Project URL**
- Look for the section labeled **Project URL**
- It looks like: `https://jhgaoemlwjradmufigyh.supabase.co`
- **Copy this entire URL**
- This is your `VITE_SUPABASE_URL`

**Value 2: Anon Public Key**
- In the same **API** page, find the section **Project API keys**
- Look for a key labeled **anon public** or **pk_anon_...**
- It's a long string starting with `eyJhbGc...`
- **Click the copy icon** next to it
- This is your `VITE_SUPABASE_PUBLISHABLE_KEY`

**Value 3: Service Role Key** ⚠️ KEEP THIS SECRET
- In the same **Project API keys** section
- Look for a key labeled **service_role secret** or **sk_service_role_...**
- It's a long string starting with `eyJhbGc...`
- **Click the copy icon** next to it
- ⚠️ **NEVER share this publicly or commit it to git**
- This is your `VITE_SUPABASE_SERVICE_ROLE_KEY`

---

## Adding to Vercel (Detailed)

### Step 1: Access Your Vercel Project

1. Go to https://vercel.com/dashboard
2. Find your project: **frensic-luxury**
3. Click on the project name to open it

### Step 2: Open Project Settings

- At the top of the project page, click the **Settings** tab
- You'll see a menu on the left side

### Step 3: Navigate to Environment Variables

- In the left sidebar menu, scroll down and click **Environment Variables**
- You'll see a page with an empty list (or existing variables)

### Step 4: Add First Variable - VITE_SUPABASE_URL

Click the **Add New** button (top right) or **+ Add New Variable**

**In the form that appears:**

- **Name field**: Type exactly: `VITE_SUPABASE_URL`
- **Value field**: Paste your Supabase Project URL (from Step 1 above)
  - Example: `https://jhgaoemlwjradmufigyh.supabase.co`
- **Environment**: Select all three checkboxes:
  - ☑ Production
  - ☑ Preview
  - ☑ Development
- Click **Save**

### Step 5: Add Second Variable - VITE_SUPABASE_PUBLISHABLE_KEY

Click **+ Add New Variable** again

**In the form that appears:**

- **Name field**: Type exactly: `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Value field**: Paste your Anon Public Key (from Step 2 above)
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long string)
- **Environment**: Select all three checkboxes:
  - ☑ Production
  - ☑ Preview
  - ☑ Development
- Click **Save**

### Step 6: Add Third Variable - VITE_SUPABASE_SERVICE_ROLE_KEY

Click **+ Add New Variable** one more time

**In the form that appears:**

- **Name field**: Type exactly: `VITE_SUPABASE_SERVICE_ROLE_KEY`
- **Value field**: Paste your Service Role Key (from Step 3 above)
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long string)
- **Environment**: Select all three checkboxes:
  - ☑ Production
  - ☑ Preview
  - ☑ Development
- Click **Save**

### Step 7: Verify All Variables Are Added

After adding all three, you should see:

```
✓ VITE_SUPABASE_URL                    Production, Preview, Development
✓ VITE_SUPABASE_PUBLISHABLE_KEY        Production, Preview, Development
✓ VITE_SUPABASE_SERVICE_ROLE_KEY       Production, Preview, Development
```

---

## Important Notes

### Environment Explanation

- **Production**: Your live website (vercel domain or custom domain)
- **Preview**: Temporary preview URLs from pull requests
- **Development**: Local development environments

**You need all three checked** so the app works everywhere.

### Security Reminder

- ⚠️ Never commit `.env.local` to GitHub
- ⚠️ Service Role Key is SECRET — only Vercel should have it
- ✅ Anon Public Key is safe to share (it's meant to be public)
- ✅ Supabase Project URL is public information

### If You Make a Mistake

1. Find the variable in the list
2. Click the **three dots (⋯)** on the right
3. Click **Edit** to change it
4. Or click **Delete** and add it again

---

## Next Steps After Adding Variables

1. **Trigger a new deployment** (see below)
2. **Wait for build to complete** (~5 minutes)
3. **Visit your site** and check if rooms/cars data loads
4. **Check browser console** (F12 → Console tab) for any errors

### How to Trigger a New Deployment

**Option A: Automatic (Recommended)**
- Make any small commit to your main branch
- Example: Update README or add a comment
- Push to GitHub
- Vercel automatically redeploys

**Option B: Manual Redeploy**
1. Go to your Vercel project page
2. Click **Deployments** tab
3. Find the latest deployment
4. Click the **⋯** menu on it
5. Click **Redeploy**

---

## Troubleshooting

### Variables don't appear after saving?
- Refresh the page (Ctrl+R or Cmd+R)
- They should appear in the list

### Build fails after adding variables?
- Check that variable names are spelled exactly as shown (case-sensitive)
- `VITE_` prefix is required for Vite to access them
- Make sure no extra spaces in values

### App still loading hardcoded data?
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Wait 1-2 minutes for Vercel build to fully complete

### Can't find Environment Variables option?
- Make sure you're in **Settings** tab, not **Analytics** or **Deployments**
- Look in the left sidebar for **Environment Variables**
- If still missing, you might not have admin access — check with project owner
