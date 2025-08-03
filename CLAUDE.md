# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Voice Transcription App for SF Homeless Outreach - a mobile app for social workers to document interactions with homeless individuals using voice transcription and AI categorization. Built for a 36-hour hackathon with 3 developers.

## HACKATHON MVP CONTEXT

**CRITICAL: This is a 36-hour hackathon project. We are building an MVP demo, not a production application.**

### Keep It Simple
- Do NOT overcomplicate any implementation
- Choose the simplest solution that meets PRD requirements
- No fancy patterns, no over-engineering, no "future-proofing"
- If it works for the demo, it's good enough
- Time is extremely limited - focus on working features

### Always Refer to PRD
- Every implementation decision must align with @prd-voice-transcription
- If the PRD doesn't require it, don't build it
- If the PRD specifies something, follow it exactly
- No assumptions - only what's written in the PRD
- When in doubt, check the PRD requirements

## Development Commands

### Backend (FastAPI)
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

### Frontend (React Native Expo)
```bash
# Start Expo development server
cd mobile && npm start

# Run tests
cd mobile && npm test

# Install dependencies
cd mobile && npm install

# Build for iOS
cd mobile && expo build:ios
```

### Database (Supabase)
```bash
# Run migrations
supabase db push

# Seed demo data
supabase db seed
```

## Architecture

### Backend Structure
- **FastAPI** server handles all API logic (not Supabase Edge Functions)
- **OpenAI Integration**: Whisper for transcription, GPT-4o for categorization
- **Database**: PostgreSQL via Supabase with JSONB for flexible data storage
- **Auth**: Supabase Auth with hardcoded demo credentials
- **Storage**: Supabase Storage for audio files (auto-delete after 24 hours)

### Frontend Structure
- **React Native Expo** for iOS mobile app
- **Tab Navigation**: Record (default), Search, Categories, Profile
- **Auto-login** with demo@sfgov.org / demo123456
- **Audio**: M4A format, AAC codec, 64kbps, 2-minute limit
- **No offline support** - requires constant internet

### Key Database Tables
- `individuals`: Current aggregated state per person
- `interactions`: Historical log of changes only
- `categories`: Dynamic field definitions with danger weights

## Critical Requirements from PRD

### Voice Recording
- Minimum 10 seconds, maximum 2 minutes
- Show live duration counter, red text after 1:30
- Auto-stop at 2:00 with warning modal at 1:45
- Capture GPS location at recording start

### Required Fields
Always validate these fields are present:
- Name (text) - required
- Height (number, 0-300) - required  
- Weight (number, 0-300) - required
- Skin Color (single-select: Light/Medium/Dark) - required

### Danger Score Calculation
- Only `number` and `single_select` types can have danger weights
- Auto-trigger fields immediately set score to 100
- Formula: (value/300 * weight) for numbers, (option_value * weight) for selects
- Manual override via slider sets `danger_override` field
- Display: Show override if set, otherwise calculated score

### Duplicate Detection
- LLM compares all attributes, returns confidence 0-100%
- Auto-merge prompted to front end if confidence ≥ 95%
- Show merge UI for confidence < 95%
- Latest values override older values

### AI Prompts
When categorizing transcriptions, use exact prompt from PRD:
```
Extract information from this transcription into these categories:
{list of categories with types and required flags}

Rules:
- Always attempt to extract required fields: Name, Height, Weight, Skin Color
- For skin color, map descriptions to Light/Medium/Dark
- Return null for missing non-required information

Return JSON only.
```

## Development Principles

### Ask Questions When Ambiguous
- If implementation details are unclear, ask for clarification
- Check that new code doesn't conflict with PRD requirements
- Verify changes align with the task list priorities

### Test-Driven Development
- Write integration tests first for critical paths
- Backend: pytest for API endpoints
- Frontend: Jest for user flows
- Focus on end-to-end testing, not unit tests (hackathon constraint)

### Check for Conflicts
Before implementing features:
- Verify against PRD specifications
- Check task list for developer assignments
- Ensure no duplicate or conflicting logic
- Validate data flow matches architecture

### Hackathon Shortcuts
- No email verification
- Hardcoded demo credentials
- Simple JWT validation (no signature check)
- CORS allow all origins
- Basic error toasts only
- No loading skeletons (just spinners)

## Common Pitfalls to Avoid

1. **Don't assume libraries exist** - Always check package.json/requirements.txt
2. **Required fields must be validated** - Name, Height, Weight, Skin Color
3. **Danger score only for number/single-select** - Not for text, multi-select, date, location
4. **Audio must be M4A format** - Not MP3 or WAV
5. **No offline mode** - App requires internet connection
6. **Auto-login is mandatory** - Skip login screen entirely
7. **Categories can't be edited/deleted** - Create-only in MVP

## Task Assignments

- **Dev 1**: Backend infrastructure, APIs, AI integration
- **Dev 2**: Frontend recording features, audio handling
- **Dev 3**: Frontend data management, search, profiles

## Task Context
- You are now Dev 1, 2, annd 3. You may work on all tasks.

**IMPORTANT: You are Dev 1. Only work on tasks marked [Dev 1]. Do not work on [Dev 2] or [Dev 3] tasks.**

## Important: File References

In every command, always refer to:
- @prd-voice-transcription - Contains all product requirements and specifications
- @tasks-voice-transcription.md - Contains the complete task breakdown and assignments

These files are the source of truth for all implementation decisions.

## Subtask Completion Protocol

When working through tasks, follow this strict protocol:

### One Sub-task at a Time
- Do NOT start the next sub-task until you ask the user for permission and they say "yes" or "y"
- Stop after each sub-task and wait for the user's go-ahead

### Completion Protocol

1. **When you finish a sub-task**, immediately mark it as completed by changing `[ ]` to `[x]` in the tasks file

2. **If all subtasks underneath a parent task are now `[x]`**, follow this sequence:
   - **First**: Run the full test suite
     - Backend: `cd backend && pytest tests/test_api_integration.py`
     - Frontend: `cd mobile && npm test`
   - **Only if all tests pass**: Stage changes with `git add .`
   - **Clean up**: Remove any temporary files and temporary code before committing
   - **Commit**: Use a descriptive commit message that:
     - Uses conventional commit format (feat:, fix:, refactor:, etc.)
     - Summarizes what was accomplished in the parent task
     - Lists key changes and additions
     - References the task number and PRD context
     - Formats the message as a single-line command using -m flags
     - Example: `git commit -m "feat: add payment validation logic" -m "- Validates card type and expiry" -m "- Adds unit tests for edge cases" -m "Related to T123 in PRD"`

3. **Once all the subtasks are marked completed and changes have been committed**, mark the parent task as completed with `[x]`

## Dev Environment Best Practices

### Running Commands
- Always use port 8001 instead of port 8000
- Always use python3 instead of pip or python
- When testing, make sure to add a reasonable exit case so that it does not stay stuck in the test