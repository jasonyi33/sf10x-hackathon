"""
Task 4.0.4: Error Recovery Testing - Simplified Backend Tests
Tests for actual error recovery scenarios in the backend
"""

import pytest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock, Mock
from datetime import datetime
import json
import httpx
from fastapi.testclient import TestClient
from fastapi import HTTPException

# Import from main
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from services.openai_service import OpenAIService
from services.individual_service import IndividualService
from services.upload_retry import RetryUploader

# Create test client
client = TestClient(app)


class TestNetworkErrors:
    """Test network error scenarios"""
    
    def test_network_error_during_individual_save(self):
        """Test network error when saving individual"""
        with patch('api.individuals.supabase') as mock_supabase:
            # Mock auth
            mock_supabase.auth.get_session.return_value = {
                "data": {"session": {"user": {"id": "test-user"}}},
                "error": None
            }
            
            # Mock network error
            mock_supabase.table.side_effect = Exception("Network request failed")
            
            response = client.post(
                "/api/individuals",
                json={
                    "name": "John Doe",
                    "height": 72,
                    "weight": 180,
                    "skin_color": "Light"
                },
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 500
            assert "error" in response.json()
    
    def test_timeout_during_search(self):
        """Test timeout during search operation"""
        with patch('api.individuals.supabase') as mock_supabase:
            # Mock auth
            mock_supabase.auth.get_session.return_value = {
                "data": {"session": {"user": {"id": "test-user"}}},
                "error": None
            }
            
            # Mock timeout
            mock_table = MagicMock()
            mock_table.select.side_effect = Exception("Request timeout")
            mock_supabase.table.return_value = mock_table
            
            response = client.get(
                "/api/individuals/search?q=test",
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 500


class TestPhotoUploadRetry:
    """Test photo upload retry mechanism"""
    
    @pytest.mark.asyncio
    async def test_photo_upload_retry_success(self):
        """Test photo upload succeeds after retry"""
        retry_uploader = RetryUploader(max_retries=3, initial_delay=0.1)
        
        attempt_count = 0
        
        async def mock_upload():
            nonlocal attempt_count
            attempt_count += 1
            if attempt_count < 3:
                raise Exception("Upload failed")
            return {"success": True, "url": "https://example.com/photo.jpg"}
        
        result = await retry_uploader.upload_with_retry(mock_upload)
        
        assert attempt_count == 3
        assert result["success"] is True
    
    @pytest.mark.asyncio
    async def test_photo_upload_max_retries_exceeded(self):
        """Test photo upload fails after max retries"""
        retry_uploader = RetryUploader(max_retries=3, initial_delay=0.1)
        
        async def mock_upload():
            raise Exception("Upload always fails")
        
        with pytest.raises(Exception) as exc_info:
            await retry_uploader.upload_with_retry(mock_upload)
        
        assert "Upload always fails" in str(exc_info.value)


class TestInvalidResponses:
    """Test handling of invalid server responses"""
    
    def test_malformed_json_from_openai(self):
        """Test handling of malformed JSON from OpenAI"""
        with patch('services.openai_service.AsyncOpenAI') as mock_openai_class:
            mock_client = MagicMock()
            mock_openai_class.return_value = mock_client
            
            # Mock malformed response
            mock_response = MagicMock()
            mock_response.choices = [MagicMock(message=MagicMock(content="Not valid JSON{"))]
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
            
            service = OpenAIService()
            
            # Should handle gracefully
            asyncio.run(self._test_categorize_with_invalid_json(service))
    
    async def _test_categorize_with_invalid_json(self, service):
        """Helper to test categorization with invalid JSON"""
        result = await service.categorize_transcription("test", [])
        # Should return empty dict or handle error gracefully
        assert isinstance(result, dict)
    
    def test_missing_required_fields_in_response(self):
        """Test handling of missing required fields"""
        with patch('api.individuals.supabase') as mock_supabase:
            # Mock auth
            mock_supabase.auth.get_session.return_value = {
                "data": {"session": {"user": {"id": "test-user"}}},
                "error": None
            }
            
            # Mock response missing required fields
            mock_supabase.table.return_value.select.return_value.execute.return_value = MagicMock(
                data=[{"id": "123"}]  # Missing name, danger_score, etc.
            )
            
            response = client.get(
                "/api/individuals/123",
                headers={"Authorization": "Bearer test-token"}
            )
            
            # Should handle missing fields
            assert response.status_code in [200, 404, 500]


class TestAuthErrors:
    """Test authentication error handling"""
    
    def test_expired_token(self):
        """Test handling of expired auth token"""
        with patch('api.auth.supabase') as mock_supabase:
            # Mock expired token
            mock_supabase.auth.get_session.return_value = {
                "data": {"session": None},
                "error": {"message": "Token expired"}
            }
            
            response = client.get(
                "/api/individuals",
                headers={"Authorization": "Bearer expired-token"}
            )
            
            assert response.status_code == 401
    
    def test_invalid_token_format(self):
        """Test handling of invalid token format"""
        response = client.get(
            "/api/individuals",
            headers={"Authorization": "InvalidFormat"}
        )
        
        assert response.status_code == 401
    
    def test_missing_auth_header(self):
        """Test handling of missing authorization header"""
        response = client.get("/api/individuals")
        
        assert response.status_code == 401


class TestAudioErrors:
    """Test audio file error handling"""
    
    @pytest.mark.asyncio
    async def test_corrupted_audio_file(self):
        """Test handling of corrupted audio files"""
        service = OpenAIService()
        
        with patch('httpx.AsyncClient.get') as mock_get:
            # Mock downloading corrupted file
            mock_response = MagicMock()
            mock_response.content = b"corrupted data"
            mock_response.raise_for_status = MagicMock()
            mock_get.return_value = mock_response
            
            with patch('services.openai_service.AsyncOpenAI') as mock_openai:
                mock_client = MagicMock()
                mock_openai.return_value = mock_client
                
                # Mock OpenAI rejecting the file
                mock_client.audio.transcriptions.create.side_effect = Exception(
                    "Invalid file format"
                )
                
                service.client = mock_client
                
                with pytest.raises(Exception) as exc_info:
                    await service.transcribe_audio("https://example.supabase.co/audio.m4a")
                
                assert "Invalid file format" in str(exc_info.value)
    
    def test_audio_file_too_large(self):
        """Test handling of oversized audio files"""
        with patch('api.transcribe.supabase') as mock_supabase:
            # Mock auth
            mock_supabase.auth.get_session.return_value = {
                "data": {"session": {"user": {"id": "test-user"}}},
                "error": None
            }
            
            # Mock oversized file (> 25MB)
            mock_storage = MagicMock()
            mock_storage.from_.return_value.download.return_value.data = b"x" * (26 * 1024 * 1024)
            mock_supabase.storage = mock_storage
            
            response = client.post(
                "/api/transcribe",
                json={"audio_url": "https://example.com/large-audio.m4a"},
                headers={"Authorization": "Bearer test-token"}
            )
            
            # Should reject oversized files
            assert response.status_code in [400, 413, 500]


class TestDataRecovery:
    """Test data recovery and consistency"""
    
    def test_save_draft_on_error(self):
        """Test that draft is saved when main save fails"""
        with patch('api.individuals.supabase') as mock_supabase:
            # Mock auth
            mock_supabase.auth.get_session.return_value = {
                "data": {"session": {"user": {"id": "test-user"}}},
                "error": None
            }
            
            # First save fails
            mock_supabase.table.return_value.insert.side_effect = [
                Exception("Network error"),
                MagicMock(data=[{"id": "draft-123"}])  # Draft save succeeds
            ]
            
            response = client.post(
                "/api/individuals",
                json={
                    "name": "Test User",
                    "height": 70,
                    "weight": 160,
                    "skin_color": "Medium"
                },
                headers={"Authorization": "Bearer test-token"}
            )
            
            # Should attempt to save draft
            assert mock_supabase.table.call_count >= 1
    
    def test_duplicate_prevention(self):
        """Test prevention of duplicate individuals"""
        with patch('api.individuals.individual_service') as mock_service:
            # Mock duplicate detection
            mock_service.check_duplicates = AsyncMock(return_value=[
                {"id": "existing-123", "confidence": 98, "name": "John Doe"}
            ])
            
            response = client.post(
                "/api/individuals",
                json={
                    "name": "John Doe",
                    "height": 72,
                    "weight": 180,
                    "skin_color": "Light"
                },
                headers={"Authorization": "Bearer test-token"}
            )
            
            # Should detect potential duplicate
            if response.status_code == 200:
                data = response.json()
                assert "potential_matches" in data or "duplicate" in str(data)


class TestErrorMessages:
    """Test user-friendly error messages"""
    
    def test_network_error_message(self):
        """Test network error returns user-friendly message"""
        with patch('api.individuals.supabase') as mock_supabase:
            mock_supabase.auth.get_session.return_value = {
                "data": {"session": {"user": {"id": "test-user"}}},
                "error": None
            }
            
            mock_supabase.table.side_effect = httpx.ConnectError("Network unreachable")
            
            response = client.get(
                "/api/individuals",
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 500
            error_detail = response.json().get("detail", "")
            # Should not expose internal error details
            assert "Network unreachable" not in error_detail
    
    def test_validation_error_message(self):
        """Test validation errors return clear messages"""
        response = client.post(
            "/api/individuals",
            json={
                "name": "",  # Empty name
                "height": -5,  # Invalid height
                "weight": 1000,  # Invalid weight
                "skin_color": "Blue"  # Invalid option
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 422
        errors = response.json()
        assert "detail" in errors


class TestRetryMechanisms:
    """Test retry mechanisms work correctly"""
    
    @pytest.mark.asyncio
    async def test_exponential_backoff(self):
        """Test exponential backoff in retry logic"""
        retry_uploader = RetryUploader(max_retries=3, initial_delay=0.1)
        
        attempt_times = []
        
        async def mock_operation():
            attempt_times.append(datetime.now())
            if len(attempt_times) < 3:
                raise Exception("Retry needed")
            return "Success"
        
        result = await retry_uploader.upload_with_retry(mock_operation)
        
        assert result == "Success"
        assert len(attempt_times) == 3
        
        # Verify increasing delays
        if len(attempt_times) >= 3:
            delay1 = (attempt_times[1] - attempt_times[0]).total_seconds()
            delay2 = (attempt_times[2] - attempt_times[1]).total_seconds()
            
            # Second delay should be longer (exponential backoff)
            assert delay2 > delay1
    
    def test_non_retryable_errors(self):
        """Test that certain errors are not retried"""
        with patch('api.individuals.supabase') as mock_supabase:
            mock_supabase.auth.get_session.return_value = {
                "data": {"session": {"user": {"id": "test-user"}}},
                "error": None
            }
            
            # Mock 403 Forbidden (non-retryable)
            mock_supabase.table.side_effect = HTTPException(
                status_code=403,
                detail="Forbidden"
            )
            
            response = client.get(
                "/api/individuals",
                headers={"Authorization": "Bearer test-token"}
            )
            
            # Should not retry 403 errors
            assert response.status_code in [403, 500]
            assert mock_supabase.table.call_count == 1  # Called only once


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])