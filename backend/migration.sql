-- Migration: Update database schema from danger_score to urgency_score
-- Run this in your Supabase SQL Editor

-- Step 1: Add new columns to individuals table
ALTER TABLE individuals 
ADD COLUMN IF NOT EXISTS urgency_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS urgency_override INTEGER;

-- Step 2: Copy data from old columns to new columns
UPDATE individuals 
SET urgency_score = danger_score 
WHERE urgency_score IS NULL AND danger_score IS NOT NULL;

UPDATE individuals 
SET urgency_override = danger_override 
WHERE urgency_override IS NULL AND danger_override IS NOT NULL;

-- Step 3: Add urgency_weight column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS urgency_weight INTEGER DEFAULT 0;

-- Step 4: Copy danger_weight data to urgency_weight
UPDATE categories 
SET urgency_weight = danger_weight 
WHERE urgency_weight IS NULL AND danger_weight IS NOT NULL;

-- Step 5: Verify the migration
SELECT 
    'individuals' as table_name,
    COUNT(*) as total_records,
    COUNT(urgency_score) as records_with_urgency_score,
    COUNT(urgency_override) as records_with_urgency_override
FROM individuals
UNION ALL
SELECT 
    'categories' as table_name,
    COUNT(*) as total_records,
    COUNT(urgency_weight) as records_with_urgency_weight,
    NULL as records_with_urgency_override
FROM categories;
