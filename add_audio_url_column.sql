-- Add missing audio_url column to interactions table
-- Run this in your Supabase SQL Editor

ALTER TABLE interactions 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Also add user_name column if it doesn't exist (may be needed too)
ALTER TABLE interactions 
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Update any existing interactions to have user_name if they don't
UPDATE interactions 
SET user_name = 'Unknown User' 
WHERE user_name IS NULL;
