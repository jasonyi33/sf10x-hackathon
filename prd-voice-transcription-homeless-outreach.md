# Comprehensive Updated PRD: Voice Transcription App for SF Homeless Outreach
*Version 3.0 - Complete PRD with All Backend Implementation Updates*

## Introduction/Overview

This product is a mobile voice transcription application designed for San Francisco homeless street workers to efficiently document their interactions with individuals experiencing homelessness. The app allows workers to speak their observations, which are then transcribed and automatically categorized by an AI system into a structured database. Workers can also manually enter data without voice recording. This solution replaces the current time-consuming process of manual data entry after field rounds, saving hours of work daily while improving data quality and accessibility.

**Implementation Status**: Backend infrastructure (Task 1.0) and AI integration (Task 2.0) are complete. Individual management APIs are being implemented to support frontend development.

## Goals

1. Reduce documentation time from hours to minutes by enabling voice-based data entry
2. Create a searchable, structured database of individuals experiencing homelessness
3. Enable real-time access to individual histories during field interactions
4. Provide customizable data categories to meet varying team needs
5. Implement an automated danger assessment system for worker safety
6. Track all interactions with timestamp and location data

## User Stories

1. **As a street worker**, I want to speak my observations after meeting someone, so that I can quickly document the interaction without writing notes.

2. **As a street worker**, I want to manually enter data without recording, so that I can document interactions in noisy environments or when voice recording isn't appropriate.

3. **As a street worker**, I want to search for individuals I've previously met, so that I can review their history before approaching them.

4. **As a street worker**, I want to see a danger assessment score, so that I can take appropriate safety precautions.

5. **As a team lead**, I want to customize data categories before field rounds, so that we collect the specific information our program needs.

6. **As a street worker**, I want to edit AI-categorized information before saving, so that I can ensure accuracy.

7. **As a program coordinator**, I want to export all data to CSV, so that I can analyze trends and report to stakeholders.

## Current Implementation Status

### Backend (Dev 1) - Real Services
- ✅ **Whisper API**: Real implementation working
- ✅ **GPT-4o**: Real implementation working
- ✅ **Duplicate Detection**: Real LLM comparison implemented
- ✅ **All endpoints**: Returning real data

### Frontend (Dev 2) - Mocked for Demo
- ⚠️ **Whisper API**: Using mock transcription data
- ⚠️ **GPT-4o**: Using mock categorization data
- ⚠️ **Duplicate Detection**: Using mock confidence scores
- ✅ **Integration Ready**: All UI prepared for real API connection

### Frontend (Dev 2) - Fully Implemented
- ✅ **Audio Recording**: M4A format with proper codec
- ✅ **GPS Capture**: Location captured when recording starts
- ✅ **Audio Upload**: Complete Supabase Storage integration
- ✅ **Transcription Display**: Shows text for user review
- ✅ **Loading Indicators**: Clear visual feedback
- ✅ **Required Field Validation**: Highlights missing fields
- ✅ **Merge UI**: Field-by-field selection interface
- ✅ **Error Handling**: Recording failure recovery

## Functional Requirements

### 1. Voice Recording Interface
- 1.1 Display prominent start/stop recording buttons
- 1.2 Show visual feedback during recording:
    - Live duration counter: "0:45 / 2:00"
    - Red text color when > 1:30
    - Waveform or pulsing indicator
- 1.3 Display warning modal at 1:45 mark, auto-stop at 2:00 minutes
- 1.4 Minimum recording length: 10 seconds (show error toast if shorter)
- 1.5 Capture GPS location when recording starts
- 1.6 Allow location adjustment via map interface after recording
- 1.7 Allow playback of recorded audio before submission
- 1.8 Option to discard and re-record (creates new file, no stitching)
- 1.9 Audio format: M4A with AAC codec, 64kbps, ~1MB for 2 minutes

### 2. Manual Entry Interface
- 2.1 Display form with all active categories
- 2.2 Show appropriate input types (text field, number pad, dropdown, multi-select)
- 2.3 Capture current GPS location when form opens
- 2.4 Allow location adjustment via map interface
- 2.5 No AI processing - direct save to database
- 2.6 Validation rules before save:
    - Required fields (demo hardcoded): Height, Weight, Skin Color
    - Name: Required, non-empty
    - Number fields: Positive integers only, max 300
    - Single-select: Must be from predefined options IF a value is selected
    - Multi-select: Must be from predefined options IF any values are selected
    - All select fields are optional (can be left empty)
    - Date fields: Valid date format, not future dates
    - Text fields: Optional

### 3. AI Transcription & Categorization
- 3.1 Upload compressed audio to Supabase Storage
- 3.2 Transcribe voice recordings using OpenAI Whisper API
- 3.3 Display transcription text for user review
- 3.4 Use GPT-4o to extract and categorize information into predefined fields
- 3.5 Process entire transcription, then show all results at once (no streaming for MVP)
- 3.6 Show loading spinner during processing
- 3.7 Apply same validation as manual entry:
    - Ensure required fields are populated (Name, Height, Weight, Skin Color)
    - If required fields missing, highlight for user to fill manually
- 3.8 Delete audio file from storage after user confirms save - **NOT IMPLEMENTED FOR MVP**
- 3.9 If recording fails mid-session, show error and allow re-recording
- 3.10 Orphaned audio files auto-delete after 24 hours (Supabase Storage lifecycle policy)

### 4. Duplicate Detection & Merging
- 4.1 After categorization, before save, check for potential duplicates
- 4.2 LLM compares all available attributes (name, age, description, etc.) for similarity
- 4.3 Return match confidence score (0-100%)
- 4.4 If confidence ≥ 95%, show streamlined confirmation dialog
- 4.5 If confidence < 95%, show full merge UI with side-by-side comparison
- 4.6 User options: "Merge", "Create New", or "Cancel"
- 4.7 Merge policy: Frontend sends final merged data to backend
- 4.8 No multi-candidate merges for MVP (only show top match)
- 4.9 Store category definitions snapshot with each interaction - **SKIPPED FOR MVP**

### 5. Individual Profile Management
- 5.1 Display aggregated current data from all interactions
- 5.2 Interaction history list shows:
    - Date/time of interaction
    - Worker name who logged it
    - Abbreviated address (e.g., "Market St & 5th")
- 5.3 Click interaction to view details:
    - ALL fields that changed in that interaction
    - Full address of interaction location
    - Original transcription (if voice entry)
- 5.4 Display danger score with color coding:
    - Show danger_override if not null
    - Otherwise show calculated danger_score
    - Color based on displayed value
- 5.5 Show total interaction count
- 5.6 Display last interaction date prominently
- 5.7 Manual danger override: 
    - Slider (0-100) below danger score
    - Sets danger_override field
    - Persists until manually changed again
    - Show "Manual" indicator when override active

### 6. Search Functionality
- 6.1 Search individuals by name (partial match)
- 6.2 Search within all categorized JSONB data fields
- 6.3 Display results with: name, danger score, last seen date
- 6.4 Quick-access recent individuals - **REMOVED FOR MVP**
- 6.5 Server-side search with PostgreSQL JSONB queries
- 6.6 Target: <500ms response time for 2,000+ interactions

### 7. Category Customization
- 7.1 Add new categories with:
    - Name (required)
    - Type: text, number, single-select, multi-select, date, location
    - Priority: high, medium, low (for UI display only)
    - Danger weight: 0-100 (only available for number and single-select types)
    - Auto-trigger danger: yes/no (only for number and single-select)
    - Required field: yes/no (default no)
- 7.2 For select types:
    - Single-select: Input format "Label:danger_value" (e.g., "Low:0.2,Medium:0.5,High:0.8")
    - Multi-select: Comma-separated labels (no danger values)
- 7.3 Only numeric and single-select can affect danger score
- 7.4 Preset categories (cannot be deleted):
    - Name (text, required)
    - Gender (single-select: Male:0, Female:0, Other:0, Unknown:0)
    - Height (number, inches, max 300, required)
    - Weight (number, pounds, max 300, required)
    - Skin Color (single-select: Light:0, Medium:0, Dark:0, required)
    - Substance abuse history (multi-select: None, Mild, Moderate, Severe, In Recovery)
- 7.5 No edit/delete categories in MVP (create-only)

### 8. Danger Assessment
- 8.1 Calculate using weighted average formula:
    - For numeric fields: (value / 300) * weight
    - For single-select: stored danger_value * weight
    - Text, multi-select, date, location fields: ignored (cannot have weight)
    - Missing values treated as 0
    - Final score = (sum of weighted values / sum of weights) * 100
- 8.2 Display logic:
    - If danger_override is set: display danger_override
    - Otherwise: display calculated danger_score
    - Color based on displayed value:
      - 0-33: Green (#10B981)
      - 34-66: Yellow (#F59E0B)
      - 67-100: Red (#EF4444)
- 8.3 Auto-trigger categories immediately set score to 100
- 8.4 Manual override via slider (0-100), sets danger_override field
- 8.5 Recalculate only when danger-weighted fields change
- 8.6 Priority (high/medium/low) does NOT affect danger calculation

### 9. Location Tracking
- 9.1 Request location permission on first use
- 9.2 Capture coordinates when recording/manual entry starts
- 9.3 Display map with draggable pin for adjustment
- 9.4 Store as {"lat": number, "lng": number} in database
- 9.5 Show readable address (via Google Maps reverse geocoding - FRONTEND ONLY):
    - Frontend uses Google Maps API to convert coordinates to address
    - Frontend sends both coordinates AND address string to backend
    - Backend stores and returns the address as provided
    - In interaction history list: abbreviated (e.g., "Market St & 5th")
    - In interaction detail view: full address

### 10. Data Management
- 10.1 Two separate database tables:
    - `individuals`: Current aggregated state per person
    - `interactions`: Log of every interaction (stores only changes)
- 10.2 Export all individuals data as CSV:
    - All categories as columns
    - Include danger score
    - Include last interaction date
    - Multi-select values as comma-separated
- 10.3 Pre-populate demo data via SQL script:
    - 20 individuals with varied characteristics
    - 5 with manual danger overrides
    - 3 with auto-triggered danger scores (weapon_possession = 100)
    - Each individual has 1-10 interactions (randomized)
    - Custom categories added: housing_status, mental_health, weapon_possession
    - Danger scores distributed across all ranges (low/medium/high)

### 11. Authentication & User Management
- 11.1 Use Supabase Auth with email/password
- 11.2 Disable email confirmation for hackathon demo
- 11.3 Pre-create demo user account and hardcode credentials
- 11.4 Store minimal user data: email, full name
- 11.5 All users have equal permissions (no roles)
- 11.6 Show current user name in app header
- 11.7 Auto-login for demo:
    - Hardcode demo credentials in app
    - On app launch, automatically sign in with demo account
    - Skip login screen entirely
    - Go straight to main tab navigation
    - If auto-login fails, show error and retry

## Non-Goals (Out of Scope)

1. Face ID/facial recognition features (planned for future release)
2. Offline functionality
3. Multi-organization support
4. Role-based permissions
5. Integration with existing case management systems
6. Full HIPAA compliance (following best practices only)
7. Android support (iOS only for MVP)
8. Multi-language support
9. Advanced analytics or reporting beyond basic CSV export
10. Search by location/proximity
11. Edit/delete categories after creation
12. Edit historical interactions
13. User profile management
14. Password reset flow (use Supabase dashboard)

## Design Considerations

### Screen Structure (Tab Navigation)
1. **Record Tab** (camera icon) - Default after login
   - Voice recording interface
   - Manual entry button
2. **Search Tab** (magnifying glass)
   - Search bar
   - Search results
3. **Categories Tab** (settings icon)
   - List current categories
   - Add new category button
4. **Profile Tab** (person icon)
   - Current user info
   - Logout button

### UI Requirements
- Basic functional design with minimal polish
- Large touch targets (minimum 44x44 points)
- High contrast for outdoor visibility
- Simple navigation - no complex gestures
- Loading spinners for all async operations
- Toast notifications for success/error
- Color-coded danger scores always visible
- Modal for recording warning at 1:45

### Demo Flow
1. Worker opens app → Auto-login (saved credentials)
2. Records interaction → Views live transcription → Edits categories → Saves
3. Gets duplicate suggestion → Reviews and merges
4. Searches for individual → Views history → Danger score visible
5. Adds custom category → Uses in next interaction
6. Exports data to show comprehensive tracking

## Technical Architecture

### Backend (FastAPI) - **UPDATED**

**Base Infrastructure (Task 1.0) ✅ Complete**:
- FastAPI server running on port 8001
- Supabase integration (database, auth, storage)
- Simplified JWT authentication (no signature verification for hackathon)
- CORS configured to allow all origins
- Railway deployment ready

**AI Services (Task 2.0) ✅ Complete**:
- OpenAI Whisper transcription for M4A audio files
- GPT-4o categorization with dynamic prompts
- Danger score calculation service
- Duplicate detection with LLM confidence scoring
- Validation helper for required fields

**Individual Management (In Progress)**:
- CRUD operations for individuals
- Search with pagination
- Interaction history tracking
- Danger score override functionality

### Frontend (React Native Expo)
- Tab navigation with 4 screens
- Audio recording with M4A format
- Auto-login with demo credentials
- Real-time validation
- Google Maps integration for geocoding

### Database (Supabase PostgreSQL)
- Three main tables: individuals, interactions, categories
- JSONB for flexible data storage
- Indexed for performance

### Technology Stack
- **Frontend**: React Native Expo (iOS)
- **API Server**: FastAPI (Python)
- **Transcription**: OpenAI Whisper API
- **LLM**: OpenAI GPT-4o
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Maps**: Google Maps API
- **Audio Format**: M4A (AAC codec, 64kbps)
- **No offline support**: App requires constant internet connection

### Architecture Decision
Using dedicated FastAPI server instead of pure Supabase Edge Functions for:
- Better control over complex AI orchestration flow
- Easier debugging during hackathon
- Native Python support for AI/ML operations
- More reliable implementation
- No cold start delays

## API Endpoints - **UPDATED WITH IMPLEMENTATION DETAILS**

### Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### Currently Implemented Endpoints

#### GET /api/categories
**Purpose**: Fetch all categories for dynamic form generation and AI prompts
**Response**:
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "height",
      "type": "number",
      "is_required": true,
      "is_preset": true,
      "priority": "medium",
      "danger_weight": 0,
      "auto_trigger": false,
      "options": null
    }
  ]
}
```

#### POST /api/transcribe
**Purpose**: Transcribe audio and extract categorized data (read-only, does not save)
**Request**:
```json
{
  "audio_url": "https://...supabase.co/storage/v1/object/public/audio/...",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```
**Response**:
```json
{
  "transcription": "Met John near Market Street...",
  "categorized_data": {
    "name": "John",
    "height": 72,
    "weight": 180,
    "skin_color": "Light",
    "substance_abuse_history": ["Moderate"]
  },
  "missing_required": [],
  "potential_matches": [
    {
      "id": "uuid",
      "confidence": 89,
      "name": "John Doe"
    }
  ]
}
```
**Implementation Notes**:
- Only accepts M4A files from Supabase URLs
- Processing time: 3-5 seconds per audio file
- Returns all potential matches, frontend handles confidence thresholds
- Does NOT save data - frontend must call /api/individuals to persist

### Individual Management Endpoints (Being Implemented)

#### POST /api/individuals
**Purpose**: Save new individual or update existing (merge)
**Request**:
```json
{
  "data": {
    "name": "John Doe",
    "height": 72,
    "weight": 180,
    "skin_color": "Light"
    // ... all categorized fields
  },
  "merge_with_id": "uuid-of-existing",  // Optional: for merging
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "address": "123 Market Street, San Francisco, CA"  // Frontend provides this
  },
  "transcription": "original audio text",  // Optional: only for voice entries
  "audio_url": "https://..."  // Optional: reference to audio file
}
```
**Response**:
```json
{
  "individual": {
    "id": "uuid",
    "name": "John Doe",
    "danger_score": 45,
    "danger_override": null,
    "data": {...},
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T10:30:00Z"
  },
  "interaction": {
    "id": "uuid",
    "created_at": "2024-01-20T10:30:00Z"
  }
}
```
**Implementation Notes**:
- Validates all data using validation_helper
- Calculates danger score automatically
- Creates interaction record tracking only changed fields
- Audio files auto-delete after 24 hours via Supabase lifecycle (no manual deletion after save)
- Frontend handles all merge decisions (streamlined confirmation at ≥95%, full UI at <95%)
- Frontend sends final merged data with merge_with_id, backend just saves it

#### GET /api/individuals
**Purpose**: Search/list individuals with pagination
**Query Parameters**:
- `search`: Search term (searches name and all JSONB data fields)
- `limit`: Max results (default 20)
- `offset`: Pagination offset
- `sort_by`: "last_seen" | "danger_score" | "name" (default: "last_seen")
- `sort_order`: "asc" | "desc" (default: "desc")

**Response**:
```json
{
  "individuals": [
    {
      "id": "uuid",
      "name": "John Doe",
      "danger_score": 75,
      "danger_override": null,
      "last_seen": "2024-01-20T10:30:00Z",
      "last_location": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "address": "Market St & 5th"
      }
    }
  ],
  "total": 150,
  "offset": 0,
  "limit": 20
}
```

#### GET /api/individuals/{id}
**Purpose**: Get full individual profile with recent interactions
**Response**:
```json
{
  "individual": {
    "id": "uuid",
    "name": "John Doe",
    "danger_score": 75,
    "danger_override": null,
    "data": {
      // All current field values
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T10:30:00Z"
  },
  "recent_interactions": [
    {
      "id": "uuid",
      "created_at": "2024-01-20T10:30:00Z",
      "user_name": "Demo User",
      "location": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "address": "Market St & 5th"
      },
      "has_transcription": true
    }
  ]
}
```

#### PUT /api/individuals/{id}/danger-override
**Purpose**: Update manual danger score override
**Request**:
```json
{
  "danger_override": 85  // null to remove override
}
```

**Response**:
```json
{
  "danger_score": 75,
  "danger_override": 85,
  "display_score": 85  // What to show in UI
}
```

#### GET /api/individuals/{id}/interactions
**Purpose**: Get detailed interaction history
**Response**:
```json
{
  "interactions": [
    {
      "id": "uuid",
      "created_at": "2024-01-20T10:30:00Z",
      "user_name": "Demo User",
      "transcription": "Met John near Market...",  // If voice entry
      "location": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "address": "123 Market Street, San Francisco, CA"  // Full address
      },
      "changes": {
        "height": 72,
        "weight": 180
        // Only fields that changed in this interaction
      }
      // Note: categories_snapshot skipped for MVP
    }
  ]
}
```

### Future Endpoints (Task 5.0)

#### POST /api/categories
**Purpose**: Create new custom category
**Validation**: Returns 400 error if non-numeric/non-single-select types have danger_weight > 0
**Request**:
```json
{
  "name": "housing_status",
  "type": "single_select",
  "priority": "high",
  "danger_weight": 50,
  "auto_trigger": false,
  "is_required": false,
  "options": [
    {"label": "Housed", "value": 0},
    {"label": "Shelter", "value": 0.3},
    {"label": "Street", "value": 0.8},
    {"label": "Vehicle", "value": 0.5}
  ]
}
```
**Response**:
```json
{
  "id": "uuid",
  "name": "housing_status",
  "type": "single_select",
  "priority": "high",
  "danger_weight": 50,
  "auto_trigger": false,
  "is_required": false,
  "is_preset": false,
  "options": [...],
  "created_at": "2024-01-20T10:30:00Z"
}
```

#### GET /api/export
**Purpose**: Export all individuals to CSV (no filtering for MVP)
**Format**: Basic CSV with essential fields only
**Response**: File download with:
- Headers: name, height, weight, skin_color, danger_score, last_seen
- Multi-select values comma-separated (e.g., "Moderate, In Recovery")
- All individuals included (no filtering)
- Content-Type: text/csv
- Content-Disposition: attachment; filename="individuals_export.csv"

## Database Schema

```sql
-- Individuals table: Current state
CREATE TABLE individuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}', -- All categorized fields
  danger_score INTEGER DEFAULT 0,
  danger_override INTEGER, -- Manual override via slider (NULL if not set)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Interactions table: Historical log
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID REFERENCES individuals(id),
  user_id UUID REFERENCES auth.users(id),
  transcription TEXT, -- NULL for manual entries
  data JSONB NOT NULL DEFAULT '{}', -- Only changed fields
  location JSONB, -- {"lat": num, "lng": num}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Categories table: Dynamic fields
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'text','number','single_select','multi_select','date','location'
  options JSONB, -- ["option1", "option2"] for select types
  priority TEXT DEFAULT 'medium', -- 'high','medium','low' (UI display only)
  danger_weight INTEGER DEFAULT 0, -- 0-100
  auto_trigger BOOLEAN DEFAULT false,
  is_preset BOOLEAN DEFAULT false, -- Cannot be deleted
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_individuals_name ON individuals(name);
CREATE INDEX idx_individuals_data ON individuals USING GIN(data);
CREATE INDEX idx_interactions_individual ON interactions(individual_id);
CREATE INDEX idx_interactions_created ON interactions(created_at);
```

## Data Structure Examples

```json
// Individual data JSONB (current state):
{
  "name": "John Doe",
  "gender": "Male",
  "height": 72,
  "weight": 180,
  "skin_color": "Medium",
  "substance_abuse_history": ["Mild", "In Recovery"],
  "veteran_status": "Yes",
  "medical_conditions": ["Diabetes", "Hypertension"],
  "housing_priority": "High"
}

// Interaction data JSONB (only changes):
{
  "mood": "Anxious",
  "substance_abuse_update": "3 weeks clean",
  "new_medication": "Insulin",
  "housing_update": "Applied for shelter"
}

// Category options JSONB for single-select:
{
  "options": [
    {"label": "Low", "value": 0.2},
    {"label": "Medium", "value": 0.5},
    {"label": "High", "value": 0.8}
  ]
}

// Category options JSONB for multi-select:
{
  "options": ["None", "Mild", "Moderate", "Severe", "In Recovery"]
}

// Location JSONB:
{
  "lat": 37.7749,
  "lng": -122.4194
}
```

## Data Flow - **UPDATED**

### Voice Recording Flow
1. User records audio (10 sec - 2 min)
2. Audio uploaded to Supabase Storage as M4A
3. Frontend calls POST /api/transcribe with audio URL
4. Backend:
   - Downloads audio from Supabase
   - Transcribes using Whisper API
   - Categorizes using GPT-4o
   - Checks for duplicates
   - Returns results (does NOT save)
5. Frontend shows results for user review
6. User confirms/edits data
7. If confidence ≥ 95%: Frontend shows streamlined confirmation
8. If confidence < 95%: Frontend shows full merge UI
9. Frontend calls POST /api/individuals to save with merge_with_id if merging
10. Backend saves and audio auto-deletes after 24 hours

### Manual Entry Flow
1. User fills form with required fields
2. Frontend validates locally
3. Frontend captures location and gets address via Google Maps
4. Frontend calls POST /api/individuals
5. Backend validates and saves

### Search Flow
1. User types in search bar
2. Frontend calls GET /api/individuals with search param
3. Backend searches name and all JSONB fields
4. Backend returns paginated results
5. User taps individual
6. Frontend calls GET /api/individuals/{id}
7. Full profile displayed

## Implementation Details - **COMPREHENSIVE**

### Required Fields
Always required (hardcoded for MVP):
- Name (text, non-empty)
- Height (number, 0-300)
- Weight (number, 0-300)
- Skin Color (single-select: Light/Medium/Dark)

### Validation Rules
- Number fields: Must be integers 0-300
- Single-select: Must match predefined options
- Multi-select: All values must match options
- Text fields: Optional unless marked required
- Missing required fields block save

### Danger Score Calculation
**Formula Implementation**:
- Auto-trigger categories: If value exists AND auto_trigger=true → return 100
- Number fields: `(value / 300) * weight`
- Single-select: `option_value * weight`
- Final score: `(sum of weighted values / sum of weights) * 100`
- Only number and single-select types can have danger weights
- Text, multi-select, date, location types are ignored

**Display Logic**:
- Show `danger_override` if not null
- Otherwise show calculated `danger_score`
- Color coding:
  - Green (#10B981): 0-33
  - Yellow (#F59E0B): 34-66
  - Red (#EF4444): 67-100

### Duplicate Detection & Merging
**Smart Search Strategy**:
1. Exact name match first (uses index, fast)
2. Fuzzy name search if < 10 exact matches
3. Limit to 50 candidates total
4. LLM compares all attributes, returns confidence 0-100%

**Merge UI Behavior**:
- Confidence ≥ 95%: Show streamlined confirmation dialog ("High confidence match found. Merge with existing record?")
- Confidence < 95%: Show full merge UI with field-by-field selection
- User selects which value to keep for each field in full UI
- Frontend sends final merged data to backend with merge_with_id
- Backend updates the existing individual with provided data
- All interactions preserved in history

**What Gets Stored**:
- Individual record: Updated with merged data from frontend
- Interaction record: Only fields that changed
- Example: If only height changed from 72 to 73, interaction shows `{height: 73}`
- Note: categories_snapshot field skipped for MVP

### Audio Processing Flow
1. Record audio (Expo Audio API, M4A format)
2. Check minimum length (10 seconds)
3. Compress if needed (target: 64kbps, ~1MB)
4. Upload to Supabase Storage (returns public URL)
5. Send URL to FastAPI endpoint
6. FastAPI downloads from storage
7. Process with Whisper → GPT-4o
8. Return complete results as JSON
9. Audio files auto-delete after 24 hours (no manual deletion)

### Transcription Implementation
**Backend (FastAPI):**
```python
@app.post("/api/transcribe")
async def transcribe_interaction(
    request: TranscribeRequest,
    user_id: str = Depends(get_current_user)
):
    try:
        # Download audio from Supabase
        audio_data = await download_from_storage(request.audio_url)
        
        # Transcribe with Whisper
        transcription = await whisper_transcribe(audio_data)
        
        # Get active categories with required flags
        categories = await get_active_categories()
        
        # Categorize with GPT-4o
        categorized_data = await gpt_categorize(transcription, categories)
        
        # Check required fields
        required_fields = [cat for cat in categories if cat['is_required']]
        missing_required = []
        for field in required_fields:
            if not categorized_data.get(field['name']):
                missing_required.append(field['name'])
        
        # Check for duplicates
        potential_matches = await find_similar_individuals(categorized_data)
        
        return {
            "transcription": transcription,
            "categorized_data": categorized_data,
            "missing_required": missing_required,
            "potential_matches": potential_matches,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def validate_interaction_data(data: dict, categories: list) -> dict:
    """Validate data before saving"""
    errors = {}
    
    for category in categories:
        value = data.get(category['name'])
        
        # Check required fields
        if category['is_required'] and not value:
            errors[category['name']] = "This field is required"
            continue
            
        # Skip validation if field is empty and not required
        if not value and not category['is_required']:
            continue
            
        # Type-specific validation
        if category['type'] == 'number' and value is not None:
            if not isinstance(value, int) or value < 0 or value > 300:
                errors[category['name']] = "Must be 0-300"
        elif category['type'] == 'single_select' and value:
            valid_options = [opt['label'] for opt in category.get('options', [])]
            if value not in valid_options:
                errors[category['name']] = "Invalid selection"
        elif category['type'] == 'multi_select' and value:
            valid_options = category.get('options', [])
            for v in value:
                if v not in valid_options:
                    errors[category['name']] = "Invalid selection"
                    break
    
    return errors
```

**Frontend (React Native):**
```javascript
const transcribeAudio = async (audioUrl) => {
  try {
    setLoading(true);
    setStatus('Processing audio...');
    
    const response = await fetch(`${API_URL}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audio_url: audioUrl }),
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      setTranscription(data.transcription);
      setCategorizedData(data.categorized_data);
      
      // Highlight missing required fields
      if (data.missing_required.length > 0) {
        setMissingFields(data.missing_required);
        showToast('Please fill in required fields: ' + data.missing_required.join(', '));
      }
      
      // Handle potential duplicates
      if (data.potential_matches.length > 0) {
        const topMatch = data.potential_matches[0];
        if (topMatch.confidence >= 95) {
          setShowStreamlinedConfirm(true);
        } else if (topMatch.confidence > threshold) {
          setShowMergeUI(true);
        }
        setPotentialMatches(data.potential_matches);
      }
    }
  } catch (error) {
    showErrorToast('Failed to process audio');
  } finally {
    setLoading(false);
  }
};
```

### Authentication Flow
```javascript
// App.js - Setup Supabase client
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Demo credentials hardcoded
const DEMO_EMAIL = 'demo@sfgov.org';
const DEMO_PASSWORD = 'demo123456';

// AuthContext.js with automatic demo login
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Auto-login with demo account on launch
    autoLogin();
  }, []);
  
  const autoLogin = async () => {
    try {
      // First check if already logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
        setAuthToken(session.access_token);
      } else {
        // Auto sign in with demo credentials
        const { data, error } = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });
        
        if (error) {
          console.error('Auto-login failed:', error);
          // Retry once after delay
          setTimeout(() => autoLogin(), 2000);
        } else if (data.session) {
          setUser(data.session.user);
          setAuthToken(data.session.access_token);
        }
      }
    } catch (error) {
      console.error('Auto-login error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session) {
          setAuthToken(session.access_token);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, supabase }}>
      {children}
    </AuthContext.Provider>
  );
};

// App.js - Skip login screen entirely
const App = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <SplashScreen />; // Show loading while auto-logging in
  }
  
  // No login screen - go straight to app
  return (
    <NavigationContainer>
      {user ? (
        <TabNavigator defaultTab="record" />
      ) : (
        <ErrorScreen message="Unable to connect. Please check internet." />
      )}
    </NavigationContainer>
  );
};
```

### Audio Recording Configuration
```javascript
// Expo Audio recording settings
const recordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 64000, // 64kbps for ~1MB per 2 minutes
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 64000,
  },
};
```

### Search Implementation
```python
# FastAPI - Search in name and all JSONB data fields
@app.get("/api/individuals")
async def search_individuals(
    q: str = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("last_seen"),
    sort_order: str = Query("desc"),
    user_id: str = Depends(get_current_user)
):
    query = """
    SELECT i.*, 
           MAX(inter.created_at) as last_seen,
           inter.location as last_location
    FROM individuals i
    LEFT JOIN interactions inter ON i.id = inter.individual_id
    WHERE ($1::text IS NULL OR 
           i.name ILIKE '%' || $1 || '%' OR 
           i.data::text ILIKE '%' || $1 || '%')
    GROUP BY i.id, inter.location
    ORDER BY 
      CASE 
        WHEN $2 = 'last_seen' AND $3 = 'desc' THEN MAX(inter.created_at)
      END DESC NULLS LAST,
      CASE
        WHEN $2 = 'danger_score' AND $3 = 'desc' THEN 
          COALESCE(i.danger_override, i.danger_score)
      END DESC,
      CASE
        WHEN $2 = 'name' AND $3 = 'asc' THEN i.name
      END ASC
    LIMIT $4 OFFSET $5
    """
    
    results = await db.fetch_all(
        query, 
        [q, sort_by, sort_order, limit, offset]
    )
    
    # Get total count
    count_query = """
    SELECT COUNT(*) FROM individuals 
    WHERE ($1::text IS NULL OR 
           name ILIKE '%' || $1 || '%' OR 
           data::text ILIKE '%' || $1 || '%')
    """
    total = await db.fetch_val(count_query, [q])
    
    return {
        "individuals": results,
        "total": total,
        "offset": offset,
        "limit": limit
    }
```

### Danger Score Calculation Implementation
```python
def calculate_danger_score(individual_data: dict, categories: list) -> int:
    """Calculate danger score - only numeric and single-select fields"""
    
    # Check for auto-trigger first
    for category in categories:
        if category['auto_trigger'] and category['type'] in ['number', 'single_select']:
            value = individual_data.get(category['name'])
            if value is not None and value != 0 and value != "":
                return 100
    
    total_weight = 0
    weighted_sum = 0
    
    for category in categories:
        # Skip if no danger weight or not applicable type
        if category['danger_weight'] == 0:
            continue
        if category['type'] not in ['number', 'single_select']:
            continue
            
        value = individual_data.get(category['name'])
        if value is None:
            continue
            
        weight = category['danger_weight']
        total_weight += weight
        
        if category['type'] == 'number':
            # Normalize numeric values (max 300 for all fields)
            normalized = min(value / 300, 1.0)
            weighted_sum += normalized * weight
        elif category['type'] == 'single_select':
            # Find the danger value for selected option
            for option in category['options']:
                if option['label'] == value:
                    weighted_sum += option['value'] * weight
                    break
    
    if total_weight == 0:
        return 0
        
    return int((weighted_sum / total_weight) * 100)

def get_display_danger_score(individual: dict) -> int:
    """Get danger score to display (override or calculated)"""
    if individual.get('danger_override') is not None:
        return individual['danger_override']
    return individual['danger_score']
```

### LLM Prompts

**Categorization Prompt:**
```
Extract information from this transcription into these categories:
{list of categories with types and required flags}

Rules:
- For multi-select, return array of matching options
- For single-select, return one option from the available choices
- For numbers, extract digits only
- Always attempt to extract required fields: Name, Height, Weight, Skin Color
- Return null for missing non-required information
- Be conservative - only extract explicitly stated info
- For skin color, map descriptions to Light/Medium/Dark

Transcription: {transcription}

Return JSON only. Example:
{
  "name": "John Doe",
  "height": 72,
  "weight": 180,
  "skin_color": "Medium",
  "gender": null
}
```

**Duplicate Detection Prompt:**
```
Compare this new person with existing records using ALL available attributes:

New person data: {all categorized fields}
Existing records: {top 3 similar individuals with all their data}

Analyze similarity based on:
- Name (consider phonetic similarity)
- Physical attributes (height, weight, skin color)
- Conditions and history
- Any other matching details

Return:
- similarity_score: 0-100 (100 = definitely same person)
- matching_individual_id: ID of best match
- reason: Brief explanation of score
```

### Performance Requirements
- Audio transcription: < 10 seconds for 2-minute file
- Search response: < 500ms for 1000 individuals
- Save operation: < 1 second
- Duplicate detection: < 2 seconds
- CSV export: < 3 seconds for full database

### Performance Expectations
- Audio compression: <2 seconds
- Upload to storage: 1-3 seconds
- Whisper transcription: 2-5 seconds
- GPT-4o categorization: 1-3 seconds
- **Total processing: 6-13 seconds**
- Duplicate check: <1 second
- Search response: <500ms for 2,000+ records
- CSV export: <3 seconds for full database

### Cost Analysis
- Whisper API: ~$0.006 per minute of audio
- GPT-4o: ~$0.014 per categorization
- Total: ~$0.02 per voice interaction
- Monthly estimate (1000 interactions): ~$20

### Error Handling
- Network failures: Show "No internet connection" message, disable all features
- Partial categorization: Save what was processed with clear indication of missing fields
- Audio too short: Show "Recording must be at least 10 seconds" error
- Audio too long: Warning at 1:45, auto-stop at 2:00
- Location permission denied: Allow manual location entry via map
- API failures: User-friendly messages with retry button
- No offline mode: App shows "Internet connection required" if network lost
- Invalid audio format: "Please use M4A format" error
- Duplicate API calls: Implement request debouncing
- Session timeout: Auto-refresh token or prompt re-login

## Security & Privacy - **UPDATED**

### Authentication
- Demo credentials: demo@sfgov.org / demo123456
- JWT tokens (simplified validation for hackathon)
- All endpoints require authentication
- Session persistence with auto-refresh

### Data Protection
- Audio files auto-delete after 24 hours
- No PII in logs
- HTTPS only in production
- Encrypted database connections

### Hackathon Simplifications
- No email verification
- No rate limiting
- CORS allows all origins
- No signature verification on JWTs
- Single demo account for all users
- No password reset flow

### API Security (Minimal for Hackathon)
```python
# FastAPI - Simple JWT validation
async def get_current_user(authorization: str = Header()):
    try:
        token = authorization.replace('Bearer ', '')
        # For hackathon, just decode without full verification
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload['sub']  # User ID
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
```

## Testing Strategy - **COMPREHENSIVE**

### Backend Testing
- Unit tests for each service (validation, danger calculation)
- Integration tests for complete flows
- Performance tests with real audio files
- Load tests for search functionality

### Frontend Testing
- Component tests for critical UI elements
- Integration tests for complete user flows
- Manual testing on real devices
- Accessibility testing

### Key Test Scenarios
1. Transcribe audio → Save individual → Search → View profile
2. Create duplicate → Streamlined merge confirmation at ≥95% confidence
3. Manual entry with validation errors
4. Danger score override persistence
5. CSV export with 100+ individuals
6. Search across multiple fields
7. Audio recording limits (10 sec min, 2 min max)
8. Location capture and adjustment
9. Category creation and usage
10. Session timeout and refresh

### Integration Test Example
```python
async def test_complete_voice_flow():
    # 1. Upload audio
    audio_url = await upload_test_audio()
    
    # 2. Transcribe
    transcribe_response = await client.post("/api/transcribe", 
        json={"audio_url": audio_url})
    assert transcribe_response.status_code == 200
    data = transcribe_response.json()
    
    # 3. Save individual
    save_response = await client.post("/api/individuals",
        json={
            "data": data["categorized_data"],
            "location": {"lat": 37.7749, "lng": -122.4194},
            "transcription": data["transcription"]
        })
    assert save_response.status_code == 200
    
    # 4. Search
    search_response = await client.get("/api/individuals?search=John")
    assert len(search_response.json()["individuals"]) > 0
    
    # 5. Verify audio deleted after 24 hours
    # (mock time or use lifecycle policy)
```

## Deployment - **UPDATED**

### Backend (Railway)
- Automatic deployment from main branch
- Environment variables configured in Railway dashboard:
  - SUPABASE_URL
  - SUPABASE_KEY
  - OPENAI_API_KEY
  - JWT_SECRET (simplified for hackathon)
- Health check endpoint: GET /health
- Logs available in Railway UI
- Custom domain configuration
- Auto-scaling disabled for hackathon

### Frontend (Expo)
- Development: expo start
- Production: EAS Build
- iOS deployment via TestFlight
- Environment variables in .env files

### Database (Supabase)
- Migrations in supabase/migrations/
- RLS policies disabled for hackathon
- Connection pooling enabled
- Automatic backups every 24 hours
- Storage lifecycle policies configured

## Known Limitations (Hackathon MVP)

1. No offline support - requires internet
2. Categories can only be created, not edited/deleted
3. No user management beyond demo account
4. Audio files must be M4A format
5. No real reverse geocoding (shows coordinates) - FRONTEND DOES GEOCODING
6. English-only transcription
7. 2-minute audio limit
8. No manual audio deletion after save (relies on 24-hour auto-delete)
9. No categories_snapshot stored with interactions
10. No recent individuals tracking feature
11. Single organization support only
12. No audit trail for changes
13. Limited error recovery options
14. No data encryption at rest

## Future Enhancements (Post-Hackathon)

1. Offline mode with sync
2. Multiple language support
3. Real reverse geocoding in backend
4. Category management (edit/delete)
5. User roles and permissions
6. Advanced search filters
7. Analytics dashboard
8. Batch operations
9. Face recognition integration
10. HIPAA compliance
11. Android support
12. Integration with case management systems
13. Historical trend analysis
14. Automated alerts for high-risk individuals
15. Team collaboration features

## Implementation Notes

### 1. Development Order (36 hours)
**Hours 0-6: Foundation**
- Set up Expo + FastAPI + Supabase
- Implement Supabase Auth
- Create database schema
- Basic tab navigation

**Hours 6-12: Core Recording**
- Audio recording with 2-minute limit
- Upload to Supabase Storage
- Basic transcription endpoint
- Manual entry form

**Hours 12-18: AI Integration**
- Whisper integration
- GPT-4o categorization
- Loading states and progress indicators
- Duplicate detection with similarity scoring

**Hours 18-24: Data Management**
- Individual profiles
- Search functionality
- Interaction history
- Danger scoring

**Hours 24-30: Polish**
- Category customization
- Location adjustment
- Export to CSV
- UI improvements

**Hours 30-36: Demo Prep**
- Seed demo data
- Fix critical bugs
- Practice demo flow
- Backup audio files

### 2. Demo Data Setup
Create SQL script with:
- 10 individuals with varied danger scores (0-100)
- 3 pairs of similar names for merge demo
- 20 interactions across 5 workers
- Custom categories: "Veteran Status", "Medical Conditions", "Housing Priority"
- Realistic but fictional names and data

Example individuals:
- "John Doe" (danger: 75)
- "Sarah Smith" (danger: 20, override: 40)
- "Robert Johnson" (danger: 90)

### 3. Hackathon Shortcuts
- Skip email verification
- Pre-save demo login credentials
- Use * CORS for FastAPI
- Simple error toasts (no detailed handling)
- No loading skeletons (just spinners)
- Pre-compressed demo audio files as backup
- Hardcoded category priorities for presets

### 4. Critical Features Checklist
- [ ] Voice recording with timer
- [ ] Live transcription display
- [ ] Required field validation (Name, Height, Weight, Skin Color)
- [ ] Category value editing
- [ ] Duplicate merge flow
- [ ] Danger score calculation
- [ ] Search functionality
- [ ] Export to CSV
- [ ] Location capture
- [ ] Auto-login with demo account

### 5. Common Pitfalls to Avoid
- Don't use search commands like `find` - use proper search endpoints
- Always validate required fields before save
- Ensure M4A audio format
- Test on real device (not just simulator)
- Handle network failures gracefully
- Don't delete individuals - only add interactions
- Index database fields for performance
- Test with 100+ records for performance

## Developer Notes

### Backend Development (Dev 1)
- Always validate with validation_helper.py
- Use danger_calculator.py for scores
- Audio files auto-delete after 24 hours (no manual deletion)
- Never modify individuals directly, only add interactions
- **Important**: Implement all endpoints even if frontend isn't fully integrated
- Backend should be complete and tested independently of frontend readiness
- Use existing Supabase client for all database operations
- Implement proper error handling with meaningful messages
- Add logging for debugging but no PII in logs

### Frontend Integration
- Call /api/transcribe first (read-only)
- Show results for user confirmation
- Call /api/individuals to save
- Handle streamlined confirmation for ≥ 95% confidence
- Show full merge UI for < 95% confidence
- Always send location with address from Google Maps
- Implement proper loading states
- Handle session expiry gracefully

### Common Issues
- Audio URL must be from Supabase
- All required fields must be present
- Danger scores are integers 0-100
- Timestamps are UTC ISO format
- Search includes all JSONB fields
- Merge sends complete data with merge_with_id
- Categories snapshot not implemented for MVP

## Open Questions - None

All questions have been resolved:
- ✓ Using Supabase Auth with session persistence
- ✓ Location stored as lat/lng JSON with frontend-provided addresses
- ✓ Interactions store only changes (no category snapshot for MVP)
- ✓ Multi-select as arrays (no danger scoring)
- ✓ Manual entry without AI with validation rules
- ✓ No edit/delete categories
- ✓ Basic CSV export of all data
- ✓ Audio format: M4A with AAC codec at 64kbps
- ✓ Search all JSONB data fields
- ✓ Danger calculation: only numeric (max 300) and single-select
- ✓ Manual danger override with slider and display logic
- ✓ No offline support
- ✓ Recording shows live duration counter
- ✓ Frontend handles all merge decisions
- ✓ 24-hour audio deletion only
- ✓ No recent individuals tracking
