import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock, AsyncMock
from uuid import uuid4
import sys
import os
import time

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
def get_mock_individuals_with_variety():
    """Get individuals with variety of data for filter extraction"""
    return [
        {
            "id": str(uuid4()),
            "name": "John Doe",
            "danger_score": 75,
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
            "name": "Unknown Person",
            "danger_score": 15,
            "photo_url": None,
            "data": {
                "gender": "Unknown",
                "approximate_age": [-1, -1],  # Unknown age
                "height": 68,
                "weight": 160,
                "skin_color": "Medium"
            },
            "created_at": (datetime.utcnow() - timedelta(days=5)).isoformat(),
            "updated_at": (datetime.utcnow() - timedelta(days=5)).isoformat()
        },
        {
            "id": str(uuid4()),
            "name": "Alice Williams",
            "danger_score": 5,
            "photo_url": "https://example.com/photo5.jpg", 
            "data": {
                "gender": "Female",
                "approximate_age": [18, 25],
                "height": 62,
                "weight": 120,
                "skin_color": "Light"
            },
            "created_at": (datetime.utcnow() - timedelta(days=3)).isoformat(),
            "updated_at": (datetime.utcnow() - timedelta(days=3)).isoformat()
        }
    ]


class TestFilterOptions:
    """Test cases for the filter options endpoint"""
    
    def setup_method(self):
        """Clear cache before each test"""
        import api.individuals
        api.individuals.FILTER_CACHE = {}
        api.individuals.CACHE_EXPIRY = None
    
    # Test 1: Returns all filter options
    @patch('api.individuals.get_supabase_client')
    def test_returns_all_filter_options(self, mock_get_supabase):
        """Test that endpoint returns all expected filter options"""
        # Setup mock
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_individuals_with_variety()
        
        response = client.get("/api/search/filters")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "filters" in data
        assert "cached_at" in data
        assert "expires_at" in data
        
        filters = data["filters"]
        assert "gender" in filters
        assert "age_range" in filters
        assert "height_range" in filters
        assert "has_photo" in filters
        assert "danger_score_range" in filters
    
    # Test 2: Gender list includes all unique values
    @patch('api.individuals.get_supabase_client')
    def test_gender_list_unique_values(self, mock_get_supabase):
        """Test that gender filter includes all unique values from data"""
        # Setup mock
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_individuals_with_variety()
        
        response = client.get("/api/search/filters")
        
        assert response.status_code == 200
        data = response.json()
        
        gender_list = data["filters"]["gender"]
        # Should have Male, Female, Unknown from test data
        assert "Male" in gender_list
        assert "Female" in gender_list
        assert "Unknown" in gender_list
        assert len(set(gender_list)) == len(gender_list)  # All unique
    
    # Test 3: Age range shows actual min/max
    @patch('api.individuals.get_supabase_client')
    def test_age_range_actual_values(self, mock_get_supabase):
        """Test that age range reflects actual min/max from data (excluding unknown)"""
        # Setup mock
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_individuals_with_variety()
        
        response = client.get("/api/search/filters")
        
        assert response.status_code == 200
        data = response.json()
        
        age_range = data["filters"]["age_range"]
        # From test data: min is 18 (from [18,25]), max is 65 (from [55,65])
        # Should exclude unknown ages [-1, -1]
        assert age_range["min"] == 18
        assert age_range["max"] == 65
    
    # Test 4: Height range shows actual min/max
    @patch('api.individuals.get_supabase_client')
    def test_height_range_actual_values(self, mock_get_supabase):
        """Test that height range reflects actual min/max from data"""
        # Setup mock
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_individuals_with_variety()
        
        response = client.get("/api/search/filters")
        
        assert response.status_code == 200
        data = response.json()
        
        height_range = data["filters"]["height_range"]
        # From test data: min is 62, max is 72
        assert height_range["min"] == 62
        assert height_range["max"] == 72
    
    # Test 5: Cache works for 1 hour
    @patch('api.individuals.get_supabase_client')
    def test_cache_works_for_one_hour(self, mock_get_supabase):
        """Test that cache returns same data for 1 hour"""
        # Setup mock
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_individuals_with_variety()
        
        # First request
        response1 = client.get("/api/search/filters")
        assert response1.status_code == 200
        data1 = response1.json()
        cached_at1 = data1["cached_at"]
        
        # Second request (should use cache)
        response2 = client.get("/api/search/filters")
        assert response2.status_code == 200
        data2 = response2.json()
        cached_at2 = data2["cached_at"]
        
        # Should have same cache timestamp
        assert cached_at1 == cached_at2
        
        # Verify expires_at is 1 hour after cached_at
        cached_time = datetime.fromisoformat(cached_at1.replace('Z', '+00:00'))
        expires_time = datetime.fromisoformat(data1["expires_at"].replace('Z', '+00:00'))
        time_diff = expires_time - cached_time
        # Should be approximately 1 hour (3600 seconds)
        assert 3595 <= time_diff.total_seconds() <= 3605
    
    # Test 6: Cache refreshes after expiry
    @patch('api.individuals.get_supabase_client')
    def test_cache_refreshes_after_expiry(self, mock_get_supabase):
        """Test that cache refreshes after expiry time"""
        # Setup mock
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_individuals_with_variety()
        
        # First call to populate cache
        response1 = client.get("/api/search/filters")
        assert response1.status_code == 200
        
        # Set cache expiry to past
        import api.individuals
        api.individuals.CACHE_EXPIRY = datetime.now(timezone.utc) - timedelta(minutes=1)
        
        # This should trigger cache rebuild
        response2 = client.get("/api/search/filters")
        
        assert response2.status_code == 200
        # Should be called twice (once for initial, once for rebuild)
        assert mock_get_supabase.call_count >= 2
    
    # Test 7: Empty cache triggers rebuild
    @patch('api.individuals.get_supabase_client')
    def test_empty_cache_triggers_rebuild(self, mock_get_supabase):
        """Test that empty cache triggers rebuild even if not expired"""
        # Setup mock
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_individuals_with_variety()
        
        # Clear the cache
        import api.individuals
        api.individuals.FILTER_CACHE = {}
        api.individuals.CACHE_EXPIRY = datetime.now(timezone.utc) + timedelta(hours=2)  # Not expired
        
        response = client.get("/api/search/filters")
        
        assert response.status_code == 200
        # Should rebuild cache when empty
        mock_get_supabase.assert_called()
    
    # Test 8: Response time < 100ms (cached)
    @patch('api.individuals.get_supabase_client')
    def test_cached_response_time(self, mock_get_supabase):
        """Test that cached response is fast (< 100ms)"""
        # Setup mock
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_individuals_with_variety()
        
        # First request to populate cache
        client.get("/api/search/filters")
        
        # Second request should be cached
        start_time = time.time()
        response = client.get("/api/search/filters")
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 0.1  # Less than 100ms
    
    # Test 9: Handles empty database gracefully
    @patch('api.individuals.get_supabase_client')
    def test_handles_empty_database(self, mock_get_supabase):
        """Test that endpoint handles empty database gracefully"""
        # Setup mock
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock empty database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = []  # Empty database
        
        response = client.get("/api/search/filters")
        
        assert response.status_code == 200
        data = response.json()
        
        filters = data["filters"]
        # Should have empty lists and default ranges
        assert filters["gender"] == []
        assert filters["age_range"]["min"] == 0
        assert filters["age_range"]["max"] == 120
        assert filters["height_range"]["min"] == 0
        assert filters["height_range"]["max"] == 300
        # With empty database, has_photo should be empty list
        assert filters["has_photo"] == []
        assert filters["danger_score_range"]["min"] == 0
        assert filters["danger_score_range"]["max"] == 100
    
    # Additional test: Danger score range
    @patch('api.individuals.get_supabase_client')
    def test_danger_score_range(self, mock_get_supabase):
        """Test that danger score range reflects actual values"""
        # Setup mock
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_individuals_with_variety()
        
        response = client.get("/api/search/filters")
        
        assert response.status_code == 200
        data = response.json()
        
        danger_range = data["filters"]["danger_score_range"]
        # From test data: min is 5, max is 90
        assert danger_range["min"] == 5
        assert danger_range["max"] == 90
    
    # Additional test: Has photo options
    @patch('api.individuals.get_supabase_client')
    def test_has_photo_options(self, mock_get_supabase):
        """Test that has_photo filter shows both true and false if data has both"""
        # Setup mock
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_individuals_with_variety()
        
        response = client.get("/api/search/filters")
        
        assert response.status_code == 200
        data = response.json()
        
        has_photo_options = data["filters"]["has_photo"]
        # Should have both true and false since test data has both
        assert True in has_photo_options
        assert False in has_photo_options
        assert len(has_photo_options) == 2
    
    # Additional test: Skin color options extraction
    @patch('api.individuals.get_supabase_client')
    def test_skin_color_options(self, mock_get_supabase):
        """Test that skin color options are extracted correctly"""
        # Setup mock
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_individuals_with_variety()
        
        response = client.get("/api/search/filters")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check if skin_color is included in filters
        assert "skin_color" in data["filters"]
        skin_colors = data["filters"]["skin_color"]
        # Should have Light, Medium, Dark from test data
        assert "Light" in skin_colors
        assert "Medium" in skin_colors
        assert "Dark" in skin_colors
        assert len(set(skin_colors)) == len(skin_colors)  # All unique