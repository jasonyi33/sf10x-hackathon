-- Add last_location field to individuals table to store most recent interaction location
-- This provides quick access to an individual's last known location without querying interactions

ALTER TABLE individuals 
ADD COLUMN IF NOT EXISTS last_location JSONB;

-- Update existing individuals with their most recent interaction location
-- This is a one-time migration for existing data
UPDATE individuals 
SET last_location = (
    SELECT location 
    FROM interactions 
    WHERE interactions.individual_id = individuals.id 
      AND location IS NOT NULL 
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE last_location IS NULL;

-- Add index for location queries (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_individuals_last_location ON individuals USING GIN(last_location);

-- Create function to automatically update last_location when new interactions are added
-- This ensures the last_location field stays current
CREATE OR REPLACE FUNCTION update_individual_last_location()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the individual's last_location when a new interaction with location is created
    IF NEW.location IS NOT NULL THEN
        UPDATE individuals 
        SET last_location = NEW.location,
            updated_at = NOW()
        WHERE id = NEW.individual_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_location
DROP TRIGGER IF EXISTS trigger_update_individual_last_location ON interactions;
CREATE TRIGGER trigger_update_individual_last_location
    AFTER INSERT ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_individual_last_location();
