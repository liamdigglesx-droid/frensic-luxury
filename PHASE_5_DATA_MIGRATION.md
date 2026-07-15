# Phase 5: Data Migration from Base44 to Supabase

## Understanding What Needs to Happen

Your app currently has data in **two places:**

**Base44 (Old):** Contains all your existing data
- ✅ Rooms (Royal Haven, Majestic Deluxe, Luxe Manor)
- ✅ Cars (Luxurious Style, Premium Style, etc.)
- ✅ Bookings (customer reservations)
- ✅ Reviews (guest testimonials)
- ✅ Contact Messages

**Supabase (New):** Empty database waiting for data
- ❌ Tables exist but are empty
- ❌ No rooms, cars, bookings yet

**Your Goal:** Copy all data from Base44 → Supabase

---

## Three Methods to Migrate Data

### Method 1: Base44 Built-in Migration (EASIEST - If Available)
### Method 2: Manual SQL Import (If Method 1 doesn't exist)
### Method 3: Export/Import via CSV/JSON (Backup option)

---

## Method 1: Base44 Built-in Migration Function ⭐ TRY THIS FIRST

Base44 might have a built-in migration function. Check these places:

### Step 1: Check Base44 Admin Dashboard
1. Go to https://base44.app
2. Log in with your admin credentials
3. Look for any of these:
   - **"Migrate to Supabase"** button/link
   - **"Export Data"** option
   - **"Migration Tools"** section
   - **"Integrations"** → Supabase
   - **"Settings"** → Data Migration

### Step 2: If You Find Migration Option
**If you see a migration button:**
1. Click it
2. Select **"Supabase"** as destination
3. Paste your Supabase Project ID: `jhgaoemlwjradmufigyh`
4. Paste your Supabase API Key (service_role key)
5. Click **"Migrate"**
6. Wait for completion (5-15 minutes)

**Result:** All data automatically copied to Supabase ✅

✅ **Did you find a migration option in Base44? (Yes/No)**

---

## Method 2: Manual SQL Import (If Method 1 Doesn't Exist)

### Step 1: Export Data from Base44

**Option A: Export via Base44 Dashboard**
1. Go to Base44 admin panel
2. Look for **"Export Data"** or **"Download Data"**
3. Select all entities:
   - ☑ Rooms
   - ☑ Cars
   - ☑ Bookings
   - ☑ Reviews
   - ☑ Contact Messages
4. Choose format: **JSON** or **CSV**
5. Download the file

**Option B: If no export option exists**
- Contact Base44 support: support@base44.app
- Ask for: "Data export for migration to Supabase"
- They should provide a JSON or CSV file

### Step 2: Format the Data

The data from Base44 might not match Supabase column names exactly. Here's the mapping:

**Base44 → Supabase Field Names:**

| Base44 Field | Supabase Field | Notes |
|---|---|---|
| `created_date` | `created_at` | Change field name |
| `updated_date` | `updated_at` | Change field name |
| `order` | `display_order` | Change field name |
| Everything else | Same name | Keep as is |

**Example transformation:**
```json
// Base44 format
{
  "id": "room-1",
  "name": "Royal Haven",
  "created_date": "2024-01-15T10:00:00Z"
}

// Supabase format (change field names)
{
  "id": "room-1",
  "name": "Royal Haven",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Step 3: Import to Supabase

**Go to your Supabase Project:**

1. Open https://supabase.com/dashboard
2. Click your project: `jhgaoemlwjradmufigyh`
3. Click **SQL Editor** in left sidebar
4. Click **+ New Query**

**For each table (rooms, cars, bookings, reviews, contact_messages):**

#### Importing Rooms:
```sql
-- First, clear any existing data (optional)
DELETE FROM rooms WHERE id IS NOT NULL;

-- Copy this INSERT statement and add your data:
INSERT INTO rooms (id, name, tagline, description, price_per_night, bedrooms, size_sqm, max_guests, amenities, image_url, gallery, featured, display_order, legacy_id, created_at, updated_at)
VALUES
('royal-haven', 'Royal Haven', 'Family Suite', 'A spacious, family-friendly suite...', 250000, 3, 250, 6, ARRAY['High-Speed WiFi', 'Smart TV', 'Swimming Pool'], 'https://...', ARRAY[]::text[], false, 0, NULL, NOW(), NOW()),
('majestic-deluxe', 'The Majestic Deluxe', 'Executive Suite', 'A luxurious room...', 350000, 4, 320, 8, ARRAY['High-Speed WiFi', 'Smart TV'], 'https://...', ARRAY[]::text[], false, 1, NULL, NOW(), NOW()),
('luxe-manor', 'The Luxe Manor', 'Premium Suite', 'The ultimate luxury...', 400000, 5, 450, 10, ARRAY['High-Speed WiFi'], 'https://...', ARRAY[]::text[], false, 2, NULL, NOW(), NOW());
```

#### Importing Cars:
```sql
DELETE FROM cars WHERE id IS NOT NULL;

INSERT INTO cars (id, name, style, description, price_per_day, horsepower, top_speed, seats, transmission, features, image_url, gallery, chauffeur_available, display_order, legacy_id, created_at, updated_at)
VALUES
('luxurious-style', 'Luxurious Style', 'Sports Coupe', 'Experience the thrill...', 80000, 650, '320 km/h', 4, 'Automatic', ARRAY['Chauffeur Available', 'GPS Navigation'], 'https://...', ARRAY[]::text[], true, 0, NULL, NOW(), NOW()),
('premium-style', 'Premium Style', 'Executive Sedan', 'Premium performance...', 80000, 450, '280 km/h', 5, 'Automatic', ARRAY['Chauffeur Available'], 'https://...', ARRAY[]::text[], true, 1, NULL, NOW(), NOW());
-- ... add remaining cars ...
```

#### Importing Bookings:
```sql
DELETE FROM bookings WHERE id IS NOT NULL;

INSERT INTO bookings (id, booking_type, item_id, item_name, start_date, end_date, guest_name, guest_email, guest_phone, guests_count, chauffeur, special_requests, nights_or_days, unit_price, total_amount, payment_status, payment_reference, legacy_id, created_at, updated_at)
VALUES
('booking-1', 'stay', 'royal-haven', 'Royal Haven', '2024-01-20', '2024-01-23', 'John Doe', 'john@example.com', '+234701234567', 2, false, 'No requests', 3, 250000, 750000, 'paid', 'PS_REF_123', NULL, NOW(), NOW());
-- ... add remaining bookings ...
```

5. **Click Run** button (or press Ctrl+Enter)
6. Wait for success message ✅

### Step 4: Verify Import

After importing each table, verify the data:

```sql
-- Check rooms imported
SELECT COUNT(*) as room_count FROM rooms;

-- Check cars imported
SELECT COUNT(*) as car_count FROM cars;

-- Check bookings imported
SELECT COUNT(*) as booking_count FROM bookings;
```

You should see counts matching your Base44 data.

---

## Method 3: Ask Me for Help

If you're not comfortable with SQL or the above methods don't work:

**I can create a migration script.** Just provide:

1. **Export file from Base44** (JSON or CSV)
   - Upload or share the file
   - Or describe what data you have

2. **Screenshots** of:
   - Base44 data structure
   - What fields each table has

3. **I will:**
   - Create automated SQL import script
   - Handle all field name transformations
   - Make sure data imports correctly
   - Verify everything worked

---

## ✅ Post-Migration Verification

After migration completes, verify everything worked:

### Step 1: Count Verification
```sql
SELECT COUNT(*) as rooms FROM rooms;
SELECT COUNT(*) as cars FROM cars;
SELECT COUNT(*) as bookings FROM bookings;
SELECT COUNT(*) as reviews FROM reviews;
SELECT COUNT(*) as messages FROM contact_messages;
```

**Expected results:**
- Rooms: ~3
- Cars: ~7
- Bookings: (however many you have)
- Reviews: ~4
- Messages: (however many)

### Step 2: Sample Data Check
```sql
-- Check a sample room
SELECT * FROM rooms LIMIT 1;

-- Check a sample car
SELECT * FROM cars LIMIT 1;

-- Check a sample booking
SELECT * FROM bookings LIMIT 1;
```

All data should be complete with no NULL fields (except optional fields).

### Step 3: Website Test
1. Go to your website: https://frensic-luxury.vercel.app (or your domain)
2. Refresh page (Ctrl+Shift+R)
3. Check if you see:
   - ✅ All rooms display
   - ✅ All cars display
   - ✅ Testimonials display
   - ✅ Try booking and see if data saves to Supabase

---

## Common Migration Issues & Fixes

### Issue: "Column not found" error
**Cause:** Field names don't match between Base44 and Supabase
**Fix:** Check the field mapping table above and adjust field names

### Issue: "Foreign key constraint failed"
**Cause:** Referenced data doesn't exist
**Fix:** Import in this order: rooms → cars → bookings → reviews → contact_messages

### Issue: "Duplicate key value"
**Cause:** Data already exists in Supabase
**Fix:** Delete existing data first:
```sql
DELETE FROM rooms;
DELETE FROM cars;
DELETE FROM bookings;
DELETE FROM reviews;
DELETE FROM contact_messages;
```

### Issue: Date formats wrong
**Cause:** Base44 uses different date format
**Fix:** Convert dates to ISO format: `2024-01-15T10:00:00Z`

---

## Next Steps

**Reply with one of these:**

1. ✅ **"I found Base44 migration option"** → I'll help you use it
2. ✅ **"Method 2 (SQL import)"** → Ready to import manually
3. ✅ **"Can you help me?"** → I'll create a script
4. ✅ **"I need to export data first"** → Show me how to export from Base44

**What method would you like to use?** 🚀
