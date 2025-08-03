# How to Fix the Database Migration for Phase 1

## Problem
The migration `004_add_photos_age.sql` was partially successful:
- ✅ Photo columns were added
- ✅ photo_consents table was created
- ✅ approximate_age category was added
- ❌ Existing individuals weren't updated with the age field

## Solution Options

### Option 1: Using Supabase Dashboard (Easiest)

1. **Login to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Navigate to your project
   - Click on "SQL Editor" in the left sidebar

2. **Run the Fix Query**
   - Copy and paste this SQL:
   ```sql
   -- Update all individuals that don't have approximate_age field
   UPDATE individuals 
   SET data = jsonb_set(
     COALESCE(data, '{}'::jsonb), 
     '{approximate_age}', 
     '[-1, -1]'::jsonb
   )
   WHERE data->>'approximate_age' IS NULL;
   ```
   - Click "Run" or press Cmd/Ctrl + Enter

3. **Verify the Fix**
   - Run this query to check:
   ```sql
   SELECT COUNT(*) as total_individuals,
          COUNT(CASE WHEN data->>'approximate_age' IS NULL THEN 1 END) as missing_age
   FROM individuals;
   ```
   - The `missing_age` count should be 0

### Option 2: Using psql Command Line

1. **Get your Database URL**
   ```bash
   # Check your .env file
   cat .env | grep DATABASE_URL
   # OR
   cat .env | grep SUPABASE_DB_URL
   ```

2. **Run the Fix Script**
   ```bash
   # If you have psql installed
   psql "$DATABASE_URL" < scripts/fix_missing_age_field.sql
   
   # OR using the full connection string
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < scripts/fix_missing_age_field.sql
   ```

### Option 3: Using Supabase CLI

1. **Install Supabase CLI** (if not already installed)
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Link to your project**
   ```bash
   supabase link --project-ref [YOUR-PROJECT-REF]
   ```

3. **Run the migration**
   ```bash
   supabase db push < scripts/fix_missing_age_field.sql
   ```

### Option 4: Using a Python Script

1. **Create a fix script**
   ```bash
   touch scripts/run_age_migration_fix.py
   ```

2. **Add this code:**
   ```python
   import os
   from supabase import create_client, Client
   from dotenv import load_dotenv

   # Load environment variables
   load_dotenv()

   # Create Supabase client
   url = os.getenv("SUPABASE_URL")
   key = os.getenv("SUPABASE_SERVICE_KEY")
   supabase: Client = create_client(url, key)

   # Run the update
   print("Updating individuals with missing age field...")
   
   # Note: Supabase Python client doesn't support direct UPDATE queries
   # So we need to fetch and update each record
   
   # First, get all individuals
   result = supabase.table("individuals").select("*").execute()
   
   updated_count = 0
   for individual in result.data:
       if individual.get("data", {}).get("approximate_age") is None:
           # Update the data field
           data = individual.get("data", {})
           data["approximate_age"] = [-1, -1]
           
           # Update the record
           supabase.table("individuals").update({
               "data": data
           }).eq("id", individual["id"]).execute()
           
           updated_count += 1
   
   print(f"✅ Updated {updated_count} individuals with age field")
   
   # Verify
   result = supabase.table("individuals").select("id, data").execute()
   missing = sum(1 for ind in result.data if ind.get("data", {}).get("approximate_age") is None)
   print(f"Verification: {missing} individuals still missing age field (should be 0)")
   ```

3. **Run the script:**
   ```bash
   cd backend
   python3 scripts/run_age_migration_fix.py
   ```

## Verification After Fix

Run this test to confirm the fix worked:

```bash
cd backend
python3 -m pytest tests/test_phase1_success_criteria.py::TestPhase1CriticalSuccessCriteria::test_database_migration_success -xvs
```

You should see:
- ✅ All existing individuals have age field
- All tests passing

## Why This Happened

The original migration likely had one of these issues:
1. The UPDATE statement wasn't included
2. The UPDATE ran before the category was inserted
3. The UPDATE had a syntax error that was silently ignored
4. The migration was run in parts and the UPDATE was skipped

## Prevention for Future Migrations

1. **Always test migrations locally first**
2. **Include verification queries in migrations**
3. **Use transactions for multi-step migrations**
4. **Add rollback scripts**

## Complete Migration File

For reference, here's what the complete migration should have looked like:

```sql
-- Start transaction
BEGIN;

-- Add photo columns
ALTER TABLE individuals 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS photo_history JSONB DEFAULT '[]'::jsonb;

-- Create photo consents table
CREATE TABLE IF NOT EXISTS photo_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID REFERENCES individuals(id),
  photo_url TEXT NOT NULL,
  consented_by UUID REFERENCES auth.users(id),
  consented_at TIMESTAMP DEFAULT NOW(),
  consent_location JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add approximate_age category
INSERT INTO categories (name, type, is_required, is_preset, priority, danger_weight, auto_trigger, options)
VALUES ('approximate_age', 'range', true, true, 'high', 0, false,
        '{"min": 0, "max": 120, "default": "Unknown"}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Update ALL existing individuals with age field
UPDATE individuals 
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb), 
  '{approximate_age}', 
  '[-1, -1]'::jsonb
)
WHERE data->>'approximate_age' IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_individuals_photo ON individuals(photo_url);
CREATE INDEX IF NOT EXISTS idx_consent_individual ON photo_consents(individual_id);
CREATE INDEX IF NOT EXISTS idx_individuals_age ON individuals((data->>'approximate_age'));

-- Verify the migration
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM individuals
    WHERE data->>'approximate_age' IS NULL;
    
    IF missing_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % individuals still missing age field', missing_count;
    END IF;
END $$;

-- Commit if successful
COMMIT;
```

This ensures the migration either completely succeeds or completely fails (no partial state).