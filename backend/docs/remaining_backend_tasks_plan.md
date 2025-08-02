# Remaining Backend Tasks Implementation Plan

## Overview
This document outlines the implementation plan for the three remaining backend tasks:
1. POST /api/categories endpoint (Task 5.6)
2. GET /api/export endpoint (Task 5.6)
3. Demo data SQL (Task 6.1)

Each task includes detailed requirements, implementation steps, and test cases that must fail before implementation.

---

## Task 1: POST /api/categories Endpoint

### Requirements
- Create new custom category with validation
- Reject if non-numeric/non-single-select types have danger_weight > 0
- Category names should have uppercase first letter, lowercase rest
- Authenticate with JWT token

### Request/Response Schema
```python
# Request
class CreateCategoryRequest(BaseModel):
    name: str  # Required, unique, uppercase first letter
    type: Literal["text", "number", "single_select", "multi_select", "date", "location"]
    priority: Optional[Literal["high", "medium", "low"]] = "medium"
    danger_weight: Optional[int] = Field(0, ge=0, le=100)
    auto_trigger: Optional[bool] = False
    is_required: Optional[bool] = False
    options: Optional[Union[List[Dict[str, Any]], List[str]]] = None

# Response
class CategoryResponse(BaseModel):
    id: UUID
    name: str
    type: str
    is_required: bool
    is_preset: bool
    priority: str
    danger_weight: int
    auto_trigger: bool
    options: Optional[Union[List[Dict[str, Any]], List[str]]]
    created_at: datetime
    updated_at: datetime
```

### Implementation Steps
1. Add request/response models to `db/models.py`
2. Add validation logic in endpoint:
   - Name formatting (capitalize first letter)
   - Name uniqueness check
   - Type-specific validation for danger_weight and auto_trigger
   - Options format validation
3. Insert into database
4. Return created category

### Test Cases
```python
# File: backend/tests/test_create_category.py

import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
from main import app
from datetime import datetime, timezone
from uuid import uuid4

@pytest.mark.asyncio
class TestCreateCategory:
    
    async def test_create_category_success(self):
        """Test successful category creation with proper validation"""
        # This test MUST fail initially
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/categories",
                json={
                    "name": "test category",  # Should be capitalized
                    "type": "single_select",
                    "priority": "high",
                    "danger_weight": 30,
                    "options": [
                        {"label": "Low", "value": 0.2},
                        {"label": "High", "value": 0.8}
                    ]
                },
                headers={"Authorization": "Bearer test_token"}
            )
            assert response.status_code == 201
            data = response.json()
            assert data["name"] == "Test category"  # Capitalized
            assert data["danger_weight"] == 30
            
    async def test_reject_invalid_danger_weight(self):
        """Test rejection when non-numeric/single-select has danger_weight > 0"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/categories",
                json={
                    "name": "invalid category",
                    "type": "text",
                    "danger_weight": 50  # Invalid for text type
                },
                headers={"Authorization": "Bearer test_token"}
            )
            assert response.status_code == 400
            assert "danger_weight" in response.json()["errors"]["validation"][0]
            
    async def test_reject_duplicate_name(self):
        """Test rejection when category name already exists"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Mock existing category
            with patch("supabase.Client") as mock_client:
                mock_client.table().select().eq().execute.return_value.data = [
                    {"name": "Existing category"}
                ]
                
                response = await client.post(
                    "/api/categories",
                    json={
                        "name": "existing category",  # Case insensitive duplicate
                        "type": "text"
                    },
                    headers={"Authorization": "Bearer test_token"}
                )
                assert response.status_code == 409
                
    async def test_options_validation(self):
        """Test options format validation for different types"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Invalid options for single_select
            response = await client.post(
                "/api/categories",
                json={
                    "name": "bad options",
                    "type": "single_select",
                    "options": ["Just", "Strings"]  # Should be objects
                },
                headers={"Authorization": "Bearer test_token"}
            )
            assert response.status_code == 400
            assert "options" in response.json()["errors"]["validation"][0]
            
    async def test_auto_trigger_validation(self):
        """Test auto_trigger only allowed for number/single_select"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/categories",
                json={
                    "name": "invalid trigger",
                    "type": "multi_select",
                    "auto_trigger": True,  # Invalid for multi_select
                    "options": ["Option1", "Option2"]
                },
                headers={"Authorization": "Bearer test_token"}
            )
            assert response.status_code == 400
            assert "auto_trigger" in response.json()["errors"]["validation"][0]
            
    async def test_missing_auth(self):
        """Test authentication required"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/categories",
                json={"name": "test", "type": "text"}
            )
            assert response.status_code in [401, 422]
```

---

## Task 2: GET /api/export Endpoint

### Requirements
- Export all individuals to CSV format
- Basic fields only: name, height, weight, skin_color, danger_score, last_seen
- No filtering - export all individuals
- Return as file download

### Implementation Steps
1. Create endpoint in `api/individuals.py` or new `api/export.py`
2. Query all individuals with their latest interaction for last_seen
3. Format data as CSV:
   - Use danger_override if set, else danger_score
   - Handle null values as empty strings
   - Multi-select values comma-separated
4. Return with proper headers for file download

### Test Cases
```python
# File: backend/tests/test_export_csv.py

import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
from main import app
from datetime import datetime, timezone
import csv
import io

@pytest.mark.asyncio
class TestExportCSV:
    
    async def test_export_csv_success(self):
        """Test successful CSV export with all individuals"""
        # This test MUST fail initially
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Mock data
            mock_individuals = [
                {
                    "id": "123",
                    "name": "John Doe",
                    "data": {
                        "height": 72,
                        "weight": 180,
                        "skin_color": "Light"
                    },
                    "danger_score": 75,
                    "danger_override": None
                },
                {
                    "id": "456", 
                    "name": "Jane Smith",
                    "data": {
                        "height": 64,
                        "weight": 130,
                        "skin_color": "Dark"
                    },
                    "danger_score": 30,
                    "danger_override": 50  # Override set
                }
            ]
            
            mock_interactions = [
                {"individual_id": "123", "created_at": "2024-01-15T10:00:00Z"},
                {"individual_id": "456", "created_at": "2024-01-16T14:30:00Z"}
            ]
            
            with patch("supabase.Client") as mock_client:
                # Mock individuals query
                mock_client.table("individuals").select().execute.return_value.data = mock_individuals
                # Mock interactions query
                mock_client.table("interactions").select().execute.return_value.data = mock_interactions
                
                response = await client.get(
                    "/api/export",
                    headers={"Authorization": "Bearer test_token"}
                )
                
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/csv"
            assert "attachment" in response.headers["content-disposition"]
            
            # Parse CSV content
            csv_content = response.text
            reader = csv.DictReader(io.StringIO(csv_content))
            rows = list(reader)
            
            assert len(rows) == 2
            assert rows[0]["name"] == "John Doe"
            assert rows[0]["danger_score"] == "75"  # No override
            assert rows[1]["danger_score"] == "50"  # Override used
            
    async def test_export_empty_database(self):
        """Test CSV export with no individuals"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            with patch("supabase.Client") as mock_client:
                mock_client.table("individuals").select().execute.return_value.data = []
                
                response = await client.get(
                    "/api/export",
                    headers={"Authorization": "Bearer test_token"}
                )
                
            assert response.status_code == 200
            csv_content = response.text
            assert "name,height,weight,skin_color,danger_score,last_seen" in csv_content
            assert len(csv_content.strip().split('\n')) == 1  # Headers only
            
    async def test_export_null_values(self):
        """Test CSV export handles null values properly"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            mock_individual = {
                "id": "789",
                "name": "Incomplete Person",
                "data": {
                    "height": None,  # Null value
                    "weight": 150,
                    "skin_color": "Medium"
                },
                "danger_score": 0,
                "danger_override": None
            }
            
            with patch("supabase.Client") as mock_client:
                mock_client.table("individuals").select().execute.return_value.data = [mock_individual]
                mock_client.table("interactions").select().execute.return_value.data = []
                
                response = await client.get(
                    "/api/export",
                    headers={"Authorization": "Bearer test_token"}
                )
                
            csv_content = response.text
            reader = csv.DictReader(io.StringIO(csv_content))
            row = list(reader)[0]
            assert row["height"] == ""  # Null becomes empty string
            assert row["last_seen"] == ""  # No interactions
            
    async def test_export_requires_auth(self):
        """Test authentication required for export"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/export")
            assert response.status_code in [401, 422]
```

---

## Task 3: Demo Data SQL

### Requirements
- 20 individuals with varied profiles
- Custom categories inserted first
- Specific danger score distribution
- 1-10 interactions per individual
- Mix of voice and manual entries

### Implementation Steps
1. Create `supabase/migrations/003_demo_data.sql`
2. Insert custom categories first
3. Insert 20 individuals with:
   - Varied danger scores (low/medium/high distribution)
   - 5 with manual overrides
   - 3 with auto-triggered scores
4. Insert interactions for each individual:
   - Randomized 1-10 per person
   - Mix of voice (with transcriptions) and manual
   - Various SF locations

### Test SQL Validation
```sql
-- File: backend/tests/test_demo_data_validation.sql
-- Run this to verify demo data meets requirements

-- Test 1: Verify 20 individuals exist
SELECT COUNT(*) as individual_count FROM individuals;
-- Expected: 20

-- Test 2: Verify danger score distribution
SELECT 
    CASE 
        WHEN COALESCE(danger_override, danger_score) <= 33 THEN 'Low (0-33)'
        WHEN COALESCE(danger_override, danger_score) <= 66 THEN 'Medium (34-66)'
        ELSE 'High (67-100)'
    END as danger_range,
    COUNT(*) as count
FROM individuals
GROUP BY danger_range
ORDER BY danger_range;
-- Expected: ~6 low, ~8 medium, ~6 high

-- Test 3: Verify manual overrides
SELECT COUNT(*) as override_count 
FROM individuals 
WHERE danger_override IS NOT NULL;
-- Expected: 5

-- Test 4: Verify auto-triggered scores
SELECT COUNT(*) as auto_triggered_count
FROM individuals
WHERE danger_score = 100;
-- Expected: At least 3

-- Test 5: Verify custom categories
SELECT name, type, danger_weight, auto_trigger 
FROM categories 
WHERE is_preset = false
ORDER BY name;
-- Expected: 4 custom categories (housing_priority, medical_conditions, veteran_status, violent_behavior)

-- Test 6: Verify interaction distribution
SELECT 
    i.name,
    COUNT(int.id) as interaction_count
FROM individuals i
LEFT JOIN interactions int ON i.id = int.individual_id
GROUP BY i.id, i.name
ORDER BY interaction_count;
-- Expected: Each individual has 1-10 interactions

-- Test 7: Verify voice vs manual entries
SELECT 
    CASE 
        WHEN transcription IS NOT NULL THEN 'Voice'
        ELSE 'Manual'
    END as entry_type,
    COUNT(*) as count
FROM interactions
GROUP BY entry_type;
-- Expected: Mix of both types

-- Test 8: Verify location variety
SELECT DISTINCT 
    (location->>'address') as location_address
FROM interactions
WHERE location IS NOT NULL
LIMIT 10;
-- Expected: Various SF locations (Market St, Mission, Golden Gate Park, etc.)

-- Test 9: Verify specific individuals exist
SELECT name, danger_score, danger_override 
FROM individuals 
WHERE name IN ('John Doe', 'Sarah Smith', 'Robert Johnson');
-- Expected: John (75), Sarah (20 with override 40), Robert (90)

-- Test 10: Verify all custom fields populated for at least one individual
SELECT COUNT(DISTINCT i.id) as individuals_with_all_custom_fields
FROM individuals i
WHERE 
    i.data->>'veteran_status' IS NOT NULL
    AND i.data->>'medical_conditions' IS NOT NULL
    AND i.data->>'housing_priority' IS NOT NULL
    AND i.data->>'violent_behavior' IS NOT NULL;
-- Expected: At least 1
```

### Demo Data SQL Template
```sql
-- File: supabase/migrations/003_demo_data.sql

-- Step 1: Insert custom categories
INSERT INTO categories (name, type, is_required, is_preset, priority, danger_weight, auto_trigger, options) VALUES
('veteran_status', 'single_select', false, false, 'high', 20, false,
 '[{"label": "Yes", "value": 1}, {"label": "No", "value": 0}, {"label": "Unknown", "value": 0}]'::jsonb),
('medical_conditions', 'multi_select', false, false, 'high', 0, false,
 '["Diabetes", "Heart Disease", "Mental Health", "Mobility Issues", "Chronic Pain", "None"]'::jsonb),
('housing_priority', 'single_select', false, false, 'high', 30, false,
 '[{"label": "Critical", "value": 1}, {"label": "High", "value": 0.7}, {"label": "Medium", "value": 0.4}, {"label": "Low", "value": 0.1}]'::jsonb),
('violent_behavior', 'single_select', false, false, 'high', 40, true,
 '[{"label": "None", "value": 0}, {"label": "Verbal Only", "value": 0.3}, {"label": "Physical", "value": 1}]'::jsonb);

-- Step 2: Insert individuals (20 total)
-- Specific individuals
INSERT INTO individuals (id, name, data, danger_score, danger_override, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 
 '{"height": 72, "weight": 180, "skin_color": "Light", "gender": "Male", "veteran_status": "Yes", "housing_priority": "High"}'::jsonb,
 75, NULL, NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 days'),
 
('550e8400-e29b-41d4-a716-446655440002', 'Sarah Smith',
 '{"height": 64, "weight": 130, "skin_color": "Dark", "gender": "Female", "substance_abuse_history": ["In Recovery"], "housing_priority": "Medium"}'::jsonb,
 20, 40, NOW() - INTERVAL '45 days', NOW() - INTERVAL '1 day'),
 
('550e8400-e29b-41d4-a716-446655440003', 'Robert Johnson',
 '{"height": 70, "weight": 200, "skin_color": "Medium", "gender": "Male", "veteran_status": "Yes", "violent_behavior": "Physical"}'::jsonb,
 90, NULL, NOW() - INTERVAL '60 days', NOW() - INTERVAL '3 days');

-- Continue with 17 more generic individuals...

-- Step 3: Insert interactions
-- For each individual, insert 1-10 interactions with variety
-- Include mix of voice entries (with transcription) and manual entries
-- Vary locations across SF
```

---

## Testing Strategy

### Pre-Implementation Verification
Before implementing any code, run the test files to ensure they fail:

```bash
# Run each test file individually
cd backend
pytest tests/test_create_category.py -v  # Should fail all tests
pytest tests/test_export_csv.py -v       # Should fail all tests

# For SQL validation, the queries should return no results or incorrect counts
```

### Post-Implementation Verification
After implementing each feature:

```bash
# Run tests again - all should pass
pytest tests/test_create_category.py -v
pytest tests/test_export_csv.py -v

# Run demo data validation SQL after inserting data
psql $DATABASE_URL < tests/test_demo_data_validation.sql
```

### Integration Testing
After all three tasks complete:

```bash
# Run full test suite
pytest tests/ -v

# Test end-to-end flow
# 1. Create custom category via API
# 2. Verify it appears in export
# 3. Verify demo data uses custom categories
```

---

## Implementation Order

1. **POST /api/categories** - Frontend needs this for Task 5
2. **GET /api/export** - Quick to implement, useful for testing
3. **Demo data SQL** - Best done last to use real categories

## Error Handling Patterns

All endpoints should follow consistent error response format:

```python
def create_error_response(validation_errors=None, missing_required=None):
    return {
        "success": False,
        "errors": {
            "validation": validation_errors or [],
            "missing_required": missing_required or []
        }
    }
```

## Notes

- Keep validation simple but effective
- Use existing patterns from Task 2.15 implementation
- Ensure all tests fail before implementation to avoid false positives
- Follow existing code style and conventions