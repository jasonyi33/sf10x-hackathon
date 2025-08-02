# Task 1.0 Test Cases and Outcomes

## Overview
This document outlines all test cases and expected outcomes for Task 1.0 - Backend Infrastructure Setup.
Reference: @prd-voice-transcription-homeless-outreach.md and @tasks-voice-transcription.md

---

## 1.1 Initialize FastAPI Project with Dependencies

### PRD Context
- Lines 250, 261-266: FastAPI chosen for better control over AI orchestration
- Lines 391-428, 710-720: Sample code structure provided

### Expected Outcomes
1. **Project Structure Created**:
   ```
   backend/
   ├── main.py
   ├── requirements.txt
   ├── .env.example
   ├── api/
   │   ├── __init__.py
   │   ├── auth.py
   │   ├── transcription.py
   │   ├── individuals.py
   │   └── categories.py
   ├── services/
   │   ├── __init__.py
   │   ├── openai_service.py
   │   └── danger_calculator.py
   ├── db/
   │   ├── __init__.py
   │   └── models.py
   └── tests/
       └── test_api_integration.py
   ```

2. **Dependencies in requirements.txt**:
   ```
   fastapi==0.104.1
   uvicorn==0.24.0
   python-jose==3.3.0
   httpx==0.25.1
   openai==1.3.5
   python-multipart==0.0.6
   pytest-asyncio==0.21.1
   supabase==2.0.0
   pydantic==2.5.0
   python-dotenv==1.0.0
   ```

### Test Cases
- [ ] Run `pip install -r requirements.txt` - all packages install without errors
- [ ] Run `python -m pytest --version` - pytest is available
- [ ] Create basic `main.py` with health check endpoint
- [ ] Run `uvicorn main:app --reload` - server starts on port 8001
- [ ] Access `http://localhost:8001/health` - returns `{"status": "ok"}`
- [ ] Access `http://localhost:8001/docs` - FastAPI docs load

---

## 1.2 Create Supabase Project and Configure Environment Variables

### PRD Context
- Lines 253-255: Supabase for database, auth, and storage
- Lines 181-183, 521-523: Demo credentials specified

### Expected Outcomes
1. **Supabase Project Created** with:
   - Project name: `sf-homeless-outreach-hackathon`
   - Region: US West
   - Database password saved securely

2. **.env File Created**:
   ```env
   # Supabase
   SUPABASE_URL=https://[project-id].supabase.co
   SUPABASE_ANON_KEY=[anon-key]
   SUPABASE_SERVICE_KEY=[service-key]
   
   # OpenAI
   OPENAI_API_KEY=[your-openai-key]
   
   # Demo Credentials (for reference)
   DEMO_EMAIL=demo@sfgov.org
   DEMO_PASSWORD=demo123456
   ```

3. **.env.example File Created** (without sensitive values)

### Test Cases
- [ ] Supabase project accessible via dashboard
- [ ] Environment variables load in Python: `from dotenv import load_dotenv`
- [ ] Can connect to Supabase from Python using the credentials
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` exists with placeholder values

---

## 1.3 Write and Run Initial Schema Migration

### PRD Context
- Lines 282-324: Exact database schema provided
- Lines 320-323: Performance indexes specified

### Expected Outcomes
1. **Migration File**: `supabase/migrations/001_initial_schema.sql`
   ```sql
   -- Individuals table: Current state
   CREATE TABLE individuals (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     data JSONB NOT NULL DEFAULT '{}',
     danger_score INTEGER DEFAULT 0,
     danger_override INTEGER,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Interactions table: Historical log
   CREATE TABLE interactions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     individual_id UUID REFERENCES individuals(id),
     user_id UUID REFERENCES auth.users(id),
     transcription TEXT,
     data JSONB NOT NULL DEFAULT '{}',
     location JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Categories table: Dynamic fields
   CREATE TABLE categories (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT UNIQUE NOT NULL,
     type TEXT NOT NULL,
     options JSONB,
     priority TEXT DEFAULT 'medium',
     danger_weight INTEGER DEFAULT 0,
     auto_trigger BOOLEAN DEFAULT false,
     is_preset BOOLEAN DEFAULT false,
     is_required BOOLEAN DEFAULT false,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Indexes for performance
   CREATE INDEX idx_individuals_name ON individuals(name);
   CREATE INDEX idx_individuals_data ON individuals USING GIN(data);
   CREATE INDEX idx_interactions_individual ON interactions(individual_id);
   CREATE INDEX idx_interactions_created ON interactions(created_at);
   ```

### Test Cases
- [ ] Migration file created in correct location
- [ ] Run migration: `supabase db push`
- [ ] Verify all 3 tables exist in Supabase dashboard
- [ ] Verify all indexes are created
- [ ] Test inserting a record into each table
- [ ] Verify foreign key constraints work
- [ ] Check JSONB columns accept JSON data

---

## 1.4 Run Preset Categories Migration

### PRD Context
- Lines 131-137: Exact preset categories specified
- Task list lines 54-66: SQL provided

### Expected Outcomes
1. **Migration File**: `supabase/migrations/002_preset_categories.sql`
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

### Test Cases
- [ ] Migration file created
- [ ] Run migration: `supabase db push`
- [ ] Query categories table: exactly 6 preset records
- [ ] Verify required fields: `name`, `height`, `weight`, `skin_color` have `is_required=true`
- [ ] Verify all have `is_preset=true`
- [ ] Verify options JSON structure is correct for select types
- [ ] Verify multi-select has array format, single-select has object format

---

## 1.5 Create Demo User in Supabase Auth

### PRD Context
- Lines 182-183: Disable email confirmation
- Lines 521-523: Demo credentials specified

### Expected Outcomes
1. **Demo User Created**:
   - Email: `demo@sfgov.org`
   - Password: `demo123456`
   - Email verified: Yes (manually set)
   - User metadata: `{"name": "Demo User"}`

### Test Cases
- [ ] Email confirmation disabled in Supabase Auth settings
- [ ] User created in Supabase Auth dashboard
- [ ] Can authenticate via Supabase client library
- [ ] JWT token returned contains user ID
- [ ] Token works with Supabase Row Level Security

---

## 1.6 Set up Supabase Storage Bucket

### PRD Context
- Lines 76, 255: Audio storage with 24-hour lifecycle
- Lines 382, 117: Storage path format specified

### Expected Outcomes
1. **Storage Bucket Created**:
   - Name: `audio`
   - Public: No (authenticated access only)
   - Allowed file types: `.m4a`
   - Max file size: 5MB

2. **Lifecycle Policy**:
   - Delete files older than 24 hours
   - Run daily

### Test Cases
- [ ] Bucket visible in Supabase Storage dashboard
- [ ] Upload test file via dashboard succeeds
- [ ] File accessible via public URL with auth
- [ ] Lifecycle policy configured and visible
- [ ] Test file path: `audio/{user_id}/{timestamp}.m4a`

---

## 1.7 Implement Simplified JWT Validation Middleware

### PRD Context
- Lines 711-720: Exact implementation provided
- Line 715: No signature verification for hackathon

### Expected Outcomes
1. **File Created**: `backend/api/auth.py`
   ```python
   from fastapi import Header, HTTPException, Depends
   import jwt

   async def get_current_user(authorization: str = Header()):
       try:
           token = authorization.replace('Bearer ', '')
           # For hackathon, just decode without full verification
           payload = jwt.decode(token, options={"verify_signature": False})
           return payload['sub']  # User ID
       except:
           raise HTTPException(status_code=401, detail="Invalid token")
   ```

### Test Cases
- [ ] Valid Supabase JWT passes validation
- [ ] Returns correct user ID from token
- [ ] Missing Authorization header returns 401
- [ ] Invalid token format returns 401
- [ ] Can use as dependency: `user_id: str = Depends(get_current_user)`

---

## 1.8 Create Basic CORS Configuration

### PRD Context
- Line 692: Allow all origins for demo
- Lines 137, 151: Basic error handling only

### Expected Outcomes
1. **CORS Middleware in main.py**:
   ```python
   from fastapi.middleware.cors import CORSMiddleware

   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Test Cases
- [ ] Browser requests from any origin succeed
- [ ] Preflight OPTIONS requests return proper headers
- [ ] Auth headers (Authorization) pass through
- [ ] Can call API from localhost:3000 (React dev)
- [ ] Can call API from Expo app

---

## 1.9 Deploy to Railway.app

### PRD Context
- Task list: Railway provides instant URL
- Line 71: Health check endpoint needed

### Expected Outcomes
1. **Railway Configuration**: `railway.toml`
   ```toml
   [build]
   builder = "NIXPACKS"

   [deploy]
   startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
   ```

2. **Environment Variables Set in Railway**:
   - All from `.env` file
   - PORT automatically provided

3. **Deployed URL Format**: `https://[project-name].up.railway.app`

### Test Cases
- [ ] `railway login` succeeds
- [ ] `railway up` deploys successfully
- [ ] Health check at `https://[url]/health` returns 200
- [ ] FastAPI docs at `https://[url]/docs` accessible
- [ ] Environment variables load correctly
- [ ] Can make authenticated API call
- [ ] CORS headers present in responses

---

## Integration Test After All Subtasks

### Final Verification
1. **Local Testing**:
   - [ ] Start server: `uvicorn main:app --reload`
   - [ ] Health check returns ok
   - [ ] Can connect to Supabase
   - [ ] JWT middleware works with demo token

2. **Deployed Testing**:
   - [ ] Railway URL accessible
   - [ ] All environment variables working
   - [ ] Can authenticate with demo credentials
   - [ ] Database queries work

3. **Ready for Task 2.0**:
   - [ ] All API endpoint stubs ready
   - [ ] OpenAI integration ready to implement
   - [ ] Database schema supports all PRD features