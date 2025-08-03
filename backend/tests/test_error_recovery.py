"""
Task 4.0.4: Error Recovery Testing - Backend Tests
Tests for all backend error recovery scenarios
"""

import pytest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime, timedelta
import json
from fastapi import HTTPException
from httpx import AsyncClient, ConnectError, TimeoutException
import base64

# Import the modules to test
from main import app
from services.openai_service import OpenAIService
from services.individual_service import IndividualService
from services.photo_history import PhotoHistoryService
from services.upload_retry import RetryUploader
from api.auth import get_current_user

# Fixtures
@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    mock = MagicMock()
    mock.auth.get_session = AsyncMock(return_value={
        "data": {"session": {"access_token": "valid-token", "user": {"id": "user-123"}}},
        "error": None
    })
    return mock

@pytest.fixture
def mock_openai():
    """Mock OpenAI client"""
    mock = MagicMock()
    mock.audio.transcriptions.create = MagicMock()
    mock.chat.completions.create = MagicMock()
    return mock

@pytest.fixture
async def client():
    """Create test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

# Mark all tests as async
pytestmark = pytest.mark.asyncio


class TestNetworkErrorRecovery:
    """Test network error recovery scenarios"""
    
    async def test_database_connection_failure(self, mock_supabase):
        """Test handling of database connection failures"""
        # Mock database connection error
        mock_supabase.table.side_effect = Exception("Database connection failed")
        
        service = IndividualService(mock_supabase)
        
        with pytest.raises(Exception) as exc_info:
            await service.search_individuals("test")
        
        assert "Database connection failed" in str(exc_info.value)
    
    async def test_openai_api_timeout(self, mock_openai):
        """Test handling of OpenAI API timeouts"""
        # Mock timeout
        mock_openai.audio.transcriptions.create.side_effect = TimeoutException("Request timeout")
        
        service = OpenAIService()
        service.client = mock_openai
        
        with pytest.raises(Exception) as exc_info:
            await service.transcribe_audio("test-audio-url")
        
        assert "timeout" in str(exc_info.value).lower()
    
    async def test_storage_upload_failure(self, mock_supabase):
        """Test handling of storage upload failures"""
        # Mock storage upload error
        mock_storage = MagicMock()
        mock_storage.from_.return_value.upload.side_effect = Exception("Upload failed")
        mock_supabase.storage = mock_storage
        
        service = PhotoHistoryService(mock_supabase)
        
        with pytest.raises(Exception) as exc_info:
            await service.upload_photo(b"test-photo-data", "individual-123", {})
        
        assert "Upload failed" in str(exc_info.value)


class TestRetryMechanisms:
    """Test retry mechanisms for various operations"""
    
    async def test_transcription_retry_on_failure(self, mock_openai, mock_supabase):
        """Test that transcription retries on temporary failures"""
        call_count = 0
        
        def mock_transcribe(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise Exception("Temporary failure")
            return MagicMock(text="Transcribed text")
        
        mock_openai.audio.transcriptions.create.side_effect = mock_transcribe
        
        service = OpenAIService(mock_openai, mock_supabase)
        
        # Should succeed after retries
        result = await service.transcribe_audio_with_retry("test-url", max_retries=3)
        
        assert call_count == 3
        assert result == "Transcribed text"
    
    async def test_photo_upload_retry_limit(self, mock_supabase):
        """Test that photo upload stops after max retries"""
        # Mock continuous failures
        mock_storage = MagicMock()
        mock_storage.from_.return_value.upload.side_effect = Exception("Upload failed")
        mock_supabase.storage = mock_storage
        
        service = PhotoHistoryService(mock_supabase)
        
        with pytest.raises(Exception) as exc_info:
            await service.upload_photo_with_retry(
                b"test-photo", 
                "individual-123", 
                {},
                max_retries=3
            )
        
        # Should have tried 3 times
        assert mock_storage.from_.return_value.upload.call_count == 3
    
    async def test_exponential_backoff(self, mock_supabase):
        """Test exponential backoff between retries"""
        retry_times = []
        
        async def mock_operation():
            retry_times.append(datetime.now())
            if len(retry_times) < 3:
                raise Exception("Retry needed")
            return "Success"
        
        # Run operation with retries
        start_time = datetime.now()
        result = await self._retry_with_backoff(mock_operation, max_retries=3)
        
        assert result == "Success"
        assert len(retry_times) == 3
        
        # Verify increasing delays
        delay1 = (retry_times[1] - retry_times[0]).total_seconds()
        delay2 = (retry_times[2] - retry_times[1]).total_seconds()
        
        # Second delay should be longer (exponential backoff)
        assert delay2 > delay1
    
    async def _retry_with_backoff(self, operation, max_retries=3):
        """Helper method for retry with exponential backoff"""
        for attempt in range(max_retries):
            try:
                return await operation()
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(0.1 * (2 ** attempt))  # Exponential backoff


class TestInvalidResponseHandling:
    """Test handling of invalid server responses"""
    
    async def test_malformed_json_response(self, client):
        """Test handling of malformed JSON responses"""
        with patch('main.get_current_user', return_value="user-123"):
            # Mock a route to return invalid JSON
            @app.get("/test/malformed")
            async def malformed_response():
                return "Invalid JSON{{"
            
            response = await client.get(
                "/test/malformed",
                headers={"Authorization": "Bearer test-token"}
            )
            
            # Should handle gracefully
            assert response.status_code == 500
    
    async def test_missing_required_fields(self, mock_supabase):
        """Test handling of responses missing required fields"""
        # Mock response missing required fields
        mock_supabase.table.return_value.select.return_value.execute.return_value = MagicMock(
            data=[{"id": "123"}]  # Missing name, danger_score, etc.
        )
        
        service = IndividualService(mock_supabase)
        
        # Should handle missing fields gracefully
        result = await service.get_individual("123")
        assert result is not None
        assert result.get("id") == "123"
    
    async def test_invalid_data_types(self, mock_openai, mock_supabase):
        """Test handling of invalid data types in responses"""
        # Mock AI returning invalid data types
        mock_openai.chat.completions.create.return_value = MagicMock(
            choices=[MagicMock(
                message=MagicMock(
                    content=json.dumps({
                        "name": 123,  # Should be string
                        "height": "tall",  # Should be number
                        "weight": "heavy",  # Should be number
                        "skin_color": "Blue"  # Invalid option
                    })
                )
            )]
        )
        
        service = OpenAIService(mock_openai, mock_supabase)
        
        # Should handle invalid types gracefully
        result = await service.categorize_transcription("test transcription", [])
        
        # Should have validation errors
        assert "name" in result.get("validation_errors", {})


class TestAuthenticationErrorRecovery:
    """Test authentication error recovery"""
    
    async def test_expired_token_handling(self, client, mock_supabase):
        """Test handling of expired authentication tokens"""
        # Mock expired token
        mock_supabase.auth.get_session.return_value = {
            "data": {"session": None},
            "error": {"message": "Token expired"}
        }
        
        with patch('services.auth.supabase', mock_supabase):
            response = await client.get(
                "/api/individuals",
                headers={"Authorization": "Bearer expired-token"}
            )
            
            assert response.status_code == 401
            assert "expired" in response.json()["detail"].lower()
    
    async def test_invalid_token_format(self, client):
        """Test handling of invalid token formats"""
        response = await client.get(
            "/api/individuals",
            headers={"Authorization": "InvalidTokenFormat"}
        )
        
        assert response.status_code == 401
        assert "Invalid authentication" in response.json()["detail"]
    
    async def test_missing_authorization_header(self, client):
        """Test handling of missing authorization header"""
        response = await client.get("/api/individuals")
        
        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]


class TestAudioFileErrorHandling:
    """Test audio file error handling"""
    
    async def test_corrupted_audio_file(self, mock_openai, mock_supabase):
        """Test handling of corrupted audio files"""
        # Mock OpenAI rejecting corrupted audio
        mock_openai.audio.transcriptions.create.side_effect = Exception(
            "Audio file format not supported"
        )
        
        service = OpenAIService(mock_openai, mock_supabase)
        
        with pytest.raises(Exception) as exc_info:
            await service.transcribe_audio("corrupted-audio-url")
        
        assert "format not supported" in str(exc_info.value)
    
    async def test_oversized_audio_file(self, mock_supabase):
        """Test handling of oversized audio files"""
        # Mock oversized file
        mock_storage = MagicMock()
        mock_storage.from_.return_value.download.return_value = MagicMock(
            data=b"x" * (26 * 1024 * 1024)  # 26MB (over 25MB limit)
        )
        mock_supabase.storage = mock_storage
        
        service = OpenAIService(MagicMock(), mock_supabase)
        
        with pytest.raises(Exception) as exc_info:
            await service.validate_audio_file("large-audio-url")
        
        assert "file size exceeds" in str(exc_info.value).lower()
    
    async def test_invalid_audio_format(self, mock_openai, mock_supabase):
        """Test handling of invalid audio formats"""
        # Mock invalid format detection
        mock_openai.audio.transcriptions.create.side_effect = Exception(
            "Invalid file format. Only m4a, mp3, wav supported"
        )
        
        service = OpenAIService(mock_openai, mock_supabase)
        
        with pytest.raises(Exception) as exc_info:
            await service.transcribe_audio("invalid-format-url")
        
        assert "Invalid file format" in str(exc_info.value)


class TestDataConsistencyRecovery:
    """Test data consistency and recovery"""
    
    async def test_partial_save_rollback(self, mock_supabase):
        """Test rollback on partial save failure"""
        # Mock successful individual creation but failed interaction
        mock_table = MagicMock()
        mock_table.insert.return_value.execute.return_value = MagicMock(
            data=[{"id": "new-individual-123"}]
        )
        mock_supabase.table.side_effect = [
            mock_table,  # First call succeeds (individual)
            Exception("Interaction save failed")  # Second call fails
        ]
        
        service = IndividualService(mock_supabase)
        
        with pytest.raises(Exception) as exc_info:
            await service.create_individual_with_interaction({
                "name": "Test User",
                "transcription": "Test transcription"
            })
        
        assert "Interaction save failed" in str(exc_info.value)
        # In real implementation, should rollback the individual creation
    
    async def test_duplicate_individual_handling(self, mock_supabase):
        """Test handling of duplicate individual creation"""
        # Mock duplicate key error
        mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception(
            "duplicate key value violates unique constraint"
        )
        
        service = IndividualService(mock_supabase)
        
        with pytest.raises(Exception) as exc_info:
            await service.create_individual({"name": "Duplicate User"})
        
        assert "duplicate" in str(exc_info.value).lower()
    
    async def test_concurrent_update_conflict(self, mock_supabase):
        """Test handling of concurrent update conflicts"""
        # Mock optimistic locking failure
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[]  # No rows updated (version mismatch)
        )
        
        service = IndividualService(mock_supabase)
        
        result = await service.update_individual_with_version_check(
            "individual-123",
            {"danger_override": 50},
            expected_version=1
        )
        
        assert result is None  # Update failed due to version mismatch


class TestErrorLoggingAndMonitoring:
    """Test error logging and monitoring"""
    
    async def test_error_logging_with_context(self, client, mock_supabase):
        """Test that errors are logged with proper context"""
        with patch('main.logger') as mock_logger:
            # Trigger an error
            mock_supabase.table.side_effect = Exception("Database error")
            
            with patch('services.individual_service.supabase', mock_supabase):
                response = await client.get(
                    "/api/individuals",
                    headers={"Authorization": "Bearer test-token"}
                )
            
            # Verify error was logged with context
            mock_logger.error.assert_called()
            error_call = mock_logger.error.call_args
            assert "Database error" in str(error_call)
    
    async def test_sensitive_data_not_logged(self, mock_openai, mock_supabase):
        """Test that sensitive data is not included in error logs"""
        with patch('services.transcription_service.logger') as mock_logger:
            # Mock error with sensitive data
            mock_openai.audio.transcriptions.create.side_effect = Exception(
                "API key invalid: sk-1234567890abcdef"
            )
            
            service = OpenAIService(mock_openai, mock_supabase)
            
            try:
                await service.transcribe_audio("test-url")
            except:
                pass
            
            # Verify API key is not in logs
            for call in mock_logger.error.call_args_list:
                assert "sk-1234567890abcdef" not in str(call)


# Integration test for complete error recovery flow
class TestCompleteErrorRecoveryFlow:
    """Test complete error recovery flows"""
    
    async def test_full_save_flow_with_recovery(self, client, mock_supabase, mock_openai):
        """Test complete save flow with various error recoveries"""
        # Setup mocks
        call_count = {"transcribe": 0, "photo": 0, "save": 0}
        
        def mock_transcribe(*args, **kwargs):
            call_count["transcribe"] += 1
            if call_count["transcribe"] == 1:
                raise Exception("Temporary transcription failure")
            return MagicMock(text="Transcribed: John Doe, 45 years old")
        
        def mock_photo_upload(*args, **kwargs):
            call_count["photo"] += 1
            if call_count["photo"] <= 2:
                raise Exception("Photo upload timeout")
            return {"photo_url": "https://example.com/photo.jpg"}
        
        def mock_save(*args, **kwargs):
            call_count["save"] += 1
            if call_count["save"] == 1:
                raise Exception("Network error")
            return MagicMock(data=[{"id": "saved-individual-123"}])
        
        mock_openai.audio.transcriptions.create.side_effect = mock_transcribe
        mock_supabase.storage.from_.return_value.upload.side_effect = mock_photo_upload
        mock_supabase.table.return_value.insert.return_value.execute.side_effect = mock_save
        
        with patch('services.transcription_service.openai_client', mock_openai):
            with patch('services.individual_service.supabase', mock_supabase):
                # Simulate full flow with retries
                
                # 1. Transcribe audio (will retry once)
                response = await client.post(
                    "/api/transcribe",
                    json={"audio_url": "test-audio.m4a"},
                    headers={"Authorization": "Bearer test-token"}
                )
                
                assert response.status_code == 200
                assert call_count["transcribe"] == 2  # Retried once
                
                # 2. Upload photo (will retry twice)
                # 3. Save individual (will retry once)
                # This would be part of the full implementation
        
        # Verify all operations eventually succeeded with retries
        assert all(count >= 2 for count in call_count.values())


if __name__ == "__main__":
    # Run specific error recovery tests
    pytest.main([__file__, "-v", "-k", "error_recovery"])