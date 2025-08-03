-- Rename danger columns to urgency
ALTER TABLE individuals RENAME COLUMN danger_score TO urgency_score;
ALTER TABLE individuals RENAME COLUMN danger_override TO urgency_override;
ALTER TABLE categories RENAME COLUMN danger_weight TO urgency_weight;

-- Update any views or functions that might reference these columns
-- (none in current schema)