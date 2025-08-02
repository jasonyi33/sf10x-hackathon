# Task 2.15: Individual Management Backend APIs - Implementation Guide

## Overview

Task 2.15 implements the core backend APIs for managing individuals in the system. These endpoints are critical for the frontend to function, as they handle:
- Saving new individuals and updates
- Searching and listing individuals
- Managing danger score overrides
- Tracking interaction history
- Supporting merge operations

## Architecture Context

### Key Principles
1. **Frontend handles merge logic** - Backend receives already-merged data
2. **Interactions track changes only** - Not full snapshots
3. **Search across all fields** - Not just name
4. **Location includes address** - Frontend sends address string from geocoding
5. **No manual audio deletion** - 24-hour lifecycle handles cleanup

### Database Schema (from Task 1.0)
```sql
-- individuals table
CREATE TABLE individuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    danger_score INTEGER DEFAULT 0,
    danger_override INTEGER, -- NULL means use calculated score
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- interactions table  
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    individual_id UUID NOT NULL REFERENCES individuals(id),
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    transcription TEXT,
    audio_url TEXT,
    location JSONB, -- {"latitude": 37.7, "longitude": -122.4, "address": "123 Market St"}
    changes JSONB NOT NULL DEFAULT '{}', -- Only fields that changed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_individuals_name ON individuals(name);
CREATE INDEX idx_individuals_created_at ON individuals(created_at);
CREATE INDEX idx_interactions_individual_id ON interactions(individual_id);
```

## Subtask 2.15.1: Create Data Models

### Required Models in `db/models.py`

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

# Request Models
class LocationData(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: str  # Full address from frontend geocoding

class SaveIndividualRequest(BaseModel):
    data: Dict[str, Any]  # Categorized data from AI or manual entry
    merge_with_id: Optional[UUID] = None  # If merging, ID of existing individual
    location: Optional[LocationData] = None
    transcription: Optional[str] = None  # Original audio transcription if voice entry
    audio_url: Optional[str] = None  # Reference to audio file
    
    @validator('data')
    def validate_required_fields(cls, v):
        # Ensure required fields exist
        required = ['name', 'height', 'weight', 'skin_color']
        missing = [f for f in required if f not in v or v[f] is None]
        if missing:
            raise ValueError(f"Missing required fields: {missing}")
        return v

class DangerOverrideRequest(BaseModel):
    danger_override: Optional[int] = Field(None, ge=0, le=100)

# Response Models
class IndividualSummary(BaseModel):
    id: UUID
    name: str
    danger_score: int
    danger_override: Optional[int]
    last_seen: datetime
    last_location: Optional[Dict[str, Any]]  # Simplified location for list view

class IndividualResponse(BaseModel):
    id: UUID
    name: str
    danger_score: int
    danger_override: Optional[int]
    data: Dict[str, Any]  # All categorized fields
    created_at: datetime
    updated_at: datetime

class InteractionSummary(BaseModel):
    id: UUID
    created_at: datetime
    user_name: str
    location: Optional[Dict[str, Any]]
    has_transcription: bool

class InteractionDetail(BaseModel):
    id: UUID
    created_at: datetime
    user_name: str
    transcription: Optional[str]
    location: Optional[Dict[str, Any]]
    changes: Dict[str, Any]  # Only fields that changed

class SaveIndividualResponse(BaseModel):
    individual: IndividualResponse
    interaction: InteractionSummary

class SearchIndividualsResponse(BaseModel):
    individuals: List[IndividualSummary]
    total: int
    offset: int
    limit: int

class IndividualDetailResponse(BaseModel):
    individual: IndividualResponse
    recent_interactions: List[InteractionSummary]

class DangerOverrideResponse(BaseModel):
    danger_score: int
    danger_override: Optional[int]
    display_score: int  # What UI should show

class InteractionsResponse(BaseModel):
    interactions: List[InteractionDetail]
```

### Questions for 2.15.1:
1. Should we add validation for height/weight ranges (0-300) in the model?
2. Should we validate skin_color options (Light/Medium/Dark) in the model?
3. Do we need a separate model for abbreviated vs full address in location?

## Subtask 2.15.2: Create Individual Service

### Required Functions in `services/individual_service.py`

```python
from typing import Dict, Any, Optional, List
from uuid import UUID
from supabase import Client
import json

class IndividualService:
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
    
    async def save_individual(
        self, 
        user_id: str,
        user_name: str,
        data: Dict[str, Any],
        merge_with_id: Optional[UUID] = None,
        location: Optional[LocationData] = None,
        transcription: Optional[str] = None,
        audio_url: Optional[str] = None
    ) -> SaveIndividualResponse:
        """
        Save a new individual or update existing (merge).
        
        Logic:
        1. Calculate danger score
        2. If merge_with_id: update existing individual
        3. Else: create new individual
        4. Create interaction record with changes only
        5. Return both records
        """
        pass
    
    def get_changed_fields(
        self,
        old_data: Dict[str, Any],
        new_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compare old and new data, return only changed fields.
        
        Rules:
        - Include field if value changed
        - Include new fields not in old data
        - Don't include fields with same value
        """
        pass
    
    def update_individual_with_merged_data(
        self,
        individual_id: UUID,
        merged_data: Dict[str, Any],
        danger_score: int
    ) -> None:
        """
        Update existing individual with frontend's merged data.
        
        Note: Frontend already handled merge decisions,
        we just apply the final result.
        """
        pass
    
    async def search_individuals(
        self,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
        sort_by: str = "last_seen",
        sort_order: str = "desc"
    ) -> SearchIndividualsResponse:
        """
        Search individuals across all fields.
        
        Search strategy:
        1. If search term: query name AND JSONB data fields
        2. Join with interactions for last_seen
        3. Apply sorting and pagination
        """
        pass
    
    def abbreviate_address(self, full_address: str) -> str:
        """
        Abbreviate address for list views.
        
        Example:
        "123 Market Street, San Francisco, CA 94105" -> "Market St & 5th"
        """
        pass
```

### Questions for 2.15.2:
1. Should we use transactions for save operations to ensure atomicity?
2. How should we handle the JSONB search - PostgreSQL full-text search or simple LIKE?
3. What's the abbreviation logic for addresses - just street name or intersection?

## Subtask 2.15.3: POST /api/individuals Endpoint

### Endpoint Specification

```python
@router.post("/api/individuals", response_model=SaveIndividualResponse)
async def save_individual(
    request: SaveIndividualRequest,
    user_id: str = Depends(get_current_user),
    user_name: str = Depends(get_current_user_name)  # Need to implement this
):
    """
    Save new individual or update existing (merge).
    
    Flow:
    1. Validate data using validation_helper
    2. Calculate danger score
    3. Use individual_service to save
    4. Return individual and interaction records
    """
```

### Business Logic Requirements
1. **Validation**: Use existing `validation_helper.validate_categorized_data()`
2. **Danger Score**: Use existing `danger_calculator.calculate_danger_score()`
3. **Merge**: If `merge_with_id` provided, update that individual
4. **New**: If no merge_with_id, create new individual
5. **Location**: Store full location object with address
6. **Audio**: Do NOT delete audio file (24-hour lifecycle handles it)

### Error Cases
- 400: Invalid data (missing required fields, invalid types)
- 404: merge_with_id doesn't exist
- 500: Database errors

### Questions for 2.15.3:
1. How do we get the user's name for interaction records - from JWT or database?
2. Should we validate that merge_with_id exists before processing?
3. Should we return validation warnings (non-critical issues) in response?

## Subtask 2.15.4: GET /api/individuals Endpoint

### Endpoint Specification

```python
@router.get("/api/individuals", response_model=SearchIndividualsResponse)
async def search_individuals(
    search: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("last_seen", regex="^(last_seen|danger_score|name)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    user_id: str = Depends(get_current_user)
):
    """
    Search and list individuals.
    
    Search behavior:
    - If search provided: search name AND all JSONB data fields
    - Always join with interactions for last_seen
    - Return abbreviated addresses in last_location
    """
```

### Search Implementation
Per PRD line 756: "Search across all fields (name and JSONB data)"

Possible approaches:
1. PostgreSQL GIN index on JSONB + full-text search
2. Multiple LIKE queries on name and JSONB text representation
3. Elasticsearch (probably overkill for hackathon)

### Questions for 2.15.4:
1. Which search approach should we use for JSONB fields?
2. Should search be case-insensitive?
3. How to handle sorting by danger_score with overrides?

## Subtask 2.15.5: GET /api/individuals/{id} Endpoint

### Endpoint Specification

```python
@router.get("/api/individuals/{individual_id}", response_model=IndividualDetailResponse)
async def get_individual(
    individual_id: UUID,
    user_id: str = Depends(get_current_user)
):
    """
    Get individual details with recent interactions.
    
    Returns:
    - Full individual data
    - Last 10 interactions (summary only)
    - Calculated display danger score
    """
```

### Requirements
1. Return all fields from individuals.data
2. Include recent interactions (limit 10)
3. Show danger_override if set, else danger_score
4. Format dates for display

## Subtask 2.15.6: PUT /api/individuals/{id}/danger-override

### Endpoint Specification

```python
@router.put("/api/individuals/{individual_id}/danger-override", 
           response_model=DangerOverrideResponse)
async def update_danger_override(
    individual_id: UUID,
    request: DangerOverrideRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Update manual danger score override.
    
    Logic:
    - Set danger_override to provided value
    - If null provided, remove override
    - Return all scores for UI update
    """
```

### Requirements
1. Validate override is 0-100 or null
2. Update only danger_override field
3. Return display_score (override if set, else calculated)
4. No interaction record needed (not a data change)

## Subtask 2.15.7: GET /api/individuals/{id}/interactions

### Endpoint Specification

```python
@router.get("/api/individuals/{individual_id}/interactions", 
           response_model=InteractionsResponse)
async def get_interactions(
    individual_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user)
):
    """
    Get detailed interaction history.
    
    Returns:
    - All interaction records
    - Full addresses (not abbreviated)
    - Changes only (not full data snapshot)
    - Skip categories_snapshot for MVP
    """
```

### Requirements
1. Order by created_at DESC (newest first)
2. Include full address in location
3. Show transcription if voice entry
4. Changes field shows only what changed

## Subtask 2.15.8: Integration Tests

### Test Cases in `tests/test_api_integration.py`

```python
class TestIndividualManagement:
    """Test individual management flow"""
    
    async def test_save_new_individual(self):
        """
        Test creating a new individual:
        1. Valid data with all required fields
        2. Calculate danger score correctly
        3. Create interaction with all fields
        4. Return proper response format
        """
        
    async def test_save_missing_required_fields(self):
        """
        Test validation:
        1. Missing name - should fail
        2. Missing height - should fail
        3. Height > 300 - should fail
        4. Invalid skin_color - should fail
        """
        
    async def test_merge_individual(self):
        """
        Test merge flow:
        1. Create individual A
        2. Save with merge_with_id = A
        3. Verify A is updated (not new record)
        4. Verify interaction has only changes
        """
        
    async def test_search_individuals(self):
        """
        Test search:
        1. Create individuals with various data
        2. Search by name - finds match
        3. Search by JSONB field - finds match
        4. Pagination works correctly
        5. Sorting works correctly
        """
        
    async def test_danger_override(self):
        """
        Test danger override:
        1. Create individual with calculated score
        2. Set override to 90
        3. Verify display_score = 90
        4. Remove override (null)
        5. Verify display_score = calculated
        """
        
    async def test_interaction_history(self):
        """
        Test interactions:
        1. Create individual
        2. Update multiple times
        3. Verify each interaction has only changes
        4. Verify order is newest first
        """
        
    async def test_full_flow(self):
        """
        Test complete flow:
        1. Transcribe audio
        2. Save individual from transcription
        3. Search and find individual
        4. Update danger override
        5. View interaction history
        """
```

### Questions for 2.15.8:
1. Should we test with real Supabase or mock it?
2. Do we need performance tests (e.g., search with 100+ records)?
3. Should we test error scenarios (network failures, etc.)?

## Implementation Order

Recommended implementation sequence:
1. **2.15.1**: Data models (foundation for everything)
2. **2.15.2**: Service functions (business logic)
3. **2.15.3**: POST endpoint (frontend can start saving)
4. **2.15.4**: GET search endpoint (frontend can display data)
5. **2.15.5**: GET individual endpoint (view details)
6. **2.15.6**: PUT danger override (less critical)
7. **2.15.7**: GET interactions (history view)
8. **2.15.8**: Integration tests (throughout development)

## Time Estimates

- 2.15.1: Data models - 30 minutes
- 2.15.2: Service functions - 1.5 hours
- 2.15.3: POST endpoint - 45 minutes
- 2.15.4: GET search endpoint - 1 hour
- 2.15.5: GET individual endpoint - 30 minutes
- 2.15.6: PUT danger override - 20 minutes
- 2.15.7: GET interactions - 30 minutes
- 2.15.8: Integration tests - 1 hour

**Total: ~6 hours**

## Critical Success Factors

1. **Frontend Integration**: Coordinate with Dev 2 & 3 on exact data formats
2. **Search Performance**: Ensure search is fast with proper indexes
3. **Merge Logic**: Frontend sends final merged data, backend just saves
4. **Data Integrity**: Use transactions for save operations
5. **Error Handling**: Clear error messages for frontend debugging

## Open Questions

1. **Search Implementation**: PostgreSQL full-text search vs simple LIKE queries for JSONB fields?
2. **User Name Source**: Get from JWT claims or query database?
3. **Address Abbreviation**: What's the exact logic - street name only or intersection format?
4. **Validation Warnings**: Should we return non-critical validation issues (warnings) in responses?
5. **Transaction Scope**: Should save_individual use a single transaction for both tables?
6. **Search Filters**: Should we add filters for danger score ranges or date ranges?
7. **Soft Delete**: Do we need soft delete for individuals (PRD doesn't mention)?

## Dependencies

- Existing services: `validation_helper`, `danger_calculator`, `openai_service`
- Database: Supabase PostgreSQL with existing schema
- Auth: JWT validation middleware
- Frontend: Coordination on exact data formats

## Notes

- No categories_snapshot for MVP (skip complexity)
- Audio files auto-delete via Supabase lifecycle (no manual deletion)
- Frontend handles all merge UI decisions
- Search must work across ALL fields, not just name
- Abbreviated addresses for lists, full addresses for details