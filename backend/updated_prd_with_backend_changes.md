# Updated PRD: Voice Transcription App for SF Homeless Outreach
*Version 2.0 - With Backend Implementation Updates*

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

### Database (Supabase PostgreSQL)
- Three main tables: individuals, interactions, categories
- JSONB for flexible data storage
- Indexed for performance

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
      "transcription": "Met John near Market...",
      "location": {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "address": "123 Market Street, San Francisco, CA"
      },
      "changes": {
        "height": 72,
        "weight": 180
      },
      // Note: categories_snapshot skipped for MVP
    }
  ]
}
```

### Future Endpoints (Task 5.0)

#### POST /api/categories
**Purpose**: Create new custom category

#### GET /api/export
**Purpose**: Export all individuals to CSV

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
7. Frontend calls POST /api/individuals to save
8. Backend saves and deletes audio file

### Manual Entry Flow
1. User fills form with required fields
2. Frontend validates locally
3. Frontend calls POST /api/individuals
4. Backend validates and saves

### Search Flow
1. User types in search bar
2. Frontend calls GET /api/individuals with search param
3. Backend returns paginated results
4. User taps individual
5. Frontend calls GET /api/individuals/{id}
6. Full profile displayed

## Implementation Details - **NEW SECTION**

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

### Performance Requirements
- Audio transcription: < 10 seconds for 2-minute file
- Search response: < 500ms for 1000 individuals
- Save operation: < 1 second

### Cost Analysis
- Whisper API: ~$0.006 per minute of audio
- GPT-4o: ~$0.014 per categorization
- Total: ~$0.02 per voice interaction

## Security & Privacy - **UPDATED**

### Authentication
- Demo credentials: demo@sfgov.org / demo123456
- JWT tokens (simplified validation for hackathon)
- All endpoints require authentication

### Data Protection
- Audio files auto-delete after 24 hours
- No PII in logs
- HTTPS only in production

### Hackathon Simplifications
- No email verification
- No rate limiting
- CORS allows all origins
- No signature verification on JWTs

## Testing Strategy - **NEW SECTION**

### Backend Testing
- Unit tests for each service (validation, danger calculation)
- Integration tests for complete flows
- Performance tests with real audio files

### Key Test Scenarios
1. Transcribe audio → Save individual → Search → View profile
2. Create duplicate → Streamlined merge confirmation at ≥95% confidence
3. Manual entry with validation errors
4. Danger score override persistence
5. CSV export with 100+ individuals

## Deployment - **UPDATED**

### Backend (Railway)
- Automatic deployment from main branch
- Environment variables configured in Railway dashboard
- Health check endpoint: GET /health
- Logs available in Railway UI

### Frontend (Expo)
- Development: expo start
- Production: EAS Build

### Database (Supabase)
- Migrations in supabase/migrations/
- RLS policies disabled for hackathon
- Connection pooling enabled

## Known Limitations (Hackathon MVP)

1. No offline support - requires internet
2. Categories can only be created, not edited/deleted
3. No user management beyond demo account
4. Audio files must be M4A format
5. No real reverse geocoding (shows coordinates)
6. English-only transcription
7. 2-minute audio limit
8. No manual audio deletion after save (relies on 24-hour auto-delete)
9. No categories_snapshot stored with interactions

## Future Enhancements (Post-Hackathon)

1. Offline mode with sync
2. Multiple language support
3. Real reverse geocoding
4. Category management (edit/delete)
5. User roles and permissions
6. Advanced search filters
7. Analytics dashboard
8. Batch operations

## Developer Notes

### Backend Development (Dev 1)
- Always validate with validation_helper.py
- Use danger_calculator.py for scores
- Audio files auto-delete after 24 hours (no manual deletion)
- Never modify individuals directly, only add interactions
- **Important**: Implement all endpoints even if frontend isn't fully integrated
- Backend should be complete and tested independently of frontend readiness

### Frontend Integration
- Call /api/transcribe first (read-only)
- Show results for user confirmation
- Call /api/individuals to save
- Handle streamlined confirmation for ≥ 95% confidence
- Show full merge UI for < 95% confidence

### Common Issues
- Audio URL must be from Supabase
- All required fields must be present
- Danger scores are integers 0-100
- Timestamps are UTC ISO format