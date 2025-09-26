-- Clean up old terminology from JSONB data fields
-- This script removes skin_color fields and renames violent_behavior to behavior

BEGIN;

-- 1. Remove skin_color from all individual records
UPDATE individuals
SET data = data - 'skin_color'
WHERE data ? 'skin_color';

-- 2. Rename violent_behavior to behavior in individual records
UPDATE individuals
SET data = jsonb_set(data, '{behavior}', data->'violent_behavior') - 'violent_behavior'
WHERE data ? 'violent_behavior';

-- 3. Remove skin_color category from categories table
DELETE FROM categories
WHERE name = 'skin_color';

-- 4. Update violent_behavior category to behavior
UPDATE categories
SET name = 'behavior'
WHERE name = 'violent_behavior';

-- 5. Verify the changes
SELECT COUNT(*) as total_individuals FROM individuals;
SELECT COUNT(*) as individuals_with_skin_color FROM individuals WHERE data ? 'skin_color';
SELECT COUNT(*) as individuals_with_violent_behavior FROM individuals WHERE data ? 'violent_behavior';
SELECT COUNT(*) as individuals_with_behavior FROM individuals WHERE data ? 'behavior';
SELECT name FROM categories WHERE name IN ('skin_color', 'violent_behavior', 'behavior');

COMMIT;