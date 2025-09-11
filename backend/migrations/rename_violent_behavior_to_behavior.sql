-- Migration: Rename violent_behavior category to behavior
-- This renames the category name and updates existing data references

-- Step 1: Update the category name in the categories table
UPDATE categories 
SET name = 'Behavior', updated_at = NOW()
WHERE name = 'violent_behavior' OR name = 'Violent Behavior';

-- Step 2: Update all individual data JSONB fields that reference violent_behavior
-- This updates the key in the JSONB data from 'violent_behavior' to 'behavior'
UPDATE individuals 
SET data = data - 'violent_behavior' || jsonb_build_object('behavior', data->'violent_behavior'),
    updated_at = NOW()
WHERE data ? 'violent_behavior';

-- Step 3: Update interactions data JSONB fields
UPDATE interactions 
SET data = data - 'violent_behavior' || jsonb_build_object('behavior', data->'violent_behavior')
WHERE data ? 'violent_behavior';

-- Verify the changes
SELECT 'Categories updated:' as info, count(*) as count FROM categories WHERE name = 'Behavior';
SELECT 'Individuals updated:' as info, count(*) as count FROM individuals WHERE data ? 'behavior';
SELECT 'Interactions updated:' as info, count(*) as count FROM interactions WHERE data ? 'behavior';
