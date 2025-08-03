# Migration 004: Photos and Age Requirement

## Overview
This migration adds photo support infrastructure and makes age a required field for all individuals.

## Changes Made

### 1. Photo Support Infrastructure
- **Added to `individuals` table:**
  - `photo_url` (TEXT) - Stores current photo URL from Supabase Storage
  - `photo_history` (JSONB) - Array of last 3 photos with timestamps

- **New `photo_consents` table:**
  - Tracks WHO obtained consent (user_id)
  - WHEN consent was obtained (timestamp)
  - WHERE consent was obtained (GPS location)
  - Full audit trail for legal compliance

### 2. Age as Required Field
- **New category:** `approximate_age`
  - Type: `range` (not single number)
  - Format: `[min, max]` array
  - Special value: `[-1, -1]` represents "Unknown"
  - Required field for all new entries
  - Does NOT affect danger score (weight = 0)

### 3. Data Migration
- **All existing individuals** updated with `approximate_age: [-1, -1]`
- Preserves all existing data using `jsonb_set`
- Safe to run multiple times (idempotent)

### 4. Performance Indexes
- `idx_individuals_photo` - Quick photo lookups
- `idx_consent_individual` - Consent history queries
- `idx_individuals_age` - Age-based filtering for search

## Important Notes

### Age Format Consistency
```javascript
// ALWAYS use array format
approximate_age: [45, 50]     // Age range 45-50
approximate_age: [-1, -1]     // Unknown age

// NEVER use single number
approximate_age: 45           // ❌ WRONG
```

### Photo Upload Flow
1. User captures photo and confirms consent
2. Upload photo to Storage first
3. Get photo_url from response
4. Include photo_url when saving individual
5. Backend automatically manages photo history

### Migration Order
⚠️ **CRITICAL**: Run this migration BEFORE deploying code changes!
1. Apply database migration first
2. Then deploy backend changes
3. Finally deploy frontend changes

## Testing

### Before Migration
Run tests to verify they fail:
```bash
cd backend/tests
python run_migration_test.py
```

Expected: All 5 tests should fail

### Apply Migration
Option 1 - Supabase CLI:
```bash
supabase db push
```

Option 2 - SQL Editor:
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Paste contents of `004_add_photos_age.sql`
4. Execute

### After Migration
Run tests again to verify they pass:
```bash
python run_migration_test.py
```

Expected: All 5 tests should pass

## Rollback Plan
If issues arise, you can partially rollback:

```sql
-- Remove photo columns (safe if not used)
ALTER TABLE individuals 
DROP COLUMN IF EXISTS photo_url,
DROP COLUMN IF EXISTS photo_history;

-- Remove consent table
DROP TABLE IF EXISTS photo_consents;

-- Remove indexes
DROP INDEX IF EXISTS idx_individuals_photo;
DROP INDEX IF EXISTS idx_consent_individual;
DROP INDEX IF EXISTS idx_individuals_age;

-- Note: Keep approximate_age data to avoid data loss
```

## Next Steps
After successful migration:
1. ✅ Task 1.1 Complete
2. → Move to Task 1.2: Create photos bucket in Supabase Storage
3. → Move to Task 1.3: Update backend validation