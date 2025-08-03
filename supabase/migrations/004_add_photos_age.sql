-- Run this IMMEDIATELY before any code changes
ALTER TABLE individuals 
ADD COLUMN photo_url TEXT,
ADD COLUMN photo_history JSONB DEFAULT '[]'::jsonb;

CREATE TABLE photo_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID REFERENCES individuals(id),
  photo_url TEXT NOT NULL,
  consented_by UUID REFERENCES auth.users(id),
  consented_at TIMESTAMP DEFAULT NOW(),
  consent_location JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add approximate_age as required preset
INSERT INTO categories (name, type, is_required, is_preset, priority, danger_weight, auto_trigger, options)
VALUES ('approximate_age', 'range', true, true, 'high', 0, false,
        '{"min": 0, "max": 120, "default": "Unknown"}'::jsonb);

-- Update ALL existing individuals - use consistent JSON format
UPDATE individuals 
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb), 
  '{approximate_age}', 
  '[-1, -1]'::jsonb  -- Use [-1, -1] to represent "Unknown" consistently
);

CREATE INDEX idx_individuals_photo ON individuals(photo_url);
CREATE INDEX idx_consent_individual ON photo_consents(individual_id);
CREATE INDEX idx_individuals_age ON individuals((data->>'approximate_age')); 