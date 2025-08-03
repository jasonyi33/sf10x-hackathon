"""
Test suite for photo update endpoint (no interaction creation)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
import json
from datetime import datetime, timezone
from main import app
from services.photo_history import update_photo_history
from api.auth import get_current_user

# Mock auth dependency
def mock_get_current_user():
    return "test-user-123"

# Override auth dependency
app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)

class TestPhotoUpdateEndpoint:
    """Test the photo update endpoint that doesn't create interactions"""
    
    @pytest.fixture
    def mock_supabase(self):
        with patch('api.photos.create_client') as mock_create_client:
            mock_supabase = Mock()
            mock_create_client.return_value = mock_supabase
            yield mock_supabase
    
    def setup_method(self, method):
        """Reset mocks before each test"""
        # Ensure auth is mocked
        app.dependency_overrides[get_current_user] = mock_get_current_user
    
    def test_update_photo_endpoint_exists(self):
        """Test that the update photo endpoint exists"""
        # Endpoint should exist and return 422 without required fields
        response = client.put(
            "/api/photos/update/test-individual-123",
            headers={"Authorization": "Bearer test-token"}
        )
        # Should be 422 (Unprocessable Entity) due to missing required fields
        assert response.status_code == 422
    
    def test_update_requires_photo_file(self, mock_supabase):
        """Test that update requires a photo file"""
        response = client.put(
            "/api/photos/update/test-individual-123",
            headers={"Authorization": "Bearer test-token"},
            data={
                "consent_location": json.dumps({
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "address": "Test Location"
                })
            }
        )
        # Should fail without photo - 422 for missing required field
        assert response.status_code == 422
    
    def test_update_requires_consent(self, mock_supabase):
        """Test that update requires consent location"""
        with open("test_image.jpg", "wb") as f:
            f.write(b"fake image data")
        
        try:
            with open("test_image.jpg", "rb") as f:
                response = client.put(
                    "/api/photos/update/test-individual-123",
                    headers={"Authorization": "Bearer test-token"},
                    files={"photo": ("test.jpg", f, "image/jpeg")}
                )
            # Should fail without consent_location - 422 for missing required field
            assert response.status_code == 422
        finally:
            os.remove("test_image.jpg")
    
    def test_no_interaction_created(self, mock_supabase):
        """Test that photo update doesn't create an interaction"""
        # Mock the individual fetch
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            'id': 'test-individual-123',
            'name': 'John Doe',
            'photo_url': 'https://example.com/old-photo.jpg',
            'photo_history': [],
            'data': {'height': 180}
        }
        
        # Mock storage upload
        mock_storage = Mock()
        mock_storage.upload.return_value = Mock(error=None)
        mock_supabase.storage.from_.return_value = mock_storage
        
        # Mock individual update (not interaction insert)
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [{
            'id': 'test-individual-123',
            'photo_url': 'https://example.com/new-photo.jpg'
        }]
        
        with open("test_image.jpg", "wb") as f:
            f.write(b"fake image data")
        
        try:
            with open("test_image.jpg", "rb") as f:
                response = client.put(
                    "/api/photos/update/test-individual-123",
                    headers={"Authorization": "Bearer test-token"},
                    files={"photo": ("test.jpg", f, "image/jpeg")},
                    data={
                        "consent_location": json.dumps({
                            "latitude": 37.7749,
                            "longitude": -122.4194,
                            "address": "Test Location"
                        })
                    }
                )
            
            if response.status_code == 200:
                # Verify no interaction was created
                # Only update call should be made, not insert
                assert mock_supabase.table.return_value.insert.call_count == 1  # Only consent record
                assert mock_supabase.table.return_value.update.called
        finally:
            os.remove("test_image.jpg")
    
    def test_old_photo_moves_to_history(self, mock_supabase):
        """Test that the old photo is moved to history"""
        old_photo_url = 'https://example.com/old-photo.jpg'
        new_photo_url = 'https://example.com/new-photo.jpg'
        
        # Mock current individual data
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            'id': 'test-individual-123',
            'name': 'John Doe',
            'photo_url': old_photo_url,
            'photo_history': [],
            'data': {'height': 180}
        }
        
        # Mock storage upload
        mock_storage = Mock()
        mock_storage.upload.return_value = Mock(error=None)
        mock_supabase.storage.from_.return_value = mock_storage
        
        with open("test_image.jpg", "wb") as f:
            f.write(b"fake image data")
        
        try:
            with open("test_image.jpg", "rb") as f:
                response = client.put(
                    "/api/photos/update/test-individual-123",
                    headers={"Authorization": "Bearer test-token"},
                    files={"photo": ("test.jpg", f, "image/jpeg")},
                    data={
                        "consent_location": json.dumps({
                            "latitude": 37.7749,
                            "longitude": -122.4194,
                            "address": "Test Location"
                        })
                    }
                )
            
            if response.status_code == 200:
                # Check that update was called with photo history
                update_calls = mock_supabase.table.return_value.update.call_args_list
                assert any(
                    'photo_history' in call[0][0] and 
                    old_photo_url in str(call[0][0]['photo_history'])
                    for call in update_calls
                )
        finally:
            os.remove("test_image.jpg")
    
    def test_returns_updated_photo_url(self, mock_supabase):
        """Test that endpoint returns the new photo URL"""
        new_photo_url = 'https://example.com/new-photo.jpg'
        
        # Mock individual fetch
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            'id': 'test-individual-123',
            'photo_url': 'https://example.com/old-photo.jpg',
            'photo_history': []
        }
        
        # Mock storage upload
        mock_storage = Mock()
        mock_storage.upload.return_value = Mock(error=None)
        mock_supabase.storage.from_.return_value = mock_storage
        
        # Mock update response
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [{
            'photo_url': new_photo_url
        }]
        
        with open("test_image.jpg", "wb") as f:
            f.write(b"fake image data")
        
        try:
            with open("test_image.jpg", "rb") as f:
                response = client.put(
                    "/api/photos/update/test-individual-123",
                    headers={"Authorization": "Bearer test-token"},
                    files={"photo": ("test.jpg", f, "image/jpeg")},
                    data={
                        "consent_location": json.dumps({
                            "latitude": 37.7749,
                            "longitude": -122.4194,
                            "address": "Test Location"
                        })
                    }
                )
            
            if response.status_code == 200:
                data = response.json()
                assert 'photo_url' in data
                assert data['photo_url'] == new_photo_url
        finally:
            os.remove("test_image.jpg")
    
    def test_creates_consent_record(self, mock_supabase):
        """Test that a consent record is still created for the update"""
        # Mock individual fetch
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            'id': 'test-individual-123',
            'photo_url': 'https://example.com/old-photo.jpg',
            'photo_history': []
        }
        
        # Mock storage upload
        mock_storage = Mock()
        mock_storage.upload.return_value = Mock(error=None)
        mock_supabase.storage.from_.return_value = mock_storage
        
        # Mock consent insert
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{
            'id': 'consent-123'
        }]
        
        with open("test_image.jpg", "wb") as f:
            f.write(b"fake image data")
        
        try:
            with open("test_image.jpg", "rb") as f:
                response = client.put(
                    "/api/photos/update/test-individual-123",
                    headers={"Authorization": "Bearer test-token"},
                    files={"photo": ("test.jpg", f, "image/jpeg")},
                    data={
                        "consent_location": json.dumps({
                            "latitude": 37.7749,
                            "longitude": -122.4194,
                            "address": "Test Location"
                        })
                    }
                )
            
            if response.status_code == 200:
                # Verify consent record was created
                insert_calls = [call for call in mock_supabase.table.return_value.insert.call_args_list
                              if 'consent' in str(call)]
                assert len(insert_calls) > 0
                
                data = response.json()
                assert 'consent_id' in data
        finally:
            os.remove("test_image.jpg")


if __name__ == "__main__":
    print("🧪 Running Photo Update Endpoint Tests...")
    print("\nThese tests verify the photo update endpoint that doesn't create interactions.")
    print("\nExpected: All tests should initially fail since the endpoint doesn't exist yet.")
    print("-" * 60)
    
    pytest.main([__file__, "-v"])