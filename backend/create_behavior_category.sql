-- Create Behavior category (renamed from violent_behavior)
-- Run this in Supabase SQL editor

INSERT INTO categories (name, type, priority, danger_weight, auto_trigger, is_required, is_preset, options) 
VALUES ('Behavior', 'single_select', 'high', 40, TRUE, FALSE, TRUE, 
    '[{"label": "None", "value": 0}, {"label": "Verbal Only", "value": 0.3}, {"label": "Physical", "value": 1}]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Verify the category was created
SELECT * FROM categories WHERE name = 'Behavior';
