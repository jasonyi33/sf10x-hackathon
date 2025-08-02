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