-- Migration 004: Add photo support and age requirement
-- This migration must be run BEFORE deploying any code changes
-- It adds photo columns, consent tracking, and makes age a required field

-- 1. Add photo columns to individuals table
ALTER TABLE individuals 
ADD COLUMN photo_url TEXT,
ADD COLUMN photo_history JSONB DEFAULT '[]'::jsonb;

-- 2. Create photo consent tracking table
CREATE TABLE photo_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID REFERENCES individuals(id),
  photo_url TEXT NOT NULL,
  consented_by UUID REFERENCES auth.users(id),
  consented_at TIMESTAMP DEFAULT NOW(),
  consent_location JSONB, -- {"lat": number, "lng": number}
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Add approximate_age as required preset category
INSERT INTO categories (name, type, is_required, is_preset, priority, danger_weight, auto_trigger, options)
VALUES ('approximate_age', 'range', true, true, 'high', 0, false,
        '{"min": 0, "max": 120, "default": "Unknown"}'::jsonb);

-- 4. Update ALL existing individuals to have approximate_age field
-- Use jsonb_set to preserve existing data and add the new field
UPDATE individuals 
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb), 
  '{approximate_age}', 
  '[-1, -1]'::jsonb  -- Use [-1, -1] to represent "Unknown" consistently
);

-- 5. Create indexes for performance
CREATE INDEX idx_individuals_photo ON individuals(photo_url);
CREATE INDEX idx_consent_individual ON photo_consents(individual_id);
CREATE INDEX idx_individuals_age ON individuals((data->>'approximate_age'));

-- 6. Add helper RPC functions for testing (optional but useful)
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE(column_name text, data_type text, is_nullable text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    column_name::text,
    data_type::text,
    is_nullable::text
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = $1
  ORDER BY ordinal_position;
$$;

CREATE OR REPLACE FUNCTION table_exists(table_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  );
$$;

CREATE OR REPLACE FUNCTION get_indexes(table_names text[])
RETURNS TABLE(indexname text, tablename text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT indexname::text, tablename::text
  FROM pg_indexes 
  WHERE schemaname = 'public'
  AND tablename = ANY($1);
$$;

-- 7. Add comments for documentation
COMMENT ON COLUMN individuals.photo_url IS 'Current photo URL from Supabase Storage';
COMMENT ON COLUMN individuals.photo_history IS 'Array of last 3 photos with timestamps';
COMMENT ON TABLE photo_consents IS 'Audit trail for photo consent tracking';
COMMENT ON COLUMN photo_consents.consent_location IS 'GPS location where consent was obtained';