# Codebase Reference: SF Homeless Outreach Voice Transcription App

## Project Overview

**Project Type**: 36-hour hackathon MVP mobile application
**Purpose**: Voice transcription and AI categorization system for SF homeless outreach workers
**Status**: Backend infrastructure complete, frontend and integration in progress
**Team**: 3 developers with specific role assignments

### Key Characteristics
- **MVP Focus**: Simple solutions over complex patterns
- **Demo-Ready**: Hardcoded credentials, simplified auth, CORS open
- **Real AI Integration**: OpenAI Whisper + GPT-4o for transcription/categorization
- **No Offline Support**: Requires constant internet connection

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage (24-hour auto-delete for audio)
- **Auth**: Supabase Auth with simplified JWT validation
- **AI Services**: OpenAI Whisper API + GPT-4o
- **Deployment**: Railway (port 8001)
- **Testing**: pytest with integration focus

### Frontend
- **Framework**: React Native Expo (iOS only)
- **Navigation**: Tab-based (Record/Search/Categories/Profile)
- **State Management**: React Context
- **UI Components**: Custom components with functional design
- **Audio**: M4A format, AAC codec, 64kbps
- **Maps**: Google Maps for geocoding
- **Testing**: Jest for integration tests

### Infrastructure
- **Hosting**: Railway (backend), Expo (frontend)
- **Storage**: Supabase Storage with lifecycle policies
- **Auth**: Auto-login with demo@sfgov.org / demo123456
- **CORS**: Open for all origins (hackathon setting)

## Architecture Overview

### Database Schema

```sql
-- Core Tables
individuals (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    data JSONB,              -- Flexible categorized data
    urgency_score INTEGER,   -- Calculated danger score
    urgency_override INTEGER,-- Manual override via slider
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

interactions (
    id UUID PRIMARY KEY,
    individual_id UUID FK,
    user_id UUID FK,
    transcription TEXT,      -- Original voice transcription
    data JSONB,              -- Only changed fields
    location JSONB,          -- {lat, lng, address}
    created_at TIMESTAMP
)

categories (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE,
    type TEXT,               -- text/number/single_select/multi_select/date/location
    priority TEXT,           -- high/medium/low (UI display only)
    danger_weight INTEGER,   -- 0-100 (only for number/single_select)
    auto_trigger BOOLEAN,    -- Sets danger to 100 if true
    is_required BOOLEAN,
    is_preset BOOLEAN,       -- Cannot be deleted
    options JSONB,           -- Select options with values
    created_at TIMESTAMP
)
```

### API Endpoints Structure

#### Authentication
- All endpoints require JWT Bearer token (except /health)
- Simplified validation without signature check (hackathon)
- Auto-refresh handled by Supabase client

#### Core Endpoints

**Transcription & AI Processing**
- `POST /api/transcribe` - Process audio, return categorized data (read-only)
- `GET /api/categories` - Fetch all active categories
- `POST /api/individuals` - Save new or merge existing individual

**Individual Management**
- `GET /api/individuals` - Search with pagination
- `GET /api/individuals/{id}` - Full profile with interactions
- `PUT /api/individuals/{id}/danger-override` - Manual danger score
- `GET /api/individuals/{id}/interactions` - Detailed history

**Voice Assistant (Realtime)**
- `WebSocket /ws/voice-assistant` - OpenAI Realtime API proxy
- `POST /api/voice-assistant/transcribe` - Fallback transcription
- `GET /api/voice-assistant/context` - Database context injection

## Critical Business Logic

### Required Fields Validation
Always required (hardcoded):
1. **Name** (text) - Non-empty string
2. **Height** (number) - Integer 0-300
3. **Weight** (number) - Integer 0-300

(Skin Color was a fourth required field in earlier drafts; it was removed. The
live list is enforced at `backend/db/models.py:29`.)

### Danger Score Calculation
```python
# Priority order:
1. Check auto_trigger fields → return 100 if any triggered
2. Calculate weighted average:
   - Number fields: (value / 300) * weight
   - Single-select: option_value * weight
   - Other types: ignored (cannot have weight)
3. Display urgency_override if set, else calculated score
4. Color coding:
   - 0-33: Green (#10B981)
   - 34-66: Yellow (#F59E0B)
   - 67-100: Red (#EF4444)
```

### Duplicate Detection & Merging
```
1. LLM compares all attributes → confidence 0-100%
2. Frontend decision logic:
   - ≥ 95% confidence: Streamlined confirmation dialog
   - < 95% confidence: Full merge UI with field selection
3. Frontend sends complete merged data with merge_with_id
4. Backend updates existing record (no merge logic)
```

### Audio Processing Flow
```
1. Record M4A audio (10 sec min, 2 min max)
2. Upload to Supabase Storage
3. POST /api/transcribe with audio URL
4. Backend: Download → Whisper → GPT-4o → Duplicate check
5. Return results (does NOT save)
6. User reviews/edits in frontend
7. POST /api/individuals to persist
8. Audio auto-deletes after 24 hours
```

## File Structure & Key Components

### Backend Structure
```
backend/
├── main.py                 # FastAPI app entry, WebSocket handlers
├── api/
│   ├── auth.py            # JWT validation middleware
│   ├── transcription.py   # Audio processing endpoints
│   ├── individuals.py     # CRUD operations
│   ├── categories.py      # Category management
│   ├── voice_assistant.py # Realtime API integration
│   └── embeddings.py      # Semantic search (future)
├── services/
│   ├── openai_service.py  # Whisper + GPT-4o integration
│   ├── individual_service.py # Business logic
│   ├── context_service.py # Database context for voice
│   ├── urgency_calculator.py # Danger score logic
│   └── validation_helper.py  # Field validation
├── db/
│   └── models.py          # Pydantic schemas
└── tests/
    └── test_api_integration.py # Critical path tests
```

### Frontend Structure
```
mobile/
├── App.tsx                # Entry point, navigation setup
├── screens/
│   ├── ModernRecordScreen.tsx      # Voice recording (default tab)
│   ├── ModernSearchScreen.tsx      # Individual search
│   ├── ModernIndividualProfileScreen.tsx # Profile view (pushed from Search)
│   ├── ModernVoiceAssistantScreen.tsx    # Realtime voice UI
│   ├── CategoriesScreen.tsx        # Category management
│   └── UserProfileScreen.tsx       # Worker profile
├── components/
│   ├── ModernAudioRecorder.tsx # 5 s min / 2 min max recording
│   ├── ManualEntryForm.tsx     # Direct data entry
│   ├── UrgencyScore.tsx        # Score display + override
│   └── MergeUI.tsx             # Duplicate resolution
├── services/
│   ├── api.ts             # API client
│   └── supabase.ts        # Supabase config
└── contexts/
    └── AuthContext.tsx    # Auto-login management
```

## Development Commands

### Backend
```bash
# Start development server
cd backend && uvicorn main:app --reload --port 8001

# Run tests
cd backend && pytest tests/test_api_integration.py

# Install dependencies
cd backend && python3 -m pip install -r requirements.txt

# Deploy to Railway
railway up
```

### Frontend
```bash
# Start Expo dev server
cd mobile && npm start

# Run tests
cd mobile && npm test

# Install dependencies
cd mobile && npm install

# Build for iOS
cd mobile && expo build:ios
```

### Database
```bash
# Run migrations
supabase db push

# Seed demo data
supabase db seed
```

## Key Implementation Patterns

### Error Handling
```python
# Backend pattern
try:
    result = await service_call()
    return {"success": true, "data": result}
except ValidationError as e:
    return {"success": false, "errors": {"validation": [str(e)]}}
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
```

### Authentication Flow
```javascript
// Frontend auto-login
const DEMO_EMAIL = 'demo@sfgov.org';
const DEMO_PASSWORD = 'demo123456';

useEffect(() => {
    autoLogin();
}, []);

const autoLogin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        await supabase.auth.signInWithPassword({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD
        });
    }
};
```

### API Integration Pattern
```javascript
// Frontend API call pattern
const transcribeAudio = async (audioUrl) => {
    try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/transcribe`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ audio_url: audioUrl })
        });

        const data = await response.json();

        // Handle missing required fields
        if (data.missing_required?.length > 0) {
            setMissingFields(data.missing_required);
            showToast('Please fill required fields');
        }

        // Handle duplicates
        if (data.potential_matches?.[0]?.confidence >= 95) {
            setShowStreamlinedConfirm(true);
        }

        return data;
    } finally {
        setLoading(false);
    }
};
```

## Common Edge Cases & Solutions

### Audio Recording
- **< 10 seconds**: Show error toast, don't submit
- **> 2 minutes**: Auto-stop at 2:00, warning modal at 1:45
- **Network failure during upload**: Allow re-upload, show retry button
- **Wrong format**: Enforce M4A only in recorder settings

### Data Validation
- **Missing required fields**: Highlight in red, block save
- **Invalid number ranges**: Clamp to 0-300
- **Empty select options**: Allow null for non-required
- **Duplicate names**: Use LLM confidence for smart detection

### Merge Scenarios
- **High confidence (≥95%)**: Simple yes/no dialog
- **Medium confidence**: Full field-by-field UI
- **Multiple matches**: Show top match only (MVP)
- **User creates new anyway**: Allow, no forced merge

### Network & Auth
- **Token expiry**: Auto-refresh via Supabase
- **Network loss**: Show "No connection" banner
- **API timeout**: 30 second timeout, show error
- **Session persistence**: AsyncStorage for React Native

## Testing Strategy

### Backend Tests (pytest)
- Integration tests only (no unit tests for MVP)
- Test complete flows: transcribe → save → search
- Mock OpenAI responses for speed
- Use test database with migrations

### Frontend Tests (Jest)
- Critical user flows only
- Mock API responses
- Test navigation and state changes
- Skip UI component unit tests

### Key Test Scenarios
1. Voice recording → transcription → save
2. Duplicate detection with merge
3. Manual entry with validation
4. Search across JSONB fields
5. Danger score calculation & override
6. Auto-login and session persistence

## Deployment Configuration

### Environment Variables
```bash
# Backend (.env)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
OPENAI_API_KEY=sk-xxx
JWT_SECRET=xxx (simplified validation)
PORT=8001

# Frontend (.env)
EXPO_PUBLIC_API_URL=https://api.railway.app
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
EXPO_PUBLIC_GOOGLE_MAPS_KEY=xxx
```

### Railway Deployment
- Auto-deploy from main branch
- Health check: GET /health
- Custom domain configuration
- Environment variables in dashboard
- Logs available in Railway UI

### Supabase Configuration
- Storage bucket: 'audio' with 24hr lifecycle
- Auth: Email/password, no confirmation
- RLS: Disabled for hackathon
- Connection pooling: Enabled
- Backups: Daily automatic

## Known Limitations (MVP)

1. **No offline support** - Requires constant internet
2. **Categories create-only** - No edit/delete
3. **Single demo account** - All users share demo@sfgov.org
4. **iOS only** - No Android support
5. **English only** - Whisper transcription
6. **2-minute audio limit** - Frontend enforced
7. **No face recognition** - Text/audio only
8. **Basic CSV export** - No filtering
9. **No audit trail** - Only current state + interactions
10. **Simplified auth** - No signature verification

## Development Workflow

### Task Assignment
- **Dev 1**: Backend APIs, AI integration, database
- **Dev 2**: Frontend recording, audio handling
- **Dev 3**: Frontend data management, search, profiles

### Git Workflow
```bash
# Feature branch
git checkout -b feature/task-name

# After testing
cd backend && pytest tests/test_api_integration.py
git add .
git commit -m "feat: implement task description"
git push origin feature/task-name
```

### PR Requirements
1. All tests passing
2. No console errors
3. Follows PRD requirements
4. Updates this reference doc if needed

## Quick Reference

### API Response Format
```json
// Success
{
  "success": true,
  "data": {...}
}

// Error
{
  "success": false,
  "errors": {
    "validation": ["field errors"],
    "missing_required": ["name", "height"]
  }
}
```

### Common SQL Queries
```sql
-- Search individuals
SELECT * FROM individuals
WHERE name ILIKE '%john%'
   OR data::text ILIKE '%john%';

-- Get interactions for individual
SELECT * FROM interactions
WHERE individual_id = 'uuid'
ORDER BY created_at DESC;

-- Update danger override
UPDATE individuals
SET urgency_override = 75
WHERE id = 'uuid';
```

### Debugging Tips
1. Check Railway logs for backend errors
2. Use Expo DevTools for frontend debugging
3. Supabase dashboard for database queries
4. Network tab for API response inspection
5. Console logs preserved in development

## Critical Success Factors

1. **Required fields must validate** - Name, Height, Weight
2. **Audio must be M4A format** - Enforce in recorder
3. **Danger score calculation correct** - Test with edge cases
4. **Duplicate detection working** - LLM confidence accurate
5. **Auto-login successful** - No manual login screen
6. **Search includes JSONB** - Not just name field
7. **Merge sends complete data** - Frontend handles logic
8. **2-minute limit enforced** - Stop recording at max
9. **Location captured** - GPS at recording start
10. **Tests passing** - Integration tests green

## Contact & Resources

- **PRD**: docs/PRD.md
- **Setup & overview**: README.md
- **Claude Instructions**: CLAUDE.md
- **Demo Script**: DEMO_SCRIPT.md
- **Railway Dashboard**: https://railway.app
- **Supabase Dashboard**: https://supabase.com/dashboard