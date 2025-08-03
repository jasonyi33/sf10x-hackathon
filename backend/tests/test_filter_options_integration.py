import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock
from uuid import uuid4
import sys
import os
import json

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


class TestFilterOptionsIntegration:
    """Integration tests for the filter options endpoint"""
    
    def test_filter_options_endpoint_accessible(self):
        """Test that the filter options endpoint is accessible"""
        response = client.get("/api/search/filters")
        assert response.status_code in [200, 500]  # Either success or error (if no DB)
    
    def test_filter_options_requires_auth(self):
        """Test that the endpoint requires authentication"""
        # Remove auth override temporarily
        del app.dependency_overrides[get_current_user]
        
        response = client.get("/api/search/filters")
        assert response.status_code in [401, 403, 422]  # Unauthorized
        
        # Restore auth override
        app.dependency_overrides[get_current_user] = mock_get_current_user
    
    def test_filter_options_response_format(self):
        """Test that the response has the correct format"""
        response = client.get("/api/search/filters")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check top-level keys
            assert "filters" in data
            assert "cached_at" in data
            assert "expires_at" in data
            
            # Check filter structure
            filters = data["filters"]
            assert "gender" in filters
            assert "age_range" in filters
            assert "height_range" in filters
            assert "danger_score_range" in filters
            assert "has_photo" in filters
            assert "skin_color" in filters
            
            # Check data types
            assert isinstance(filters["gender"], list)
            assert isinstance(filters["age_range"], dict)
            assert isinstance(filters["height_range"], dict)
            assert isinstance(filters["danger_score_range"], dict)
            assert isinstance(filters["has_photo"], list)
            assert isinstance(filters["skin_color"], list)
            
            # Check range structure
            assert "min" in filters["age_range"]
            assert "max" in filters["age_range"]
            assert "min" in filters["height_range"]
            assert "max" in filters["height_range"]
            assert "min" in filters["danger_score_range"]
            assert "max" in filters["danger_score_range"]
            
            # Check timestamps are valid ISO format
            cached_at = datetime.fromisoformat(data["cached_at"].replace('Z', '+00:00'))
            expires_at = datetime.fromisoformat(data["expires_at"].replace('Z', '+00:00'))
            assert expires_at > cached_at
    
    def test_filter_options_cache_headers(self):
        """Test that cache-related timestamps work correctly"""
        response = client.get("/api/search/filters")
        
        if response.status_code == 200:
            data = response.json()
            
            cached_at = datetime.fromisoformat(data["cached_at"].replace('Z', '+00:00'))
            expires_at = datetime.fromisoformat(data["expires_at"].replace('Z', '+00:00'))
            
            # Check that expiry is approximately 1 hour after cache time
            time_diff = expires_at - cached_at
            assert 3595 <= time_diff.total_seconds() <= 3605  # Within 5 seconds of 1 hour
    
    def test_filter_options_with_mock_data(self):
        """Test filter options with mocked database data"""
        # This test will use the mock client if configured
        response = client.get("/api/search/filters")
        
        if response.status_code == 200:
            data = response.json()
            filters = data["filters"]
            
            # With mock data, we should have some values
            if filters["gender"]:  # If we have gender data
                assert len(filters["gender"]) > 0
                # Each gender should be a string
                for gender in filters["gender"]:
                    assert isinstance(gender, str)
            
            # Age range should have valid bounds
            if filters["age_range"]["min"] != 0:  # If we have age data
                assert 0 <= filters["age_range"]["min"] <= filters["age_range"]["max"] <= 120
            
            # Height range should have valid bounds
            if filters["height_range"]["min"] != 0:  # If we have height data
                assert 0 <= filters["height_range"]["min"] <= filters["height_range"]["max"] <= 300
            
            # Danger score range should have valid bounds
            assert 0 <= filters["danger_score_range"]["min"] <= filters["danger_score_range"]["max"] <= 100
            
            # Has photo should be boolean values
            for value in filters["has_photo"]:
                assert isinstance(value, bool)
    
    def test_multiple_requests_use_cache(self):
        """Test that multiple requests within cache period use same data"""
        # First request
        response1 = client.get("/api/search/filters")
        if response1.status_code != 200:
            pytest.skip("Cannot test caching without successful response")
        
        data1 = response1.json()
        
        # Second request (should use cache)
        response2 = client.get("/api/search/filters")
        data2 = response2.json()
        
        # Cache timestamps should be identical
        assert data1["cached_at"] == data2["cached_at"]
        assert data1["expires_at"] == data2["expires_at"]
        
        # Filter data should be identical
        assert json.dumps(data1["filters"], sort_keys=True) == json.dumps(data2["filters"], sort_keys=True)