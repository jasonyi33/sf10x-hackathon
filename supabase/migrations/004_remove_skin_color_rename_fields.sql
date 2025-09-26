-- Migration: Remove skin_color, rename danger->urgency, violent_behavior->behavior
-- This migration removes sensitive fields and renames terminology

-- Step 1: Remove skin_color category completely
DELETE FROM categories WHERE name = 'skin_color' OR name = 'Skin Color';

-- Step 2: Rename violent_behavior to behavior in categories
UPDATE categories
SET name = 'behavior',
    display_name = 'Behavior'
WHERE name = 'violent_behavior' OR name = 'Violent Behavior';

-- Step 3: Rename danger columns to urgency in individuals table
ALTER TABLE individuals
RENAME COLUMN danger_score TO urgency_score;

ALTER TABLE individuals
RENAME COLUMN danger_override TO urgency_override;

-- Step 4: Rename danger columns to urgency in interactions table
ALTER TABLE interactions
RENAME COLUMN danger_score TO urgency_score;

ALTER TABLE interactions
RENAME COLUMN danger_override TO urgency_override;

-- Step 5: Rename danger_weight to urgency_weight in categories table
ALTER TABLE categories
RENAME COLUMN danger_weight TO urgency_weight;

-- Step 6: Remove skin_color from all individual data (keeping other data intact)
UPDATE individuals
SET data = data - 'skin_color'
WHERE data ? 'skin_color';

-- Step 7: Rename violent_behavior to behavior in all individual data
UPDATE individuals
SET data = data - 'violent_behavior' || jsonb_build_object('behavior', data->'violent_behavior')
WHERE data ? 'violent_behavior';

-- Step 8: Remove skin_color from all interaction data
UPDATE interactions
SET data = data - 'skin_color'
WHERE data ? 'skin_color';

-- Step 9: Rename violent_behavior to behavior in all interaction data
UPDATE interactions
SET data = data - 'violent_behavior' || jsonb_build_object('behavior', data->'violent_behavior')
WHERE data ? 'violent_behavior';