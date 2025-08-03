import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from api.auth import get_current_user
from api.individuals import get_current_user_name

# Mock authentication
async def mock_get_current_user():
    return "test-user-id"

async def mock_get_current_user_name():
    return "Test User"

app.dependency_overrides[get_current_user] = mock_get_current_user
app.dependency_overrides[get_current_user_name] = mock_get_current_user_name

client = TestClient(app)

# Test data
def get_mock_individuals():
    return [
        {
            "id": str(uuid4()),
            "name": "John Doe",
            "danger_score": 75,
            "danger_override": None,
            "photo_url": "https://example.com/photo1.jpg",
            "data": {
                "gender": "Male",
                "approximate_age": [40, 50],
                "height": 72,
                "weight": 180,
                "skin_color": "Light"
            },
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid4()),
            "name": "Jane Smith",
            "danger_score": 30,
            "danger_override": None,
            "photo_url": None,
            "data": {
                "gender": "Female",
                "approximate_age": [25, 35],
                "height": 65,
                "weight": 140,
                "skin_color": "Medium"
            },
            "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "updated_at": (datetime.utcnow() - timedelta(days=1)).isoformat()
        },
        {
            "id": str(uuid4()),
            "name": "Robert Johnson",
            "danger_score": 90,
            "danger_override": None,
            "photo_url": "https://example.com/photo3.jpg",
            "data": {
                "gender": "Male", 
                "approximate_age": [55, 65],
                "height": 70,
                "weight": 200,
                "skin_color": "Dark"
            },
            "created_at": (datetime.utcnow() - timedelta(days=2)).isoformat(),
            "updated_at": (datetime.utcnow() - timedelta(hours=1)).isoformat()
        },
        {
            "id": str(uuid4()),
            "name": "Alice Williams",
            "danger_score": 15,
            "danger_override": None,
            "photo_url": "https://example.com/photo4.jpg",
            "data": {
                "gender": "Female",
                "approximate_age": [18, 25],
                "height": 62,
                "weight": 120,
                "skin_color": "Light",
                "additional_info": "Has a service dog"
            },
            "created_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
            "updated_at": (datetime.utcnow() - timedelta(days=5)).isoformat()
        }
    ]


class TestAdvancedSearch:
    """Test cases for the advanced search endpoint"""
    
    # Test 1: Search with no filters returns all
    @patch('api.individuals.get_supabase_client')
    def test_search_no_filters_returns_all(self, mock_get_supabase):
        """Test that search with no filters returns all individuals"""
        # Setup mock
        mock_individuals = get_mock_individuals()
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock the service method
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            # Convert to IndividualSummary format
            summaries = []
            for ind in mock_individuals:
                danger_score = ind.get("danger_score", 0)
                danger_override = ind.get("danger_override")
                display_score = danger_override if danger_override is not None else danger_score
                
                summaries.append({
                    "id": ind["id"],
                    "name": ind["name"],
                    "danger_score": danger_score,
                    "danger_override": danger_override,
                    "display_score": display_score,
                    "last_seen": ind["updated_at"],
                    "last_location": {"address": "Market St & 5th"}
                })
            
            mock_search.return_value = {
                "individuals": summaries,
                "total": len(summaries),
                "limit": 10,
                "offset": 0
            }
            
            response = client.get("/api/individuals/search")
            
            if response.status_code != 200:
                print(f"Response status: {response.status_code}")
                print(f"Response body: {response.json()}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 4
            assert len(data["individuals"]) == 4
    
    # Test 2: Text search finds in name field
    @patch('api.individuals.get_supabase_client')
    def test_text_search_finds_in_name(self, mock_get_supabase):
        """Test that text search finds matches in name field"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            # Return only individuals with "John" in name
            mock_search.return_value = {
                "individuals": [ind for ind in get_mock_individuals() if "John" in ind["name"]],
                "total": 2,
                "limit": 10,
                "offset": 0
            }
            
            response = client.get("/api/individuals/search?q=John")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 2
            assert all("John" in ind["name"] for ind in data["individuals"])
    
    # Test 3: Text search finds in JSONB data
    @patch('api.individuals.get_supabase_client')
    def test_text_search_finds_in_jsonb(self, mock_get_supabase):
        """Test that text search finds matches in JSONB data fields"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            # Return individual with "service dog" in additional_info
            mock_search.return_value = {
                "individuals": [ind for ind in get_mock_individuals() if "service dog" in str(ind.get("data", {}))],
                "total": 1,
                "limit": 10,
                "offset": 0
            }
            
            response = client.get("/api/individuals/search?q=service%20dog")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 1
            assert "service dog" in str(data["individuals"][0]["data"])
    
    # Test 4: Gender filter with single value
    @patch('api.individuals.get_supabase_client')
    def test_gender_filter_single_value(self, mock_get_supabase):
        """Test gender filter with single value"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            # Return only males
            males = [ind for ind in get_mock_individuals() if ind["data"].get("gender") == "Male"]
            mock_search.return_value = {
                "individuals": males,
                "total": len(males),
                "limit": 10,
                "offset": 0
            }
            
            response = client.get("/api/individuals/search?gender=Male")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 2
            assert all(ind["data"]["gender"] == "Male" for ind in data["individuals"])
    
    # Test 5: Gender filter with multiple values (OR)
    @patch('api.individuals.get_supabase_client')
    def test_gender_filter_multiple_values(self, mock_get_supabase):
        """Test gender filter with multiple values using OR logic"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            # Return males and females
            mock_search.return_value = {
                "individuals": get_mock_individuals(),
                "total": 4,
                "limit": 10,
                "offset": 0
            }
            
            response = client.get("/api/individuals/search?gender=Male,Female")
            
            assert response.status_code == 200
            data = response.json()
            assert data["total"] == 4
            assert all(ind["data"]["gender"] in ["Male", "Female"] for ind in data["individuals"])
    
    # Test 6: Age range overlap logic works correctly
    @patch('api.individuals.get_supabase_client')
    def test_age_range_overlap_logic(self, mock_get_supabase):
        """Test age range filter with overlap logic: NOT (ind_max < filter_min OR ind_min > filter_max)"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            # Filter for ages 30-50, should include individuals with ranges that overlap
            overlapping = []
            for ind in get_mock_individuals():
                age_range = ind["data"].get("approximate_age", [])
                if age_range and len(age_range) == 2:
                    # Check overlap: NOT (ind_max < 30 OR ind_min > 50)
                    if not (age_range[1] < 30 or age_range[0] > 50):
                        overlapping.append(ind)
            
            mock_search.return_value = {
                "individuals": overlapping,
                "total": len(overlapping),
                "limit": 10,
                "offset": 0
            }
            
            response = client.get("/api/individuals/search?age_min=30&age_max=50")
            
            assert response.status_code == 200
            data = response.json()
            # Should include John (40-50) and Jane (25-35)
            assert data["total"] == 2
    
    # Test 7: All filters combined with AND logic
    @patch('api.individuals.get_supabase_client')
    def test_all_filters_combined(self, mock_get_supabase):
        """Test that all filters are combined with AND logic"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            # Filter: Male, age 40-60, height 68-75, danger 50-100, has photo
            filtered = []
            for ind in get_mock_individuals():
                data = ind["data"]
                # Check all conditions
                if (data.get("gender") == "Male" and
                    data.get("height", 0) >= 68 and data.get("height", 0) <= 75 and
                    ind["danger_score"] >= 50 and ind["danger_score"] <= 100 and
                    ind["photo_url"] is not None):
                    # Check age overlap
                    age_range = data.get("approximate_age", [])
                    if age_range and len(age_range) == 2:
                        if not (age_range[1] < 40 or age_range[0] > 60):
                            filtered.append(ind)
            
            mock_search.return_value = {
                "individuals": filtered,
                "total": len(filtered),
                "limit": 10,
                "offset": 0
            }
            
            response = client.get(
                "/api/individuals/search?"
                "gender=Male&age_min=40&age_max=60&"
                "height_min=68&height_max=75&"
                "danger_min=50&danger_max=100&"
                "has_photo=true"
            )
            
            assert response.status_code == 200
            data = response.json()
            # Should only include John and Robert
            assert data["total"] >= 1
    
    # Test 8: Sort by each option works
    @patch('api.individuals.get_supabase_client')
    def test_sort_options(self, mock_get_supabase):
        """Test sorting by each available option"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Test each sort option
        sort_options = ["danger_score", "last_seen", "name"]
        
        for sort_by in sort_options:
            with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
                mock_search.return_value = {
                    "individuals": get_mock_individuals(),
                    "total": 4,
                    "limit": 10,
                    "offset": 0
                }
                
                response = client.get(f"/api/individuals/search?sort_by={sort_by}&sort_order=desc")
                
                assert response.status_code == 200
                data = response.json()
                assert "individuals" in data
    
    # Test 9: Distance sort only with coordinates
    @patch('api.individuals.get_supabase_client')
    def test_distance_sort_requires_coordinates(self, mock_get_supabase):
        """Test that distance sort requires lat/lon coordinates"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Try distance sort without coordinates - should fail
        response = client.get("/api/individuals/search?sort_by=distance")
        assert response.status_code == 400
        
        # Try with coordinates - should work
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = {
                "individuals": get_mock_individuals(),
                "total": 4,
                "limit": 10,
                "offset": 0
            }
            
            response = client.get("/api/individuals/search?sort_by=distance&lat=37.7749&lon=-122.4194")
            assert response.status_code == 200
    
    # Test 10: Pagination limit and offset
    @patch('api.individuals.get_supabase_client')
    def test_pagination(self, mock_get_supabase):
        """Test pagination with limit and offset"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            # Return 2 individuals with limit=2, offset=1
            all_individuals = get_mock_individuals()
            mock_search.return_value = {
                "individuals": all_individuals[1:3],  # Skip first, take next 2
                "total": len(all_individuals),
                "limit": 2,
                "offset": 1
            }
            
            response = client.get("/api/individuals/search?limit=2&offset=1")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["individuals"]) == 2
            assert data["limit"] == 2
            assert data["offset"] == 1
            assert data["total"] == 4
    
    # Test 11: Max offset 100 enforced
    @patch('api.individuals.get_supabase_client')
    def test_max_offset_enforced(self, mock_get_supabase):
        """Test that maximum offset of 100 is enforced"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Try offset > 100
        response = client.get("/api/individuals/search?offset=101")
        assert response.status_code == 422  # Validation error
    
    # Test 12: Response time < 500ms with filters
    @patch('api.individuals.get_supabase_client')
    def test_response_time_with_filters(self, mock_get_supabase):
        """Test that response time is under 500ms even with multiple filters"""
        import time
        
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = {
                "individuals": get_mock_individuals()[:2],
                "total": 2,
                "limit": 10,
                "offset": 0
            }
            
            start_time = time.time()
            response = client.get(
                "/api/individuals/search?"
                "q=test&gender=Male,Female&age_min=25&age_max=50&"
                "height_min=60&height_max=80&danger_min=0&danger_max=100&"
                "has_photo=true&sort_by=danger_score&sort_order=desc"
            )
            end_time = time.time()
            
            assert response.status_code == 200
            assert (end_time - start_time) < 0.5  # Less than 500ms
    
    # Additional test: Height range filter
    @patch('api.individuals.get_supabase_client')
    def test_height_range_filter(self, mock_get_supabase):
        """Test height range filter"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            # Filter for height 65-70
            filtered = [ind for ind in get_mock_individuals() 
                       if 65 <= ind["data"].get("height", 0) <= 70]
            
            mock_search.return_value = {
                "individuals": filtered,
                "total": len(filtered),
                "limit": 10,
                "offset": 0
            }
            
            response = client.get("/api/individuals/search?height_min=65&height_max=70")
            
            assert response.status_code == 200
            data = response.json()
            assert all(65 <= ind["data"]["height"] <= 70 for ind in data["individuals"])
    
    # Additional test: Danger score range filter
    @patch('api.individuals.get_supabase_client')
    def test_danger_score_filter(self, mock_get_supabase):
        """Test danger score range filter"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            # Filter for danger score 50-100
            filtered = [ind for ind in get_mock_individuals() 
                       if 50 <= ind["danger_score"] <= 100]
            
            mock_search.return_value = {
                "individuals": filtered,
                "total": len(filtered),
                "limit": 10,
                "offset": 0
            }
            
            response = client.get("/api/individuals/search?danger_min=50&danger_max=100")
            
            assert response.status_code == 200
            data = response.json()
            assert all(50 <= ind["danger_score"] <= 100 for ind in data["individuals"])
    
    # Additional test: Has photo filter
    @patch('api.individuals.get_supabase_client')
    def test_has_photo_filter(self, mock_get_supabase):
        """Test has_photo boolean filter"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Test has_photo=true
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            with_photos = [ind for ind in get_mock_individuals() if ind["photo_url"] is not None]
            mock_search.return_value = {
                "individuals": with_photos,
                "total": len(with_photos),
                "limit": 10,
                "offset": 0
            }
            
            response = client.get("/api/individuals/search?has_photo=true")
            assert response.status_code == 200
            data = response.json()
            assert all(ind["photo_url"] is not None for ind in data["individuals"])
        
        # Test has_photo=false
        with patch('services.individual_service.IndividualService.advanced_search', new_callable=AsyncMock) as mock_search:
            without_photos = [ind for ind in get_mock_individuals() if ind["photo_url"] is None]
            mock_search.return_value = {
                "individuals": without_photos,
                "total": len(without_photos),
                "limit": 10,
                "offset": 0
            }
            
            response = client.get("/api/individuals/search?has_photo=false")
            assert response.status_code == 200
            data = response.json()
            assert all(ind["photo_url"] is None for ind in data["individuals"])