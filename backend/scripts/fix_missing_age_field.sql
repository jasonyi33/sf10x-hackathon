-- Fix missing age field for existing individuals
-- This should be run after migration 004_add_photos_age.sql

-- First, let's check how many individuals are missing the age field
SELECT COUNT(*) as total_individuals,
       COUNT(CASE WHEN data->>'approximate_age' IS NULL THEN 1 END) as missing_age,
       COUNT(CASE WHEN data->>'approximate_age' = '[-1, -1]' THEN 1 END) as has_unknown_age
FROM individuals;

-- Update all individuals that don't have approximate_age field
-- Set it to [-1, -1] which represents "Unknown"
UPDATE individuals 
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb), 
  '{approximate_age}', 
  '[-1, -1]'::jsonb
)
WHERE data->>'approximate_age' IS NULL;

-- Verify the update worked
SELECT COUNT(*) as total_individuals,
       COUNT(CASE WHEN data->>'approximate_age' IS NULL THEN 1 END) as missing_age,
       COUNT(CASE WHEN data->>'approximate_age' = '[-1, -1]' THEN 1 END) as has_unknown_age
FROM individuals;

-- Show a few examples to verify the structure
SELECT id, 
       name,
       data->>'approximate_age' as approximate_age,
       created_at
FROM individuals
LIMIT 5;