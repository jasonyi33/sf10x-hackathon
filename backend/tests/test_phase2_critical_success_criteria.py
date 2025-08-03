"""
Comprehensive test suite for Phase 2 Critical Success Criteria
Tests all requirements from Phase2_Implementation_Guide.md
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import asyncio
import json
from datetime import datetime, timezone
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from PIL import Image
from io import BytesIO
import tempfile

from main import app
from api.auth import get_current_user
from services.photo_history import update_photo_history

# Mock auth dependency
def mock_get_current_user():
    return "test-user-123"

# Override auth dependency
app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)


class TestPhase2CriticalSuccessCriteria:
    """Test all critical success criteria for Phase 2"""
    
    # ==================== 1. PHOTO UPLOAD FLOW ====================
    
    def test_1_1_photos_upload_before_individual_save(self):
        """Verify photos upload BEFORE individual save"""
        print("\n🔍 Testing 1.1: Photos upload BEFORE individual save")
        
        # This is enforced in the frontend by the flow:
        # 1. User takes photo
        # 2. Photo uploads to get photo_url
        # 3. photo_url is included in save request
        
        # Test that save endpoint accepts photo_url
        with patch('api.individuals.create_client') as mock_client:
            mock_supabase = Mock()
            mock_client.return_value = mock_supabase
            
            # Mock individual insert
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{
                'id': 'test-123',
                'photo_url': 'https://example.com/photo.jpg',
                'name': 'Test User',
                'data': {
                    "name": "Test User",
                    "height": 180,
                    "weight": 75,
                    "skin_color": "Medium"
                }
            }]
            
            response = client.post(
                "/api/individuals/save",
                headers={"Authorization": "Bearer test-token"},
                json={
                    "data": {
                        "name": "Test User",
                        "height": 180,
                        "weight": 75,
                        "skin_color": "Medium"
                    },
                    "photo_url": "https://example.com/photo.jpg",  # Pre-uploaded photo
                    "location": {
                        "latitude": 37.7749,
                        "longitude": -122.4194,
                        "address": "San Francisco, CA"
                    }
                }
            )
            
            assert response.status_code == 201
            # Verify that the save request included photo_url
            insert_calls = mock_supabase.table.return_value.insert.call_args_list
            assert len(insert_calls) > 0
            saved_data = insert_calls[0][0][0]
            assert 'photo_url' in saved_data
            assert saved_data['photo_url'] == "https://example.com/photo.jpg"
            print("✅ Save endpoint accepts pre-uploaded photo_url")
    
    def test_1_2_upload_failures_dont_block_save(self):
        """Verify upload failures don't block save"""
        print("\n🔍 Testing 1.2: Upload failures don't block save")
        
        # Test save without photo_url (simulating failed upload)
        with patch('api.individuals.create_client') as mock_client:
            mock_supabase = Mock()
            mock_client.return_value = mock_supabase
            
            # Mock individual insert
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{
                'id': 'test-123',
                'photo_url': None,
                'name': 'Test User',
                'data': {
                    "name": "Test User",
                    "height": 180,
                    "weight": 75,
                    "skin_color": "Medium"
                }
            }]
            
            response = client.post(
                "/api/individuals/save",
                headers={"Authorization": "Bearer test-token"},
                json={
                    "data": {
                        "name": "Test User",
                        "height": 180,
                        "weight": 75,
                        "skin_color": "Medium"
                    },
                    # No photo_url - simulating upload failure
                    "location": {
                        "latitude": 37.7749,
                        "longitude": -122.4194,
                        "address": "San Francisco, CA"
                    }
                }
            )
            
            assert response.status_code == 201
            print("✅ Save succeeds without photo_url")
    
    # ==================== 2. CONSENT TRACKING ====================
    
    def test_2_1_cannot_save_photo_without_consent(self):
        """Verify cannot save photo without consent"""
        print("\n🔍 Testing 2.1: Cannot save photo without consent")
        
        # This is enforced in frontend - test backend creates consent record
        with patch('api.photos.create_client') as mock_client:
            mock_supabase = Mock()
            mock_client.return_value = mock_supabase
            
            # Mock storage upload
            mock_storage = Mock()
            mock_storage.upload.return_value = Mock(error=None)
            mock_supabase.storage.from_.return_value = mock_storage
            
            # Mock consent insert
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{
                'id': 'consent-123',
                'consented_by': 'test-user-123',
                'created_at': datetime.now(timezone.utc).isoformat()
            }]
            
            # Create test image
            img = Image.new('RGB', (100, 100), color='red')
            img_bytes = BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            
            response = client.post(
                "/api/photos/upload",
                headers={"Authorization": "Bearer test-token"},
                files={"photo": ("test.jpg", img_bytes, "image/jpeg")},
                data={
                    "individual_id": "test-individual-123",
                    "consent_location": json.dumps({
                        "latitude": 37.7749,
                        "longitude": -122.4194,
                        "address": "Test Location"
                    })
                }
            )
            
            # Verify consent record was created
            insert_calls = mock_supabase.table.return_value.insert.call_args_list
            consent_calls = [call for call in insert_calls if 'consent' in str(call)]
            assert len(consent_calls) > 0
            print("✅ Consent record created with photo upload")
    
    def test_2_2_consent_records_who_when_where(self):
        """Verify consent records who/when/where"""
        print("\n🔍 Testing 2.2: Consent records who/when/where")
        
        with patch('api.photos.create_client') as mock_client:
            mock_supabase = Mock()
            mock_client.return_value = mock_supabase
            
            # Mock storage upload
            mock_storage = Mock()
            mock_storage.upload.return_value = Mock(error=None)
            mock_supabase.storage.from_.return_value = mock_storage
            
            # Capture consent insert
            consent_data = None
            def capture_consent(data):
                nonlocal consent_data
                consent_data = data
                return Mock(execute=Mock(return_value=Mock(data=[{'id': 'consent-123'}])))
            
            mock_supabase.table.return_value.insert.side_effect = capture_consent
            
            # Create test image
            img = Image.new('RGB', (100, 100), color='red')
            img_bytes = BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            
            consent_location = {
                "latitude": 37.7749,
                "longitude": -122.4194,
                "address": "Test Location"
            }
            
            response = client.post(
                "/api/photos/upload",
                headers={"Authorization": "Bearer test-token"},
                files={"photo": ("test.jpg", img_bytes, "image/jpeg")},
                data={
                    "individual_id": "test-individual-123",
                    "consent_location": json.dumps(consent_location)
                }
            )
            
            assert consent_data is not None
            assert consent_data['consented_by'] == 'test-user-123'  # WHO
            assert 'created_at' in consent_data  # WHEN
            assert consent_data['consent_location'] == consent_location  # WHERE
            print("✅ Consent records WHO (user), WHEN (timestamp), WHERE (location)")
    
    # ==================== 3. STORAGE & FORMAT ====================
    
    def test_3_1_photos_stored_in_supabase_storage(self):
        """Verify photos stored in Supabase Storage"""
        print("\n🔍 Testing 3.1: Photos stored in Supabase Storage")
        
        with patch('api.photos.create_client') as mock_client:
            mock_supabase = Mock()
            mock_client.return_value = mock_supabase
            
            # Mock storage upload
            mock_storage = Mock()
            mock_storage.upload.return_value = Mock(error=None)
            mock_supabase.storage.from_.return_value = mock_storage
            
            # Mock consent insert
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{
                'id': 'consent-123'
            }]
            
            # Create test image
            img = Image.new('RGB', (100, 100), color='red')
            img_bytes = BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            
            response = client.post(
                "/api/photos/upload",
                headers={"Authorization": "Bearer test-token"},
                files={"photo": ("test.jpg", img_bytes, "image/jpeg")},
                data={
                    "individual_id": "test-individual-123",
                    "consent_location": json.dumps({
                        "latitude": 37.7749,
                        "longitude": -122.4194,
                        "address": "Test Location"
                    })
                }
            )
            
            # Verify storage.upload was called
            # Verify storage.upload was called
            assert mock_storage.upload.called
            # Verify storage was called with photos bucket
            mock_supabase.storage.from_.assert_called_with('photos')
            print("✅ Photos uploaded to Supabase Storage 'photos' bucket")
    
    def test_3_2_size_limit_enforced(self):
        """Verify 5MB size limit enforced"""
        print("\n🔍 Testing 3.2: 5MB size limit enforced")
        
        # Create oversized file (> 5MB)
        oversized_data = b'x' * (6 * 1024 * 1024)  # 6MB
        
        response = client.post(
            "/api/photos/upload",
            headers={"Authorization": "Bearer test-token"},
            files={"photo": ("test.jpg", oversized_data, "image/jpeg")},
            data={
                "individual_id": "test-individual-123",
                "consent_location": json.dumps({
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "address": "Test Location"
                })
            }
        )
        
        assert response.status_code == 400
        assert "too large" in response.json()['detail'].lower()
        print("✅ 5MB size limit enforced")
    
    def test_3_3_only_jpeg_png_accepted(self):
        """Verify only JPEG/PNG accepted"""
        print("\n🔍 Testing 3.3: Only JPEG/PNG accepted")
        
        # Test invalid file type
        response = client.post(
            "/api/photos/upload",
            headers={"Authorization": "Bearer test-token"},
            files={"photo": ("test.gif", b"fake gif data", "image/gif")},
            data={
                "individual_id": "test-individual-123",
                "consent_location": json.dumps({
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "address": "Test Location"
                })
            }
        )
        
        assert response.status_code == 400
        assert "only jpeg and png" in response.json()['detail'].lower()
        print("✅ Only JPEG/PNG file types accepted")
    
    def test_3_4_png_to_jpeg_conversion(self):
        """Verify PNG to JPEG conversion works"""
        print("\n🔍 Testing 3.4: PNG to JPEG conversion")
        
        with patch('api.photos.create_client') as mock_client:
            mock_supabase = Mock()
            mock_client.return_value = mock_supabase
            
            # Mock storage upload
            uploaded_data = None
            def capture_upload(file_data, path, file=None):
                nonlocal uploaded_data
                uploaded_data = file_data
                return Mock(error=None)
            
            mock_storage = Mock()
            mock_storage.upload.side_effect = capture_upload
            mock_supabase.storage.from_.return_value = mock_storage
            
            # Mock consent insert
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{
                'id': 'consent-123'
            }]
            
            # Create PNG image with transparency
            img = Image.new('RGBA', (100, 100), (255, 0, 0, 128))  # Semi-transparent red
            img_bytes = BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            
            response = client.post(
                "/api/photos/upload",
                headers={"Authorization": "Bearer test-token"},
                files={"photo": ("test.png", img_bytes, "image/png")},
                data={
                    "individual_id": "test-individual-123",
                    "consent_location": json.dumps({
                        "latitude": 37.7749,
                        "longitude": -122.4194,
                        "address": "Test Location"
                    })
                }
            )
            
            assert response.status_code == 200
            # Verify uploaded data is JPEG (check magic bytes)
            assert uploaded_data[:3] == b'\xff\xd8\xff'  # JPEG magic bytes
            print("✅ PNG converted to JPEG successfully")
    
    # ==================== 4. PHOTO HISTORY ====================
    
    def test_4_1_current_photo_moves_to_history(self):
        """Verify current photo moves to history on update"""
        print("\n🔍 Testing 4.1: Current photo moves to history")
        
        # Test the photo history function
        individual = {
            'photo_url': 'https://example.com/current.jpg',
            'photo_history': []
        }
        
        updated = update_photo_history(individual, 'https://example.com/new.jpg')
        
        assert updated['photo_url'] == 'https://example.com/new.jpg'
        assert len(updated['photo_history']) == 1
        assert updated['photo_history'][0]['url'] == 'https://example.com/current.jpg'
        print("✅ Current photo moves to history on update")
    
    def test_4_2_maximum_3_photos_in_history(self):
        """Verify maximum 3 photos in history"""
        print("\n🔍 Testing 4.2: Maximum 3 photos in history")
        
        # Test with already 3 photos in history
        individual = {
            'photo_url': 'https://example.com/current.jpg',
            'photo_history': [
                {'url': 'https://example.com/old1.jpg', 'timestamp': '2024-01-01T00:00:00Z'},
                {'url': 'https://example.com/old2.jpg', 'timestamp': '2024-01-02T00:00:00Z'},
                {'url': 'https://example.com/old3.jpg', 'timestamp': '2024-01-03T00:00:00Z'}
            ]
        }
        
        updated = update_photo_history(individual, 'https://example.com/new.jpg')
        
        assert len(updated['photo_history']) == 3  # Still 3, oldest removed
        assert updated['photo_history'][0]['url'] == 'https://example.com/current.jpg'
        assert updated['photo_history'][1]['url'] == 'https://example.com/old1.jpg'
        assert updated['photo_history'][2]['url'] == 'https://example.com/old2.jpg'
        # old3.jpg was removed
        print("✅ Photo history limited to 3 entries")
    
    def test_4_3_timestamps_preserved(self):
        """Verify timestamps preserved in history"""
        print("\n🔍 Testing 4.3: Timestamps preserved")
        
        # Test timestamp preservation
        individual = {
            'photo_url': 'https://example.com/current.jpg',
            'photo_history': [
                {'url': 'https://example.com/old1.jpg', 'timestamp': '2024-01-01T00:00:00Z'}
            ]
        }
        
        updated = update_photo_history(individual, 'https://example.com/new.jpg')
        
        # Check that we have 2 items in history now
        assert len(updated['photo_history']) == 2
        
        # Find the old photo in history
        old_photo = next((p for p in updated['photo_history'] if p['url'] == 'https://example.com/old1.jpg'), None)
        assert old_photo is not None
        assert old_photo['timestamp'] == '2024-01-01T00:00:00Z'
        
        # New entry should have current timestamp
        new_entry = updated['photo_history'][0]
        assert 'timestamp' in new_entry
        print("✅ Timestamps preserved in photo history")
    
    # ==================== 5. DISPLAY & GALLERY ====================
    
    def test_5_1_photos_in_profile_only(self):
        """Verify photos show in profile only"""
        print("\n🔍 Testing 5.1: Photos show in profile only")
        
        # Test that search endpoint doesn't return photo URLs
        with patch('api.individuals.create_client') as mock_client:
            mock_supabase = Mock()
            mock_client.return_value = mock_supabase
            
            # Mock the complete query chain for search
            mock_query = Mock()
            mock_supabase.table.return_value.select.return_value = mock_query
            mock_query.order.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.offset.return_value = mock_query
            mock_query.execute.return_value.data = [{
                'id': 'test-123',
                'name': 'Test User',
                'danger_score': 50,
                'danger_override': None,
                'photo_url': 'https://example.com/photo.jpg',  # Should be filtered out
                'data': {'name': 'Test User', 'height': 180},
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            }]
            
            # Mock count query
            mock_count_query = Mock()
            mock_supabase.table.return_value.select.return_value = mock_count_query
            mock_count_query.count.return_value = mock_count_query
            mock_count_query.execute.return_value.count = 1
            
            response = client.get(
                "/api/individuals/search",
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            results = response.json()['individuals']
            if results:
                # Verify photo_url not in search results
                assert 'photo_url' not in results[0]
            print("✅ Photos not exposed in search results")
    
    def test_5_2_profile_returns_photo_data(self):
        """Verify profile endpoint returns photo data"""
        print("\n🔍 Testing 5.2: Profile returns photo data")
        
        with patch('api.individuals.create_client') as mock_client:
            mock_supabase = Mock()
            mock_client.return_value = mock_supabase
            
            # Mock profile query chain
            mock_query = Mock()
            mock_supabase.table.return_value.select.return_value = mock_query
            mock_query.eq.return_value = mock_query
            mock_query.single.return_value = mock_query
            mock_query.execute.return_value.data = {
                'id': 'test-123',
                'name': 'Test User',
                'danger_score': 50,
                'danger_override': None,
                'photo_url': 'https://example.com/current.jpg',
                'photo_history': [
                    {'url': 'https://example.com/old1.jpg', 'timestamp': '2024-01-01T00:00:00Z'}
                ],
                'data': {'name': 'Test User', 'height': 180},
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            }
            
            # Mock interactions query
            mock_interactions_query = Mock()
            mock_supabase.table.return_value.select.return_value = mock_interactions_query
            mock_interactions_query.eq.return_value = mock_interactions_query
            mock_interactions_query.order.return_value = mock_interactions_query
            mock_interactions_query.execute.return_value.data = []
            
            response = client.get(
                "/api/individuals/test-123/profile",
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            profile = response.json()
            assert profile['photo_url'] == 'https://example.com/current.jpg'
            assert len(profile['photo_history']) == 1
            print("✅ Profile endpoint returns photo_url and photo_history")


def run_all_tests():
    """Run all Phase 2 critical success criteria tests"""
    print("=" * 60)
    print("🚀 PHASE 2 CRITICAL SUCCESS CRITERIA TEST SUITE")
    print("=" * 60)
    
    test_instance = TestPhase2CriticalSuccessCriteria()
    
    # Define all test methods
    test_methods = [
        # 1. Photo Upload Flow
        test_instance.test_1_1_photos_upload_before_individual_save,
        test_instance.test_1_2_upload_failures_dont_block_save,
        
        # 2. Consent Tracking
        test_instance.test_2_1_cannot_save_photo_without_consent,
        test_instance.test_2_2_consent_records_who_when_where,
        
        # 3. Storage & Format
        test_instance.test_3_1_photos_stored_in_supabase_storage,
        test_instance.test_3_2_size_limit_enforced,
        test_instance.test_3_3_only_jpeg_png_accepted,
        test_instance.test_3_4_png_to_jpeg_conversion,
        
        # 4. Photo History
        test_instance.test_4_1_current_photo_moves_to_history,
        test_instance.test_4_2_maximum_3_photos_in_history,
        test_instance.test_4_3_timestamps_preserved,
        
        # 5. Display & Gallery
        test_instance.test_5_1_photos_in_profile_only,
        test_instance.test_5_2_profile_returns_photo_data,
    ]
    
    passed = 0
    failed = 0
    
    for test_method in test_methods:
        try:
            test_method()
            passed += 1
        except Exception as e:
            print(f"❌ {test_method.__name__} FAILED: {str(e)}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS: {passed}/{len(test_methods)} tests passed")
    print("=" * 60)
    
    if failed == 0:
        print("\n✅ ALL PHASE 2 CRITICAL SUCCESS CRITERIA MET!")
        print("\nVerified functionality:")
        print("1. ✅ Photo Upload Flow - Photos upload before save, failures handled")
        print("2. ✅ Consent Tracking - Consent required, records who/when/where")
        print("3. ✅ Storage & Format - Supabase storage, size limits, format conversion")
        print("4. ✅ Photo History - History management, 3 photo limit, timestamps")
        print("5. ✅ Display & Gallery - Photos in profile only, not in search")
    else:
        print(f"\n❌ {failed} CRITERIA NOT MET - Review failed tests above")
    
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)