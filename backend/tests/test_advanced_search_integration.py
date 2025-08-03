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

# Mock Supabase data
def get_mock_db_individuals():
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
        }
    ]

class TestAdvancedSearchIntegration:
    """Integration tests for the advanced search endpoint"""
    
    @patch('api.individuals.get_supabase_client')
    def test_search_without_filters(self, mock_get_supabase):
        """Test basic search without any filters"""
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
        mock_execute.data = get_mock_db_individuals()
        
        # Mock interactions table (empty for now)
        def mock_table_func(table_name):
            if table_name == "individuals":
                return mock_table
            else:
                # For interactions table
                int_table = MagicMock()
                int_select = MagicMock()
                int_table.select.return_value = int_select
                int_eq = MagicMock()
                int_select.eq.return_value = int_eq
                int_order = MagicMock()
                int_eq.order.return_value = int_order
                int_limit = MagicMock()
                int_order.limit.return_value = int_limit
                int_execute = MagicMock()
                int_limit.execute.return_value = int_execute
                int_execute.data = []
                return int_table
        
        mock_supabase.table = mock_table_func
        
        response = client.get("/api/individuals/search")
        
        assert response.status_code == 200
        data = response.json()
        assert "individuals" in data
        assert "total" in data
        assert data["total"] == 3
        assert len(data["individuals"]) == 3
        
        # Check that individuals have required fields
        for ind in data["individuals"]:
            assert "id" in ind
            assert "name" in ind
            assert "danger_score" in ind
            assert "display_score" in ind
            assert "last_seen" in ind
            assert "last_location" in ind
    
    @patch('api.individuals.get_supabase_client')
    def test_text_search(self, mock_get_supabase):
        """Test text search functionality"""
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
        
        # For this test, the service will filter in-memory
        mock_execute.data = get_mock_db_individuals()
        
        # Mock interactions table
        def mock_table_func(table_name):
            if table_name == "individuals":
                return mock_table
            else:
                int_table = MagicMock()
                int_select = MagicMock()
                int_table.select.return_value = int_select
                int_eq = MagicMock()
                int_select.eq.return_value = int_eq
                int_order = MagicMock()
                int_eq.order.return_value = int_order
                int_limit = MagicMock()
                int_order.limit.return_value = int_limit
                int_execute = MagicMock()
                int_limit.execute.return_value = int_execute
                int_execute.data = []
                return int_table
        
        mock_supabase.table = mock_table_func
        
        response = client.get("/api/individuals/search?q=John")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2  # John Doe and Robert Johnson
        assert all("John" in ind["name"] for ind in data["individuals"])
    
    @patch('api.individuals.get_supabase_client')
    def test_gender_filter(self, mock_get_supabase):
        """Test gender filter"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_db_individuals()
        
        # Mock interactions table
        def mock_table_func(table_name):
            if table_name == "individuals":
                return mock_table
            else:
                int_table = MagicMock()
                int_select = MagicMock()
                int_table.select.return_value = int_select
                int_eq = MagicMock()
                int_select.eq.return_value = int_eq
                int_order = MagicMock()
                int_eq.order.return_value = int_order
                int_limit = MagicMock()
                int_order.limit.return_value = int_limit
                int_execute = MagicMock()
                int_limit.execute.return_value = int_execute
                int_execute.data = []
                return int_table
        
        mock_supabase.table = mock_table_func
        
        response = client.get("/api/individuals/search?gender=Female")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["individuals"][0]["name"] == "Jane Smith"
    
    @patch('api.individuals.get_supabase_client')
    def test_age_range_filter(self, mock_get_supabase):
        """Test age range filter with overlap logic"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_db_individuals()
        
        # Mock interactions table
        def mock_table_func(table_name):
            if table_name == "individuals":
                return mock_table
            else:
                int_table = MagicMock()
                int_select = MagicMock()
                int_table.select.return_value = int_select
                int_eq = MagicMock()
                int_select.eq.return_value = int_eq
                int_order = MagicMock()
                int_eq.order.return_value = int_order
                int_limit = MagicMock()
                int_order.limit.return_value = int_limit
                int_execute = MagicMock()
                int_limit.execute.return_value = int_execute
                int_execute.data = []
                return int_table
        
        mock_supabase.table = mock_table_func
        
        # Test age range 30-50 (should include John 40-50 and Jane 25-35)
        response = client.get("/api/individuals/search?age_min=30&age_max=50")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        names = [ind["name"] for ind in data["individuals"]]
        assert "John Doe" in names
        assert "Jane Smith" in names
    
    @patch('api.individuals.get_supabase_client')
    def test_distance_sort_validation(self, mock_get_supabase):
        """Test that distance sort requires coordinates"""
        # This should fail with 400 before calling any service
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Try distance sort without coordinates
        response = client.get("/api/individuals/search?sort_by=distance")
        
        assert response.status_code == 400
        assert "Distance sort requires lat and lon parameters" in response.json()["detail"]
        
        # Verify the service was never called since validation should fail first
        mock_get_supabase.assert_not_called()
    
    @patch('api.individuals.get_supabase_client')
    def test_pagination(self, mock_get_supabase):
        """Test pagination functionality"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_db_individuals()
        
        # Mock interactions table
        def mock_table_func(table_name):
            if table_name == "individuals":
                return mock_table
            else:
                int_table = MagicMock()
                int_select = MagicMock()
                int_table.select.return_value = int_select
                int_eq = MagicMock()
                int_select.eq.return_value = int_eq
                int_order = MagicMock()
                int_eq.order.return_value = int_order
                int_limit = MagicMock()
                int_order.limit.return_value = int_limit
                int_execute = MagicMock()
                int_limit.execute.return_value = int_execute
                int_execute.data = []
                return int_table
        
        mock_supabase.table = mock_table_func
        
        # Test limit and offset
        response = client.get("/api/individuals/search?limit=2&offset=1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 2
        assert data["offset"] == 1
        assert len(data["individuals"]) == 2
        assert data["total"] == 3  # Total count regardless of pagination
    
    @patch('api.individuals.get_supabase_client')
    def test_combined_filters(self, mock_get_supabase):
        """Test multiple filters combined with AND logic"""
        mock_supabase = MagicMock()
        mock_get_supabase.return_value = mock_supabase
        
        # Mock database response
        mock_table = MagicMock()
        mock_supabase.table.return_value = mock_table
        mock_select = MagicMock()
        mock_table.select.return_value = mock_select
        mock_execute = MagicMock()
        mock_select.execute.return_value = mock_execute
        mock_execute.data = get_mock_db_individuals()
        
        # Mock interactions table
        def mock_table_func(table_name):
            if table_name == "individuals":
                return mock_table
            else:
                int_table = MagicMock()
                int_select = MagicMock()
                int_table.select.return_value = int_select
                int_eq = MagicMock()
                int_select.eq.return_value = int_eq
                int_order = MagicMock()
                int_eq.order.return_value = int_order
                int_limit = MagicMock()
                int_order.limit.return_value = int_limit
                int_execute = MagicMock()
                int_limit.execute.return_value = int_execute
                int_execute.data = []
                return int_table
        
        mock_supabase.table = mock_table_func
        
        # Test: Male, height 68-75, has photo
        response = client.get("/api/individuals/search?gender=Male&height_min=68&height_max=75&has_photo=true")
        
        assert response.status_code == 200
        data = response.json()
        # Should include John (Male, 72", has photo) and Robert (Male, 70", has photo)
        assert data["total"] == 2