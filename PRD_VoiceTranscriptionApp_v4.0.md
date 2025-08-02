Comprehensive Updated PRD: Voice Transcription App for SF Homeless Outreach
Version 4.0 - Enhanced with Photo Identification and Advanced Search
Introduction/Overview
This product is a mobile voice transcription application designed for San Francisco homeless street workers to efficiently document their interactions with individuals experiencing homelessness. The app allows workers to speak their observations, which are then transcribed and automatically categorized by an AI system into a structured database. Workers can also manually enter data without voice recording and optionally capture photos for visual identification (with consent). This solution replaces the current time-consuming process of manual data entry after field rounds, saving hours of work daily while improving data quality, accessibility, and individual identification accuracy.
Key Enhancement: The app now includes optional photo capture with consent tracking, advanced search filters, and enhanced data protection warnings to ensure compliance with San Francisco privacy regulations.
Goals

Reduce documentation time from hours to minutes by enabling voice-based data entry
Create a searchable, structured database of individuals experiencing homelessness with optional photo identification
Enable real-time access to individual histories during field interactions
Provide customizable data categories to meet varying team needs while ensuring legal compliance
Implement an automated danger assessment system for worker safety
Track all interactions with timestamp and location data
Enable visual identification through consented photo capture
Provide advanced search and filtering capabilities for quick individual location

User Stories

As a street worker, I want to speak my observations after meeting someone, so that I can quickly document the interaction without writing notes.
As a street worker, I want to manually enter data without recording, so that I can document interactions in noisy environments or when voice recording isn't appropriate.
As a street worker, I want to capture a photo with consent, so that I can visually identify individuals in future encounters.
As a street worker, I want to search for individuals with filters, so that I can quickly find someone based on their characteristics.
As a street worker, I want to see danger assessment scores and photos on profiles, so that I can take appropriate safety precautions and confirm identity.
As a team lead, I want to customize data categories with legal guidance, so that we collect appropriate information without violating privacy laws.
As a street worker, I want to edit AI-categorized information and add/update photos before saving, so that I can ensure accuracy.
As a program coordinator, I want to export all data including photo URLs to CSV, so that I can analyze trends and report to stakeholders.
As a street worker, I want to see photo history, so that I can track changes in an individual's appearance over time.

Current Implementation Status
Backend (Dev 1) - Enhanced Services

✅ Whisper API: Real implementation working
✅ GPT-4o: Real implementation working with age extraction
✅ Duplicate Detection: Real LLM comparison implemented
🆕 Photo Storage: Supabase Storage integration for photos
🆕 Consent Tracking: Audit trail for photo consent
🆕 Advanced Search: Filter-based search with dynamic options

Frontend (Dev 2) - Enhanced UI

✅ Audio Recording: M4A format with proper codec
✅ GPS Capture: Location captured when recording starts
🆕 Photo Capture: Camera integration with consent flow
🆕 Combined Edit Screen: Attributes + photo upload
🆕 Filter UI: Collapsible filter section with tags
🆕 Photo History: View last 3 photos per individual

Functional Requirements
1. Voice Recording Interface

1.1 Display prominent start/stop recording buttons
1.2 Show visual feedback during recording:

Live duration counter: "0:45 / 2:00"
Red text color when > 1:30
Waveform or pulsing indicator


1.3 Display warning modal at 1:45 mark, auto-stop at 2:00 minutes
1.4 Minimum recording length: 10 seconds (show error toast if shorter)
1.5 Capture GPS location when recording starts
1.6 Allow location adjustment via map interface after recording
1.7 Allow playback of recorded audio before submission
1.8 Option to discard and re-record (creates new file, no stitching)
1.9 Audio format: M4A with AAC codec, 64kbps, ~1MB for 2 minutes

2. Manual Entry Interface

2.1 Display form with all active categories
2.2 Show appropriate input types:

Text field, number pad, dropdown, multi-select
🆕 Age range slider with two handles


2.3 Capture current GPS location when form opens
2.4 Allow location adjustment via map interface
2.5 🆕 Photo upload option on same screen with consent checkbox
2.6 No AI processing for manual entry - direct save to database
2.7 Validation rules before save:

Required fields: Name, Height, Weight, Skin Color, 🆕 Approximate Age
Name: Required, non-empty
Number fields: Positive integers only, max 300
🆕 Age: Valid range (min < max, 0-120 bounds) or [-1, -1] for Unknown
Photo: If uploaded, consent must be checked
All other fields remain optional



3. AI Transcription & Categorization

3.1 Upload compressed audio to Supabase Storage
3.2 Transcribe voice recordings using OpenAI Whisper API
3.3 Display transcription text for user review
3.4 Use GPT-4o to extract and categorize information:

🆕 Always attempt to extract approximate age range as [min, max] array
Default to [-1, -1] if age cannot be determined


3.5 🆕 New Flow: After transcription, show combined edit screen with:

All categorized fields for editing
Photo upload option with consent
Save button (disabled until validation passes)


3.6 Apply validation including new required age field
3.7 Show loading spinner during processing
3.8 Delete audio file from storage after 24 hours (automatic)
3.9 If recording fails mid-session, show error and allow re-recording

4. Photo Capture & Management

4.1 🆕 Photo Upload Interface:

Camera button to capture photo
Option to retake if not satisfied
Automatic format conversion (HEIC → JPEG on iOS)
Max file size: 5MB (auto-compress if larger)


4.2 🆕 Consent Requirement:

Checkbox: "Verbal consent has been received to use facial photos for identification purposes within the SF Street Team system only"
Cannot save with photo unless checked
If unchecked after upload, photo is automatically discarded


4.3 🆕 Photo Storage:

Upload to Supabase Storage bucket photos/{user_id}/{timestamp}.jpg
Store URL in database individuals.photo_url
Keep last 3 photos in photo_history JSONB array (current photo moves to history when replaced)


4.4 🆕 Consent Tracking:

Store: WHO obtained consent (user_id)
WHEN consent was obtained (timestamp)
WHERE consent was obtained (GPS location)


4.5 🆕 Photo Display:

Show on individual profile (full size)
NOT shown in search results (text only)
Photo history accessible via "Photo History" button


4.6 🆕 Photo Updates:

Can update photo from profile screen
Requires new consent each time
Does NOT create new interaction record
Previous photo automatically moves to history



5. Duplicate Detection & Merging

5.1 After save attempt, check for potential duplicates
5.2 LLM compares all attributes including 🆕 age ranges
5.3 Return match confidence score (0-100%)
5.4 If confidence ≥ 95%, show streamlined confirmation dialog
5.5 If confidence < 95% but ≥ 60%, show full merge UI
5.6 If confidence < 60%, create new individual (too low to suggest)
5.7 🆕 Photo Merge Logic:

If both have photos: keep newer one
If one has photo: keep that photo
Show photo in merge UI for visual confirmation


5.8 User options: "Merge", "Create New", or "Cancel"
5.9 Frontend sends final merged data to backend

6. Individual Profile Management

6.1 Display aggregated current data from all interactions
6.2 🆕 Show current photo prominently if available
6.3 🆕 Photo History button shows last 3 photos with timestamps

Can select older photo to make current
Shows date taken for each photo


6.4 Interaction history list shows:

Date/time of interaction
Worker name who logged it
Abbreviated address


6.5 Display danger score with color coding
6.6 Manual danger override slider
6.7 🆕 Update Photo button with consent flow

7. Search Functionality

7.1 Search individuals by name (partial match)
7.2 Search within all categorized JSONB data fields
7.3 🆕 Live Search Dropdown:

Shows as user types (300ms debounce)
Text-only previews (no photos)
Displays: Name, Age (e.g. "45-50"), Height, Skin Color, Danger Score
Maximum 10 results shown
Clicking result navigates to profile


7.4 🆕 Advanced Filters (collapsible section):

Gender (checkboxes for multiple selection)
Approximate Age (dual range slider with overlap matching)
Height Range (min/max inputs)
Danger Score Range (0-100 slider)
Last Seen (date range picker)
Has Photo (yes/no toggle)


7.5 🆕 Filter Behavior:

Live filtering (instant apply)
AND logic for multiple filters
Show active filters as removable tags
Dynamically populate options from existing data


7.6 🆕 Sort Options:

Danger Score (default, high to low)
Last Seen (most recent first)
Name (A-Z alphabetical)
Distance from current location (if available)


7.7 Target: <500ms response time with filters

8. Category Customization

8.1 🆕 Legal Compliance Warning (prominent display):
⚠️ Data Protection Notice: Do not create categories for:
• Medical diagnoses or health conditions
• Criminal history or legal status
• Immigration or citizenship status
• Specific racial/ethnic identification
• Mental health diagnoses
• Social Security Numbers or government IDs
• Financial information

✓ Acceptable categories include:
• Physical descriptions (height, build, clothing)
• Observable behaviors
• Current situation (location, expressed needs)
• Information voluntarily shared
• General appearance descriptors

8.2 Add new categories with standard options
8.3 🆕 Preset categories (cannot be deleted):

Name (text, required)
Approximate Age (range, required) 🆕
Gender (single-select)
Height (number, required)
Weight (number, required)
Skin Color (single-select, required)
Substance abuse history (multi-select)


8.4 No edit/delete categories in MVP

9. Danger Assessment

9.1 Calculate using weighted average formula (unchanged)
9.2 Display logic with color coding
9.3 Auto-trigger categories immediately set score to 100
9.4 Manual override via slider
9.5 🆕 Age does NOT affect danger score (descriptive only)

10. Location Tracking

10.1 Request location permission on first use
10.2 Capture coordinates when recording/manual entry starts
10.3 Display map with draggable pin for adjustment
10.4 Store as {"lat": number, "lng": number} in database
10.5 Show readable address via Google Maps
10.6 🆕 Use last known location for distance-based sorting

11. Data Management

11.1 Two separate database tables (unchanged)
11.2 🆕 Enhanced CSV Export:

All categories as columns
Include current photo URL only (not history)
Age ranges exported as "45-50" format
Consent tracking data (who/when for current photo)


11.3 🆕 Migration for existing data:

Set approximate_age to [-1, -1] for all existing individuals
Photo fields default to null



12. Authentication & User Management

12.1 Use Supabase Auth with email/password
12.2 🆕 Onboarding Screen on first login:

Display legal compliance warning
Explain photo consent requirements
User must acknowledge before proceeding


12.3 Auto-login with demo credentials after onboarding
12.4 All authenticated users can view photos

Non-Goals (Out of Scope)

Facial recognition or automatic face matching
Offline functionality
Multi-organization support
Role-based permissions for photo access
Integration with existing case management systems
Full HIPAA compliance (following SF privacy regulations only)
Android support (iOS only for MVP)
Multi-language support
Photo editing or annotation features
Bulk photo upload
Video recording
Automated age detection from photos

Design Considerations
Screen Structure (Tab Navigation)

Record Tab (camera icon) - Default after login

Voice recording interface
Manual entry button


Search Tab (magnifying glass)

Search bar with dropdown results
Collapsible filter section
Search results grid


Categories Tab (settings icon)

Legal compliance warning at top
List current categories
Add new category button


Profile Tab (person icon)

Current user info
Logout button



UI Requirements

Large touch targets for field work (minimum 44x44 points)
High contrast for outdoor visibility
Photo consent checkbox prominently displayed
Loading spinners for all async operations
Toast notifications for success/error
Collapsible sections for complex UI (filters)
Clear visual hierarchy for required fields
Age range slider with numeric indicators

Photo UI Specifications

Camera button: 60x60 points, centered
Consent checkbox: Full width, large text
Photo preview: Square aspect ratio, 200x200 points
Retake button overlay on preview
Photo history: Horizontal scrollable bar with 4 thumbnails (current + 3 history)
Compression indicator during upload

Technical Architecture
Backend (FastAPI) - Enhanced
Core Services:

FastAPI server with photo handling endpoints
Supabase integration for photos + database
Photo compression and format conversion
Consent tracking service
Advanced search with filter query builder

New Endpoints:

POST /api/photos/upload - Handle photo upload with consent
GET /api/photos/{individual_id}/history - Get photo history
PUT /api/individuals/{id}/photo - Update current photo
GET /api/search/filters - Get dynamic filter options

Frontend (React Native Expo)

Camera integration for photo capture
Image compression before upload
HEIC to JPEG converter for iOS
Range slider component for age
Collapsible filter component
Photo history gallery view

Database (Supabase PostgreSQL)
sql-- Updated individuals table
CREATE TABLE individuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  danger_score INTEGER DEFAULT 0,
  danger_override INTEGER,
  photo_url TEXT, -- Current photo URL
  photo_history JSONB DEFAULT '[]', -- Array of last 3 photos with timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- New consent tracking table
CREATE TABLE photo_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID REFERENCES individuals(id),
  photo_url TEXT NOT NULL,
  consented_by UUID REFERENCES auth.users(id),
  consented_at TIMESTAMP DEFAULT NOW(),
  consent_location JSONB, -- {"lat": num, "lng": num}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Updated categories with age preset
INSERT INTO categories (name, type, is_required, is_preset, priority) VALUES
('approximate_age', 'range', true, true, 'high');

-- Indexes for performance
CREATE INDEX idx_individuals_age ON individuals((data->>'approximate_age'));
CREATE INDEX idx_photo_consents ON photo_consents(individual_id, consented_at);
Technology Stack (Updated)

Photo Handling:

React Native Image Picker
Image compression library
HEIC to JPEG converter


UI Components:

@react-native-community/slider for age selection
Collapsible sections
Tag input for filters


Storage:

Supabase Storage for photos (in addition to audio)
No lifecycle rules for photos (keep indefinitely)



API Endpoints - Updated
Photo Management Endpoints
POST /api/photos/upload
Purpose: Upload photo with consent tracking
Request: multipart/form-data with:

photo: File (JPEG/PNG, max 5MB)
individual_id: string
consent_location: JSON string

Response:
json{
  "photo_url": "https://...supabase.co/storage/v1/object/public/photos/...",
  "consent_id": "uuid",
  "compressed": true,
  "original_size": 8500000,
  "final_size": 2100000
}
GET /api/search/filters
Purpose: Get dynamic filter options from existing data
Response:
json{
  "filters": {
    "gender": ["Male", "Female", "Other", "Unknown"],
    "age_range": {"min": 18, "max": 85},
    "height_range": {"min": 48, "max": 84},
    "has_photo": [true, false],
    "danger_score_range": {"min": 0, "max": 100}
  }
}
Updated Existing Endpoints
POST /api/transcribe (Updated)
Response now includes:
json{
  "transcription": "...",
  "categorized_data": {
    "name": "John",
    "approximate_age": [45, 50], // 🆕 Always array format
    "height": 72,
    // ... other fields
  },
  "missing_required": ["approximate_age"], // If AI couldn't determine
  "potential_matches": [...]
}
POST /api/individuals (Updated)
Request now includes:
json{
  "data": {
    "name": "John Doe",
    "approximate_age": [45, 50], // 🆕 Required, [-1, -1] for Unknown
    // ... other fields
  },
  "photo_url": "https://...", // 🆕 Optional, from photo upload
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "address": "123 Market Street, San Francisco, CA"
  },
  // ... rest unchanged
}
GET /api/individuals (Updated)
Query Parameters (🆕 additions):

gender: Filter by gender (comma-separated for OR within gender)
age_min, age_max: Filter by age range overlap
has_photo: true/false
danger_min, danger_max: Filter by danger score range

Data Flow - Updated
Voice Recording Flow with Photo

User records audio (10 sec - 2 min)
Audio uploaded to Supabase Storage
Frontend calls POST /api/transcribe
🆕 Combined Edit Screen:

Shows transcription results
All fields editable (age shows as range or "Unknown")
Photo upload section with camera button
Consent checkbox (required if photo taken)


User reviews, edits, optionally adds photo
If photo added:

Upload photo first via POST /api/photos/upload
Get photo_url from response


Frontend validates all required fields
Frontend calls POST /api/individuals with all data including photo_url
Backend checks for duplicates
Show appropriate merge UI based on confidence
Save individual with photo URL and consent record

Search Flow with Filters

User types in search bar
🆕 After 300ms debounce, dropdown shows text-only previews
🆕 User can expand filters section
🆕 Select filters (gender, age range, etc.)
🆕 Active filters show as removable tags
Results update live with AND logic
Click result to view profile with photo

Implementation Notes
Required Field Updates
Always required (including for AI):

Name
Height
Weight
Skin Color
🆕 Approximate Age (range format: [min, max] or [-1, -1])

Age Format Specification
typescript// Age is ALWAYS stored as array [min, max]
// Special value [-1, -1] represents "Unknown"
// Display formatting:
// [45, 50] → "45-50"
// [-1, -1] → "Unknown"
Photo Specifications

Max size: 5MB (auto-compress larger files)
Formats: JPEG, PNG (convert HEIC automatically)
Storage: Keep current photo + last 3 in history
Upload format: multipart/form-data (not base64)
No thumbnails (load full images on demand)
Consent required for each photo/update

Search Performance

Age range queries use overlap logic: NOT (age_max < filter_min OR age_min > filter_max)
Indexes on all filterable fields
Filter options cached for 1 hour with manual refresh
Max 20 results returned with pagination
No deep pagination (offset > 100)

Legal Compliance

Warning shown during onboarding (once per user)
Warning shown in categories section (always visible)
Photo consent tracked with full audit trail
Comply with SF privacy regulations for vulnerable populations
No medical/criminal/immigration categories allowed

Migration Steps

Add new database columns
Update all existing individuals: approximate_age = [-1, -1]
Deploy backend with new endpoints
Deploy frontend with new features
All new interactions require age

Security & Privacy - Enhanced
Photo Privacy

Photos only accessible to authenticated SF Street Team users
Full consent audit trail maintained (who, when, where)
Photos not included in search previews
Device info logged for accountability
Photos stored indefinitely (no auto-deletion)

Data Protection

Legal warning prevents sensitive categories
Photo storage separate from PHI
No facial recognition performed
Manual consent required per photo
Clear data retention policies

Testing Strategy - Updated
New Test Scenarios

Photo upload with consent flow
Photo history navigation (current + 3)
Age range filter overlaps
Search with multiple filters (AND logic)
HEIC to JPEG conversion on iOS
Photo compression for >5MB files
Consent tracking accuracy
Filter performance with 1000+ individuals
Migration of existing data to include age = [-1, -1]
Legal warning acknowledgment flow

Critical Photo Tests

Upload without consent (should fail)
Update photo with new consent
View photo history and select old photo
Merge individuals with different photos
Large photo compression (10MB → <5MB)
Network failure during photo upload (retry 3 times)

Deployment Considerations
Storage Configuration

Create photos bucket in Supabase Storage
Set public access for photos (auth still required)
Configure CORS for camera access
Set max file size limits (5MB)

Database Migrations
sql-- Run in order:
-- 1. Add photo columns
ALTER TABLE individuals 
ADD COLUMN photo_url TEXT,
ADD COLUMN photo_history JSONB DEFAULT '[]';

-- 2. Create consent table
CREATE TABLE photo_consents (...);

-- 3. Add age to categories and set existing to [-1, -1]
INSERT INTO categories (name, type, is_required, is_preset...)
VALUES ('approximate_age', 'range', true, true...);

UPDATE individuals 
SET data = jsonb_set(data, '{approximate_age}', '[-1, -1]'::jsonb);
Known Limitations (Updated)

No facial recognition (manual matching only)
No offline photo sync
Single photo at a time (no bulk upload)
English-only consent forms
5MB photo limit
Basic photo compression only
No photo editing/annotation
Age ranges only (no exact age)
Filters limited to existing data values
No photo export in bulk (only current photo URL in CSV)

Future Enhancements (Post-MVP)

Facial recognition for automatic matching
Offline photo queue with sync
Photo annotation tools
Multi-language consent forms
Advanced photo compression options
Bulk photo management
Age detection from photos (with consent)
Custom filter saving
Photo-based search ("find similar looking")
Integration with city services for photo sharing

Success Metrics

Photo consent rate > 60%
Search with filters < 500ms
Successful photo uploads > 95%
Age field completion rate > 90%
Filter usage rate > 40%
Photo-assisted positive IDs > 70%
Consent audit trail 100% complete