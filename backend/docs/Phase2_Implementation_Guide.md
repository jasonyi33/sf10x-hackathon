# Phase 2 Implementation Guide: Photo Capture & Consent

## Overview
Phase 2 focuses on implementing photo capture functionality with proper consent tracking, storage management, and display features. This phase runs from hours 3-5 of the 7-hour sprint.

## Phase 2 Task Breakdown

### Task 2.0: [Dev 2] Camera Integration with Proper Flow

#### Sub-task 2.0.1: Install Camera Dependencies
**Requirements:**
- Install expo-camera for camera access
- Install expo-image-picker for gallery access
- Install expo-image-manipulator for image compression

**Test Cases:**
```bash
# Test 1: Verify dependencies installed
npm list expo-camera expo-image-picker expo-image-manipulator

# Test 2: Check for version compatibility
# All should be Expo SDK 49 compatible

# Test 3: Verify no peer dependency warnings
npm audit
```

#### Sub-task 2.0.2: Create PhotoCapture.tsx with Consent
**Requirements:**
- Camera preview component
- Capture photo button
- Retake option after capture
- Consent checkbox with legal text: "Verbal consent has been received to use facial photos for identification purposes within the SF Street Team system only"
- Disable save if photo exists but no consent
- Auto-clear photo if consent unchecked
- Return photo URI and consent status

**Test Cases:**
```typescript
// Test 1: Component renders camera preview
// Test 2: Capture button takes photo
// Test 3: Retake button resets to camera view
// Test 4: Consent checkbox toggles correctly
// Test 5: Photo cleared when consent unchecked
// Test 6: Save disabled without consent
// Test 7: Returns {photoUri: string, hasConsent: boolean}
```

#### Sub-task 2.0.3: Image Compression Service
**Requirements:**
- Convert HEIC to JPEG automatically
- Compress images to < 5MB
- Maintain reasonable quality (80% JPEG quality)
- Return file URI for multipart upload
- Handle various image formats (HEIC, PNG, JPG)

**Test Cases:**
```typescript
// Test 1: HEIC file converts to JPEG
// Test 2: Large image (>5MB) compressed successfully
// Test 3: Small image (<5MB) not over-compressed
// Test 4: Output is valid JPEG format
// Test 5: Returns proper file:// URI
// Test 6: Handles corrupted images gracefully
```

#### Sub-task 2.0.4: Update Save Flow in RecordScreen.tsx
**Requirements:**
- If photo exists, upload it FIRST before saving individual
- Get photo_url from upload response
- Include photo_url in individual save request
- Do NOT send consent_id to individual endpoint
- Handle upload failures gracefully
- Show appropriate loading states

**Test Cases:**
```typescript
// Test 1: Photo uploads before individual save
// Test 2: photo_url included in save request
// Test 3: Save continues without photo on upload failure
// Test 4: Loading spinner during photo upload
// Test 5: No consent_id sent to /api/individuals
// Test 6: Error toast on upload failure
```

### Task 2.1: [Dev 1] Photo Backend with Proper Order

#### Sub-task 2.1.1: Create Photo Upload Endpoint
**Requirements:**
```python
@app.post("/api/photos/upload")
async def upload_photo(
    photo: UploadFile = File(...),
    individual_id: str = Form(...),
    consent_location: str = Form(...),  # JSON string
    user_id: str = Depends(get_current_user)
):
    # Requirements:
    # 1. Validate file type (image/jpeg, image/png only)
    # 2. Validate file size (max 5MB)
    # 3. Generate unique filename: photos/{user_id}/{timestamp}_{uuid}.jpg
    # 4. Upload to Supabase Storage 'photos' bucket
    # 5. Create consent record in photo_consents table
    # 6. Return photo_url for frontend use
    # 7. Handle upload failures with proper error messages
```

**Test Cases:**
```python
# Test 1: Valid JPEG upload succeeds
# Test 2: Valid PNG upload succeeds and converts
# Test 3: Invalid file type (PDF) rejected
# Test 4: Oversized file (>5MB) rejected
# Test 5: Consent record created with all fields
# Test 6: Returns proper photo URL format
# Test 7: Handles Supabase storage errors
# Test 8: Missing required fields return 422
# Test 9: Invalid JSON in consent_location rejected
# Test 10: Unauthorized user returns 401
```

#### Sub-task 2.1.2: Photo History Management
**Requirements:**
```python
def update_photo_history(individual: dict, new_photo_url: str) -> dict:
    """
    Update photo history when new photo added
    - Get current history (max 3 entries)
    - Add current photo_url to history if exists
    - Keep only last 3 photos
    - Set new photo as current
    - Preserve timestamps
    """
```

**Test Cases:**
```python
# Test 1: First photo - no history created
# Test 2: Second photo - first moves to history
# Test 3: Fourth photo - oldest dropped from history
# Test 4: History maintains chronological order
# Test 5: Timestamps preserved in history
# Test 6: Handles missing photo_history field
# Test 7: Returns updated individual dict
```

#### Sub-task 2.1.3: Retry Logic - Exactly 3 Attempts Total
**Requirements:**
```python
async def upload_with_retry(file_data: bytes, path: str, max_retries: int = 2):
    """
    Upload to Supabase with retry logic
    - Attempt 1 + 2 retries = 3 total attempts
    - 1 second delay between attempts
    - Return success or raise HTTPException(500) after 3 failures
    - Log each attempt for debugging
    """
```

**Test Cases:**
```python
# Test 1: Success on first attempt - no retries
# Test 2: Success on second attempt - 1 retry
# Test 3: Success on third attempt - 2 retries
# Test 4: Failure after 3 attempts raises 500
# Test 5: Delay occurs between attempts
# Test 6: Each attempt logged properly
# Test 7: Network errors trigger retry
# Test 8: Auth errors don't retry (fail fast)
```

### Task 2.2: [Dev 3] Photo Display with Gallery

#### Sub-task 2.2.1: Update IndividualProfileScreen.tsx
**Requirements:**
- Show current photo prominently at top
- Use placeholder image if no photo
- Tap photo to show/hide gallery bar
- Gallery appears below photo
- Smooth animation for gallery toggle
- Handle missing photo gracefully

**Test Cases:**
```typescript
// Test 1: Photo displays when photo_url exists
// Test 2: Placeholder shown when no photo
// Test 3: Tap toggles gallery visibility
// Test 4: Gallery animates smoothly
// Test 5: Handles network errors loading photo
// Test 6: Photo scales properly to container
```

#### Sub-task 2.2.2: Create PhotoGallery.tsx
**Requirements:**
- Horizontal scrollable bar
- Shows current + up to 3 history photos
- Small thumbnails with dates
- Tap thumbnail to preview full size
- "Set as Current" button on preview
- Smooth scrolling between photos

**Test Cases:**
```typescript
// Test 1: Shows all photos (current + history)
// Test 2: Maximum 4 photos displayed
// Test 3: Dates shown for each photo
// Test 4: Tap opens full preview
// Test 5: Set as Current updates main photo
// Test 6: Handles missing history gracefully
// Test 7: Scrolls horizontally on swipe
```

#### Sub-task 2.2.3: Photo Update from Profile
**Requirements:**
- Same consent requirement as initial capture
- Does NOT create new interaction record
- Updates photo_url and photo_history
- Shows success/error feedback
- Refreshes profile after update

**Test Cases:**
```typescript
// Test 1: Update requires consent checkbox
// Test 2: No new interaction created
// Test 3: Old photo moves to history
// Test 4: Profile refreshes with new photo
// Test 5: Error shown on upload failure
// Test 6: Loading state during update
```

## Critical Success Criteria for Phase 2

### 1. Photo Upload Flow
- [ ] Photos upload BEFORE individual save
- [ ] photo_url included in save request
- [ ] Upload failures don't block save
- [ ] Proper error handling and feedback

### 2. Consent Tracking
- [ ] Cannot save photo without consent
- [ ] Consent records who/when/where
- [ ] Consent checkbox with legal text
- [ ] Photo cleared if consent unchecked

### 3. Storage & Format
- [ ] Photos stored in Supabase Storage
- [ ] 5MB size limit enforced
- [ ] HEIC → JPEG conversion works
- [ ] Only JPEG/PNG accepted

### 4. Photo History
- [ ] Current photo moves to history on update
- [ ] Maximum 3 photos in history
- [ ] Can restore from history
- [ ] Timestamps preserved

### 5. Display & Gallery
- [ ] Photos show in profile only
- [ ] Gallery shows current + history
- [ ] Smooth animations
- [ ] Proper error states

## Common Pitfalls to Avoid

1. **Upload Order**: Always upload photo FIRST, then save individual with photo_url
2. **Consent Validation**: Block save if photo exists without consent
3. **File Format**: Convert HEIC to JPEG before upload
4. **History Management**: Keep max 3 photos, newest first
5. **Error Recovery**: Allow save to continue if photo upload fails
6. **No Search Photos**: Photos should NOT appear in search results

## Integration Test Scenarios

### Scenario 1: Complete Flow with Photo
```
1. Start voice recording
2. Stop and transcribe
3. Take photo on edit screen
4. Check consent
5. Save successfully
6. Verify photo appears in profile
```

### Scenario 2: Photo Update Flow
```
1. Navigate to existing profile
2. Tap "Update Photo"
3. Take new photo
4. Check consent
5. Save update
6. Verify old photo in history
```

### Scenario 3: Error Recovery
```
1. Create individual with photo
2. Simulate upload failure (network off)
3. Verify save continues without photo
4. Verify error message shown
```

### Scenario 4: Consent Validation
```
1. Take photo
2. Don't check consent
3. Verify save button disabled
4. Check consent
5. Verify save enabled
```

## Performance Requirements

- Photo upload: < 5 seconds for 5MB file
- Thumbnail generation: < 500ms
- Gallery load: < 1 second
- Consent record creation: < 200ms

## Security Considerations

- Photos accessible only to authenticated users
- Consent audit trail immutable
- Photo URLs use Supabase RLS
- No photo data in search responses

## API Contracts

### Photo Upload Request
```
POST /api/photos/upload
Content-Type: multipart/form-data

photo: File (required)
individual_id: string (required)
consent_location: JSON string (required)
```

### Photo Upload Response
```json
{
  "photo_url": "https://supabase.co/storage/v1/photos/...",
  "consent_id": "uuid"
}
```

### Individual Save with Photo
```json
{
  "data": {
    "name": "John Doe",
    "approximate_age": [45, 50],
    // ... other fields
  },
  "photo_url": "https://supabase.co/storage/v1/photos/..."  // From upload response
}
```

## Completion Checklist

- [ ] All camera dependencies installed
- [ ] PhotoCapture component with consent
- [ ] Image compression service working
- [ ] Photo upload endpoint created
- [ ] Consent tracking implemented
- [ ] Photo history management working
- [ ] Retry logic with 3 attempts
- [ ] Profile photo display
- [ ] Photo gallery component
- [ ] Update photo from profile
- [ ] All test scenarios passing
- [ ] Performance requirements met