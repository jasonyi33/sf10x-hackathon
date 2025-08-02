# Updated Tasks: Voice Transcription App for SF Homeless Outreach
*Version 2.1 - With Backend Individual Management APIs and Technical Specifications*

## Relevant Files

### Backend (FastAPI)
- `backend/main.py` - Main FastAPI application entry point
- `backend/tests/test_api_integration.py` - Critical path integration tests for all endpoints
- `backend/api/auth.py` - Authentication middleware and JWT validation
- `backend/api/transcription.py` - Audio transcription and categorization endpoints
- `backend/api/individuals.py` - CRUD operations for individuals
- `backend/api/categories.py` - Category management endpoints
- `backend/services/openai_service.py` - OpenAI API integration (Whisper/GPT-4o)
- `backend/services/danger_calculator.py` - Danger score calculation logic
- `backend/services/individual_service.py` - Individual management business logic (NEW)
- `backend/db/models.py` - Database models and schemas

### Frontend (React Native Expo)
- `mobile/App.tsx` - Main app entry point with navigation and auto-login
- `mobile/tests/App.integration.test.tsx` - Critical integration tests for main flows
- `mobile/contexts/AuthContext.tsx` - Authentication context with auto-login
- `mobile/screens/RecordScreen.tsx` - Voice recording interface (default tab)
- `mobile/screens/SearchScreen.tsx` - Individual search interface
- `mobile/screens/IndividualProfileScreen.tsx` - Individual homeless person profile view
- `mobile/screens/CategoriesScreen.tsx` - Category management
- `mobile/screens/UserProfileScreen.tsx` - Current user info and logout
- `mobile/components/AudioRecorder.tsx` - Audio recording component with 2-min limit
- `mobile/components/ManualEntryForm.tsx` - Manual data entry form
- `mobile/components/DangerScore.tsx` - Danger score display with slider override
- `mobile/components/MergeUI.tsx` - Duplicate merge interface
- `mobile/services/api.ts` - API client service
- `mobile/services/supabase.ts` - Supabase client configuration

### Database & Configuration
- `supabase/migrations/001_initial_schema.sql` - Database schema creation
- `supabase/migrations/002_preset_categories.sql` - Insert preset categories
- `supabase/migrations/003_demo_data.sql` - Demo individuals and interactions
- `.env.example` - Environment variables template
- `railway.toml` - Railway deployment configuration

### Notes

- **Simplified Testing for Hackathon**: Focus only on critical integration tests, not unit tests
- **AI Agent Context**: Tests should verify main user flows work end-to-end
- Backend tests use pytest: `pytest backend/tests/test_api_integration.py`
- Frontend tests use Jest: `npm test` 
- Team split: Dev 1 (Backend), Dev 2 (Frontend Recording), Dev 3 (Frontend Data Management)
- Railway deployment provides instant URL for API access
- **Important Merge Logic**: Frontend sends complete merged data with `merge_with_id` field when merging individuals. Backend simply updates the existing record with the provided data (no merge logic in backend)
- **Categories Snapshot**: Skip storing categories_snapshot with interactions for MVP - reduces complexity without affecting core functionality

## Tasks

- [ ] 0.5 **[All Devs]** Development environment setup and technical specifications
  - [ ] 0.5.1 **Backend API Response Formats**:
    - All endpoints return JSON with consistent structure
    - Success: `{"data": {...}, "success": true}`
    - Error: `{"success": false, "errors": {"validation": [...], "missing_required": [...]}}`
    - Validation errors include field name and message
  - [ ] 0.5.2 **Authentication Configuration**:
    - Simplified JWT validation without signature verification (hackathon shortcut)
    - All endpoints except /health require authentication
    - Use Bearer token in Authorization header
  - [ ] 0.5.3 **CORS Configuration**:
    - Allow all origins (*) for demo purposes
    - Enable credentials for Supabase Auth
    - Allow all headers and methods
  - [ ] 0.5.4 **Database Performance**:
    - Create indexes on: individuals.name, individuals.created_at, interactions.individual_id
    - Use JSONB for flexible data storage in individuals.data field
  - [ ] 0.5.5 **Error Handling Standards**:
    - Frontend: Show toast messages for all errors
    - Backend: Return 4xx for client errors, 5xx for server errors
    - Log all errors but don't expose internal details to client
  - [ ] 0.5.6 **Development Commands Reference**:
    - Backend: `cd backend && uvicorn main:app --reload --port 8001`
    - Frontend: `cd mobile && npm start`
    - Tests: `cd backend && pytest tests/test_api_integration.py`
    - Always use python3 instead of python/pip

- [x] 1.0 **[Dev 1]** Set up project infrastructure, database, and core backend APIs
  - [x] 1.1 Initialize FastAPI project with dependencies (fastapi, uvicorn, python-jose, httpx, openai, python-multipart, pytest-asyncio)
  - [x] 1.2 Create Supabase project and configure environment variables in `.env` files
  - [x] 1.3 Write and run initial schema migration from PRD (individuals, interactions, categories tables with all indexes)
  - [x] 1.4 Run preset categories migration with exact SQL from PRD:
    **IMPORTANT: Execute this SQL exactly as written - do not modify any values**
    ```sql
    INSERT INTO categories (name, type, is_required, is_preset, priority, danger_weight, auto_trigger, options) VALUES
    ('name', 'text', true, true, 'high', 0, false, null),
    ('height', 'number', true, true, 'medium', 0, false, null),
    ('weight', 'number', true, true, 'medium', 0, false, null),
    ('skin_color', 'single_select', true, true, 'high', 0, false,
     '[{"label": "Light", "value": 0}, {"label": "Medium", "value": 0}, {"label": "Dark", "value": 0}]'::jsonb),
    ('gender', 'single_select', false, true, 'medium', 0, false,
     '[{"label": "Male", "value": 0}, {"label": "Female", "value": 0}, {"label": "Other", "value": 0}, {"label": "Unknown", "value": 0}]'::jsonb),
    ('substance_abuse_history', 'multi_select', false, true, 'low', 0, false,
     '["None", "Mild", "Moderate", "Severe", "In Recovery"]'::jsonb);
    ```
  - [x] 1.5 Create demo user in Supabase Auth dashboard (demo@sfgov.org / demo123456)
  - [x] 1.6 Set up Supabase Storage bucket `audio` with lifecycle rule: delete files older than 24 hours
  - [x] 1.7 Implement simplified JWT validation middleware (no signature verification for hackathon)
  - [x] 1.8 Create basic CORS configuration allowing all origins for demo
  - [x] 1.9 Deploy to Railway.app and verify deployment with health check endpoint

- [x] 2.0 **[Dev 1]** Implement AI transcription and categorization services
  - [x] 2.1 Create OpenAI service with Whisper transcription supporting M4A format from Supabase URL
  - [x] 2.2 Implement GPT-4o categorization with exact prompt from PRD:
    ```
    Extract information from this transcription into these categories:
    {list of categories with types and required flags}
    
    Rules:
    - Always attempt to extract required fields: Name, Height, Weight, Skin Color
    - For skin color, map descriptions to Light/Medium/Dark
    - Return null for missing non-required information
    
    Return JSON only.
    ```
  - [x] 2.3 Implement danger score calculator with exact formula:
    - Auto-trigger: If field has non-zero/non-empty value AND auto_trigger=true, return 100
    - Otherwise: (numeric_value/300 * weight) for numbers, (option_value * weight) for single-select
    - Only number and single-select types can have danger weights
  - [x] 2.4 Create duplicate detection using LLM to compare all attributes, return confidence 0-100
  - [x] 2.5 Build `/api/transcribe` endpoint that returns complete results (no streaming):
    ```json
    {
      "transcription": "...",
      "categorized_data": {...},
      "missing_required": ["height", "skin_color"],
      "potential_matches": [{"id": "...", "confidence": 89, "name": "..."}]
    }
    ```
  - [x] 2.6 Add validation helper checking required fields and types (numbers 0-300, valid select options)
  - [x] 2.7 Write integration test for complete transcription flow verifying all steps work

- [ ] 2.15 **[Dev 1]** Implement individual management backend APIs (NEW - Critical for frontend)
  - [ ] 2.15.1 Create data models in `db/models.py`:
    - SaveIndividualRequest, IndividualResponse, DangerOverrideRequest
    - LocationData (includes address string from frontend), InteractionResponse models
  - [ ] 2.15.2 Create `services/individual_service.py` with helper functions:
    - update_individual_with_merged_data() - Update individual with data merged by frontend
    - get_changed_fields() - Track what changed between interactions
    - save_individual() - Core save logic with transaction handling
    - Frontend sends already-merged data with merge_with_id when applicable
  - [ ] 2.15.3 Implement POST /api/individuals endpoint:
    - Validate data using existing validation_helper
    - Calculate danger score using danger_calculator
    - When merge_with_id provided, update existing individual with frontend's merged data
    - Create interaction record with changes only
    - Store location with address string from frontend
    - Note: Audio files auto-delete after 24 hours via Supabase lifecycle (no manual deletion after save)
  - [ ] 2.15.4 Implement GET /api/individuals endpoint:
    - Search across multiple fields (name and all JSONB data fields)
    - Join with interactions for last_seen timestamp
    - Return location data as provided by frontend
    - Support sort by last_seen, danger_score, name
  - [ ] 2.15.5 Implement GET /api/individuals/{id} endpoint:
    - Return full individual data
    - Include recent interactions summary
    - Calculate display danger score (override or calculated)
  - [ ] 2.15.6 Implement PUT /api/individuals/{id}/danger-override endpoint:
    - Update danger_override field
    - Return current scores for UI update
  - [ ] 2.15.7 Implement GET /api/individuals/{id}/interactions endpoint:
    - Return detailed interaction history
    - Include location data with addresses as stored
    - Show only changed fields per interaction
    - Skip categories_snapshot for MVP
  - [ ] 2.15.8 Write integration tests for individual management flow:
    - Test save → search → update → history flow
    - Test merge behavior (>= 95% shows streamlined confirmation)
    - Test multi-field search functionality

- [ ] 3.0 **[Dev 2]** Build recording interface and transcription flow (frontend)
  - [ ] 3.1 Initialize Expo project with TypeScript and dependencies (expo-av, react-native-maps, react-native-toast-message)
  - [ ] 3.2 Configure Supabase client with hardcoded credentials and auto-login:
    ```javascript
    const DEMO_EMAIL = 'demo@sfgov.org';
    const DEMO_PASSWORD = 'demo123456';
    // Auto sign in on app launch
    ```
  - [ ] 3.3 Build AudioRecorder component with:
    - M4A format, AAC codec, 64kbps
    - Live duration display "0:45 / 2:00", red text after 1:30
    - 10-second minimum, 2-minute maximum
    - Stop button disabled before 10 seconds
  - [ ] 3.4 Implement audio upload to Supabase Storage path: `audio/{user_id}/{timestamp}.m4a`
  - [ ] 3.5 Create transcription flow showing loading spinner, then categorized results
  - [ ] 3.6 Build ManualEntryForm with validation:
    - Required: Name (text), Height (number), Weight (number), Skin Color (dropdown)
    - Optional: All other fields including Gender, Substance Abuse History
    - Number inputs: keyboardType="numeric", max 300
  - [ ] 3.7 Add location capture with Google Maps draggable pin:
    - Step 1: Get initial GPS coordinates from device location
    - Step 2: Display Google Maps with draggable pin at coordinates
    - Step 3: When user moves pin, capture new coordinates
    - Step 4: Use Google Maps Geocoding API to convert coordinates to address
    - Step 5: Send both to backend in format:
      ```json
      {
        "location": {
          "latitude": 37.7749,
          "longitude": -122.4194,
          "address": "123 Market Street, San Francisco, CA 94105"
        }
      }
      ```
  - [ ] 3.8 Build MergeUI component for duplicates:
    - Only show merge UI if confidence ≥ 60% (below 60% is too low to be meaningful)
    - For confidence ≥ 95%: Streamlined confirmation dialog ("High confidence match found. Merge?")
    - For confidence 60-94%: Full side-by-side field comparison UI
    - Both UIs have: Merge/Create New/Cancel buttons
    - Frontend sends complete merged data to backend with merge_with_id field
  - [ ] 3.9 Create demo audio files with these scripts:
    - "Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication."
    - "Sarah by the library, approximately 35, 5 foot 4, 120 pounds, dark skin. Says she's in recovery, looking for shelter. Has two children staying with relatives."
    - "Robert at Golden Gate Park. 55 years old, 5 foot 10, 200 pounds, medium skin tone. Veteran, mild substance issues. Applied for housing last week."
  - [ ] 3.10 Write integration test verifying recording → upload → transcribe → save flow

- [ ] 4.0 **[Dev 3]** Create individual profiles and search functionality (frontend)
  - [ ] 4.1 Set up tab navigation with icons:
    - Record (camera icon) - default
    - Search (magnifying glass)
    - Categories (settings icon)
    - Profile (person icon)
  - [ ] 4.2 Build SearchScreen with:
    - Search bar that searches across all individual data fields (not just name)
    - Results showing: Name, danger score with color, "Last seen: X days ago"
    - Search results display
    - **NOTE: No recent individuals section - removed per updated PRD**
  - [ ] 4.3 Create IndividualProfileScreen displaying:
    - All current field values from aggregated data
    - Danger score with color background (green #10B981, yellow #F59E0B, red #EF4444)
    - Show danger_override if not null, else calculated danger_score
    - Interaction history list with date, worker name, abbreviated address
  - [ ] 4.4 Build DangerScore component with:
    - Large number display with colored background
    - Slider (0-100) to set manual override
    - "Manual" label when override is active
  - [ ] 4.5 Create interaction detail modal showing:
    - All fields that changed in that interaction
    - Full address from reverse geocoding
    - Original transcription if voice entry
  - [ ] 4.6 Implement UserProfileScreen with:
    - Current user name display
    - Logout button (for switching demo accounts if needed)
  - [ ] 4.7 Add CSV export button triggering `/api/export` download
  - [ ] 4.8 Write integration test for search → profile → danger override flow

- [ ] 4.5 **[Dev 2 & 3]** Frontend Integration Phase (NEW - Can start as soon as backend APIs are ready)
  - [ ] 4.5.1 **[Dev 2]** Update transcription flow to save data:
    - After transcription results shown, add "Save" button
    - Include location data with address from Google Maps
    - Call POST /api/individuals with categorized data + location
    - Frontend shows streamlined confirmation at >= 95% confidence before sending
    - Show merge UI only if confidence < 95%
    - Show success toast after save
  - [ ] 4.5.2 **[Dev 3]** Connect search screen to backend:
    - Wire SearchScreen to GET /api/individuals
    - Search queries multiple fields, not just name
    - Implement pagination and loading states
    - Handle empty states gracefully
  - [ ] 4.5.3 **[Dev 3]** Connect profile screen to backend:
    - Wire IndividualProfileScreen to GET /api/individuals/{id}
    - Connect danger slider to PUT /api/individuals/{id}/danger-override
    - Load interaction history from GET /api/individuals/{id}/interactions
  - [ ] 4.5.4 **[Dev 2 & 3]** Test full integration flow:
    - Record → Transcribe → Save → Search → View → Update
    - Verify all data persists correctly
    - Test offline error handling
    - Note: Frontend teams can start integration as soon as Task 2.15 endpoints are deployed, even if UI isn't 100% complete

- [ ] 5.0 **[Dev 2 & 3]** Implement category management and danger scoring (shared)
  - [ ] 5.1 **[Dev 3]** Build CategoriesScreen listing all categories with:
    - Name, type, priority (High/Medium/Low)
    - Danger weight (only shown for number/single-select)
    - "Add Category" button (no edit/delete)
  - [ ] 5.2 **[Dev 3]** Create Add Category form with:
    - Name, Type dropdown, Priority dropdown
    - For single-select: "Label:value" input (e.g., "Low:0.2,Medium:0.5,High:0.8")
    - For multi-select: comma-separated labels
    - Danger weight slider (0-100) only for number/single-select
    - Auto-trigger checkbox only for number/single-select
    - Required field checkbox
    - **[Dev 1]** Backend validates that only number/single-select can have danger_weight > 0
  - [ ] 5.3 **[Dev 2]** Implement required field validation:
    - Highlight missing required fields in red
    - Toast message: "Please fill in required fields: Height, Weight, Skin Color"
    - Block save until required fields filled
  - [ ] 5.4 **[Dev 3]** Build CSV export with all individuals data:
    - **[Dev 1]** Backend: Basic CSV format (name, height, weight, skin_color, danger_score, last_seen)
    - **[Dev 1]** No filtering - export all individuals
    - **[Dev 3]** Frontend: Trigger download via GET /api/export
    - Multi-select values comma-separated
  - [ ] 5.5 **[All]** Write integration test for category creation → use in recording → danger calculation
  - [ ] 5.6 **[Dev 1]** Implement backend endpoints for Task 5:
    - POST /api/categories - Create new category
    - GET /api/export - Generate and download CSV file

- [ ] 6.0 **[All]** Integration, testing, and demo preparation
  - [ ] 6.1 **[Dev 1]** Create demo data SQL with:
    - 20 individuals total with varied profiles
    - 5 with manual danger overrides
    - 3 with auto-triggered danger scores (weapon_possession = 100)
    - Each individual has 1-10 interactions (randomized)
    - Mix of danger scores across all ranges:
      - Low (0-33): ~6 individuals
      - Medium (34-66): ~8 individuals  
      - High (67-100): ~6 individuals
    - Create custom categories first:
      - housing_status (single-select with danger weights)
      - mental_health (single-select with danger weights)
      - weapon_possession (single-select with auto-trigger)
    - Varied interactions across SF locations:
      - Market Street, Mission District, Golden Gate Park
      - Tenderloin, SOMA, Haight-Ashbury
      - Mix of voice entries (with transcriptions) and manual entries
    - Custom categories to insert:
      ```sql
      INSERT INTO categories (name, type, is_required, is_preset, priority, danger_weight, auto_trigger, options) VALUES
      ('veteran_status', 'single_select', false, false, 'high', 20, false,
       '[{"label": "Yes", "value": 1}, {"label": "No", "value": 0}, {"label": "Unknown", "value": 0}]'::jsonb),
      ('medical_conditions', 'multi_select', false, false, 'high', 0, false,
       '["Diabetes", "Heart Disease", "Mental Health", "Mobility Issues", "Chronic Pain", "None"]'::jsonb),
      ('housing_priority', 'single_select', false, false, 'high', 30, false,
       '[{"label": "Critical", "value": 1}, {"label": "High", "value": 0.7}, {"label": "Medium", "value": 0.4}, {"label": "Low", "value": 0.1}]'::jsonb),
      ('violent_behavior', 'single_select', false, false, 'high', 40, true,
       '[{"label": "None", "value": 0}, {"label": "Verbal Only", "value": 0.3}, {"label": "Physical", "value": 1}]'::jsonb);
      ```
  - [ ] 6.2 **[Dev 2]** Test and fix voice recording flow ensuring:
    - 10-second minimum enforced
    - Required fields highlighted if missing from transcription
    - Full merge UI appears for matches with confidence 60-94%
    - Streamlined confirmation for confidence ≥95%
  - [ ] 6.3 **[Dev 3]** Test search and profile features:
    - Search returns correct results across all fields
    - Danger override persists across sessions
    - Addresses show correctly (abbreviated in list, full in details)
  - [ ] 6.4 **[Dev 1]** Configure Railway deployment with proper CORS for Expo
  - [ ] 6.5 **[All]** Run full integration test of all features together
  - [ ] 6.6 **[Dev 2]** Create 5-minute demo script:
    - Voice recording → AI categorization → Save
    - Manual entry for comparison
    - Show merge flow with duplicate
  - [ ] 6.7 **[Dev 3]** Practice demo segment:
    - Search for individual
    - View profile and history
    - Manual danger override
    - Export CSV
  - [ ] 6.8 **[Dev 1]** Set up ngrok backup if Railway fails
  - [ ] 6.9 **[All]** Final demo run-through with handoffs

## Key Changes in This Update

### New Task 0.5 - Development Environment Setup
Added technical specifications that all developers need to know:
- API response formats and error handling
- Authentication and CORS configuration
- Database performance optimizations
- Development command reference

### Updated Task 4.2 - Removed Recent Individuals
- Explicitly noted that recent individuals feature was removed per PRD
- Clarified search works across all data fields, not just name

### Updated Task 3.8 - Merge Threshold Clarification
- Added 60% minimum confidence threshold for showing any merge UI
- Below 60% is considered too low to be meaningful

### Updated Task 3.7 - Detailed Location Flow
- Added step-by-step process for location capture
- Specified exact data format for backend communication

### Updated Task 6.1 - Expanded Demo Data
- Added all 10 individual profiles with specific danger scores
- Included custom category SQL with exact values
- Specified interaction locations across SF

### Updated Task 1.4 - SQL Execution Warning
- Added warning to execute preset categories SQL exactly as written

## Critical Path

1. **Dev 1 must complete Task 2.15 ASAP** - Frontend teams are blocked without these APIs
2. **Frontend teams continue with UI development** - Can use mock data temporarily
3. **Task 4.5 brings everything together** - Integration phase once APIs are ready
4. **Task 5 can proceed in parallel** - Category management is somewhat independent