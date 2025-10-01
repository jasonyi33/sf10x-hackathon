# Duplicate Detection UUID Mapping Fix - COMPLETED

## Problem Identified

The PostgreSQL error `22P02: invalid_text_representation` was occurring when trying to fetch individual profiles after duplicate detection, specifically with "John Doe" and similar records.

### Root Cause Analysis

The GPT-4o model was returning placeholder keys like `"candidate_id_1"` or `"candidate_1"` instead of actual UUID values when comparing individuals for duplicates. This happened because:

1. **Confusing prompt template**: The prompt showed placeholder keys `"candidate_id_1": confidence_score` in the expected format
2. **LLM interpretation**: GPT-4o followed the template literally instead of using the actual UUIDs from the records
3. **Invalid database queries**: These placeholder strings were passed to PostgreSQL, causing UUID casting errors

## Solution Implemented

### 1. Enhanced LLM Prompt (`duplicate_detection_service.py`)
- **Explicit instructions**: Added "IMPORTANT: Use the EXACT UUID from each record as the JSON key, not placeholders"
- **Dynamic examples**: Generated examples using actual UUIDs from the candidates
- **Clear formatting**: Showed the expected response with real UUIDs

### 2. Placeholder Key Mapping
```python
# Create mapping of possible placeholder formats to actual UUIDs
id_mapping = {}
for i, candidate in enumerate(top_candidates, 1):
    id_mapping[f"candidate_{i}"] = candidate["id"]
    id_mapping[f"candidate_id_{i}"] = candidate["id"]
    id_mapping[f"Record {i}"] = candidate["id"]
    id_mapping[str(i)] = candidate["id"]
```

### 3. UUID Validation
```python
def _is_valid_uuid(self, value: str) -> bool:
    """Check if a string is a valid UUID"""
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, AttributeError, TypeError):
        return False
```

### 4. Robust Response Handling
- First tries to find confidence using actual UUID
- Falls back to checking placeholder mappings if UUID not found
- Validates all IDs before adding to matches list
- Logs warnings for invalid UUIDs

## Files Modified

### `backend/services/duplicate_detection_service.py`
- **`_compare_with_llm()`**: Added mapping logic and enhanced response handling
- **`_build_comparison_prompt()`**: Completely rewrote to use actual UUIDs in examples
- **`_is_valid_uuid()`**: New validation method
- **Fallback matching**: Added UUID validation

### `backend/tests/test_duplicate_uuid_fix.py` (new)
- Comprehensive test suite for UUID mapping scenarios
- Tests placeholder key handling
- Tests UUID validation
- Tests both ideal and problematic responses

## Test Results

All tests pass successfully:
```bash
✓ test_handles_placeholder_keys_from_llm
✓ test_handles_candidate_id_placeholder_format
✓ test_validates_uuids_before_returning
✓ test_handles_actual_uuids_from_llm
✓ test_fallback_validates_uuids
```

## How to Verify the Fix Works

### 1. Voice Transcription Test
```bash
# Record audio mentioning "John Doe"
"Met John Doe today, about 6 feet tall, weighs around 180 pounds"
```

Expected behavior:
- Duplicate detection finds existing John Doe
- Returns valid UUID (not placeholder)
- High confidence match (≥95%) shows streamlined confirmation
- Merge completes successfully

### 2. Check Backend Logs
Look for:
- No more `22P02` PostgreSQL errors
- Possible warnings: `"Warning: Invalid UUID detected"` (if GPT returns placeholders)
- Successful duplicate detection messages

### 3. Database Verification
```sql
-- All IDs in potential_matches should be valid UUIDs
SELECT * FROM individuals WHERE id = 'returned-match-id';
-- Should return actual individual record
```

## Impact & Benefits

### Immediate Benefits
- ✅ Eliminates PostgreSQL UUID casting errors
- ✅ Duplicate detection works reliably with any name
- ✅ Handles both ideal and problematic GPT responses
- ✅ Invalid IDs filtered before reaching database

### Long-term Benefits
- More robust error handling
- Better logging for debugging
- Foundation for future improvements
- Consistent UUID handling pattern

## Migration Notes

The fix is backwards compatible:
- No database schema changes
- No API contract changes
- Frontend doesn't need updates
- Existing data unaffected

## Performance Considerations

- Minimal overhead from validation (~1ms)
- Mapping lookup is O(1) operation
- No additional database queries
- LLM prompt slightly longer but negligible impact

## Rollback Plan (if needed)

1. Revert `duplicate_detection_service.py` to previous version
2. Restart backend service
3. No data cleanup needed

## Future Improvements

1. **Monitoring**: Add metrics for placeholder detection frequency
2. **Caching**: Cache successful UUID mappings
3. **Prompt optimization**: Fine-tune prompt for better UUID compliance
4. **Fallback enhancement**: Implement fuzzy UUID matching

## Conclusion

The duplicate detection UUID mapping issue has been successfully resolved. The system now handles both ideal cases (GPT returns actual UUIDs) and problematic cases (GPT returns placeholders) gracefully, ensuring reliable duplicate detection for the SF Homeless Outreach application.