# Supabase Migration Instructions for Task 1.1

## Prerequisites
- Access to your Supabase project dashboard
- Database credentials (if using CLI)

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Access SQL Editor
1. Open your Supabase project at [app.supabase.com](https://app.supabase.com)
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query** button

### Step 2: Run the Migration
1. Copy the entire contents of `/supabase/migrations/004_add_photos_age.sql`
2. Paste into the SQL Editor
3. Click **Run** button (or press Cmd/Ctrl + Enter)

### Step 3: Verify Success
Look for the green success message. You should see:
- "ALTER TABLE" (photo columns added)
- "CREATE TABLE" (photo_consents created)
- "INSERT 0 1" (approximate_age category added)
- "UPDATE X" (where X is number of individuals updated)
- "CREATE INDEX" (3 times for indexes)

## Method 2: Using Supabase CLI

### Step 1: Install Supabase CLI (if not installed)
```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### Step 2: Login and Link Project
```bash
# Login to Supabase
supabase login

# Link to your project (you'll need project ID)
supabase link --project-ref <your-project-id>
```

### Step 3: Apply Migration
```bash
# From the project root directory
cd /Users/jasonyi/sf10x-hackathon
supabase db push
```

## Method 3: Direct Database Connection

### Step 1: Get Connection String
1. Go to Supabase Dashboard > Settings > Database
2. Copy the connection string (URI)

### Step 2: Run Migration
```bash
# Using psql
psql "your-connection-string" -f supabase/migrations/004_add_photos_age.sql

# Or using any PostgreSQL client
```

## Verification Steps

### Quick Verification in Dashboard
1. Go to **Table Editor** in Supabase Dashboard
2. Check **individuals** table:
   - Should have new columns: `photo_url`, `photo_history`
3. Check **Tables** list:
   - Should see new table: `photo_consents`
4. Check **categories** table:
   - Should have new row: `approximate_age`

### Programmatic Verification
Run the test script:
```bash
cd backend/tests
python run_migration_test.py
```

All 5 tests should pass:
- ✅ Photo columns exist
- ✅ Photo consents table exists
- ✅ Approximate age category exists
- ✅ All individuals have age [-1, -1]
- ✅ Indexes created

## Common Issues and Solutions

### Issue: Permission Denied
**Solution**: Make sure you're using the service role key or have proper database permissions.

### Issue: Column Already Exists
**Solution**: Migration may have been partially applied. Check which parts succeeded and run only the missing parts.

### Issue: Tests Still Failing
**Solution**: 
1. Verify you're connected to the correct database
2. Check that migration completed without errors
3. Ensure your `.env` file has correct Supabase credentials

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- Remove photo columns
ALTER TABLE individuals 
DROP COLUMN IF EXISTS photo_url,
DROP COLUMN IF EXISTS photo_history;

-- Remove consent table
DROP TABLE IF EXISTS photo_consents;

-- Remove indexes
DROP INDEX IF EXISTS idx_individuals_photo;
DROP INDEX IF EXISTS idx_consent_individual;
DROP INDEX IF EXISTS idx_individuals_age;

-- Remove category (optional - might want to keep)
DELETE FROM categories WHERE name = 'approximate_age';
```

## Next Steps

After successful migration:
1. ✅ Migration applied
2. ✅ Tests passing
3. → Proceed to Task 1.2: Create photos bucket in Supabase Storage

## Important Notes

⚠️ **CRITICAL**: This migration must be applied BEFORE deploying any code changes!

The migration:
- Is safe to run multiple times (idempotent)
- Preserves all existing data
- Sets all existing individuals to have age = [-1, -1] (Unknown)
- Does not affect danger scores (age weight = 0)