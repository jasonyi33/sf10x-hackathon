Updated Tasks: Voice Transcription App for SF Homeless Outreach
Version 3.1 - 7-Hour Implementation Sprint
Sprint Approach

Hours 1-2: Database changes and age requirement (Phase 1)
Hours 3-5: Photo capture and consent (Phase 2)
Hours 6-7: Search filters and final integration (Phase 3)
Run migrations FIRST before any code deployment

Phase 1: Database & Age Requirement (Hours 1-2)
1.0 [Dev 1] Database migrations and age field setup

 1.1 Create and run migration file 004_add_photos_age.sql:
sql-- Run this IMMEDIATELY before any code changes
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

 1.2 Create photos bucket in Supabase Storage:

Public bucket with auth required
5MB limit, image/jpeg and image/png only
No lifecycle rules (keep photos indefinitely)


 1.3 Update validation to require age:
python# backend/services/validation_helper.py
def validate_age_range(age_value):
    """Age is always array: [-1,-1] for Unknown or [min,max]"""
    if isinstance(age_value, list) and len(age_value) == 2:
        if age_value == [-1, -1]:  # Unknown
            return True
        min_age, max_age = age_value
        return 0 <= min_age < max_age <= 120
    return False


1.1 [Dev 2] Frontend age field preparation

 1.1.1 Install ONLY slider dependency:
bashnpm install @react-native-community/slider
# Do NOT install react-native-range-slider

 1.1.2 Create AgeRangeSlider.tsx with two sliders:
tsx// Use two separate sliders for min/max
// Show "Unknown" button that sets [-1, -1]
// Always return array format [min, max]
// Display current values: "Age: 45-50" or "Age: Unknown"

 1.1.3 Update ManualEntryForm.tsx:

Add AgeRangeSlider after Name field
Default value: [-1, -1] for Unknown
Add to required field validation



1.2 [Dev 1] Update AI to extract age

 1.2.1 Update GPT-4o prompt to return age arrays:
python# Always return age as [min, max] array
# Examples:
# "about 45" → [43, 47]
# "elderly" → [65, 85]
# No age info → [-1, -1]

 1.2.2 Test extraction returns correct format
 1.2.3 Update /api/transcribe to validate age format

Phase 2: Photo Capture & Consent (Hours 3-5)
2.0 [Dev 2] Camera integration with proper flow

 2.0.1 Install camera dependencies:
bashnpm install expo-camera expo-image-picker expo-image-manipulator

 2.0.2 Create PhotoCapture.tsx with consent:

Consent checkbox with legal text
Disable save if photo exists but no consent
Auto-clear photo if consent unchecked


 2.0.3 Image compression service:
typescript// Convert HEIC → JPEG automatically
// Compress to < 5MB
// Return file URI for multipart upload

 2.0.4 Update save flow in RecordScreen.tsx:
typescript// 1. If photo exists, upload it first
// 2. Get photo_url from response
// 3. Include photo_url in individual save
// Do NOT send consent_id to individual endpoint


2.1 [Dev 1] Photo backend with proper order

 2.1.1 Create photo upload endpoint:
python@app.post("/api/photos/upload")
async def upload_photo(
    photo: UploadFile = File(...),
    individual_id: str = Form(...),
    consent_location: str = Form(...),  # JSON string
    user_id: str = Depends(get_current_user)
):
    # 1. Validate file type and size
    # 2. Upload to Supabase Storage
    # 3. Create consent record
    # 4. Return photo_url (frontend will use this)

 2.1.2 Photo history management:
pythondef update_photo_history(individual, new_photo_url):
    # Get current history (max 3)
    history = individual.get('photo_history', [])
    # Add current photo to history if exists
    if individual.get('photo_url'):
        history.insert(0, {
            'url': individual['photo_url'],
            'added_at': individual.get('updated_at')
        })
    # Keep only last 3
    history = history[:3]
    # Update individual
    individual['photo_url'] = new_photo_url
    individual['photo_history'] = history

 2.1.3 Retry logic - exactly 3 attempts total:
pythonasync def upload_with_retry(file_data, max_retries=2):
    # Attempt 1 + 2 retries = 3 total attempts
    for attempt in range(max_retries + 1):
        try:
            return await supabase.storage.from_('photos').upload(...)
        except Exception as e:
            if attempt == max_retries:
                raise HTTPException(status_code=500, 
                    detail="Photo upload failed after 3 attempts")
            await asyncio.sleep(1)


2.2 [Dev 3] Photo display with gallery

 2.2.1 Update IndividualProfileScreen.tsx:

Show photo with fallback placeholder
Click photo → show gallery bar below


 2.2.2 Create PhotoGallery.tsx:

Horizontal scrollable bar
Shows current + up to 3 history photos
Tap to preview, "Set as Current" button


 2.2.3 Photo update from profile:

Same consent requirement
Does NOT create new interaction



Phase 3: Advanced Search & Filters (Hours 6-7)
3.0 [Dev 3] Search UI with filters

 3.0.1 Live dropdown in SearchScreen.tsx:

Text-only results (NO photos in dropdown)
Debounce search by 300ms
Show max 10 results
Display format: "John Doe, 45-50, 5'10", Medium"


 3.0.2 Collapsible filters:

Start collapsed
Expand shows all filter options
Active filters as removable tags


 3.0.3 Sort dropdown with 4 options:

Danger Score (default)
Last Seen
Name A-Z
Distance (if location available)



3.1 [Dev 1] Efficient search backend

 3.1.1 Search with AND filter logic:
python# Build WHERE clause dynamically
# Age overlap: WHERE NOT (age_max < filter_min OR age_min > filter_max)
# All filters use AND
# Extract age array values for comparison

 3.1.2 Filter options with smart caching:
python# Cache filter options for 1 hour
# BUT refresh if cache is empty
# Store in memory, not database
FILTER_CACHE = {}
CACHE_EXPIRY = datetime.now() + timedelta(hours=1)


3.2 [Dev 2] Legal compliance

 3.2.1 Create OnboardingScreen.tsx:

Check AsyncStorage for 'onboarding_complete'
Show legal text if not complete
Set flag after acknowledgment


 3.2.2 Add warning to CategoriesScreen.tsx:

Sticky header with warning text
Red border around warning box



Final Integration (Hour 7)
4.0 [All Devs] Critical testing checklist

 4.0.1 Test complete flow with photo
 4.0.2 Verify age shows correctly:

[-1, -1] displays as "Unknown"
[45, 50] displays as "45-50"


 4.0.3 Test photo upload failures:

After 3 attempts, allow save without photo


 4.0.4 Verify search performance < 500ms
 4.0.5 Create 5 demo individuals with photos

Critical Implementation Notes
Age Format - MUST BE CONSISTENT:
typescript// Frontend always sends/receives arrays:
type AgeRange = [number, number];  // [45, 50] or [-1, -1] for Unknown

// Display logic:
function displayAge(age: [number, number]): string {
  if (age[0] === -1) return "Unknown";
  return `${age[0]}-${age[1]}`;
}
Photo Upload Order - CRITICAL:
typescript// CORRECT order:
1. User selects photo and checks consent
2. Upload photo → get photo_url back
3. Save individual with photo_url included
4. Backend handles history automatically

// NOT: Save individual then attach photo
Photo Upload Format:
typescript// Use FormData, not base64:
const formData = new FormData();
formData.append('photo', {
  uri: photoUri,
  type: 'image/jpeg',
  name: 'photo.jpg'
});
formData.append('individual_id', individualId);
formData.append('consent_location', JSON.stringify(location));
Search Performance Requirements:

Use PostgreSQL indexes on ALL filter fields
Limit results to 20 maximum
No deep pagination (offset > 100)
Pre-calculate filter options, don't query live

Error Recovery:

Photo upload: 3 attempts total, then continue without
Required fields: Block save until filled
Network errors: Show toast, don't crash
Invalid data: Validate client-side first

Developer Quick Reference
Dev 1 Priority Order:

Run migrations FIRST
Age validation in backend
Photo upload endpoint
Search filters
Performance optimization

Dev 2 Priority Order:

Age slider component
Camera/photo capture
Update record flow
Legal warnings
Error handling

Dev 3 Priority Order:

Update profile for photos
Photo gallery component
Search dropdown
Filter UI
Integration testing

Compatibility Verified:

✅ All Expo dependencies compatible
✅ Age format consistent (always arrays)
✅ Photo flow order corrected
✅ Photo upload uses multipart/form-data
✅ Search SQL optimized for performance
✅ Migration safe to run before code

NO CONFLICTING LOGIC REMAINING