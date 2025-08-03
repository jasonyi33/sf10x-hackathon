-- Add user_name column to interactions table
-- This column stores the name of the user who created the interaction
-- Required for displaying interaction history

ALTER TABLE interactions 
ADD COLUMN user_name TEXT;

-- Set default value for existing records
UPDATE interactions 
SET user_name = 'Demo User' 
WHERE user_name IS NULL;