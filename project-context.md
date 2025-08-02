# Project Context: Voice Transcription App for SF Homeless Outreach

## Development Guidelines (Dev 2 Focus)

### Always Ask Questions
- **If anything is ambiguous or unclear, ask questions before proceeding**
- **Check for conflicting logic between PRD and task list**
- **Verify unclear aspects in code before implementing**
- **Use test-driven development (TDD) approach**

### Test-Driven Development (TDD)
- Write tests first, then implement functionality
- Focus on integration tests for critical user flows
- Frontend: Use Jest for component integration tests
- Test all main user journeys end-to-end

### Dev 2 Responsibilities
- **Primary**: Frontend recording interface and transcription flow
- **Secondary**: Category management (shared with Dev 3)
- **Key Components**: AudioRecorder, ManualEntryForm, MergeUI, RecordScreen
- **Critical Flow**: Record → Upload → Transcribe → Categorize → Save

## Project Overview

**Goal**: Mobile voice transcription app for SF homeless outreach workers to document interactions via voice, with AI categorization and safety assessment.

**Key Features**:
- Voice recording (2-min max) with AI transcription
- Manual data entry as alternative
- Duplicate detection and merging
- Danger assessment scoring
- Search and individual profiles
- Customizable data categories
- Location tracking
- CSV export

## Technical Stack

**Frontend**: React Native Expo (iOS only) - *Dev 2 Primary*
**Backend**: FastAPI (Python) - *Dev 1 Responsibility*
**Database**: Supabase (PostgreSQL) - *Dev 1 Responsibility*
**AI**: OpenAI Whisper + GPT-4o - *Dev 1 Responsibility*
**Auth**: Supabase Auth
**Storage**: Supabase Storage
**Maps**: Google Maps API

## Frontend Architecture (Dev 2 Focus)

### Core Components You'll Build
- `AudioRecorder.tsx` - Voice recording with 2-minute limit, live duration display
- `ManualEntryForm.tsx` - Alternative data entry method with validation
- `MergeUI.tsx` - Duplicate detection and merging interface
- `RecordScreen.tsx` - Main recording interface (default tab)

### Key Services You'll Use
- `api.ts` - API client for backend communication
- `supabase.ts` - Supabase client configuration with auto-login

### Audio Recording Specifications (Critical for Dev 2)
- **Format**: M4A with AAC codec, 64kbps
- **Duration**: 10 seconds minimum, 2 minutes maximum
- **Warning**: At 1:45 mark, auto-stop at 2:00
- **Size**: ~1MB for 2 minutes
- **Location**: Capture GPS when recording starts
- **UI Display**: "0:45 / 2:00" format, red text after 1:30
- **Stop Button**: Disabled until 10 seconds minimum

### Recording Flow (Your Implementation)
1. User opens app → Auto-login with demo credentials
2. Default tab is Record screen
3. User presses record button → Start audio recording
4. Live duration display with warning colors
5. Stop button disabled until 10 seconds minimum
6. Upload to Supabase Storage: `audio/{user_id}/{timestamp}.m4a`
7. Show loading spinner during transcription
8. Display categorized results from AI
9. Allow editing of categorized fields
10. Handle duplicate detection with merge UI
11. Save to database with location data

## Database Schema (Reference for Dev 2)

## Preset Categories

```sql
INSERT INTO categories (name, type, is_required, is_preset, options) VALUES
('name', 'text', true, true, null),
('height', 'number', true, true, null),
('weight', 'number', true, true, null),
('skin_color', 'single_select', true, true, 
 '[{"label": "Light", "value": 0}, {"label": "Medium", "value": 0}, {"label": "Dark", "value": 0}]'::jsonb),
('gender', 'single_select', false, true,
 '[{"label": "Male", "value": 0}, {"label": "Female", "value": 0}, {"label": "Other", "value": 0}, {"label": "Unknown", "value": 0}]'::jsonb),
('substance_abuse_history', 'multi_select', false, true,
 '["None", "Mild", "Moderate", "Severe", "In Recovery"]'::jsonb);
```

## Required Fields Validation (Critical for Dev 2)

**Always Required**: Name, Height, Weight, Skin Color
**Validation Rules**:
- Name: Required, non-empty
- Height/Weight: Positive integers only, max 300
- Skin Color: Must be Light/Medium/Dark
- Single-select: Must be from predefined options IF selected
- Multi-select: Must be from predefined options IF any selected
- Date fields: Valid date format, not future dates

**UI Implementation (Your Responsibility)**:
- Highlight missing required fields in red
- Toast message: "Please fill in required fields: Height, Weight, Skin Color"
- Block save until required fields filled
- Number inputs: keyboardType="numeric", max 300

## Danger Score Calculation

**Formula**:
1. **Auto-trigger**: If field has non-zero/non-empty value AND auto_trigger=true, return 100
2. **Weighted average**: (numeric_value/300 * weight) for numbers, (option_value * weight) for single-select
3. **Only numeric and single-select types can have danger weights**

**Display Logic**:
- If danger_override is set: display danger_override
- Otherwise: display calculated danger_score
- Color coding: 0-33 Green, 34-66 Yellow, 67-100 Red

## Audio Recording Specifications

- **Format**: M4A with AAC codec, 64kbps
- **Duration**: 10 seconds minimum, 2 minutes maximum
- **Warning**: At 1:45 mark, auto-stop at 2:00
- **Size**: ~1MB for 2 minutes
- **Location**: Capture GPS when recording starts

## API Endpoints (Dev 2 Will Use)

```
POST   /api/upload-audio      - Upload to Supabase Storage, return URL
POST   /api/transcribe        - Process audio, return all results at once
GET    /api/individuals       - List all with search (JSONB queries)
GET    /api/individuals/:id   - Get one with interaction history
POST   /api/individuals       - Create new (with duplicate check)
PUT    /api/individuals/:id   - Update existing (manual danger override)
POST   /api/interactions      - Log new interaction
GET    /api/categories        - List all active
POST   /api/categories        - Create new
GET    /api/export           - Generate CSV download
```

## Authentication

**Demo Credentials**:
- Email: demo@sfgov.org
- Password: demo123456
- Auto-login on app launch
- Skip login screen entirely

**Implementation (Your Code)**:
```javascript
const DEMO_EMAIL = 'demo@sfgov.org';
const DEMO_PASSWORD = 'demo123456';
// Auto sign in on app launch
```

## File Structure (Dev 2 Focus)

### Frontend (React Native Expo) - Your Primary Files
- `mobile/App.tsx` - Main app entry point with navigation and auto-login
- `mobile/tests/App.integration.test.tsx` - Critical integration tests for main flows
- `mobile/contexts/AuthContext.tsx` - Authentication context with auto-login
- `mobile/screens/RecordScreen.tsx` - Voice recording interface (default tab) - **YOUR MAIN SCREEN**
- `mobile/screens/SearchScreen.tsx` - Individual search interface
- `mobile/screens/IndividualProfileScreen.tsx` - Individual homeless person profile view
- `mobile/screens/CategoriesScreen.tsx` - Category management
- `mobile/screens/UserProfileScreen.tsx` - Current user info and logout
- `mobile/components/AudioRecorder.tsx` - Audio recording component with 2-min limit - **YOUR CORE COMPONENT**
- `mobile/components/ManualEntryForm.tsx` - Manual data entry form - **YOUR COMPONENT**
- `mobile/components/DangerScore.tsx` - Danger score display with slider override
- `mobile/components/MergeUI.tsx` - Duplicate merge interface - **YOUR COMPONENT**
- `mobile/services/api.ts` - API client service
- `mobile/services/supabase.ts` - Supabase client configuration

### Backend (FastAPI) - Dev 1 Responsibility
- `backend/main.py` - Main FastAPI application entry point
- `backend/tests/test_api_integration.py` - Critical path integration tests
- `backend/api/auth.py` - Authentication middleware and JWT validation
- `backend/api/transcription.py` - Audio transcription and categorization endpoints
- `backend/api/individuals.py` - CRUD operations for individuals
- `backend/api/categories.py` - Category management endpoints
- `backend/services/openai_service.py` - OpenAI API integration (Whisper/GPT-4o)
- `backend/services/danger_calculator.py` - Danger score calculation logic
- `backend/db/models.py` - Database models and schemas

### Database & Configuration
- `supabase/migrations/001_initial_schema.sql` - Database schema creation
- `supabase/migrations/002_preset_categories.sql` - Insert preset categories
- `supabase/migrations/003_demo_data.sql` - Demo individuals and interactions
- `.env.example` - Environment variables template
- `railway.toml` - Railway deployment configuration

## Development Tasks (Dev 2 Focus)

### Task 3.0: Recording Interface (Dev 2) - **YOUR PRIMARY TASK**
- [ ] Initialize Expo project with TypeScript
- [ ] Configure Supabase client with auto-login
- [ ] Build AudioRecorder component with specifications
- [ ] Implement audio upload to Supabase Storage
- [ ] Create transcription flow
- [ ] Build ManualEntryForm with validation
- [ ] Add location capture with Google Maps
- [ ] Build MergeUI component for duplicates
- [ ] Create demo audio files
- [ ] Write integration test for recording flow

### Task 5.0: Category Management (Dev 2 & 3) - **YOUR SHARED TASK**
- [ ] Build CategoriesScreen listing all categories
- [ ] Create Add Category form
- [ ] Implement required field validation
- [ ] Build CSV export
- [ ] Write integration test for category creation

### Other Tasks (Other Devs)
- **Task 1.0 & 2.0**: Dev 1 (Backend infrastructure & AI services)
- **Task 4.0**: Dev 3 (Search & profiles)
- **Task 6.0**: All (Integration & demo)

## Critical Features Checklist (Dev 2)

- [ ] Voice recording with timer (10s-2min)
- [ ] Live transcription display
- [ ] Required field validation (Name, Height, Weight, Skin Color)
- [ ] Category value editing
- [ ] Duplicate merge flow
- [ ] Location capture
- [ ] Auto-login with demo account

## Demo Flow (Dev 2 Segment)

1. Worker opens app → Auto-login (saved credentials)
2. Records interaction → Views live transcription → Edits categories → Saves
3. Gets duplicate suggestion → Reviews and merges
4. Shows manual entry as alternative
5. Demonstrates location capture

## Performance Expectations

- Audio compression: <2 seconds
- Upload to storage: 1-3 seconds
- Whisper transcription: 2-5 seconds
- GPT-4o categorization: 1-3 seconds
- **Total processing: 6-13 seconds**
- Duplicate check: <1 second
- Search response: <500ms for 2,000+ records
- CSV export: <3 seconds for full database

## Error Handling (Dev 2)

- Network failures: Show "No internet connection" message
- Partial categorization: Save what was processed with clear indication
- Audio too short: Show "Recording must be at least 10 seconds" error
- Audio too long: Warning at 1:45, auto-stop at 2:00
- Location permission denied: Allow manual location entry
- API failures: User-friendly messages with retry button

## Success Metrics

### Demo Success (Hackathon)
- Complete working demo in 36 hours
- All core features functional
- No crashes during judge presentation
- Clear value proposition demonstrated
- Fast processing times (<15 seconds total)

### Post-Implementation (if deployed)
- Reduce documentation time by 75%
- 90% adoption among street workers
- Process 2,000-15,000 interactions/month
- 95% accuracy in AI categorization
- <1% duplicate individuals in database

## Non-Goals (Out of Scope)

1. Face ID/facial recognition features
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

## Team Split

- **Dev 1**: Backend (FastAPI, AI services, database)
- **Dev 2**: Frontend Recording (audio, transcription flow, manual entry)
- **Dev 3**: Frontend Data Management (search, profiles, categories)

## Testing Strategy

- **Simplified Testing for Hackathon**: Focus only on critical integration tests
- **Backend tests**: Use pytest for API integration tests
- **Frontend tests**: Use Jest for component integration tests
- **Test main user flows end-to-end**
- **Verify all critical features work together**

## Deployment

- **Railway.app** for FastAPI backend
- **Expo** for React Native app
- **Supabase** for database, auth, and storage
- **ngrok backup** if Railway fails during demo

## Environment Variables (Dev 2)

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## Demo Data Requirements

- 10 individuals with varied danger scores (0-100)
- 3 pairs of similar names for merge demo
- 20 interactions across 5 workers
- Custom categories: "Veteran Status", "Medical Conditions", "Housing Priority"
- Realistic but fictional names and data

## Critical Reminders (Dev 2)

1. **Always ask questions if anything is unclear**
2. **Check for conflicts between PRD and task list**
3. **Use test-driven development approach**
4. **Focus on integration tests for critical flows**
5. **Auto-login with demo credentials on app launch**
6. **Required fields: Name, Height, Weight, Skin Color**
7. **Audio format: M4A with AAC codec at 64kbps**
8. **Recording limits: 10 seconds minimum, 2 minutes maximum**
9. **No offline support - requires constant internet connection**
10. **Location capture is required for all interactions** 