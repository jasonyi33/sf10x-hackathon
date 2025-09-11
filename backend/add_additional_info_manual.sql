-- Manual SQL to add Additional Information category to existing database
-- Run this in your Supabase SQL editor if the category is missing

INSERT INTO categories (name, type, priority, danger_weight, auto_trigger, is_required, is_preset, options) 
VALUES ('Additional Information', 'text', 'low', 0, FALSE, FALSE, TRUE, NULL)
ON CONFLICT (name) DO NOTHING;

-- Verify the category was added
SELECT * FROM categories WHERE name = 'Additional Information';
