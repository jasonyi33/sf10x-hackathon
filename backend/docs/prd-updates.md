# PRD Updates and Clarifications

This document tracks implementation decisions and clarifications made during development that extend or clarify the original PRD.

## Task 2.0 Clarifications

### 1. Audio Storage Access Method
**Decision**: Use public URLs with signed URLs (time-limited to 1 hour)
- **Rationale**: Balances security with simplicity for hackathon
- **PRD Reference**: Lines 382, 399 mention public URLs
- **Implementation**: Configure Supabase Storage to generate signed URLs

### 2. Duplicate Detection Scope
**Decision**: Search ALL individuals with smart limits
- **Implementation Strategy**:
  1. First search by exact name match (indexed, fast)
  2. Then fuzzy search on similar names (limit 50)
  3. Compare only those ~50 candidates with GPT-4o
- **Rationale**: Balances thoroughness with performance
- **PRD Reference**: Lines 79-86, no user restriction mentioned

### 3. Error Response Format
**Decision**: Use nested JSON format
```json
{
  "success": false,
  "errors": {
    "validation": [
      {"field": "height", "message": "Value 400 exceeds maximum of 300"}
    ],
    "missing_required": ["weight"]
  }
}
```
- **Rationale**: Clear separation of validation errors vs missing fields
- **PRD Reference**: Lines 618-623 list error types to handle

### 4. GPT Model Selection
**Decision**: Use GPT-4o as specified in PRD (not GPT-4-turbo)
- **PRD Reference**: Lines 68, 252, 385, 611, 659 specifically mention "GPT-4o"
- **Cost Analysis**:
  - ~$0.014 per voice interaction (GPT-4o)
  - ~$0.006 per minute audio (Whisper)
  - Total: ~$0.02 per complete transcription

### 5. Categories API Access
**Decision**: GET /api/categories requires authentication, returns all categories
- **Rationale**: Simple implementation, categories aren't sensitive
- **Implementation**: Uses existing get_current_user dependency
- **Note**: This is a minimal endpoint needed for Task 2.0 to function

## Additional Implementation Details

### Audio File Handling
- **Format**: M4A only (per PRD line 46)
- **Duration**: 10 seconds minimum, 2 minutes maximum
- **Storage**: Auto-delete after 24 hours (Supabase lifecycle policy)

### Duplicate Detection Thresholds
- **Auto-merge**: Confidence ≥ 95% (per PRD line 82)
- **Show merge UI**: Confidence < 95% (per PRD line 83)
- **Implementation**: Return all matches, let frontend handle thresholds

### Required Fields Validation
- **Always Required**: Name, Height, Weight, Skin Color (per PRD lines 131-137)
- **Height/Weight Range**: 0-300 (per PRD lines 134-135)
- **Skin Color Options**: Must be Light/Medium/Dark (per PRD line 136)

## Future Considerations

### Performance Optimizations
- Category prompt caching (if category list becomes large)
- Batch duplicate detection for multiple individuals
- Audio preprocessing for faster Whisper processing

### Security Enhancements (Post-Hackathon)
- Implement proper RLS policies on storage bucket
- Add rate limiting on transcription endpoint
- Encrypt sensitive data in JSONB fields

## Task 2.0 Prerequisite Implementation

### GET /api/categories Endpoint
**Implementation**: Minimal read-only endpoint for fetching all categories
- **Endpoint**: `GET /api/categories`
- **Authentication**: Required (uses get_current_user dependency)
- **Response Format**:
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
- **Purpose**: Enables dynamic GPT-4o prompt generation in Task 2.0
- **Note**: Full category management (POST endpoint) will be in Task 5.0

## Task 2.6 Implementation

### Validation Helper Service
**Implementation**: Created comprehensive validation helper for categorized data
- **Location**: `services/validation_helper.py`
- **Function**: `validate_categorized_data(data: dict, categories: list) -> ValidationResult`
- **Features**:
  - Validates all required fields (Name, Height, Weight, Skin Color)
  - Checks number ranges (0-300 for height/weight)
  - Validates single-select options match allowed values
  - Validates multi-select options
  - Returns structured ValidationResult with:
    - is_valid: boolean
    - missing_required: list of missing field names
    - validation_errors: list of {field, message} objects
- **Integration**: Used in /api/transcribe endpoint for better validation

## Notes
- All decisions prioritize hackathon timeline (36 hours)
- "Keep it simple" principle from CLAUDE.md is followed
- No over-engineering or future-proofing beyond MVP requirements

## Task 3-4 Backend Support Implementation Plan

### Overview
While Tasks 3-4 are assigned to frontend developers, critical backend endpoints are needed for the frontend to function. These endpoints handle individual data persistence, search, and interaction tracking.

### Required Endpoints

#### 1. POST /api/individuals - Create/Update Individual
**Purpose**: Save new individuals or update existing ones after transcription
**When Used**: 
- After user confirms transcription results
- After manual data entry
- When merging duplicates

**Request Structure**:
```json
{
  "data": {
    "name": "John Doe",
    "height": 72,
    "weight": 180,
    "skin_color": "Light",
    // ... all other categorized fields
  },
  "merge_with_id": "uuid-of-existing",  // Optional: for merging
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
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

**Implementation Steps**:
1. Validate incoming data using existing validation_helper
2. Calculate danger score using danger_calculator
3. If merge_with_id provided:
   - Update existing individual with new data
   - Create interaction record with only changed fields
4. If new individual:
   - Create individual record with all data
   - Create interaction record with all fields
5. Handle location data (store in interaction)
6. Delete audio file from storage after successful save

#### 2. GET /api/individuals - List/Search Individuals
**Purpose**: Power the search screen and recent individuals list
**When Used**: 
- Search screen initial load
- User types in search bar
- Recent individuals display

**Query Parameters**:
- `search`: Search term (searches name field)
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
        "address": "Market St & 5th"  // Abbreviated
      }
    }
  ],
  "total": 150,
  "offset": 0,
  "limit": 20
}
```

**Implementation Steps**:
1. Build query with search filters
2. Join with interactions to get last_seen timestamp
3. Calculate display danger score (override or calculated)
4. Return paginated results

#### 3. GET /api/individuals/{id} - Get Individual Details
**Purpose**: Display full individual profile
**When Used**: User taps on individual from search results

**Response**:
```json
{
  "individual": {
    "id": "uuid",
    "name": "John Doe",
    "danger_score": 75,
    "danger_override": null,
    "data": {
      // All fields with current values
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

#### 4. PUT /api/individuals/{id}/danger-override
**Purpose**: Update manual danger score override
**When Used**: User adjusts danger score slider

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

#### 5. GET /api/individuals/{id}/interactions
**Purpose**: Get detailed interaction history
**When Used**: User views interaction history tab

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
      },
      "categories_snapshot": [
        // Category definitions at time of interaction
      ]
    }
  ]
}
```

### Implementation Strategy

#### Phase 1: Core Data Models (Do First)
1. Create Pydantic models for all request/response structures
2. Create database query functions in db/models.py
3. Implement helper functions for:
   - Merging individual data
   - Tracking field changes
   - Address abbreviation

#### Phase 2: Individual Management (Critical Path)
1. Implement POST /api/individuals
2. Add comprehensive validation
3. Handle merge logic (confidence >= 95% auto-merge)
4. Create interaction records properly

#### Phase 3: Search and Display
1. Implement GET /api/individuals with search
2. Add pagination support
3. Implement GET /api/individuals/{id}
4. Add danger override endpoint

#### Phase 4: History and Details
1. Implement interactions endpoint
2. Add location/address formatting
3. Ensure proper data aggregation

### Testing Strategy

1. **Unit Tests**: Each endpoint individually
2. **Integration Tests**: Full flow from transcribe → save → search → view
3. **Data Integrity Tests**: Ensure interactions track changes correctly
4. **Performance Tests**: Search with 100+ individuals

### Potential Issues to Avoid

1. **Race Conditions**: Use database transactions for save operations
2. **Data Loss**: Never delete data, only add interactions
3. **Performance**: Index name field for search, created_at for sorting
4. **Validation**: Reuse existing validation_helper for consistency
5. **Audio Cleanup**: Delete audio files AFTER successful save

### Dependencies on Existing Code

- **validation_helper.py**: Reuse for data validation
- **danger_calculator.py**: Use for score calculation
- **auth.py**: All endpoints require authentication
- **Supabase client**: Use existing connection

### Migration Considerations

None needed - using existing database schema from Task 1.0

### Frontend Integration Points

1. **After transcription**: Frontend calls POST /api/individuals
2. **Search screen**: Polls GET /api/individuals
3. **Profile screen**: Calls GET /api/individuals/{id}
4. **Danger slider**: Updates via PUT endpoint
5. **History tab**: Loads interactions on demand