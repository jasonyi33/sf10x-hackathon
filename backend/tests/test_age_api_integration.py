"""
Integration tests for age validation in API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from datetime import datetime, timezone
import json


class TestAgeAPIIntegration:
    """Test age validation in API endpoints"""
    
    @pytest.fixture
    def mock_supabase(self):
        """Mock Supabase client"""
        mock = Mock()
        
        # Mock categories response including approximate_age
        mock.table().select().execute.return_value.data = [
            {"name": "name", "type": "text", "is_required": True},
            {"name": "height", "type": "number", "is_required": True},
            {"name": "weight", "type": "number", "is_required": True},
            {"name": "skin_color", "type": "single_select", "is_required": True,
             "options": [{"label": "Light", "value": 0}, {"label": "Medium", "value": 0}, {"label": "Dark", "value": 0}]},
            {"name": "approximate_age", "type": "range", "is_required": True, "is_preset": True}
        ]
        
        # Mock successful insert
        mock.table().insert().execute.return_value.data = [{
            "id": "test-individual-id",
            "name": "Test Person",
            "data": {"approximate_age": [45, 50]},
            "created_at": datetime.now(timezone.utc).isoformat()
        }]
        
        return mock
    
    @pytest.fixture
    def client(self, mock_supabase):
        """Create test client with mocked dependencies"""
        from main import app
        
        with patch('api.individuals.get_supabase_client', return_value=mock_supabase):
            with patch('api.individuals.get_current_user', return_value="test-user-id"):
                yield TestClient(app)
    
    def test_save_individual_with_valid_age(self, client, mock_supabase):
        """Test saving individual with valid age range"""
        payload = {
            "data": {
                "name": "John Doe",
                "height": 72,
                "weight": 180,
                "skin_color": "Medium",
                "approximate_age": [45, 50]  # Valid age range
            },
            "location": {
                "latitude": 37.7749,
                "longitude": -122.4194,
                "address": "123 Test St"
            }
        }
        
        response = client.post("/api/individuals", json=payload)
        
        # Should succeed with proper auth and data
        if response.status_code != 200:
            print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert data["individual"]["data"]["approximate_age"] == [45, 50]
    
    def test_save_individual_with_unknown_age(self, client, mock_supabase):
        """Test saving individual with unknown age [-1, -1]"""
        payload = {
            "data": {
                "name": "Jane Doe",
                "height": 65,
                "weight": 140,
                "skin_color": "Light",
                "approximate_age": [-1, -1]  # Unknown age
            },
            "location": {
                "latitude": 37.7749,
                "longitude": -122.4194
            }
        }
        
        response = client.post("/api/individuals", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["individual"]["data"]["approximate_age"] == [-1, -1]
    
    def test_save_individual_missing_age(self, client, mock_supabase):
        """Test saving individual without age field should fail"""
        payload = {
            "data": {
                "name": "No Age Person",
                "height": 70,
                "weight": 160,
                "skin_color": "Dark"
                # Missing approximate_age
            },
            "location": {
                "latitude": 37.7749,
                "longitude": -122.4194
            }
        }
        
        response = client.post("/api/individuals", json=payload)
        
        # Pydantic returns 422 for validation errors
        assert response.status_code == 422
        data = response.json()
        # Check the error structure
        print(f"Error response: {data}")
        # Pydantic errors come in a specific structure
        assert any("approximate_age" in str(error) for error in data["detail"])
        assert any("missing required fields" in str(error).lower() for error in data["detail"])
    
    def test_save_individual_invalid_age_format(self, client, mock_supabase):
        """Test saving individual with invalid age format"""
        # Test with single number instead of array
        payload = {
            "data": {
                "name": "Invalid Age Format",
                "height": 68,
                "weight": 150,
                "skin_color": "Medium",
                "approximate_age": 45  # Should be array
            },
            "location": {
                "latitude": 37.7749,
                "longitude": -122.4194
            }
        }
        
        response = client.post("/api/individuals", json=payload)
        
        assert response.status_code == 400
        data = response.json()
        assert "validation errors" in data["detail"].lower()
        assert "age must be an array" in data["detail"].lower()
    
    def test_save_individual_invalid_age_range(self, client, mock_supabase):
        """Test saving individual with invalid age range"""
        test_cases = [
            ([50, 45], "min.*must be less than max"),  # Min > Max
            ([45, 45], "min.*must be less than max"),  # Min = Max
            ([-5, 10], "minimum age cannot be negative"),  # Negative age
            ([100, 130], "maximum age cannot exceed 120"),  # Over 120
            ([45], "must have exactly 2 values"),  # Single value
            ([45, 50, 55], "must have exactly 2 values"),  # Too many values
        ]
        
        for age_value, expected_error in test_cases:
            payload = {
                "data": {
                    "name": "Invalid Age Range",
                    "height": 70,
                    "weight": 160,
                    "skin_color": "Dark",
                    "approximate_age": age_value
                },
                "location": {
                    "latitude": 37.7749,
                    "longitude": -122.4194
                }
            }
            
            response = client.post("/api/individuals", json=payload)
            
            assert response.status_code == 400, f"Expected 400 for age {age_value}"
            data = response.json()
            assert "validation errors" in data["detail"].lower()
            # Check that the expected error pattern is in the response
            import re
            assert re.search(expected_error, data["detail"], re.IGNORECASE), \
                f"Expected error pattern '{expected_error}' not found in: {data['detail']}"
    
    def test_existing_api_still_works(self, client, mock_supabase):
        """Test that existing API functionality still works with age requirement"""
        # Update mock to include age in existing individuals
        mock_supabase.table().select().execute.return_value.data = [{
            "id": "existing-id",
            "name": "Existing Person",
            "data": {
                "name": "Existing Person",
                "height": 70,
                "weight": 150,
                "skin_color": "Medium",
                "approximate_age": [30, 35]
            },
            "danger_score": 25,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }]
        
        # Test search endpoint
        response = client.get("/api/individuals?name=Existing")
        assert response.status_code == 200
        data = response.json()
        assert len(data["individuals"]) == 1
        assert data["individuals"][0]["data"]["approximate_age"] == [30, 35]


def run_age_api_tests():
    """Run age API integration tests"""
    pytest.main([__file__, "-v", "-s"])


if __name__ == "__main__":
    print("=" * 60)
    print("Age API Integration Test Suite")
    print("=" * 60)
    print("\nTesting age validation in API endpoints...")
    
    run_age_api_tests()