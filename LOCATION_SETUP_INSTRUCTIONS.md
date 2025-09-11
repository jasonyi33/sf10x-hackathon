# Location Storage Setup Instructions

## Overview
This document explains how to set up location storage and display functionality for individual profiles in the homeless outreach app.

## Database Migration Required

**IMPORTANT**: You need to run a database migration to add location support.

### Step 1: Run the SQL Migration
Copy and paste the following SQL script into your Supabase SQL Editor:

```sql
-- Add last_location field to individuals table if it doesn't exist
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
```

### Step 2: Verify Migration
After running the migration, you can verify it worked by running:

```sql
-- Check if last_location column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'individuals' AND column_name = 'last_location';

-- Check if trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_individual_last_location';
```

## What's New

### 🗺️ Interactive Location Maps
- Individual profiles now display an interactive map showing their last known location
- Maps include:
  - Pin marker with the individual's name
  - Full address display
  - Precise coordinates
  - Zoom/pan functionality

### 📍 Automatic Location Capture
- **Recording**: Location is automatically captured when starting voice recording
- **Manual Entry**: Location can be set manually using the location picker
- **Storage**: Location is saved with each interaction and updates the individual's profile

### 🔄 Location Data Flow
1. **Capture**: Location obtained during recording or manual entry
2. **Storage**: Saved to both `interactions.location` and `individuals.last_location`
3. **Display**: Shown as interactive map in individual profile screen
4. **Auto-Update**: Trigger automatically updates `last_location` when new interactions are added

## Technical Implementation

### Database Schema
```sql
-- individuals table now includes:
ALTER TABLE individuals ADD COLUMN last_location JSONB;

-- Example last_location data:
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "address": "123 Market Street, San Francisco, CA"
}
```

### Frontend Components
- **`IndividualLocationMap`**: New interactive map component
- **Location Integration**: Added to `IndividualProfileScreen` between current information and interaction history
- **Location Passing**: Updated `TranscriptionResults` and `RecordScreen` to pass location data

### Backend Updates
- **API Response**: `IndividualResponse` now includes `last_location` field
- **Service Layer**: `IndividualService` stores location in both interactions and individual records
- **Auto-Trigger**: Database trigger keeps `last_location` current automatically

## Usage

### For Users
1. **Voice Recording**: Location is captured automatically when recording starts
2. **Manual Entry**: Use "Set Location" button to choose location manually
3. **Profile Viewing**: Individual profiles show interactive map with last known location

### For Developers
- Location data flows through the entire system automatically
- No manual intervention needed - trigger handles updates
- Maps are responsive and work on all screen sizes
- Graceful handling when no location data is available

## Troubleshooting

### Map Not Showing
- Check if `last_location` field exists in database
- Verify individual has location data: `SELECT last_location FROM individuals WHERE id = 'uuid';`
- Ensure react-native-maps is properly configured in your environment

### Location Not Saving
- Verify database migration was successful
- Check trigger is active: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'trigger_update_individual_last_location';`
- Test location permissions are granted in the mobile app

### Performance
- The GIN index on `last_location` ensures fast location-based queries
- Trigger updates are efficient and only run when needed
- Maps are optimized for mobile performance

## Security & Privacy
- Location data is only captured with user permission
- Data is stored securely in your Supabase database
- Location sharing follows your app's existing privacy policies
- No third-party location services are used beyond the built-in map display
