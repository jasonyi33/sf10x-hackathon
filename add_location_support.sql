-- Adding last_location field to individuals table if it doesn't exist
-- This will store the most recent location where the individual was encountered

ALTER TABLE individuals 
ADD COLUMN IF NOT EXISTS last_location JSONB;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_individuals_last_location ON individuals USING GIN(last_location);

-- Create function to automatically update last_location when new interactions are added
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
