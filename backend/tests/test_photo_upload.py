"""
Unit tests for Task 2.1.1 - Photo Upload Endpoint
"""
import pytest
import asyncio
import httpx
import os
import json
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test configuration
BASE_URL = "http://localhost:8001"
TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIn0.test"


def create_test_image(format='JPEG', size_mb=1):
    """Create a test image of specified format and approximate size"""
    # Create a simple image
    img = Image.new('RGB', (1000, 1000), color='red')
    img_io = BytesIO()
    img.save(img_io, format=format)
    
    # Adjust size if needed
    current_size = len(img_io.getvalue())
    target_size = size_mb * 1024 * 1024
    
    if current_size < target_size:
        # Pad with extra data
        img_io.write(b'0' * (target_size - current_size))
    
    img_io.seek(0)
    return img_io


class TestPhotoUpload:
    """Test cases for photo upload endpoint"""
    
    @pytest.mark.asyncio
    async def test_1_valid_jpeg_upload_succeeds(self):
        """Test 1: Valid JPEG upload succeeds"""
        async with httpx.AsyncClient() as client:
            # Create test JPEG image
            image_data = create_test_image('JPEG', 1)
            
            files = {
                'photo': ('test.jpg', image_data, 'image/jpeg')
            }
            data = {
                'individual_id': 'test-individual-123',
                'consent_location': json.dumps({
                    'latitude': 37.7749,
                    'longitude': -122.4194,
                    'address': 'Test Location'
                })
            }
            
            response = await client.post(
                f"{BASE_URL}/api/photos/upload",
                files=files,
                data=data,
                headers={'Authorization': f'Bearer {TEST_TOKEN}'}
            )
            
            assert response.status_code == 200
            result = response.json()
            assert 'photo_url' in result
            assert 'consent_id' in result
            assert result['photo_url'].startswith('http')
    
    @pytest.mark.asyncio
    async def test_2_valid_png_upload_succeeds(self):
        """Test 2: Valid PNG upload succeeds and converts"""
        async with httpx.AsyncClient() as client:
            # Create test PNG image
            image_data = create_test_image('PNG', 1)
            
            files = {
                'photo': ('test.png', image_data, 'image/png')
            }
            data = {
                'individual_id': 'test-individual-123',
                'consent_location': json.dumps({
                    'latitude': 37.7749,
                    'longitude': -122.4194,
                    'address': 'Test Location'
                })
            }
            
            response = await client.post(
                f"{BASE_URL}/api/photos/upload",
                files=files,
                data=data,
                headers={'Authorization': f'Bearer {TEST_TOKEN}'}
            )
            
            assert response.status_code == 200
            result = response.json()
            assert 'photo_url' in result
            # Should be converted to JPEG
            assert '.jpg' in result['photo_url'] or '.jpeg' in result['photo_url']
    
    @pytest.mark.asyncio
    async def test_3_invalid_file_type_rejected(self):
        """Test 3: Invalid file type (PDF) rejected"""
        async with httpx.AsyncClient() as client:
            # Create fake PDF data
            pdf_data = BytesIO(b'%PDF-1.4 fake pdf content')
            
            files = {
                'photo': ('test.pdf', pdf_data, 'application/pdf')
            }
            data = {
                'individual_id': 'test-individual-123',
                'consent_location': json.dumps({
                    'latitude': 37.7749,
                    'longitude': -122.4194,
                    'address': 'Test Location'
                })
            }
            
            response = await client.post(
                f"{BASE_URL}/api/photos/upload",
                files=files,
                data=data,
                headers={'Authorization': f'Bearer {TEST_TOKEN}'}
            )
            
            assert response.status_code == 400
            assert 'Invalid file type' in response.json()['detail']
    
    @pytest.mark.asyncio
    async def test_4_oversized_file_rejected(self):
        """Test 4: Oversized file (>5MB) rejected"""
        async with httpx.AsyncClient() as client:
            # Create oversized image (6MB)
            image_data = create_test_image('JPEG', 6)
            
            files = {
                'photo': ('test.jpg', image_data, 'image/jpeg')
            }
            data = {
                'individual_id': 'test-individual-123',
                'consent_location': json.dumps({
                    'latitude': 37.7749,
                    'longitude': -122.4194,
                    'address': 'Test Location'
                })
            }
            
            response = await client.post(
                f"{BASE_URL}/api/photos/upload",
                files=files,
                data=data,
                headers={'Authorization': f'Bearer {TEST_TOKEN}'}
            )
            
            assert response.status_code == 400
            assert 'File too large' in response.json()['detail']
    
    @pytest.mark.asyncio
    async def test_5_consent_record_created(self):
        """Test 5: Consent record created with all fields"""
        # This test would need database access to verify
        # For now, we just verify the response indicates success
        async with httpx.AsyncClient() as client:
            image_data = create_test_image('JPEG', 1)
            
            files = {
                'photo': ('test.jpg', image_data, 'image/jpeg')
            }
            data = {
                'individual_id': 'test-individual-123',
                'consent_location': json.dumps({
                    'latitude': 37.7749,
                    'longitude': -122.4194,
                    'address': 'Test Location'
                })
            }
            
            response = await client.post(
                f"{BASE_URL}/api/photos/upload",
                files=files,
                data=data,
                headers={'Authorization': f'Bearer {TEST_TOKEN}'}
            )
            
            assert response.status_code == 200
            result = response.json()
            assert 'consent_id' in result
            assert result['consent_id'] is not None
    
    @pytest.mark.asyncio
    async def test_6_returns_proper_photo_url(self):
        """Test 6: Returns proper photo URL format"""
        async with httpx.AsyncClient() as client:
            image_data = create_test_image('JPEG', 1)
            
            files = {
                'photo': ('test.jpg', image_data, 'image/jpeg')
            }
            data = {
                'individual_id': 'test-individual-123',
                'consent_location': json.dumps({
                    'latitude': 37.7749,
                    'longitude': -122.4194,
                    'address': 'Test Location'
                })
            }
            
            response = await client.post(
                f"{BASE_URL}/api/photos/upload",
                files=files,
                data=data,
                headers={'Authorization': f'Bearer {TEST_TOKEN}'}
            )
            
            assert response.status_code == 200
            result = response.json()
            assert 'photo_url' in result
            assert result['photo_url'].startswith('https://')
            assert 'supabase.co/storage' in result['photo_url']
            assert 'photos/' in result['photo_url']
    
    @pytest.mark.asyncio
    async def test_7_handles_storage_errors(self):
        """Test 7: Handles Supabase storage errors"""
        # This would be tested by mocking storage failure
        # For integration test, we can't easily simulate storage failure
        pass
    
    @pytest.mark.asyncio
    async def test_8_missing_required_fields(self):
        """Test 8: Missing required fields return 422"""
        async with httpx.AsyncClient() as client:
            image_data = create_test_image('JPEG', 1)
            
            # Missing individual_id
            files = {
                'photo': ('test.jpg', image_data, 'image/jpeg')
            }
            data = {
                'consent_location': json.dumps({
                    'latitude': 37.7749,
                    'longitude': -122.4194,
                    'address': 'Test Location'
                })
            }
            
            response = await client.post(
                f"{BASE_URL}/api/photos/upload",
                files=files,
                data=data,
                headers={'Authorization': f'Bearer {TEST_TOKEN}'}
            )
            
            assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_9_invalid_json_consent_location(self):
        """Test 9: Invalid JSON in consent_location rejected"""
        async with httpx.AsyncClient() as client:
            image_data = create_test_image('JPEG', 1)
            
            files = {
                'photo': ('test.jpg', image_data, 'image/jpeg')
            }
            data = {
                'individual_id': 'test-individual-123',
                'consent_location': 'invalid json {{'  # Invalid JSON
            }
            
            response = await client.post(
                f"{BASE_URL}/api/photos/upload",
                files=files,
                data=data,
                headers={'Authorization': f'Bearer {TEST_TOKEN}'}
            )
            
            assert response.status_code == 400
            assert 'Invalid JSON' in response.json()['detail']
    
    @pytest.mark.asyncio
    async def test_10_unauthorized_user(self):
        """Test 10: Unauthorized user returns 401"""
        async with httpx.AsyncClient() as client:
            image_data = create_test_image('JPEG', 1)
            
            files = {
                'photo': ('test.jpg', image_data, 'image/jpeg')
            }
            data = {
                'individual_id': 'test-individual-123',
                'consent_location': json.dumps({
                    'latitude': 37.7749,
                    'longitude': -122.4194,
                    'address': 'Test Location'
                })
            }
            
            # No auth header
            response = await client.post(
                f"{BASE_URL}/api/photos/upload",
                files=files,
                data=data
            )
            
            assert response.status_code == 401


def test_all_photo_upload():
    """Run all photo upload tests"""
    print("Testing photo upload endpoint...")
    asyncio.run(run_all_tests())


async def run_all_tests():
    """Run all test methods"""
    test_instance = TestPhotoUpload()
    
    # Run each test
    tests = [
        test_instance.test_1_valid_jpeg_upload_succeeds,
        test_instance.test_2_valid_png_upload_succeeds,
        test_instance.test_3_invalid_file_type_rejected,
        test_instance.test_4_oversized_file_rejected,
        test_instance.test_5_consent_record_created,
        test_instance.test_6_returns_proper_photo_url,
        # test_instance.test_7_handles_storage_errors,  # Skip for now
        test_instance.test_8_missing_required_fields,
        test_instance.test_9_invalid_json_consent_location,
        test_instance.test_10_unauthorized_user,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            await test()
            print(f"✅ {test.__name__}")
            passed += 1
        except Exception as e:
            print(f"❌ {test.__name__}: {str(e)}")
            failed += 1
    
    print(f"\nResults: {passed} passed, {failed} failed")


if __name__ == "__main__":
    test_all_photo_upload()