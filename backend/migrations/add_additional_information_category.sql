-- Migration: Add Additional Information category
-- This adds a new category for capturing miscellaneous relevant information

INSERT INTO categories (name, type, priority, danger_weight, auto_trigger, is_required, is_preset, options) 
VALUES ('Additional Information', 'text', 'low', 0, FALSE, FALSE, TRUE, NULL)
ON CONFLICT (name) DO NOTHING;
