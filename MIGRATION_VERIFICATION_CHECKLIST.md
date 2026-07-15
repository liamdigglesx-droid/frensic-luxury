# Supabase Migration & Connection Verification Checklist

## Phase 1: Get Your Supabase Credentials ✓

### What You Need to Do:
1. Go to https://supabase.com/dashboard
2. Click your project: `jhgaoemlwjradmufigyh`
3. Click **Settings** → **API**
4. Copy these 3 values:

| Variable Name | What to Copy | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | **Project URL** | `https://jhgaoemlwjradmufigyh.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **anon public** key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | **service_role secret** key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

✅ **Have you copied all 3 values? (Yes/No)**

---

## Phase 2: Add to Vercel Environment Variables ✓

### What You Need to Do:
1. Go to https://vercel.com/dashboard
2. Click project: **frensic-luxury**
3. Click **Settings** tab → **Environment Variables**
4. Click **+ Add New Variable** (repeat 3 times for each value)

**For each variable:**
- **Name**: Type exactly (copy from table above)
- **Value**: Paste the Supabase credential
- **Environment**: Check all 3 boxes:
  - ☑ Production
  - ☑ Preview
  - ☑ Development
- Click **Save**

**After adding all 3, you should see:**
```
✓ VITE_SUPABASE_URL
✓ VITE_SUPABASE_PUBLISHABLE_KEY
✓ VITE_SUPABASE_SERVICE_ROLE_KEY
```

✅ **Have you added all 3 variables to Vercel? (Yes/No)**

---

## Phase 3: Trigger a New Deployment ✓

### Option A: Automatic Deployment (Easiest)
```bash
# In your terminal, make a small commit
git add .
git commit -m "chore: trigger vercel deployment with supabase env vars"
git push origin main
```

**Vercel will automatically build and deploy.**

### Option B: Manual Redeploy
1. Go to https://vercel.com/dashboard → **frensic-luxury**
2. Click **Deployments** tab
3. Find the latest deployment
4. Click the **⋯** menu → **Redeploy**

**Wait for build to complete (5-10 minutes)** ⏳

✅ **Have you triggered a deployment? (Yes/No)**

---

## Phase 4: Verify Connection Works ✓

### Test 1: Check if App Loads
1. Go to your Vercel project URL (or custom domain)
2. Wait for the site to load completely
3. Check if you see:
   - ✅ **Rooms section displays** (with Royal Haven, Majestic Deluxe, Luxe Manor)
   - ✅ **Cars section displays** (with all 7 vehicles)
   - ✅ **No error messages** in the hero section

**If you see hardcoded data (same as before), that's OK for now — we'll verify more deeply next.**

✅ **Does the site load without errors? (Yes/No)**

---

### Test 2: Check Browser Console for Errors
1. Press **F12** (or right-click → Inspect)
2. Click the **Console** tab
3. Look for any RED error messages
4. If you see errors, take note of them (screenshot or copy the text)

**Common errors to look for:**
- ❌ `VITE_SUPABASE_URL is not defined` → Variable not in Vercel
- ❌ `Failed to fetch from Supabase` → Wrong credentials
- ❌ `Cannot read property 'from' of null` → Supabase client not initialized

✅ **Are there any RED errors in the console? (Yes/No - if Yes, what are they?)**

---

### Test 3: Check Network Requests to Supabase
1. Press **F12** → **Network** tab
2. Refresh the page (F5)
3. Look for requests to `supabase.co`
4. You should see:
   - ✅ Requests to `https://jhgaoemlwjradmufigyh.supabase.co`
   - ✅ Status code **200** or **201** (green)

**If you see:**
- ❌ **404** (red) → Supabase URL is wrong
- ❌ **403** (red) → Wrong API key
- ❌ **No requests to supabase.co** → App still using hardcoded data

✅ **Do you see successful requests to Supabase? (Yes/No)**

---

### Test 4: Verify Data Actually Comes from Supabase

**Check if rooms/cars data matches your Supabase database:**

1. Open Supabase dashboard → your project
2. Click **SQL Editor** in left sidebar
3. Run these queries:

```sql
-- Count rooms
SELECT COUNT(*) as room_count FROM rooms;

-- Count cars
SELECT COUNT(*) as car_count FROM cars;

-- List all rooms
SELECT id, name, price_per_night FROM rooms;
```

**You should see:**
- Rooms: If migrated from Base44, should have ~3 rooms
- Cars: If migrated from Base44, should have ~7 cars

✅ **Do you see data in Supabase tables? (Yes/No - how many rooms/cars?)**

---

## Phase 5: Data Migration from Base44 ✓

### Status Check

**Is your data currently in Base44 or already in Supabase?**

- ❓ **Not sure** → Run the Supabase query above to check row counts
- ✅ **Data is in Supabase** → Skip to Phase 6
- ❌ **Data is NOT in Supabase** → Follow migration steps below

### How to Migrate Data from Base44 to Supabase

**Option A: Use Base44 Migration Function (If Available)**
```
Contact Base44 support or check Base44 admin dashboard for:
- "Migrate to Supabase" function
- Data export API
- Admin migration tool
```

**Option B: Manual Migration (SQL Import)**
1. Export data from Base44 (CSV or JSON)
2. Open Supabase → **SQL Editor**
3. Import the data using provided scripts

**Option C: Contact Me**
- I can create a migration script
- Provide step-by-step instructions
- Help debug any issues

✅ **Has data been migrated to Supabase? (Yes/No - if No, which option works for you?)**

---

## Phase 6: Final Verification ✓

### Complete Checklist

- ☐ Supabase credentials copied and verified
- ☐ All 3 variables added to Vercel
- ☐ Deployment triggered and completed successfully
- ☐ Site loads without errors
- ☐ No RED errors in browser console
- ☐ Network requests go to supabase.co
- ☐ Data exists in Supabase tables (rooms, cars, bookings)
- ☐ Site displays real data from Supabase (not hardcoded)

### If Everything Works ✅
Your migration is complete! Your site is now:
- **Running on Supabase** (not Base44)
- **Pulling real data** from the database
- **Ready for bookings** to be stored in Supabase

### If Something Doesn't Work ❌
**Provide these details and I'll help debug:**
1. What error did you see? (or screenshot)
2. Did deployment complete successfully?
3. Are the 3 environment variables showing in Vercel?
4. Did you copy credentials correctly from Supabase?

---

## Next Steps After Verification

1. ✅ Test a booking end-to-end
   - Make a test booking
   - Check if it appears in Supabase `bookings` table
   
2. ✅ Set up backups
   - Supabase has automatic backups
   - Configure recovery settings

3. ✅ Monitor for issues
   - Check Vercel analytics
   - Monitor Supabase performance

4. ✅ Decommission Base44
   - Once everything works perfectly
   - Keep Base44 active for 1 week as backup
   - Then turn off Base44 subscription

---

## Questions?

**Reply with:**
- 📸 Screenshots of any errors
- ✅ Checklist status (which items are complete/failing)
- 🤔 Any specific questions

I'm here to help until everything works perfectly! 🚀
