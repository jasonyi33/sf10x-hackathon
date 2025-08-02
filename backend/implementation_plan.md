# Backend Implementation Plan: Individual Management APIs

## Overview
This plan details the implementation of backend endpoints needed to support frontend Tasks 3-4, ensuring no disruption to existing Task 2.0 functionality.

## Pre-Implementation Checklist

- [ ] Ensure all Task 2.0 tests still pass
- [ ] Create a new branch: `backend-individuals`
- [ ] Back up current working state

## Implementation Order (Critical Path)

### Step 1: Create Data Models (30 mins)
**File**: `db/models.py`

```python
# Add these Pydantic models for request/response

class LocationData(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None

class SaveIndividualRequest(BaseModel):
    data: Dict[str, Any]
    merge_with_id: Optional[str] = None
    location: Optional[LocationData] = None
    transcription: Optional[str] = None
    audio_url: Optional[str] = None

class IndividualResponse(BaseModel):
    id: str
    name: str
    danger_score: int
    danger_override: Optional[int]
    last_seen: datetime
    last_location: Optional[LocationData]
    data: Optional[Dict[str, Any]] = None

class DangerOverrideRequest(BaseModel):
    danger_override: Optional[int] = Field(None, ge=0, le=100)
```

### Step 2: Create Database Helper Functions (45 mins)
**File**: `services/individual_service.py` (NEW)

```python
"""
Service for managing individuals and interactions
"""
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from uuid import uuid4

from supabase import Client
from services.danger_calculator import calculate_danger_score

def merge_individual_data(old_data: dict, new_data: dict) -> dict:
    """Merge new data into old, preserving non-null values"""
    merged = old_data.copy()
    for key, value in new_data.items():
        if value is not None:
            merged[key] = value
    return merged

def get_changed_fields(old_data: dict, new_data: dict) -> dict:
    """Get only fields that changed between old and new data"""
    changes = {}
    for key, new_value in new_data.items():
        old_value = old_data.get(key)
        if old_value != new_value:
            changes[key] = new_value
    return changes

def abbreviate_address(lat: float, lon: float) -> str:
    """Convert coordinates to abbreviated address"""
    # For MVP, return simple format
    # In production, would use reverse geocoding
    return f"Lat {lat:.3f}, Lon {lon:.3f}"

async def save_individual(
    supabase: Client,
    user_id: str,
    data: dict,
    location: dict,
    categories: list,
    merge_with_id: Optional[str] = None,
    transcription: Optional[str] = None,
    audio_url: Optional[str] = None
) -> dict:
    """Save or update individual and create interaction record"""
    # Implementation details...
```

### Step 3: Implement POST /api/individuals (1 hour)
**File**: `api/individuals.py`

```python
"""
Individual management endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
import os
from supabase import create_client, Client

from api.auth import get_current_user
from db.models import SaveIndividualRequest, IndividualResponse
from services.individual_service import save_individual
from services.validation_helper import validate_categorized_data
from services.danger_calculator import calculate_danger_score

router = APIRouter()

@router.post("/api/individuals", response_model=dict)
async def create_or_update_individual(
    request: SaveIndividualRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Create new individual or update existing (merge)
    """
    try:
        # 1. Get Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        # 2. Get categories for validation
        categories_response = supabase.table("categories").select("*").execute()
        categories = categories_response.data
        
        # 3. Validate data
        validation_result = validate_categorized_data(request.data, categories)
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Validation failed",
                    "missing_required": validation_result.missing_required,
                    "errors": validation_result.validation_errors
                }
            )
        
        # 4. Save individual
        result = await save_individual(
            supabase=supabase,
            user_id=user_id,
            data=request.data,
            location=request.location.dict() if request.location else None,
            categories=categories,
            merge_with_id=request.merge_with_id,
            transcription=request.transcription,
            audio_url=request.audio_url
        )
        
        # 5. Delete audio file if provided
        if request.audio_url and "supabase.co" in request.audio_url:
            try:
                # Extract path from URL and delete
                # Implementation...
                pass
            except:
                # Log but don't fail the request
                pass
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error saving individual: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

### Step 4: Implement GET /api/individuals (45 mins)
**File**: `api/individuals.py` (append)

```python
@router.get("/api/individuals", response_model=dict)
async def list_individuals(
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    sort_by: str = "last_seen",
    sort_order: str = "desc",
    user_id: str = Depends(get_current_user)
):
    """
    List/search individuals with pagination
    """
    # Implementation...
```

### Step 5: Implement Remaining Endpoints (45 mins)
- GET /api/individuals/{id}
- PUT /api/individuals/{id}/danger-override  
- GET /api/individuals/{id}/interactions

### Step 6: Update main.py (5 mins)
```python
from api import auth, transcription, categories, individuals

# Add the new router
app.include_router(individuals.router)
```

### Step 7: Create Integration Tests (30 mins)
**File**: `tests/test_individuals_integration.py`

Test flow:
1. Transcribe audio
2. Save individual with transcription data
3. Search for individual
4. Get individual details
5. Update danger override
6. Check interaction history

### Step 8: Update Existing Code (15 mins)

#### Update transcription endpoint to NOT save data
The `/api/transcribe` endpoint should remain read-only. The frontend will:
1. Call `/api/transcribe` to get data
2. Show results to user
3. Call `/api/individuals` to save after confirmation

No changes needed to existing transcription endpoint!

## Testing Plan

### 1. Regression Tests
```bash
# Ensure Task 2.0 still works
python3 -m pytest tests/test_api_integration.py -v
```

### 2. New Integration Tests
```bash
# Test new individual endpoints
python3 -m pytest tests/test_individuals_integration.py -v
```

### 3. Manual Testing Checklist
- [ ] Transcribe audio → Save individual → Verify in database
- [ ] Create duplicate → Verify merge works
- [ ] Search by name → Get correct results
- [ ] Update danger override → Persists correctly
- [ ] View interaction history → Shows all changes

## Rollback Plan

If issues arise:
1. Git stash changes
2. Revert to main branch
3. Redeploy previous version

## Common Pitfalls to Avoid

1. **Don't modify transcription endpoint** - It should remain read-only
2. **Don't delete individuals** - Only add interactions
3. **Don't forget transactions** - Use them for save operations
4. **Don't trust frontend data** - Always validate
5. **Don't expose all JSONB data** - Filter sensitive fields

## Success Criteria

- [ ] All existing tests pass
- [ ] New endpoints return correct data
- [ ] Frontend can save transcription results
- [ ] Search returns paginated results
- [ ] Danger override persists
- [ ] No performance degradation

## Timeline

- Step 1-2: 1.25 hours (Data models + helpers)
- Step 3-5: 2.5 hours (All endpoints)
- Step 6-7: 35 mins (Integration + tests)
- Step 8: 15 mins (Updates)
- **Total: ~4.5 hours**

## Next Steps After Implementation

1. Deploy to Railway
2. Update frontend API client
3. Test with frontend team
4. Document any API changes