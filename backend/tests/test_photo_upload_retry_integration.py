"""
Integration test for photo upload with retry logic
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi import HTTPException
import json

from api.photos import upload_photo


class TestPhotoUploadRetryIntegration:
    """Test photo upload endpoint with retry logic"""
    
    async def test_upload_with_transient_failure_retries(self):
        """Test that upload retries on transient failures"""
        
        # Mock dependencies
        with patch('api.photos.create_client') as mock_create_client, \
             patch('api.photos.Image') as mock_image, \
             patch('api.photos.BytesIO') as mock_bytesio:
            
            # Setup mocks
            mock_supabase = Mock()
            mock_create_client.return_value = mock_supabase
            
            # Mock storage that fails once then succeeds
            mock_storage = Mock()
            mock_fail_response = Mock()
            mock_fail_response.error = "Network timeout"
            mock_success_response = Mock()
            mock_success_response.error = None
            
            # First call fails, second succeeds
            mock_storage.upload.side_effect = [mock_fail_response, mock_success_response]
            mock_supabase.storage.from_.return_value = mock_storage
            
            # Mock successful consent record creation
            mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
                {'id': 'consent-123'}
            ]
            
            # Mock image processing
            mock_img = Mock()
            mock_img.mode = 'RGB'
            mock_image.open.return_value = mock_img
            
            mock_output = Mock()
            mock_output.getvalue.return_value = b'compressed image data'
            mock_bytesio.return_value = mock_output
            
            # Mock file upload
            mock_file = Mock()
            mock_file.content_type = 'image/jpeg'
            mock_file.read = AsyncMock(return_value=b'test image data')
            
            # Call the upload endpoint
            result = await upload_photo(
                photo=mock_file,
                individual_id='test-individual-123',
                consent_location=json.dumps({
                    'latitude': 37.7749,
                    'longitude': -122.4194,
                    'address': 'Test Location'
                }),
                user_id='test-user-123'
            )
            
            # Verify retry happened (2 upload calls)
            assert mock_storage.upload.call_count == 2
            
            # Verify successful response
            assert 'photo_url' in result
            assert 'consent_id' in result
            assert result['consent_id'] == 'consent-123'
    
    async def test_upload_fails_after_3_attempts(self):
        """Test that upload fails with 500 after 3 attempts"""
        
        # Mock dependencies
        with patch('api.photos.create_client') as mock_create_client, \
             patch('api.photos.Image') as mock_image, \
             patch('api.photos.BytesIO') as mock_bytesio:
            
            # Setup mocks
            mock_supabase = Mock()
            mock_create_client.return_value = mock_supabase
            
            # Mock storage that always fails
            mock_storage = Mock()
            mock_fail_response = Mock()
            mock_fail_response.error = "Persistent storage error"
            
            # All attempts fail
            mock_storage.upload.return_value = mock_fail_response
            mock_supabase.storage.from_.return_value = mock_storage
            
            # Mock image processing
            mock_img = Mock()
            mock_img.mode = 'RGB'
            mock_image.open.return_value = mock_img
            
            mock_output = Mock()
            mock_output.getvalue.return_value = b'compressed image data'
            mock_bytesio.return_value = mock_output
            
            # Mock file upload
            mock_file = Mock()
            mock_file.content_type = 'image/jpeg'
            mock_file.read = AsyncMock(return_value=b'test image data')
            
            # Call should raise HTTPException with 500
            try:
                await upload_photo(
                    photo=mock_file,
                    individual_id='test-individual-123',
                    consent_location=json.dumps({
                        'latitude': 37.7749,
                        'longitude': -122.4194,
                        'address': 'Test Location'
                    }),
                    user_id='test-user-123'
                )
                assert False, "Should have raised HTTPException"
            except HTTPException as e:
                assert e.status_code == 500
                assert "Photo upload failed after 3 attempts" in str(e.detail)
                
                # Verify 3 attempts were made
                assert mock_storage.upload.call_count == 3
    
    async def test_upload_auth_error_fails_fast(self):
        """Test that auth errors fail immediately without retry"""
        
        # Mock dependencies
        with patch('api.photos.create_client') as mock_create_client, \
             patch('api.photos.Image') as mock_image, \
             patch('api.photos.BytesIO') as mock_bytesio:
            
            # Setup mocks
            mock_supabase = Mock()
            mock_create_client.return_value = mock_supabase
            
            # Mock storage that returns auth error
            mock_storage = Mock()
            mock_storage.upload.side_effect = Exception("Invalid credentials")
            mock_supabase.storage.from_.return_value = mock_storage
            
            # Mock image processing
            mock_img = Mock()
            mock_img.mode = 'RGB'
            mock_image.open.return_value = mock_img
            
            mock_output = Mock()
            mock_output.getvalue.return_value = b'compressed image data'
            mock_bytesio.return_value = mock_output
            
            # Mock file upload
            mock_file = Mock()
            mock_file.content_type = 'image/jpeg'
            mock_file.read = AsyncMock(return_value=b'test image data')
            
            # Call should raise HTTPException with 401
            try:
                await upload_photo(
                    photo=mock_file,
                    individual_id='test-individual-123',
                    consent_location=json.dumps({
                        'latitude': 37.7749,
                        'longitude': -122.4194,
                        'address': 'Test Location'
                    }),
                    user_id='test-user-123'
                )
                assert False, "Should have raised HTTPException"
            except HTTPException as e:
                assert e.status_code == 401
                assert "Authentication failed" in str(e.detail)
                
                # Verify only 1 attempt was made (no retries)
                assert mock_storage.upload.call_count == 1


async def test_all_integration():
    """Run all integration tests"""
    print("🔍 Testing Photo Upload with Retry Logic Integration...\n")
    
    test_instance = TestPhotoUploadRetryIntegration()
    
    tests = [
        ("Upload with transient failure retries", test_instance.test_upload_with_transient_failure_retries),
        ("Upload fails after 3 attempts", test_instance.test_upload_fails_after_3_attempts),
        ("Auth error fails fast", test_instance.test_upload_auth_error_fails_fast),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            await test_func()
            print(f"✅ {test_name}")
            passed += 1
        except Exception as e:
            print(f"❌ {test_name}: {str(e)}")
            failed += 1
    
    print(f"\n📊 Results: {passed} passed, {failed} failed")
    
    if passed == len(tests):
        print("\n✅ All integration tests passed!")
        print("\nKey features verified:")
        print("- Transient failures trigger retry (up to 3 attempts)")
        print("- Persistent failures return 500 after 3 attempts")
        print("- Auth errors fail immediately without retry")
        print("- Integration with photo upload endpoint works correctly")
    
    return passed == len(tests)


if __name__ == "__main__":
    success = asyncio.run(test_all_integration())
    exit(0 if success else 1)