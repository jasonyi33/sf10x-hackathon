-- Ensure "Additional Information" category exists in the database
-- Run this in your Supabase SQL Editor if the category is missing

-- Check if Additional Information category exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Additional Information') THEN
        INSERT INTO categories (name, type, priority, danger_weight, auto_trigger, is_required, is_preset, options) 
        VALUES ('Additional Information', 'text', 'low', 0, FALSE, FALSE, TRUE, NULL);
        RAISE NOTICE 'Additional Information category has been added.';
    ELSE
        RAISE NOTICE 'Additional Information category already exists.';
    END IF;
END $$;

-- Verify the category exists
SELECT id, name, type, priority, is_required, is_preset
FROM categories 
WHERE name = 'Additional Information';
