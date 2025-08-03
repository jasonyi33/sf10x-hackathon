-- Fix for missing urgency_override column (using new terminology)
-- Only run this if the check shows you don't have urgency_override

-- Add urgency_override column to individuals table if it doesn't exist
DO $ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'individuals' 
        AND column_name = 'urgency_override'
    ) THEN
        ALTER TABLE individuals ADD COLUMN urgency_override INTEGER;
        RAISE NOTICE 'Added urgency_override column to individuals table';
    ELSE
        RAISE NOTICE 'urgency_override column already exists in individuals table';
    END IF;
END $;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'individuals' 
AND column_name = 'urgency_override';