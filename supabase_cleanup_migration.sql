-- ===================================================================
-- SUPABASE CLEANUP MIGRATION SCRIPT
-- Remove skin_color, rename danger->urgency, violent_behavior->behavior
-- Run this script in Supabase SQL Editor
-- ===================================================================

BEGIN;

-- Step 1: Add urgency columns if they don't exist
ALTER TABLE individuals
ADD COLUMN IF NOT EXISTS urgency_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS urgency_override INTEGER;

-- Step 2: Copy data from danger columns to urgency columns
UPDATE individuals
SET
    urgency_score = COALESCE(danger_score, 0),
    urgency_override = danger_override
WHERE urgency_score IS NULL OR urgency_override IS NULL;

-- Step 3: Remove skin_color category completely
DELETE FROM categories WHERE name IN ('skin_color', 'Skin Color');

-- Step 4: Rename violent_behavior category to behavior
UPDATE categories
SET name = 'behavior'
WHERE name IN ('violent_behavior', 'Violent Behavior');

-- Step 5: Clean up individual data - Remove skin_color fields
UPDATE individuals
SET data = data - 'skin_color'
WHERE data ? 'skin_color';

-- Step 6: Clean up individual data - Rename violent_behavior to behavior
UPDATE individuals
SET data = data - 'violent_behavior' || jsonb_build_object('behavior', data->'violent_behavior')
WHERE data ? 'violent_behavior';

-- Step 7: Clean up interaction data - Remove skin_color fields
UPDATE interactions
SET data = data - 'skin_color'
WHERE data ? 'skin_color';

-- Step 8: Clean up interaction data - Rename violent_behavior to behavior
UPDATE interactions
SET data = data - 'violent_behavior' || jsonb_build_object('behavior', data->'violent_behavior')
WHERE data ? 'violent_behavior';

-- Step 9: Drop old danger columns (optional - uncomment if you want to remove them)
-- ALTER TABLE individuals
-- DROP COLUMN IF EXISTS danger_score,
-- DROP COLUMN IF EXISTS danger_override;

-- Step 10: Verification queries
-- Check results
SELECT
    'Categories with skin_color' as check_type,
    COUNT(*) as count
FROM categories
WHERE name ILIKE '%skin%color%'

UNION ALL

SELECT
    'Categories with violent_behavior' as check_type,
    COUNT(*) as count
FROM categories
WHERE name ILIKE '%violent%behavior%'

UNION ALL

SELECT
    'Categories with behavior' as check_type,
    COUNT(*) as count
FROM categories
WHERE name = 'behavior'

UNION ALL

SELECT
    'Individuals with skin_color data' as check_type,
    COUNT(*) as count
FROM individuals
WHERE data ? 'skin_color'

UNION ALL

SELECT
    'Individuals with violent_behavior data' as check_type,
    COUNT(*) as count
FROM individuals
WHERE data ? 'violent_behavior'

UNION ALL

SELECT
    'Individuals with behavior data' as check_type,
    COUNT(*) as count
FROM individuals
WHERE data ? 'behavior'

UNION ALL

SELECT
    'Individuals with urgency_score' as check_type,
    COUNT(*) as count
FROM individuals
WHERE urgency_score IS NOT NULL

UNION ALL

SELECT
    'Individuals with urgency_override' as check_type,
    COUNT(*) as count
FROM individuals
WHERE urgency_override IS NOT NULL;

COMMIT;

-- ===================================================================
-- EXPECTED RESULTS AFTER RUNNING THIS SCRIPT:
-- ===================================================================
-- ✅ Categories with skin_color: 0
-- ✅ Categories with violent_behavior: 0
-- ✅ Categories with behavior: 1 (if violent_behavior existed)
-- ✅ Individuals with skin_color data: 0
-- ✅ Individuals with violent_behavior data: 0
-- ✅ Individuals with behavior data: (same count as had violent_behavior)
-- ✅ Individuals with urgency_score: (all individuals)
-- ✅ Individuals with urgency_override: (individuals that had danger_override)
-- ===================================================================