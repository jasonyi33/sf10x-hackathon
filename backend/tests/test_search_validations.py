import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from api.auth import get_current_user

# Mock authentication
async def mock_get_current_user():
    return "test-user-id"

app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)


class TestSearchValidations:
    """Test search endpoint validations"""
    
    def test_offset_limit_validation(self):
        """Test that offset cannot exceed 100"""
        # Test offset = 100 (should work)
        response = client.get("/api/individuals/search?offset=100")
        assert response.status_code in [200, 500]  # 200 if DB exists, 500 if not
        
        # Test offset = 101 (should fail with validation error)
        response = client.get("/api/individuals/search?offset=101")
        assert response.status_code == 422  # FastAPI validation error
        data = response.json()
        # Check that it's a validation error for offset
        assert any("offset" in str(error).lower() for error in data.get("detail", []))
        
        # Test offset = 150 (should fail)
        response = client.get("/api/individuals/search?offset=150")
        assert response.status_code == 422
    
    def test_distance_sort_requires_coordinates(self):
        """Test that distance sort requires lat and lon"""
        # Distance sort without coordinates should fail
        response = client.get("/api/individuals/search?sort_by=distance")
        assert response.status_code == 400
        data = response.json()
        assert "distance sort requires" in data["detail"].lower()
        
        # Distance sort with only lat should fail
        response = client.get("/api/individuals/search?sort_by=distance&lat=37.7749")
        assert response.status_code == 400
        
        # Distance sort with only lon should fail
        response = client.get("/api/individuals/search?sort_by=distance&lon=-122.4194")
        assert response.status_code == 400
        
        # Distance sort with both coordinates should work
        response = client.get("/api/individuals/search?sort_by=distance&lat=37.7749&lon=-122.4194")
        assert response.status_code in [200, 500]  # 200 if DB exists, 500 if not
    
    def test_query_parameters_validation(self):
        """Test that query parameters are validated correctly"""
        # Test valid sort_by values
        for sort_by in ["danger_score", "last_seen", "name", "distance"]:
            if sort_by == "distance":
                response = client.get(f"/api/individuals/search?sort_by={sort_by}&lat=37.7749&lon=-122.4194")
            else:
                response = client.get(f"/api/individuals/search?sort_by={sort_by}")
            assert response.status_code in [200, 500]
        
        # Test invalid sort_by value
        response = client.get("/api/individuals/search?sort_by=invalid")
        assert response.status_code == 422  # Validation error
        
        # Test valid sort_order values
        for sort_order in ["asc", "desc"]:
            response = client.get(f"/api/individuals/search?sort_order={sort_order}")
            assert response.status_code in [200, 500]
        
        # Test invalid sort_order value
        response = client.get("/api/individuals/search?sort_order=invalid")
        assert response.status_code == 422
    
    def test_numeric_range_validations(self):
        """Test numeric range parameter validations"""
        # Test age range limits
        response = client.get("/api/individuals/search?age_min=-1")
        assert response.status_code == 422
        
        response = client.get("/api/individuals/search?age_max=121")
        assert response.status_code == 422
        
        response = client.get("/api/individuals/search?age_min=0&age_max=120")
        assert response.status_code in [200, 500]
        
        # Test height range limits
        response = client.get("/api/individuals/search?height_min=-1")
        assert response.status_code == 422
        
        response = client.get("/api/individuals/search?height_max=301")
        assert response.status_code == 422
        
        # Test danger score range limits
        response = client.get("/api/individuals/search?danger_min=-1")
        assert response.status_code == 422
        
        response = client.get("/api/individuals/search?danger_max=101")
        assert response.status_code == 422
        
        # Test limit and offset ranges
        response = client.get("/api/individuals/search?limit=0")
        assert response.status_code == 422
        
        response = client.get("/api/individuals/search?limit=21")
        assert response.status_code == 422
        
        response = client.get("/api/individuals/search?offset=-1")
        assert response.status_code == 422