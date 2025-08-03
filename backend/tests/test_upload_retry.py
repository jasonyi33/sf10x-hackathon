"""
Unit tests for Task 2.1.3 - Upload Retry Logic
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import asyncio
import time
from unittest.mock import Mock, AsyncMock, patch, call
from fastapi import HTTPException

from services.upload_retry import upload_with_retry


class TestUploadRetryLogic:
    """Test cases for upload retry logic"""
    
    @pytest.mark.asyncio
    async def test_1_success_on_first_attempt_no_retries(self):
        """Test 1: Success on first attempt - no retries"""
        # Mock successful upload
        mock_storage = Mock()
        mock_upload = Mock()
        mock_upload.error = None  # No error = success
        mock_storage.upload.return_value = mock_upload
        
        file_data = b"test image data"
        path = "photos/test/test.jpg"
        
        # Call function
        result = await upload_with_retry(mock_storage, file_data, path)
        
        # Should only call upload once
        assert mock_storage.upload.call_count == 1
        assert result == mock_upload
    
    @pytest.mark.asyncio
    async def test_2_success_on_second_attempt_1_retry(self):
        """Test 2: Success on second attempt - 1 retry"""
        # Mock storage that fails once then succeeds
        mock_storage = Mock()
        mock_fail = Mock()
        mock_fail.error = "Network error"
        mock_success = Mock()
        mock_success.error = None
        
        mock_storage.upload.side_effect = [mock_fail, mock_success]
        
        file_data = b"test image data"
        path = "photos/test/test.jpg"
        
        # Call function
        result = await upload_with_retry(mock_storage, file_data, path)
        
        # Should call upload twice
        assert mock_storage.upload.call_count == 2
        assert result == mock_success
    
    @pytest.mark.asyncio
    async def test_3_success_on_third_attempt_2_retries(self):
        """Test 3: Success on third attempt - 2 retries"""
        # Mock storage that fails twice then succeeds
        mock_storage = Mock()
        mock_fail1 = Mock()
        mock_fail1.error = "Network error"
        mock_fail2 = Mock()
        mock_fail2.error = "Timeout"
        mock_success = Mock()
        mock_success.error = None
        
        mock_storage.upload.side_effect = [mock_fail1, mock_fail2, mock_success]
        
        file_data = b"test image data"
        path = "photos/test/test.jpg"
        
        # Call function
        result = await upload_with_retry(mock_storage, file_data, path)
        
        # Should call upload three times
        assert mock_storage.upload.call_count == 3
        assert result == mock_success
    
    @pytest.mark.asyncio
    async def test_4_failure_after_3_attempts_raises_500(self):
        """Test 4: Failure after 3 attempts raises 500"""
        # Mock storage that always fails
        mock_storage = Mock()
        mock_fail = Mock()
        mock_fail.error = "Persistent error"
        
        mock_storage.upload.return_value = mock_fail
        
        file_data = b"test image data"
        path = "photos/test/test.jpg"
        
        # Should raise HTTPException with status 500
        with pytest.raises(HTTPException) as exc_info:
            await upload_with_retry(mock_storage, file_data, path)
        
        assert exc_info.value.status_code == 500
        assert "Photo upload failed after 3 attempts" in str(exc_info.value.detail)
        assert mock_storage.upload.call_count == 3
    
    @pytest.mark.asyncio
    async def test_5_delay_occurs_between_attempts(self):
        """Test 5: Delay occurs between attempts"""
        # Mock storage that fails twice then succeeds
        mock_storage = Mock()
        mock_fail = Mock()
        mock_fail.error = "Network error"
        mock_success = Mock()
        mock_success.error = None
        
        mock_storage.upload.side_effect = [mock_fail, mock_fail, mock_success]
        
        file_data = b"test image data"
        path = "photos/test/test.jpg"
        
        # Track timing
        start_time = time.time()
        
        # Call function
        await upload_with_retry(mock_storage, file_data, path)
        
        elapsed_time = time.time() - start_time
        
        # Should have 2 delays of 1 second each (2 retries)
        assert elapsed_time >= 2.0  # At least 2 seconds
        assert elapsed_time < 3.0  # But not too long
    
    @pytest.mark.asyncio
    async def test_6_each_attempt_logged_properly(self):
        """Test 6: Each attempt logged properly"""
        # Mock storage and logger
        mock_storage = Mock()
        mock_fail = Mock()
        mock_fail.error = "Network error"
        mock_success = Mock()
        mock_success.error = None
        
        mock_storage.upload.side_effect = [mock_fail, mock_success]
        
        file_data = b"test image data"
        path = "photos/test/test.jpg"
        
        with patch('services.upload_retry.logger') as mock_logger:
            await upload_with_retry(mock_storage, file_data, path)
            
            # Check logging calls
            assert mock_logger.info.call_count >= 2  # At least 2 attempts
            assert mock_logger.warning.call_count >= 1  # At least 1 retry warning
    
    @pytest.mark.asyncio
    async def test_7_network_errors_trigger_retry(self):
        """Test 7: Network errors trigger retry"""
        # Mock storage that throws network exceptions
        mock_storage = Mock()
        mock_storage.upload.side_effect = [
            Exception("Connection timeout"),
            Exception("Network unreachable"),
            Mock(error=None)  # Success on third attempt
        ]
        
        file_data = b"test image data"
        path = "photos/test/test.jpg"
        
        # Should retry on network errors
        result = await upload_with_retry(mock_storage, file_data, path)
        
        assert mock_storage.upload.call_count == 3
        assert result.error is None
    
    @pytest.mark.asyncio
    async def test_8_auth_errors_dont_retry_fail_fast(self):
        """Test 8: Auth errors don't retry (fail fast)"""
        # Mock storage that returns auth error
        mock_storage = Mock()
        mock_storage.upload.side_effect = Exception("Invalid credentials")
        
        file_data = b"test image data"
        path = "photos/test/test.jpg"
        
        # Should fail immediately without retries
        with pytest.raises(HTTPException) as exc_info:
            await upload_with_retry(mock_storage, file_data, path)
        
        # Should only try once for auth errors
        assert mock_storage.upload.call_count == 1
        assert exc_info.value.status_code == 401
        assert "Authentication failed" in str(exc_info.value.detail)


def test_all_retry_logic():
    """Run all retry logic tests"""
    print("Testing upload retry logic...")
    
    test_instance = TestUploadRetryLogic()
    tests = [
        test_instance.test_1_success_on_first_attempt_no_retries,
        test_instance.test_2_success_on_second_attempt_1_retry,
        test_instance.test_3_success_on_third_attempt_2_retries,
        test_instance.test_4_failure_after_3_attempts_raises_500,
        test_instance.test_5_delay_occurs_between_attempts,
        test_instance.test_6_each_attempt_logged_properly,
        test_instance.test_7_network_errors_trigger_retry,
        test_instance.test_8_auth_errors_dont_retry_fail_fast,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            asyncio.run(test())
            print(f"✅ {test.__name__}")
            passed += 1
        except Exception as e:
            print(f"❌ {test.__name__}: {str(e)}")
            failed += 1
    
    print(f"\nResults: {passed} passed, {failed} failed")
    return passed == len(tests)


if __name__ == "__main__":
    success = test_all_retry_logic()
    exit(0 if success else 1)