# Quick Summary: Backend APIs for Frontend Support

## What Frontend Needs From You

### Critical Endpoints (Must Have)
1. **POST /api/individuals** - Save data after transcription
2. **GET /api/individuals** - Search/list for search screen
3. **GET /api/individuals/{id}** - Individual profile details

### Nice to Have
4. **PUT /api/individuals/{id}/danger-override** - Manual danger score
5. **GET /api/individuals/{id}/interactions** - Interaction history

## Why These Aren't in Task List

The task breakdown focused on UI work but missed that frontend needs backend APIs to:
- Save transcribed data (otherwise it's lost)
- Search for individuals (search screen)
- View individual profiles (profile screen)

## Implementation Priority

### Do First (2-3 hours)
1. Create data models in `db/models.py`
2. Create `api/individuals.py` with POST endpoint
3. Test saving works with validation

### Do Next (1-2 hours)
4. Add GET endpoints for search/list
5. Add GET endpoint for individual details
6. Test with pagination

### Do Last (1 hour)
7. Add danger override endpoint
8. Add interactions endpoint
9. Full integration tests

## Key Decisions

1. **Don't modify `/api/transcribe`** - Keep it read-only
2. **Reuse existing services**:
   - `validation_helper.py` for data validation
   - `danger_calculator.py` for scores
3. **Delete audio files** after successful save
4. **Auto-merge** when confidence >= 95%

## Testing Commands

```bash
# Check existing code still works
python3 -m pytest tests/test_api_integration.py

# Test new endpoints
python3 -m pytest tests/test_individuals_integration.py

# Quick manual test
python3 test_save_individual.py
```

## When to Merge

- Complete these endpoints before frontend finishes Task 3
- Frontend will need them to test their recording flow
- Deploy to Railway so they can use real API

## Files to Create/Modify

### New Files:
- `api/individuals.py` - All individual endpoints
- `services/individual_service.py` - Business logic
- `tests/test_individuals_integration.py` - Tests

### Modify:
- `db/models.py` - Add request/response models
- `main.py` - Include new router

## Remember

- Keep it simple (hackathon MVP)
- Test that existing code still works
- Document the API endpoints for frontend team
- Deploy early so frontend can integrate