# Task 2.0 Test Cases and Outcomes

## Overview
This document outlines test cases and expected outcomes for Task 2.0 - AI Transcription and Categorization Services.
Reference: @prd-voice-transcription-homeless-outreach.md and @tasks-voice-transcription.md

**Important**: 
- Keep implementations simple for hackathon MVP (per CLAUDE.md)
- No streaming - return complete results
- Conservative extraction - only extract explicitly stated information

---

## Prerequisite: Minimal Categories API

### PRD Context
- Lines 119-138: Category system with preset and custom categories
- Lines 724-739: Categories must be dynamically included in GPT-4 prompt

### Expected Outcome
```python
# GET /api/categories
# Returns all categories (preset + custom) for dynamic prompt generation
{
  "categories": [
    {
      "id": "uuid",
      "name": "height",
      "type": "number",
      "is_required": true,
      "options": null,
      "danger_weight": 0,
      "auto_trigger": false
    },
    {
      "name": "skin_color",
      "type": "single_select",
      "is_required": true,
      "options": [
        {"label": "Light", "value": 0},
        {"label": "Medium", "value": 0},
        {"label": "Dark", "value": 0}
      ],
      "danger_weight": 0,
      "auto_trigger": false
    }
  ]
}
```

### Test Cases
- [x] GET /api/categories returns 200
- [x] Returns all 6 preset categories
- [x] Returns any custom categories added
- [x] Each category has all required fields
- [x] Options field populated correctly for select types

---

## 2.1 Create OpenAI Service with Whisper Transcription

### PRD Context
- Lines 72, 76: Audio transcription using Whisper, M4A format only
- Lines 62-64: 10 second minimum, 2 minute maximum
- Line 382: Audio stored in Supabase Storage
- Lines 728-730: Whisper API implementation

### Expected Outcomes
1. **Function**: `transcribe_audio(audio_url: str) -> str`
2. **Process**:
   - Download M4A file from Supabase URL
   - Send to OpenAI Whisper API
   - Return plain text transcription
3. **Error Handling**:
   - Invalid URL format
   - File not found
   - Audio too short/long
   - Non-M4A format

### Implementation Plan
```python
# services/openai_service.py
async def transcribe_audio(audio_url: str) -> str:
    # 1. Download audio from Supabase Storage
    # 2. Validate M4A format
    # 3. Send to Whisper API
    # 4. Return transcription text
```

### Test Cases
- [x] Transcribe valid M4A file from Supabase URL
- [x] Handle audio shorter than 10 seconds - return error
- [x] Handle audio longer than 2 minutes - return error  
- [x] Handle non-M4A format - return error
- [x] Handle invalid Supabase URL - return error
- [x] Handle network timeout gracefully
- [x] Verify transcription accuracy with test audio:
  - "Met John near Market Street. About 6 feet tall, maybe 180 pounds. Light skin."

---

## 2.2 Implement GPT-4o Categorization

### PRD Context
- Lines 75-78: LLM extracts structured data from transcription
- Lines 131-137: Required fields (Name, Height, Weight, Skin Color)
- Lines 724-739: Exact prompt template
- Line 735: "Be conservative - only extract explicitly stated info"

### Expected Outcomes
1. **Function**: `categorize_transcription(transcription: str, categories: list) -> dict`
2. **Dynamic Prompt Generation**:
   ```
   Extract information from this transcription into these categories:
   - name (text, required)
   - height (number, required) 
   - weight (number, required)
   - skin_color (single_select: Light/Medium/Dark, required)
   [... dynamic categories ...]
   
   Rules:
   - Always attempt to extract required fields: Name, Height, Weight, Skin Color
   - For skin color, map descriptions to Light/Medium/Dark
   - Return null for missing non-required information
   
   Transcription: {transcription}
   
   Return JSON only.
   ```

### Implementation Plan
```python
# services/openai_service.py
async def categorize_transcription(transcription: str, categories: list) -> dict:
    # 1. Build dynamic prompt with all categories
    # 2. Call GPT-4o API
    # 3. Parse JSON response
    # 4. Return categorized data
```

### Test Cases
- [x] Extract all required fields when present in transcription
- [x] Return null for missing optional fields
- [x] Map skin color descriptions correctly (e.g., "pale" → "Light", "dark complexion" → "Dark")
- [x] Handle height in different formats (e.g., "6 feet" → 72, "5'10\"" → 70)
- [x] Handle weight descriptions (e.g., "about 180 pounds" → 180)
- [x] Extract custom categories when mentioned
- [x] Ignore information not matching any category
- [x] Handle malformed GPT response gracefully
- [x] Test with transcription: "Met Sarah Smith, she's about 5 foot 4, maybe 120 pounds, dark skin. Says she's a veteran."
  - Should extract: name="Sarah Smith", height=64, weight=120, skin_color="Dark", veteran_status="Yes" (if custom category exists)

---

## 2.3 Implement Danger Score Calculator

### PRD Context
- Lines 85-88, 139-148: Danger score calculation formula
- Line 144: Only number and single-select types can have danger weights
- Line 154: Auto-trigger categories immediately set score to 100
- Lines 142-143: Specific formulas for calculation

### Expected Outcomes
1. **Function**: `calculate_danger_score(individual_data: dict, categories: list) -> int`
2. **Calculation Logic**:
   - Auto-trigger: If value exists AND auto_trigger=true → return 100
   - Numbers: `(value / 300) * weight`
   - Single-select: `option_value * weight`
   - Ignore text, multi-select, date, location types
   - Final: `(sum of weighted values / sum of weights) * 100`

### Implementation Plan
```python
# services/danger_calculator.py
def calculate_danger_score(individual_data: dict, categories: list) -> int:
    # 1. Check for auto-trigger categories
    # 2. Calculate weighted values for each category
    # 3. Sum and normalize to 0-100
    # 4. Return integer score
```

### Test Cases
- [x] Auto-trigger category with value returns 100 immediately
- [x] Number field: height=72, weight=50 → (72/300)*50 = 12
- [x] Single-select: option with value=0.8, weight=50 → 0.8*50 = 40
- [x] Combined calculation: [(12 + 40) / (50 + 50)] * 100 = 52
- [x] Missing values treated as 0
- [x] Text fields ignored even with danger_weight set
- [x] Multi-select fields ignored
- [x] All zero weights returns 0 (not divide by zero)
- [x] Test data:
  - Individual with height=90 (weight=30), homeless_risk="High" (value=0.9, weight=70)
  - Expected: [(90/300*30) + (0.9*70)] / (30+70) * 100 = 72

---

## 2.4 Create Duplicate Detection

### PRD Context
- Lines 112-117: Duplicate detection using LLM
- Lines 751-763: Compare all attributes, return confidence
- Line 115: Auto-merge if confidence ≥ 95%
- Line 116: Show merge UI for confidence < 95%

### Expected Outcomes
1. **Function**: `find_duplicates(new_data: dict, existing_individuals: list) -> list`
2. **LLM Prompt**:
   ```
   Compare these two individuals and return a confidence score (0-100) 
   that they are the same person based on all attributes:
   
   Person 1: {new_data}
   Person 2: {existing}
   
   Consider name similarity, physical attributes, and other characteristics.
   Return only a number 0-100.
   ```

### Implementation Plan
```python
# services/openai_service.py
async def find_duplicates(new_data: dict, existing_individuals: list) -> list:
    # 1. For each existing individual
    # 2. Call GPT-4 to compare attributes
    # 3. Parse confidence score
    # 4. Return matches sorted by confidence
```

### Test Cases
- [x] Exact match returns 100% confidence
- [x] Similar name + same physical attributes returns >90%
- [x] Different name but same attributes returns 70-90%
- [x] Completely different individuals returns <30%
- [x] Handle empty existing_individuals list
- [x] Return matches sorted by confidence (highest first)
- [x] Test scenarios:
  - "John Doe" vs "John D." with same height/weight → ~95%
  - "John Smith" vs "John Smith" different attributes → ~60%
  - "Sarah Jones" vs "Michael Brown" → <20%
- [x] Auto-merge threshold: confidence ≥ 95% (for frontend to handle)

---

## 2.5 Build /api/transcribe Endpoint

### PRD Context
- Lines 382-428: API endpoint specification
- Line 428: "Returns complete results (no streaming)"
- Lines 97-99: Required fields validation
- Lines 114-116: Duplicate detection integration

### Expected Outcomes
1. **Endpoint**: `POST /api/transcribe`
2. **Request Body**:
   ```json
   {
     "audio_url": "https://...supabase.co/storage/v1/object/public/audio/...",
     "location": {
       "latitude": 37.7749,
       "longitude": -122.4194
     }
   }
   ```
3. **Response**:
   ```json
   {
     "transcription": "Met John near Market Street...",
     "categorized_data": {
       "name": "John",
       "height": 72,
       "weight": 180,
       "skin_color": "Light"
     },
     "missing_required": ["weight"],
     "potential_matches": [
       {
         "id": "uuid",
         "confidence": 89,
         "name": "John Doe"
       }
     ]
   }
   ```

### Implementation Plan
```python
# api/transcription.py
@router.post("/api/transcribe")
async def transcribe_audio_endpoint(
    request: TranscribeRequest,
    user_id: str = Depends(get_current_user)
):
    # 1. Fetch all categories
    # 2. Transcribe audio
    # 3. Categorize transcription
    # 4. Validate required fields
    # 5. Find potential duplicates
    # 6. Return complete results
```

### Test Cases
- [x] Valid audio URL returns successful transcription
- [x] Missing audio_url returns 400
- [x] Invalid audio URL format returns 400
- [x] Unauthorized request returns 401
- [x] Transcription includes all extracted data
- [x] Missing required fields listed in response
- [x] Potential matches include confidence scores
- [x] Location saved with request (for interaction record)
- [x] Integration test with real M4A file
- [x] Response time < 10 seconds for 2-minute audio

---

## 2.6 Add Validation Helper

### PRD Context
- Lines 131-137: Required fields and validation rules
- Lines 134-135: Height/Weight max 300
- Line 136: Skin color must be Light/Medium/Dark
- Lines 97-99: Required field validation

### Expected Outcomes
1. **Function**: `validate_categorized_data(data: dict, categories: list) -> ValidationResult`
2. **Validation Rules**:
   - Check all required fields present
   - Validate number ranges (0-300)
   - Validate single-select options
   - Return missing fields and validation errors

### Implementation Plan
```python
# services/validation_helper.py
def validate_categorized_data(data: dict, categories: list) -> ValidationResult:
    # 1. Check required fields
    # 2. Validate field types
    # 3. Validate ranges and options
    # 4. Return errors and missing fields
```

### Test Cases
- [x] All required fields present passes validation
- [x] Missing required field returns in missing_required list
- [x] Height > 300 returns validation error
- [x] Weight < 0 returns validation error
- [x] Invalid skin_color option returns error
- [x] Valid single-select option passes
- [x] Text field with any value passes
- [x] Multi-select with valid options passes
- [x] Empty data returns all required fields as missing
- [x] Test data:
  - Valid: {name: "John", height: 72, weight: 180, skin_color: "Light"}
  - Invalid: {name: "John", height: 400, weight: -10, skin_color: "Blue"}

---

## 2.7 Write Integration Test

### PRD Context
- Complete flow from audio to validated data
- Lines 72-78: Full transcription pipeline
- Lines 112-117: Including duplicate detection

### Expected Outcomes
1. **Test the complete flow**:
   - Upload M4A → Transcribe → Categorize → Validate → Find duplicates
2. **Use real test audio files**
3. **Verify all components work together**

### Test Cases
- [x] Complete flow with valid M4A file
- [x] Audio with all required fields mentioned
- [x] Audio missing some required fields
- [x] Audio mentioning custom category
- [x] Duplicate detection with existing data
- [x] Performance: < 10 seconds for 1-minute audio
- [x] Error handling at each step
- [x] Test audio samples:
  1. "Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months."
  2. "Sarah by the library, approximately 35, 5 foot 4, 120 pounds, dark skin. Says she's in recovery, looking for shelter."
  3. "Robert at Golden Gate Park. 55 years old, 5 foot 10, 200 pounds, medium skin tone. Veteran, mild substance issues."

---

## Integration Test After All Subtasks

### Final Verification
1. **API Flow Test**:
   - [ ] GET /api/categories returns all categories
   - [ ] POST /api/transcribe with test M4A file
   - [ ] Response includes transcription text
   - [ ] Response includes categorized data
   - [ ] Response lists any missing required fields
   - [ ] Response includes potential matches with confidence
   - [ ] Danger score calculated correctly

2. **Performance Requirements**:
   - [ ] 30-second audio processes in < 5 seconds
   - [ ] 2-minute audio processes in < 10 seconds
   - [ ] Handles concurrent requests

3. **Error Scenarios**:
   - [ ] Invalid audio format rejected
   - [ ] Network timeout handled gracefully
   - [ ] OpenAI API errors returned clearly
   - [ ] Database errors handled

## Questions to Clarify:

1. **Audio Storage Access**: 
   - How should we handle Supabase Storage authentication for downloading audio files?
   - Should we use the service key or user's token?

2. **Duplicate Detection Scope**:
   - Should we search all individuals or only those created by the current user?
   - How many existing individuals should we compare against (performance concern)?

3. **Error Response Format**:
   - What specific error format should we use for validation errors?
   - Should we follow a standard like JSON API errors?

4. **GPT-4 Model Version**:
   - Should we use `gpt-4-1106-preview` or `gpt-4-0125-preview`?
   - Any token limit concerns for large category lists?