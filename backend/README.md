# SF Homeless Outreach Backend API

FastAPI backend for the Voice Transcription App for SF Homeless Outreach.

## Overview

This backend provides APIs for:
- Audio transcription and AI categorization
- Individual homeless person data management
- Category management with danger score calculation
- Duplicate detection and merging

## Setup Instructions

### Prerequisites
- Python 3.11+
- Supabase account
- OpenAI API key
- Railway account (for deployment)

### Local Development

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Required environment variables:**
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_KEY` - Supabase service role key
   - `OPENAI_API_KEY` - OpenAI API key for Whisper and GPT-4
   - `DEMO_EMAIL` - Demo user email (demo@sfgov.org)
   - `DEMO_PASSWORD` - Demo user password (demo123456)

4. **Run the development server:**
   ```bash
   uvicorn main:app --reload --port 8001
   ```

5. **Access the API:**
   - API: http://localhost:8001
   - Docs: http://localhost:8001/docs
   - Health: http://localhost:8001/health

## API Endpoints

### Currently Implemented (Task 1.0)
- `GET /` - API info and status
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation

### To Be Implemented (Task 2.0+)
- `POST /api/transcribe` - Transcribe audio and categorize
- `GET /api/individuals` - List individuals
- `POST /api/individuals` - Create/update individual
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/export` - Export to CSV

## Database Schema

### Tables
1. **individuals** - Current state of each person
   - `id` (UUID)
   - `name` (TEXT)
   - `data` (JSONB) - All categorized fields
   - `danger_score` (INTEGER)
   - `danger_override` (INTEGER)

2. **interactions** - Historical log of changes
   - `id` (UUID)
   - `individual_id` (UUID)
   - `user_id` (UUID)
   - `transcription` (TEXT)
   - `data` (JSONB) - Only changed fields
   - `location` (JSONB)

3. **categories** - Dynamic field definitions
   - `id` (UUID)
   - `name` (TEXT)
   - `type` (TEXT) - text, number, single_select, multi_select, date, location
   - `options` (JSONB)
   - `danger_weight` (INTEGER)
   - `auto_trigger` (BOOLEAN)
   - `is_required` (BOOLEAN)

## Testing

Run tests with:
```bash
pytest tests/test_api_integration.py
```

## Deployment

### Railway Deployment

1. **Login to Railway:**
   ```bash
   railway login
   ```

2. **Link to project:**
   ```bash
   railway link
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

4. **Set environment variables in Railway dashboard**

### Configuration Files
- `Procfile` - Defines the web process
- `railway.toml` - Railway-specific configuration
- `runtime.txt` - Python version specification

## Architecture Notes

- **FastAPI** chosen over Supabase Edge Functions for better AI integration control
- **JWT validation** simplified (no signature verification) for hackathon
- **CORS** configured to allow all origins (*) for demo purposes
- **Storage** uses Supabase Storage with 24-hour auto-deletion for audio files

## Development Guidelines

- Keep it simple - this is a hackathon MVP
- Follow existing code patterns
- Test critical paths with integration tests
- Use environment variables for all configuration
- Document any new endpoints in this README

## Current Status

✅ Task 1.0 Complete - Backend infrastructure
- FastAPI setup with proper structure
- Supabase integration (database, auth, storage)
- JWT authentication middleware
- CORS configuration
- Railway deployment

🚧 Task 2.0 Next - AI Integration
- OpenAI Whisper transcription
- GPT-4 categorization
- Danger score calculation
- Duplicate detection