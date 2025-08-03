-- Check if urgency columns exist in your database
-- Run this in Supabase SQL Editor to verify the migration

-- Check individuals table columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'individuals' 
AND column_name IN ('urgency_score', 'urgency_override', 'danger_score', 'danger_override')
ORDER BY column_name;

-- Check categories table columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'categories' 
AND column_name IN ('urgency_weight', 'danger_weight')
ORDER BY column_name;

-- If you see 'danger_*' columns instead of 'urgency_*', run the migration:
-- ALTER TABLE individuals RENAME COLUMN danger_score TO urgency_score;
-- ALTER TABLE individuals RENAME COLUMN danger_override TO urgency_override;
-- ALTER TABLE categories RENAME COLUMN danger_weight TO urgency_weight;