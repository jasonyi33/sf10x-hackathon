# SF Homeless Outreach Voice Transcription App - Project Context

**This file contains ALL project context and MUST be referenced for every command and decision.**

## 🚨 CRITICAL DEVELOPMENT PRINCIPLES

### 1. ALWAYS REFER TO PRD REQUIREMENTS
- **HACKATHON CONTEXT**: Keep things simple - don't overcomplicate
- Every decision must align with the PRD specifications
- If any requirement is unclear, ask for clarification before proceeding
- If there are multiple possible interpretations, ask which is correct
- If implementation details are missing, ask for specific requirements
- Never make assumptions about unclear aspects

### 2. CHECK FOR CONFLICTING LOGIC
- Before implementing any feature, verify it aligns with the PRD
- Check that new code doesn't conflict with existing requirements
- Ensure data structures match the defined schema exactly
- Verify API endpoints follow the specified patterns
- Confirm UI flows match the documented user stories

### 3. TEST-DRIVEN DEVELOPMENT (TDD) - HACKATHON APPROACH
- Write integration tests BEFORE implementing features
- **Focus on critical user flows only** - not comprehensive unit tests
- Test main paths: recording → transcription → save, search → profile, category management
- Use pytest for backend, Jest for frontend
- Tests should verify end-to-end functionality
- **Keep tests simple and functional** - avoid over-engineering

### 4. VALIDATE AGAINST PRD AND TASKS
- Every code change must align with the PRD requirements
- Check that implementation matches the task specifications exactly
- Ensure no features are added that aren't in scope
- Verify all required fields and validations are implemented
- Confirm danger scoring follows the exact formula

### 5. HACKATHON SIMPLIFICATION RULES
- **Use the simplest solution that works**
- **Avoid premature optimization**
- **Focus on demo functionality over production polish**
- **Use hardcoded values where appropriate for demo**
- **Skip complex error handling for MVP**
- **Prioritize working features over perfect code**
- **Reference PRD requirements constantly**

---

## 📋 PROJECT OVERVIEW

**Product**: Mobile voice transcription app for SF homeless street workers
**Goal**: Replace manual data entry with voice-based documentation
**Tech Stack**: React Native Expo (iOS) + FastAPI + Supabase + OpenAI
**Timeline**: 36-hour hackathon implementation

### Core Value Proposition
- Reduce documentation time from hours to minutes
- Create searchable database of homeless individuals
- Enable real-time access to individual histories
- Provide automated danger assessment for worker safety

---

## 🎯 USER STORIES

1. **Street Worker**: Speak observations → Quick documentation without writing
2. **Street Worker**: Manual entry when voice recording inappropriate
3. **Street Worker**: Search previous individuals → Review history before approach
4. **Street Worker**: See danger assessment → Take safety precautions
5. **Team Lead**: Customize data categories → Collect specific program needs
6. **Street Worker**: Edit AI-categorized info → Ensure accuracy
7. **Program Coordinator**: Export data to CSV → Analyze trends

---

## 🔧 FUNCTIONAL REQUIREMENTS

### 1. Voice Recording Interface
- **Duration**: 10-second minimum, 2-minute maximum
- **Display**: Live counter "0:45 / 2:00", red text after 1:30
- **Warnings**: Modal at 1:45, auto-stop at 2:00
- **Format**: M4A with AAC codec, 64kbps (~1MB for 2 minutes)
- **Location**: Capture GPS when recording starts
- **Playback**: Allow review before submission
- **Re-record**: Discard and create new file (no stitching)

### 2. Manual Entry Interface
- **Form**: All active categories with appropriate input types
- **Validation**: Required fields (Name, Height, Weight, Skin Color)
- **Numbers**: Positive integers only, max 300
- **Selects**: Must be from predefined options if selected
- **Location**: Capture GPS when form opens

### 3. AI Transcription & Categorization
- **Upload**: Compressed audio to Supabase Storage
- **Transcription**: OpenAI Whisper API
- **Categorization**: GPT-4o to extract into predefined fields
- **Processing**: Complete results at once (no streaming)
- **Validation**: Same rules as manual entry
- **Cleanup**: Delete audio after save confirmation

### 4. Duplicate Detection & Merging
- **Detection**: LLM compares all attributes for similarity
- **Confidence**: Score 0-100%
- **Auto-merge**: If ≥95% confidence
- **Manual merge**: UI for <95% confidence
- **Policy**: Latest values override older values

### 5. Individual Profile Management
- **Display**: Aggregated current data from all interactions
- **History**: Date/time, worker name, abbreviated address
- **Details**: All changed fields, full address, original transcription
- **Danger Score**: Color-coded (green/yellow/red)
- **Override**: Manual slider (0-100) with "Manual" indicator

### 6. Search Functionality
- **Search**: By name (partial match) and categorized data
- **Results**: Name, danger score, last seen date
- **Recent**: Last 10 viewed individuals
- **Performance**: <500ms for 2,000+ interactions

### 7. Category Customization
- **Types**: text, number, single-select, multi-select, date, location
- **Properties**: Name, type, priority, danger weight, auto-trigger, required
- **Select Options**: Single-select with danger values, multi-select with labels
- **Preset Categories**: Name, Gender, Height, Weight, Skin Color, Substance Abuse History
- **Limitation**: Create-only (no edit/delete in MVP)

### 8. Danger Assessment
- **Formula**: Weighted average of numeric and single-select fields
- **Numeric**: (value / 300) * weight
- **Single-select**: stored danger_value * weight
- **Auto-trigger**: Immediate score of 100
- **Display**: Override if set, otherwise calculated score
- **Colors**: 0-33 green, 34-66 yellow, 67-100 red

### 9. Location Tracking
- **Capture**: GPS coordinates when recording/entry starts
- **Storage**: {"lat": number, "lng": number} in database
- **Display**: Readable address via Google Maps reverse geocoding
- **Adjustment**: Draggable pin on map interface

### 10. Data Management
- **Tables**: individuals (current state), interactions (historical log)
- **Export**: CSV with all categories, danger score, last interaction date
- **Demo Data**: Pre-populated via SQL script

### 11. Authentication & User Management
- **Provider**: Supabase Auth with email/password
- **Demo**: Auto-login with hardcoded credentials (demo@sfgov.org / demo123456)
- **Flow**: Skip login screen, go straight to main navigation
- **Permissions**: All users have equal access

---

## 🗄️ DATABASE SCHEMA

### Individuals Table
```sql
CREATE TABLE individuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}', -- All categorized fields
  danger_score INTEGER DEFAULT 0,
  danger_override INTEGER, -- Manual override (NULL if not set)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Interactions Table
```sql
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id UUID REFERENCES individuals(id),
  user_id UUID REFERENCES auth.users(id),
  transcription TEXT, -- NULL for manual entries
  data JSONB NOT NULL DEFAULT '{}', -- Only changed fields
  location JSONB, -- {"lat": num, "lng": num}
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'text','number','single_select','multi_select','date','location'
  options JSONB, -- Options for select types
  priority TEXT DEFAULT 'medium', -- 'high','medium','low' (UI display only)
  danger_weight INTEGER DEFAULT 0, -- 0-100
  auto_trigger BOOLEAN DEFAULT false,
  is_preset BOOLEAN DEFAULT false, -- Cannot be deleted
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Preset Categories
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

---

## 🏗️ ARCHITECTURE

### Technology Stack
- **Frontend**: React Native Expo (iOS only)
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: OpenAI Whisper + GPT-4o
- **Maps**: Google Maps API
- **Deployment**: Railway.app

### API Endpoints (FastAPI)
```
POST   /api/upload-audio      - Upload to Supabase Storage
POST   /api/transcribe        - Process audio with AI
GET    /api/individuals       - List/search individuals
GET    /api/individuals/:id   - Get individual with history
POST   /api/individuals       - Create new (with duplicate check)
PUT    /api/individuals/:id   - Update (manual danger override)
POST   /api/interactions      - Log new interaction
GET    /api/categories        - List all active
POST   /api/categories        - Create new
GET    /api/export           - Generate CSV download
```

### Screen Structure (Tab Navigation)
1. **Record Tab** (camera icon) - Default after login
2. **Search Tab** (magnifying glass)
3. **Categories Tab** (settings icon)
4. **Profile Tab** (person icon)

---

## 📝 IMPLEMENTATION TASKS

### 🎯 YOUR ROLE: DEV 1 (Backend)
**You are Dev 1 and should ONLY work on Dev 1 tasks. Do NOT implement Dev 2 or Dev 3 tasks.**

### Dev 1 (Backend) - Hours 0-18 - **YOUR TASKS**
- [ ] Set up FastAPI + Supabase + Railway deployment
- [ ] Implement OpenAI Whisper transcription
- [ ] Build GPT-4o categorization with exact prompt
- [ ] Create danger score calculator
- [ ] Implement duplicate detection
- [ ] Build all API endpoints
- [ ] Write integration tests

### Dev 2 (Frontend Recording) - Hours 0-18 - **NOT YOUR TASKS**
- [ ] Set up Expo with TypeScript
- [ ] Build AudioRecorder with 2-minute limit
- [ ] Implement manual entry form
- [ ] Create transcription flow
- [ ] Build MergeUI for duplicates
- [ ] Add location capture
- [ ] Write integration tests

### Dev 3 (Frontend Data Management) - Hours 0-18 - **NOT YOUR TASKS**
- [ ] Set up tab navigation
- [ ] Build SearchScreen
- [ ] Create IndividualProfileScreen
- [ ] Implement DangerScore component
- [ ] Build CategoriesScreen
- [ ] Add CSV export
- [ ] Write integration tests

### All - Hours 18-36 - **COLLABORATIVE TASKS**
- [ ] Integration testing
- [ ] Demo data creation
- [ ] Bug fixes
- [ ] Demo preparation
- [ ] Final testing

---

## 🧪 TESTING STRATEGY

### Integration Tests (Critical Paths)
1. **Recording Flow**: Record → Upload → Transcribe → Save
2. **Manual Entry**: Form → Validation → Save
3. **Search Flow**: Search → Profile → Danger Override
4. **Category Management**: Create → Use → Danger Calculation
5. **Duplicate Handling**: Detection → Merge → Save

### Test Files
- `backend/tests/test_api_integration.py` - Backend integration tests
- `mobile/tests/App.integration.test.tsx` - Frontend integration tests

### Test Commands
- Backend: `pytest backend/tests/test_api_integration.py`
- Frontend: `npm test`

---

## 🎭 DEMO REQUIREMENTS

### Demo Data (10 individuals)
- Mix of danger scores (0-100)
- 3 with manual overrides
- Include: "John Doe" (75), "Sarah Smith" (20, override: 40), "Robert Johnson" (90)
- 20 interactions across SF locations
- Custom categories: Veteran Status, Medical Conditions, Housing Priority

### Demo Flow (5 minutes)
1. Voice recording → AI categorization → Save
2. Manual entry for comparison
3. Show merge flow with duplicate
4. Search for individual
5. View profile and history
6. Manual danger override
7. Export CSV

### Demo Audio Scripts
- "Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication."
- "Sarah by the library, approximately 35, 5 foot 4, 120 pounds, dark skin. Says she's in recovery, looking for shelter. Has two children staying with relatives."
- "Robert at Golden Gate Park. 55 years old, 5 foot 10, 200 pounds, medium skin tone. Veteran, mild substance issues. Applied for housing last week."

---

## 🚫 NON-GOALS (Out of Scope)

1. Face ID/facial recognition
2. Offline functionality
3. Multi-organization support
4. Role-based permissions
5. Integration with existing systems
6. Full HIPAA compliance
7. Android support
8. Multi-language support
9. Advanced analytics
10. Search by location/proximity
11. Edit/delete categories
12. Edit historical interactions
13. User profile management
14. Password reset flow

---

## 🔒 SECURITY (Hackathon Level)

### Authentication
- Supabase Auth with email/password
- Disable email confirmation
- Hardcoded demo credentials
- Auto-login for demo

### API Security
- Simple JWT validation (no signature verification for hackathon)
- CORS allowing all origins for demo
- No role-based permissions

### Data Protection
- Follow best practices (not full HIPAA compliance)
- Secure API keys in environment variables
- No sensitive data in client-side code

---

## 📊 SUCCESS METRICS

### Demo Success (Hackathon)
- Complete working demo in 36 hours
- All core features functional
- No crashes during presentation
- Clear value proposition demonstrated
- Fast processing times (<15 seconds total)

### Post-Implementation (if deployed)
- Reduce documentation time by 75%
- 90% adoption among street workers
- Process 2,000-15,000 interactions/month
- 95% accuracy in AI categorization
- <1% duplicate individuals in database

---

## 🚨 CRITICAL VALIDATION CHECKLIST

Before implementing ANY feature, verify:

### PRD Alignment
- [ ] Feature matches documented requirements
- [ ] Data structures follow defined schema
- [ ] API endpoints match specifications
- [ ] UI flows align with user stories
- [ ] Validation rules are correct

### Task Compliance
- [ ] Implementation follows task specifications
- [ ] Required fields are enforced
- [ ] Danger scoring uses exact formula
- [ ] Audio format is M4A with AAC codec
- [ ] Location is stored as lat/lng JSON

### No Scope Creep
- [ ] Feature is in scope (not in non-goals)
- [ ] No unnecessary complexity added
- [ ] Focus on MVP functionality
- [ ] Demo requirements are prioritized

### Test Coverage
- [ ] Integration test written for feature
- [ ] Critical user flow is tested
- [ ] Error cases are handled
- [ ] Performance requirements met

---

## 🔄 DEVELOPMENT WORKFLOW

### Task Execution Protocol
1. **Read this context file** before starting any work
2. **Ask questions** if anything is unclear
3. **Check for conflicts** with existing requirements
4. **Write tests first** (TDD approach)
5. **Implement feature** following PRD exactly
6. **Validate against checklist** before committing
7. **Test end-to-end** functionality
8. **Update this file** if requirements change

### Sub-Task Completion Protocol
**One sub-task at a time**: Do NOT start the next sub-task until you ask the user for permission and they say "yes" or "y"

**Completion sequence**:
1. **Mark completion**: When you finish a sub-task, immediately mark it as completed by changing `[ ]` to `[x]`
2. **Check parent completion**: If ALL subtasks underneath a parent task are now `[x]`, follow this sequence:
   - **First**: Run the full test suite (`pytest`, `npm test`, etc.)
   - **Only if all tests pass**: Stage changes (`git add .`)
   - **Clean up**: Remove any temporary files and temporary code before committing
   - **Commit**: Use a descriptive commit message that:
     - Uses conventional commit format (`feat:`, `fix:`, `refactor:`, etc.)
     - Summarizes what was accomplished in the parent task
     - Lists key changes and additions
     - References the task number and PRD context
     - Formats the message as a single-line command using `-m` flags, e.g.:
       ```bash
       git commit -m "feat: add payment validation logic" -m "- Validates card type and expiry" -m "- Adds unit tests for edge cases" -m "Related to T123 in PRD"
       ```
3. **Mark parent complete**: Once all subtasks are marked completed and changes have been committed, mark the parent task as completed
4. **Wait for permission**: Stop after each sub-task and wait for the user's go-ahead before proceeding

### Example Workflow
```
Task 1.1: Initialize FastAPI project
[x] Set up virtual environment
[x] Install dependencies
[x] Create main.py with basic FastAPI app
[x] Add health check endpoint
[x] Write integration test for health check
→ Run tests: pytest backend/tests/
→ Stage: git add .
→ Commit: git commit -m "feat: initialize FastAPI project structure" -m "- Sets up basic FastAPI app with health check" -m "- Adds integration test for health endpoint" -m "Related to Task 1.1 in PRD"
[x] Task 1.1: Initialize FastAPI project

→ Ask user: "Task 1.1 completed. Ready to proceed to Task 1.2?"
```

---

## 📞 CONTACT & CLARIFICATION

**If ANY aspect is unclear or ambiguous:**
- Ask for specific requirements
- Request clarification on implementation details
- Confirm data structure decisions
- Verify API endpoint specifications
- Check UI/UX requirements

**Never assume - always ask for clarification!**

---

*This file contains the complete project context and must be referenced for every development decision. All requirements, constraints, and specifications are documented here.* 