# Task 2.15: Individual Management Backend APIs - Detailed Implementation Plan

## Overview
This document provides a step-by-step implementation plan for Task 2.15, including detailed outlines and test cases for each subtask. All implementations follow the PRD requirements and hackathon constraints (36-hour timeline, keep it simple).

## Prerequisites
- Task 1.0 completed (database schema, auth, basic setup)
- Task 2.0 completed (AI transcription endpoints)
- Existing services: `validation_helper`, `danger_calculator`, `openai_service`

---

## Task 2.15.1: Create Data Models in db/models.py

### Implementation Steps

1. **Open `backend/db/models.py`** (currently empty placeholder)

2. **Import required dependencies**:
```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
```

3. **Create Request Models**:
   - `LocationData` - GPS coordinates + address from frontend
   - `SaveIndividualRequest` - Main save request with optional merge
   - `DangerOverrideRequest` - Simple override update

4. **Create Response Models**:
   - `IndividualSummary` - For list views (abbreviated data)
   - `IndividualResponse` - Full individual data
   - `InteractionSummary` - Brief interaction info
   - `InteractionDetail` - Full interaction with changes
   - `SaveIndividualResponse` - Combined individual + interaction
   - `SearchIndividualsResponse` - Paginated search results
   - `IndividualDetailResponse` - Individual + recent interactions
   - `DangerOverrideResponse` - All danger scores
   - `InteractionsResponse` - List of interactions

5. **Add validation** in `SaveIndividualRequest`:
   - Check required fields exist (name, height, weight, skin_color)
   - Let service layer handle value validation (0-300 range)

### Test Cases for 2.15.1

```python
# tests/test_models.py
def test_save_individual_request_validation():
    """Test required fields validation"""
    # Valid request
    valid_data = {
        "data": {
            "name": "John Doe",
            "height": 72,
            "weight": 180,
            "skin_color": "Light"
        }
    }
    request = SaveIndividualRequest(**valid_data)
    assert request.data["name"] == "John Doe"
    
    # Missing required field
    invalid_data = {
        "data": {
            "name": "John Doe",
            "height": 72
            # Missing weight and skin_color
        }
    }
    with pytest.raises(ValueError) as exc:
        SaveIndividualRequest(**invalid_data)
    assert "Missing required fields" in str(exc.value)

def test_location_data_validation():
    """Test GPS coordinate validation"""
    # Valid location
    valid_location = LocationData(
        latitude=37.7749,
        longitude=-122.4194,
        address="123 Market Street, San Francisco, CA"
    )
    assert valid_location.latitude == 37.7749
    
    # Invalid latitude
    with pytest.raises(ValueError):
        LocationData(latitude=91, longitude=-122, address="test")

def test_danger_override_range():
    """Test danger override 0-100 validation"""
    # Valid override
    valid = DangerOverrideRequest(danger_override=75)
    assert valid.danger_override == 75
    
    # Invalid override
    with pytest.raises(ValueError):
        DangerOverrideRequest(danger_override=101)
```

### Unit Test Execution for 2.15.1

After implementing the models, run:
```bash
cd backend && python3 -m pytest tests/test_models.py -v
```

Expected output: All tests should pass, validating:
- Required fields enforcement
- GPS coordinate ranges
- Danger override limits
- Display score computation

### Questions for 2.15.1:
1. Should we add a `display_score` computed field to `IndividualSummary`?
2. Do we need pagination metadata in `InteractionsResponse`?

---

## Task 2.15.2: Create services/individual_service.py

### Implementation Steps

1. **Create new file** `backend/services/individual_service.py`

2. **Import dependencies**:
```python
from typing import Dict, Any, Optional, List
from uuid import UUID
from datetime import datetime
from supabase import Client
import re
from db.models import *
from services.danger_calculator import calculate_danger_score
```

3. **Implement `IndividualService` class** with Supabase client injection

4. **Implement core methods**:

   a. **`get_changed_fields(old_data, new_data)`**:
   - Compare dictionaries recursively
   - Return only fields with different values
   - Include new fields not in old data

   b. **`abbreviate_address(full_address)`**:
   - Multi-strategy approach per approved recommendation
   - Handle cross-streets, regular streets, landmarks
   - Fallback to truncation

   c. **`save_individual()`**:
   - Begin transaction
   - Calculate danger score
   - If merge: update existing + create interaction with changes
   - If new: create individual + interaction with all data
   - Commit transaction
   - Return formatted response

   d. **`search_individuals()`**:
   - Build query with ILIKE on name and JSONB::text
   - Join with interactions for last_seen
   - Apply sorting and pagination
   - Format results with abbreviated addresses

   e. **`get_individual_by_id()`**:
   - Fetch individual by ID
   - Get last 10 interactions
   - Calculate display score (override or calculated)

   f. **`update_danger_override()`**:
   - Update only danger_override field
   - Return all scores for UI

   g. **`get_interactions()`**:
   - Fetch all interactions for individual
   - Order by created_at DESC
   - Include full addresses

### Test Cases for 2.15.2

```python
# tests/test_individual_service.py
async def test_get_changed_fields():
    """Test change detection logic"""
    service = IndividualService(supabase_client)
    
    old_data = {
        "name": "John Doe",
        "height": 72,
        "weight": 180,
        "skin_color": "Light"
    }
    
    new_data = {
        "name": "John Doe",  # Same
        "height": 73,        # Changed
        "weight": 180,       # Same
        "skin_color": "Medium",  # Changed
        "gender": "Male"     # New field
    }
    
    changes = service.get_changed_fields(old_data, new_data)
    assert changes == {
        "height": 73,
        "skin_color": "Medium",
        "gender": "Male"
    }
    assert "name" not in changes  # Unchanged
    assert "weight" not in changes  # Unchanged

async def test_abbreviate_address():
    """Test address abbreviation strategies"""
    service = IndividualService(supabase_client)
    
    # Cross-street format
    addr1 = "Market Street & 5th Street, San Francisco, CA"
    assert service.abbreviate_address(addr1) == "Market Street & 5th"
    
    # Regular street
    addr2 = "123 Golden Gate Avenue, San Francisco, CA 94102"
    assert service.abbreviate_address(addr2) == "Golden Gate Avenue"
    
    # Landmark
    addr3 = "Golden Gate Park, San Francisco"
    assert service.abbreviate_address(addr3) == "Golden Gate Park"
    
    # Long address
    addr4 = "1234567890 Very Long Street Name That Exceeds Limit Avenue"
    assert service.abbreviate_address(addr4).endswith("...")

async def test_save_new_individual():
    """Test creating new individual with transaction"""
    service = IndividualService(supabase_client)
    
    result = await service.save_individual(
        user_id="test-user",
        user_name="Demo User",
        data={
            "name": "Jane Smith",
            "height": 65,
            "weight": 140,
            "skin_color": "Dark",
            "substance_abuse_history": ["None"]
        },
        location=LocationData(
            latitude=37.7749,
            longitude=-122.4194,
            address="123 Market Street, SF"
        )
    )
    
    # Verify individual created
    assert result.individual.name == "Jane Smith"
    assert result.individual.danger_score >= 0
    
    # Verify interaction created with all data
    assert result.interaction.has_transcription == False
    
    # Verify in database
    individual = supabase.table("individuals").select("*").eq("id", result.individual.id).single().execute()
    assert individual.data["name"] == "Jane Smith"

async def test_save_with_merge():
    """Test merging individuals"""
    service = IndividualService(supabase_client)
    
    # Create initial individual
    first = await service.save_individual(
        user_id="test-user",
        user_name="Demo User",
        data={"name": "John Doe", "height": 72, "weight": 180, "skin_color": "Light"}
    )
    
    # Merge with new data
    merged = await service.save_individual(
        user_id="test-user",
        user_name="Demo User",
        data={
            "name": "John Doe",
            "height": 73,  # Changed
            "weight": 185,  # Changed
            "skin_color": "Light",  # Same
            "veteran_status": "Yes"  # New
        },
        merge_with_id=first.individual.id
    )
    
    # Verify same individual ID
    assert merged.individual.id == first.individual.id
    
    # Verify only changes in interaction
    interaction = supabase.table("interactions").select("*").eq("id", merged.interaction.id).single().execute()
    changes = interaction.data["changes"]
    assert changes == {
        "height": 73,
        "weight": 185,
        "veteran_status": "Yes"
    }
    assert "skin_color" not in changes  # Unchanged

async def test_search_individuals():
    """Test search functionality"""
    service = IndividualService(supabase_client)
    
    # Create test data
    await service.save_individual(
        user_id="test",
        user_name="Demo User",
        data={"name": "John Smith", "height": 72, "weight": 180, "skin_color": "Light", "medical_conditions": ["Diabetes"]}
    )
    
    # Search by name
    results = await service.search_individuals(search="John", limit=10)
    assert len(results.individuals) > 0
    assert "John" in results.individuals[0].name
    
    # Search by JSONB field
    results = await service.search_individuals(search="Diabetes", limit=10)
    assert len(results.individuals) > 0
    
    # Test pagination
    results = await service.search_individuals(limit=5, offset=0)
    assert results.limit == 5
    assert results.offset == 0
```

### Unit Test Execution for 2.15.2

After implementing the service, create and run:
```bash
cd backend && python3 -m pytest tests/test_individual_service.py -v
```

Expected output: All tests should pass, validating:
- Change field detection logic
- Address abbreviation strategies
- Transaction atomicity
- Search functionality
- Danger score calculations

### Questions for 2.15.2:
1. Should transaction rollback include logging for debugging?
2. Should we cache danger score calculations?

---

## Task 2.15.3: Implement POST /api/individuals Endpoint

### Implementation Steps

1. **Create new file** `backend/api/individuals.py`

2. **Import dependencies**:
```python
from fastapi import APIRouter, HTTPException, Depends
from uuid import UUID
from typing import Optional
import os
from supabase import create_client, Client

from api.auth import get_current_user
from db.models import *
from services.individual_service import IndividualService
from services.validation_helper import validate_categorized_data
```

3. **Create router and helper**:
```python
router = APIRouter()

def get_current_user_name(user_id: str = Depends(get_current_user)):
    """Get user display name - flexible for future enhancement"""
    return "Demo User"
```

4. **Implement endpoint**:
```python
@router.post("/api/individuals", response_model=SaveIndividualResponse)
async def save_individual(
    request: SaveIndividualRequest,
    user_id: str = Depends(get_current_user),
    user_name: str = Depends(get_current_user_name)
):
    """
    Save new individual or update existing (merge).
    
    Flow:
    1. Validate merge_with_id exists (if provided)
    2. Fetch categories for validation
    3. Validate data using validation_helper
    4. Use individual_service to save
    5. Return individual and interaction records
    """
```

5. **Add to main.py**:
```python
from api.individuals import router as individuals_router
app.include_router(individuals_router)
```

### Test Cases for 2.15.3

```python
# tests/test_api_integration.py
async def test_post_individuals_new():
    """Test creating new individual via API"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Login first
        token = await get_test_token(client)
        
        # Create new individual
        response = await client.post(
            "/api/individuals",
            json={
                "data": {
                    "name": "Test Person",
                    "height": 70,
                    "weight": 160,
                    "skin_color": "Medium",
                    "gender": "Female"
                },
                "location": {
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "address": "123 Test Street, SF"
                }
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["individual"]["name"] == "Test Person"
        assert data["individual"]["danger_score"] >= 0
        assert data["interaction"]["has_transcription"] == False

async def test_post_individuals_missing_required():
    """Test validation for missing required fields"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        response = await client.post(
            "/api/individuals",
            json={
                "data": {
                    "name": "Test Person",
                    "height": 70
                    # Missing weight and skin_color
                }
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 400
        error = response.json()
        assert "Missing required fields" in error["detail"]

async def test_post_individuals_merge():
    """Test merging individuals"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Create first individual
        response1 = await client.post(
            "/api/individuals",
            json={
                "data": {
                    "name": "John Doe",
                    "height": 72,
                    "weight": 180,
                    "skin_color": "Light"
                }
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        individual_id = response1.json()["individual"]["id"]
        
        # Merge with new data
        response2 = await client.post(
            "/api/individuals",
            json={
                "data": {
                    "name": "John Doe",
                    "height": 73,  # Changed
                    "weight": 180,  # Same
                    "skin_color": "Light",  # Same
                    "veteran_status": "Yes"  # New
                },
                "merge_with_id": individual_id
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response2.status_code == 200
        data = response2.json()
        assert data["individual"]["id"] == individual_id  # Same ID
        assert data["individual"]["data"]["height"] == 73  # Updated

async def test_post_individuals_invalid_merge_id():
    """Test merge with non-existent ID"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        response = await client.post(
            "/api/individuals",
            json={
                "data": {
                    "name": "Test",
                    "height": 70,
                    "weight": 160,
                    "skin_color": "Light"
                },
                "merge_with_id": "00000000-0000-0000-0000-000000000000"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
        assert "Individual not found" in response.json()["detail"]

async def test_post_individuals_with_transcription():
    """Test saving from voice transcription"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        response = await client.post(
            "/api/individuals",
            json={
                "data": {
                    "name": "Voice Person",
                    "height": 68,
                    "weight": 150,
                    "skin_color": "Dark"
                },
                "transcription": "Met Voice Person near the library...",
                "audio_url": "https://example.com/audio.m4a",
                "location": {
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "address": "Library Street"
                }
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["interaction"]["has_transcription"] == True
```

### Unit Test Execution for 2.15.3

After implementing the endpoint, run integration tests:
```bash
cd backend && python3 -m pytest tests/test_api_integration.py::TestIndividualManagement::test_post_individuals -v
```

Expected output: All tests should pass, validating:
- New individual creation
- Required field validation
- Merge functionality
- Error handling for invalid merge IDs
- Transaction atomicity

### Questions for 2.15.3:
1. Should we validate danger_weight values from categories?
2. Should we return validation warnings (non-critical) in response?

---

## Task 2.15.4: Implement GET /api/individuals Endpoint

### Implementation Steps

1. **Add to `backend/api/individuals.py`**:

2. **Implement search endpoint**:
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

3. **Handle search query building**:
   - Use ILIKE for case-insensitive search
   - Search both name and JSONB::text
   - Apply proper escaping for special characters

4. **Format results**:
   - Calculate display danger score
   - Abbreviate addresses
   - Include last seen timestamp

### Test Cases for 2.15.4

```python
async def test_get_individuals_list():
    """Test listing individuals without search"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Create test data
        await create_test_individuals(client, token, count=5)
        
        # List individuals
        response = await client.get(
            "/api/individuals?limit=10",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["individuals"]) > 0
        assert data["total"] >= 5
        assert data["limit"] == 10
        assert data["offset"] == 0

async def test_get_individuals_search_name():
    """Test searching by name"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Create specific individual
        await client.post(
            "/api/individuals",
            json={"data": {"name": "Unique Name Test", "height": 70, "weight": 160, "skin_color": "Light"}},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Search by name
        response = await client.get(
            "/api/individuals?search=Unique",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["individuals"]) >= 1
        assert "Unique" in data["individuals"][0]["name"]

async def test_get_individuals_search_jsonb():
    """Test searching JSONB fields"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Create individual with specific condition
        await client.post(
            "/api/individuals",
            json={
                "data": {
                    "name": "Medical Test",
                    "height": 70,
                    "weight": 160,
                    "skin_color": "Light",
                    "medical_conditions": ["Rare-Condition-XYZ"]
                }
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Search by medical condition
        response = await client.get(
            "/api/individuals?search=Rare-Condition-XYZ",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["individuals"]) >= 1

async def test_get_individuals_sorting():
    """Test different sort options"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Sort by danger score
        response = await client.get(
            "/api/individuals?sort_by=danger_score&sort_order=desc",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        if len(data["individuals"]) > 1:
            # Verify descending order
            scores = [ind["danger_score"] for ind in data["individuals"]]
            assert scores == sorted(scores, reverse=True)

async def test_get_individuals_pagination():
    """Test pagination"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Page 1
        response1 = await client.get(
            "/api/individuals?limit=5&offset=0",
            headers={"Authorization": f"Bearer {token}"}
        )
        data1 = response1.json()
        
        # Page 2
        response2 = await client.get(
            "/api/individuals?limit=5&offset=5",
            headers={"Authorization": f"Bearer {token}"}
        )
        data2 = response2.json()
        
        # Verify different results
        if data1["individuals"] and data2["individuals"]:
            assert data1["individuals"][0]["id"] != data2["individuals"][0]["id"]

async def test_get_individuals_address_abbreviation():
    """Test address abbreviation in results"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Create with long address
        await client.post(
            "/api/individuals",
            json={
                "data": {"name": "Address Test", "height": 70, "weight": 160, "skin_color": "Light"},
                "location": {
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "address": "123 Very Long Street Name Avenue, San Francisco, CA 94105"
                }
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Get list
        response = await client.get(
            "/api/individuals?search=Address Test",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        data = response.json()
        location = data["individuals"][0]["last_location"]
        assert location["address"] != "123 Very Long Street Name Avenue, San Francisco, CA 94105"
        assert len(location["address"]) < 40  # Abbreviated
```

### Unit Test Execution for 2.15.4

After implementing the search endpoint, run:
```bash
cd backend && python3 -m pytest tests/test_api_integration.py::TestIndividualManagement::test_search_individuals -v
```

Expected output: All tests should pass, validating:
- Name search functionality
- JSONB field search
- Pagination behavior
- Sorting options
- Address abbreviation

### Questions for 2.15.4:
1. Should we add filters for danger score ranges?
2. Should empty search return all or none?

---

## Task 2.15.5: Implement GET /api/individuals/{id} Endpoint

### Implementation Steps

1. **Add to `backend/api/individuals.py`**:

2. **Implement get individual endpoint**:
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

3. **Include recent interactions**:
   - Limit to 10 most recent
   - Summary format only
   - Order by created_at DESC

### Unit Test Execution for 2.15.5

After implementing the get individual endpoint, run:
```bash
cd backend && python3 -m pytest tests/test_api_integration.py::TestIndividualManagement::test_get_individual -v
```

Expected output: All tests should pass, validating:
- Individual details retrieval
- Recent interactions included
- Display score calculation
- 404 handling for non-existent IDs

### Test Cases for 2.15.5

```python
async def test_get_individual_by_id():
    """Test getting individual details"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Create individual
        create_response = await client.post(
            "/api/individuals",
            json={
                "data": {
                    "name": "Detail Test",
                    "height": 70,
                    "weight": 160,
                    "skin_color": "Medium",
                    "gender": "Male",
                    "veteran_status": "Yes"
                }
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        individual_id = create_response.json()["individual"]["id"]
        
        # Get details
        response = await client.get(
            f"/api/individuals/{individual_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["individual"]["name"] == "Detail Test"
        assert data["individual"]["data"]["veteran_status"] == "Yes"
        assert "recent_interactions" in data
        assert len(data["recent_interactions"]) >= 1

async def test_get_individual_not_found():
    """Test getting non-existent individual"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        response = await client.get(
            "/api/individuals/00000000-0000-0000-0000-000000000000",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404
        assert "Individual not found" in response.json()["detail"]

async def test_get_individual_with_override():
    """Test individual with danger override"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Create and set override
        create_response = await client.post(
            "/api/individuals",
            json={"data": {"name": "Override Test", "height": 70, "weight": 160, "skin_color": "Light"}},
            headers={"Authorization": f"Bearer {token}"}
        )
        individual_id = create_response.json()["individual"]["id"]
        
        # Set override
        await client.put(
            f"/api/individuals/{individual_id}/danger-override",
            json={"danger_override": 85},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Get details
        response = await client.get(
            f"/api/individuals/{individual_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        data = response.json()
        assert data["individual"]["danger_override"] == 85
```

---

## Task 2.15.6: Implement PUT /api/individuals/{id}/danger-override

### Implementation Steps

1. **Add to `backend/api/individuals.py`**:

2. **Implement danger override endpoint**:
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

### Unit Test Execution for 2.15.6

After implementing the danger override endpoint, run:
```bash
cd backend && python3 -m pytest tests/test_api_integration.py::TestIndividualManagement::test_danger_override -v
```

Expected output: All tests should pass, validating:
- Setting override values
- Removing override (null)
- Display score updates
- Validation of 0-100 range

### Test Cases for 2.15.6

```python
async def test_set_danger_override():
    """Test setting danger override"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Create individual
        create_response = await client.post(
            "/api/individuals",
            json={"data": {"name": "Override Test", "height": 70, "weight": 160, "skin_color": "Light"}},
            headers={"Authorization": f"Bearer {token}"}
        )
        individual_id = create_response.json()["individual"]["id"]
        danger_score = create_response.json()["individual"]["danger_score"]
        
        # Set override
        response = await client.put(
            f"/api/individuals/{individual_id}/danger-override",
            json={"danger_override": 90},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["danger_score"] == danger_score  # Original unchanged
        assert data["danger_override"] == 90
        assert data["display_score"] == 90  # Shows override

async def test_remove_danger_override():
    """Test removing danger override"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Create with override
        create_response = await client.post(
            "/api/individuals",
            json={"data": {"name": "Remove Override", "height": 70, "weight": 160, "skin_color": "Light"}},
            headers={"Authorization": f"Bearer {token}"}
        )
        individual_id = create_response.json()["individual"]["id"]
        
        # Set override
        await client.put(
            f"/api/individuals/{individual_id}/danger-override",
            json={"danger_override": 80},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Remove override
        response = await client.put(
            f"/api/individuals/{individual_id}/danger-override",
            json={"danger_override": None},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["danger_override"] is None
        assert data["display_score"] == data["danger_score"]  # Back to calculated
```

---

## Task 2.15.7: Implement GET /api/individuals/{id}/interactions

### Implementation Steps

1. **Add to `backend/api/individuals.py`**:

2. **Implement interactions endpoint**:
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

### Unit Test Execution for 2.15.7

After implementing the interactions endpoint, run:
```bash
cd backend && python3 -m pytest tests/test_api_integration.py::TestIndividualManagement::test_interactions -v
```

Expected output: All tests should pass, validating:
- Interaction history order
- Changes tracking
- Full address display
- Transcription presence

### Test Cases for 2.15.7

```python
async def test_get_interactions():
    """Test getting interaction history"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Create individual
        create_response = await client.post(
            "/api/individuals",
            json={
                "data": {"name": "History Test", "height": 70, "weight": 160, "skin_color": "Light"},
                "transcription": "Initial meeting transcript",
                "location": {"latitude": 37.7749, "longitude": -122.4194, "address": "123 First Street"}
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        individual_id = create_response.json()["individual"]["id"]
        
        # Update individual (creates new interaction)
        await client.post(
            "/api/individuals",
            json={
                "data": {
                    "name": "History Test",
                    "height": 71,  # Changed
                    "weight": 165,  # Changed
                    "skin_color": "Light",  # Same
                    "gender": "Male"  # New
                },
                "merge_with_id": individual_id,
                "location": {"latitude": 37.7749, "longitude": -122.4194, "address": "456 Second Avenue"}
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Get interactions
        response = await client.get(
            f"/api/individuals/{individual_id}/interactions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["interactions"]) == 2
        
        # Check first interaction (most recent)
        first = data["interactions"][0]
        assert first["changes"] == {"height": 71, "weight": 165, "gender": "Male"}
        assert first["location"]["address"] == "456 Second Avenue"  # Full address
        
        # Check second interaction (original)
        second = data["interactions"][1]
        assert second["transcription"] == "Initial meeting transcript"
        assert len(second["changes"]) > 0  # Has all initial data

async def test_get_interactions_empty():
    """Test individual with no interactions (edge case)"""
    # This shouldn't happen in practice, but test graceful handling
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        response = await client.get(
            "/api/individuals/00000000-0000-0000-0000-000000000000/interactions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["interactions"] == []
```

---

## Task 2.15.8: Write Integration Tests

### Implementation Steps

1. **Update `backend/tests/test_api_integration.py`**:
   - Add comprehensive test class for individual management
   - Include all test cases from subtasks above
   - Add full flow integration test

2. **Create test utilities**:
```python
async def create_test_individuals(client, token, count=10):
    """Helper to create multiple test individuals"""
    
async def get_test_token(client):
    """Helper to get auth token for tests"""
```

3. **Add performance test**:
```python
async def test_search_performance():
    """Test search with 100+ individuals"""
    # Create 100 individuals
    # Time search operations
    # Verify < 1 second response time
```

### Full Flow Integration Test

```python
async def test_full_individual_management_flow():
    """Test complete flow from transcription to history"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        token = await get_test_token(client)
        
        # Step 1: Transcribe audio (mock)
        transcribe_response = await client.post(
            "/api/transcribe",
            json={
                "audio_url": "https://example.com/test.m4a",
                "location": {"latitude": 37.7749, "longitude": -122.4194}
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        categorized_data = transcribe_response.json()["categorized_data"]
        
        # Step 2: Save individual from transcription
        save_response = await client.post(
            "/api/individuals",
            json={
                "data": categorized_data,
                "transcription": transcribe_response.json()["transcription"],
                "location": {
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "address": "123 Market Street, SF"
                }
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        individual_id = save_response.json()["individual"]["id"]
        
        # Step 3: Search for individual
        search_response = await client.get(
            f"/api/individuals?search={categorized_data['name']}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert len(search_response.json()["individuals"]) > 0
        
        # Step 4: Get individual details
        detail_response = await client.get(
            f"/api/individuals/{individual_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert detail_response.json()["individual"]["id"] == individual_id
        
        # Step 5: Update danger override
        override_response = await client.put(
            f"/api/individuals/{individual_id}/danger-override",
            json={"danger_override": 75},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert override_response.json()["display_score"] == 75
        
        # Step 6: View interaction history
        history_response = await client.get(
            f"/api/individuals/{individual_id}/interactions",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert len(history_response.json()["interactions"]) >= 1
```

### Unit Test Execution for 2.15.8

After implementing all endpoints, run the full test suite:
```bash
cd backend && python3 -m pytest tests/test_api_integration.py::TestIndividualManagement -v
```

Expected output: All integration tests should pass, validating:
- Complete flow from transcription to history
- All CRUD operations
- Error handling
- Data integrity across operations
- Performance benchmarks

### Questions for 2.15.8:
1. Should we test with real Supabase or mock it?
2. Do we need performance tests (e.g., search with 100+ records)?
3. Should we test error scenarios (network failures, etc.)?

---

## Implementation Timeline

### Priority Order (Frontend Blocking):
1. **Task 2.15.1-2.15.3**: Models + Service + POST endpoint (2.5 hours)
   - Frontend can start saving data
2. **Task 2.15.4**: GET search endpoint (1 hour)
   - Frontend can display data
3. **Task 2.15.5**: GET individual endpoint (30 minutes)
   - Frontend can show details
4. **Task 2.15.6-2.15.7**: Override + Interactions (50 minutes)
   - Additional features
5. **Task 2.15.8**: Integration tests (throughout + 1 hour dedicated)

**Total Estimated Time**: 6-7 hours

## Success Criteria

1. **All endpoints return correct data formats** per PRD
2. **Search works across all fields** (name + JSONB)
3. **Merge preserves individual ID** and tracks only changes
4. **Danger scores calculate correctly** with override support
5. **Integration tests pass** for full flow
6. **Frontend can integrate immediately** after each endpoint

## Risk Mitigation

1. **Database Performance**: 
   - Indexes already created in Task 1.0
   - Limit search results to 100
   - Use simple ILIKE for MVP

2. **Transaction Failures**:
   - Log all errors for debugging
   - Return clear error messages
   - Test rollback scenarios

3. **Data Integrity**:
   - Validate all required fields
   - Check merge_with_id exists
   - Use transactions for atomic operations

## Questions Requiring Clarification

1. **Search Behavior**: Should empty search return all individuals or empty result?
2. **Validation Warnings**: Should we return non-critical validation issues (e.g., "height seems high") as warnings?
3. **Rate Limiting**: Should we add any rate limits for the demo?
4. **Audit Trail**: Should we log who viewed individual profiles for privacy compliance?
5. **Export Format**: For future CSV export, what exact columns should be included?