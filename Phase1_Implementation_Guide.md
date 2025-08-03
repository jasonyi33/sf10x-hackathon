# Phase 1 Implementation Guide: Database & Age Requirement
## Dev 1 Tasks - Hours 1-2

This guide details the requirements and test cases for Phase 1 implementation, focusing on database changes and age field requirements.

---

## Task 1.1: Create and Run Migration File (004_add_photos_age.sql)

### Requirements
1. **Photo Storage Columns**
   - Add `photo_url TEXT` column to individuals table
   - Add `photo_history JSONB DEFAULT '[]'::jsonb` column to individuals table
   
2. **Photo Consent Table**
   - Create new `photo_consents` table with:
     - `id` (UUID primary key)
     - `individual_id` (foreign key to individuals)
     - `photo_url` (TEXT NOT NULL)
     - `consented_by` (foreign key to auth.users)
     - `consented_at` (TIMESTAMP)
     - `consent_location` (JSONB for GPS coordinates)
     - `created_at` (TIMESTAMP)

3. **Age Category Setup**
   - Insert `approximate_age` as a required preset category
   - Type: 'range'
   - Options: `{"min": 0, "max": 120, "default": "Unknown"}`
   - `is_required`: true
   - `is_preset`: true
   - `priority`: 'high'
   - `danger_weight`: 0 (age does NOT affect danger score)

4. **Data Migration**
   - Update ALL existing individuals with `approximate_age: [-1, -1]`
   - Use `jsonb_set` to preserve existing data structure
   
5. **Performance Indexes**
   - Create index on `individuals.photo_url`
   - Create index on `photo_consents.individual_id`
   - Create index on age field in JSONB: `((data->>'approximate_age'))`

### Test Cases
```sql
-- Test 1: Verify photo columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'individuals' 
AND column_name IN ('photo_url', 'photo_history');
-- Expected: 2 rows with correct data types

-- Test 2: Verify photo_consents table exists with all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'photo_consents'
ORDER BY ordinal_position;
-- Expected: All 6 columns with correct types and constraints

-- Test 3: Verify approximate_age category was added
SELECT * FROM categories WHERE name = 'approximate_age';
-- Expected: 1 row with type='range', is_required=true, is_preset=true

-- Test 4: Verify all individuals have age field set to [-1, -1]
SELECT COUNT(*) as total,
       COUNT(CASE WHEN data->>'approximate_age' = '[-1, -1]' THEN 1 END) as with_age
FROM individuals;
-- Expected: total = with_age (all records have age field)

-- Test 5: Verify indexes were created
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('individuals', 'photo_consents') 
AND indexname LIKE 'idx_%';
-- Expected: 3 indexes (idx_individuals_photo, idx_consent_individual, idx_individuals_age)
```

---

## Task 1.2: Create Photos Bucket in Supabase Storage

### Requirements
1. **Bucket Configuration**
   - Name: `photos`
   - Public access enabled (but auth still required)
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg`, `image/png`
   
2. **Storage Rules**
   - No lifecycle rules (photos kept indefinitely)
   - Path structure: `{user_id}/{timestamp}.jpg`
   
3. **Security**
   - Authenticated users can upload
   - Public can read (for app display)

### Test Cases
```javascript
// Test 1: Verify bucket exists and is public
const { data: buckets } = await supabase.storage.listBuckets();
const photosBucket = buckets.find(b => b.name === 'photos');
console.assert(photosBucket?.public === true, 'Photos bucket should be public');

// Test 2: Test file upload with size validation
const largeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
const { error } = await supabase.storage.from('photos').upload('test/large.jpg', largeFile);
console.assert(error?.message.includes('5MB'), 'Should reject files over 5MB');

// Test 3: Test allowed file types
const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
const { error: typeError } = await supabase.storage.from('photos').upload('test/text.txt', textFile);
console.assert(typeError !== null, 'Should reject non-image files');

// Test 4: Test successful upload
const validFile = new File([new ArrayBuffer(1024)], 'valid.jpg', { type: 'image/jpeg' });
const { data, error: uploadError } = await supabase.storage.from('photos').upload('test/valid.jpg', validFile);
console.assert(uploadError === null && data !== null, 'Should successfully upload valid image');
```

---

## Task 1.3: Update Validation to Require Age

### Requirements
1. **Create `validate_age_range()` Function**
   - Location: `backend/services/validation_helper.py`
   - Accept array of exactly 2 integers
   - Special case: `[-1, -1]` represents "Unknown"
   - Valid ranges: `0 <= min_age < max_age <= 120`
   
2. **Update Required Fields Validation**
   - Add `approximate_age` to REQUIRED_FIELDS list
   - Ensure validation runs on both manual entry and AI categorization
   
3. **Error Messages**
   - "Age is required" if missing
   - "Age must be an array of two numbers" if wrong format
   - "Invalid age range" if min >= max or out of bounds

### Implementation
```python
def validate_age_range(age_value):
    """Validate age is always array: [-1,-1] for Unknown or [min,max]"""
    if not isinstance(age_value, list) or len(age_value) != 2:
        return False, "Age must be an array of two numbers"
    
    if age_value == [-1, -1]:  # Unknown is valid
        return True, None
    
    min_age, max_age = age_value
    if not all(isinstance(x, int) for x in [min_age, max_age]):
        return False, "Age values must be integers"
    
    if not (0 <= min_age < max_age <= 120):
        return False, "Invalid age range: must be 0 <= min < max <= 120"
    
    return True, None
```

### Test Cases
```python
# Test 1: Valid age ranges
assert validate_age_range([45, 50])[0] == True
assert validate_age_range([0, 1])[0] == True
assert validate_age_range([119, 120])[0] == True
assert validate_age_range([-1, -1])[0] == True  # Unknown

# Test 2: Invalid formats
assert validate_age_range([45])[0] == False  # Only one value
assert validate_age_range([45, 50, 55])[0] == False  # Too many values
assert validate_age_range("45-50")[0] == False  # String not array
assert validate_age_range({"min": 45, "max": 50})[0] == False  # Object not array

# Test 3: Invalid ranges
assert validate_age_range([50, 45])[0] == False  # Min > max
assert validate_age_range([45, 45])[0] == False  # Min = max
assert validate_age_range([-5, 10])[0] == False  # Negative age
assert validate_age_range([100, 130])[0] == False  # Over 120

# Test 4: Integration with save_individual
request_data = {
    "name": "John Doe",
    "height": 72,
    "weight": 180,
    "skin_color": "Medium",
    # Missing approximate_age
}
# Should return error about missing required field
```

---

## Task 1.2.1: Update GPT-4o Prompt to Extract Age Ranges

### Requirements
1. **Prompt Updates**
   - Always return age as `[min, max]` array format
   - Extract reasonable ranges from descriptions:
     - "about 45" → `[43, 47]`
     - "mid-40s" → `[43, 47]`
     - "elderly" → `[65, 85]`
     - "young adult" → `[18, 30]`
   - Default to `[-1, -1]` when age cannot be determined
   
2. **Extraction Logic**
   - Look for age-related keywords in transcription
   - Apply ±2 years for specific ages
   - Use standard ranges for descriptive terms
   
3. **Response Format**
   - Must include `approximate_age` field in response
   - Always array format, never single number

### Updated Prompt
```python
CATEGORIZATION_PROMPT = """
Extract information from this transcription into the provided categories.

CRITICAL RULES FOR AGE:
- Always return 'approximate_age' as an array [min, max]
- For specific ages, use ±2 years (e.g., "45 years old" → [43, 47])
- For age ranges, use:
  - "teenager" → [13, 19]
  - "twenties" → [20, 29]
  - "thirties" → [30, 39]
  - "middle-aged" → [40, 60]
  - "elderly/senior" → [65, 85]
  - "young adult" → [18, 30]
- If no age information found, return [-1, -1]

Rules:
- Always attempt to extract required fields: Name, Height, Weight, Skin Color, Approximate Age
- For skin color, map descriptions to Light/Medium/Dark
- Return null for missing non-required information

Return JSON only.
"""
```

### Test Cases
```python
# Test 1: Specific age extraction
transcription = "Met John today, he's about 45 years old, tall guy around 6 feet"
result = categorize_transcription(transcription, categories)
assert result["approximate_age"] == [43, 47]

# Test 2: Descriptive age extraction
transcription = "Elderly woman named Mary, probably in her seventies"
result = categorize_transcription(transcription, categories)
assert result["approximate_age"] == [65, 85]

# Test 3: No age information
transcription = "Spoke with Robert, tall man with brown hair"
result = categorize_transcription(transcription, categories)
assert result["approximate_age"] == [-1, -1]

# Test 4: Age range descriptions
test_cases = [
    ("teenager", [13, 19]),
    ("in his twenties", [20, 29]),
    ("middle-aged", [40, 60]),
    ("young adult", [18, 30])
]
for description, expected in test_cases:
    result = categorize_transcription(f"Person is a {description}", categories)
    assert result["approximate_age"] == expected
```

---

## Task 1.2.2 & 1.2.3: Test Extraction and Update /api/transcribe

### Requirements
1. **Validation in /api/transcribe**
   - Check that AI returned `approximate_age` field
   - Validate format using `validate_age_range()`
   - Add to `missing_required` if invalid or missing
   
2. **Error Handling**
   - If age is missing/invalid after AI extraction, add to missing_required
   - Frontend will prompt user to fill in missing fields
   
3. **Response Format**
   - Include validated age in `categorized_data`
   - List in `missing_required` if validation fails

### Test Cases
```python
# Test 1: Successful transcription with age
response = client.post("/api/transcribe", files={"audio": audio_file})
assert response.status_code == 200
data = response.json()
assert "approximate_age" in data["categorized_data"]
assert isinstance(data["categorized_data"]["approximate_age"], list)
assert len(data["categorized_data"]["approximate_age"]) == 2

# Test 2: Missing age adds to missing_required
# Mock AI response without age
with patch('openai_service.categorize_transcription') as mock:
    mock.return_value = {"name": "John", "height": 72}  # Missing age
    response = client.post("/api/transcribe", files={"audio": audio_file})
    assert "approximate_age" in response.json()["missing_required"]

# Test 3: Invalid age format handling
# Mock AI response with invalid age
with patch('openai_service.categorize_transcription') as mock:
    mock.return_value = {"name": "John", "approximate_age": 45}  # Single number
    response = client.post("/api/transcribe", files={"audio": audio_file})
    assert "approximate_age" in response.json()["missing_required"]

# Test 4: Performance test - ensure < 5s response time
import time
start = time.time()
response = client.post("/api/transcribe", files={"audio": two_minute_audio})
duration = time.time() - start
assert duration < 5.0, f"Transcription took {duration}s, should be < 5s"
```

---

## Critical Success Criteria for Phase 1

### Before Moving to Phase 2
1. **Database Migration**
   - ✓ All existing individuals have `approximate_age: [-1, -1]`
   - ✓ Photo columns added successfully
   - ✓ All indexes created and working
   
2. **Storage Setup**
   - ✓ Photos bucket accessible and configured
   - ✓ 5MB upload limit enforced
   - ✓ Only image files accepted
   
3. **Age Validation**
   - ✓ Backend rejects saves without valid age
   - ✓ AI consistently returns age in array format
   - ✓ Unknown age handled as `[-1, -1]`
   
4. **Integration Tests**
   - ✓ Full flow: record → transcribe → validate → save
   - ✓ Manual entry validates age requirement
   - ✓ Error messages are clear and actionable

### Common Pitfalls to Avoid
1. **DO NOT** allow single number age values anywhere
2. **DO NOT** accept age ranges where min >= max
3. **DO NOT** forget to update existing data to `[-1, -1]`
4. **DO NOT** make age affect danger score calculations
5. **ALWAYS** run migration before deploying code changes

### Rollback Plan
If issues arise:
1. Backend: Revert to previous commit
2. Database: Keep new columns (harmless if unused)
3. Storage: Delete photos bucket if needed
4. Frontend: Can deploy independently from backend

---

## Next Steps
Once all Phase 1 tasks are complete:
1. Run full test suite: `cd backend && pytest tests/test_api_integration.py`
2. Verify all tests pass
3. Commit changes with message: "feat: add age requirement and photo infrastructure"
4. Move to Phase 2 (Photo capture implementation)