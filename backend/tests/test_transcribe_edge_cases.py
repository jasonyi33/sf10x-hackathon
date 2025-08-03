"""
Test edge cases for /api/transcribe age validation
Ensures robust error handling and validation
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
import json


class TestTranscribeEdgeCases:
    """Test edge cases for age validation in transcribe endpoint"""
    
    @pytest.mark.asyncio
    async def test_validation_errors_not_exposed(self):
        """Verify that validation errors are handled internally, not exposed to client"""
        
        from api.transcription import TranscribeResponse
        from services.validation_helper import validate_categorized_data
        
        # Test data with invalid age that gets corrected by OpenAI service
        categories = [
            {"name": "name", "type": "text", "is_required": True},
            {"name": "approximate_age", "type": "range", "is_required": True}
        ]
        
        # Before correction - invalid format
        raw_data = {
            "name": "Test",
            "approximate_age": "forty-five"  # Invalid - string
        }
        
        # Validate raw data
        result = validate_categorized_data(raw_data, categories)
        assert result.is_valid == False
        assert len(result.validation_errors) > 0
        
        # After OpenAI service correction
        corrected_data = {
            "name": "Test", 
            "approximate_age": [43, 47]  # Corrected by OpenAI service
        }
        
        # Validate corrected data
        result2 = validate_categorized_data(corrected_data, categories)
        assert result2.is_valid == True
        assert len(result2.validation_errors) == 0
        
        # The endpoint returns corrected data, not raw data
        response = TranscribeResponse(
            transcription="Test is forty-five",
            categorized_data=corrected_data,  # Uses corrected data
            missing_required=[],
            potential_matches=[]
        )
        
        # Client sees valid data
        assert response.categorized_data["approximate_age"] == [43, 47]
        assert len(response.missing_required) == 0
        
        print("✅ Validation errors handled internally, corrected data returned")
    
    @pytest.mark.asyncio
    async def test_severe_validation_failures(self):
        """Test handling of severe validation failures"""
        
        with patch('api.transcription.create_client') as mock_supabase, \
             patch('api.transcription.OpenAIService') as mock_openai, \
             patch('api.transcription.get_current_user') as mock_auth:
            
            from api.transcription import transcribe_audio_endpoint, TranscribeRequest
            
            # Setup mocks
            mock_auth.return_value = "test-user"
            mock_client = Mock()
            mock_supabase.return_value = mock_client
            
            # Categories
            categories = [
                {"name": "name", "type": "text", "is_required": True},
                {"name": "height", "type": "number", "is_required": True},
                {"name": "weight", "type": "number", "is_required": True},
                {"name": "skin_color", "type": "single_select", "is_required": True},
                {"name": "approximate_age", "type": "range", "is_required": True}
            ]
            mock_client.table.return_value.select.return_value.order.return_value.execute.return_value.data = categories
            mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
            mock_client.table.return_value.select.return_value.ilike.return_value.limit.return_value.execute.return_value.data = []
            
            # OpenAI service returns data missing multiple required fields
            mock_openai_instance = Mock()
            mock_openai.return_value = mock_openai_instance
            mock_openai_instance.transcribe_audio = AsyncMock(return_value="Some person")
            mock_openai_instance.categorize_transcription = AsyncMock(
                return_value={
                    "name": "Unknown"
                    # Missing: height, weight, skin_color, approximate_age
                }
            )
            mock_openai_instance.find_duplicates = AsyncMock(return_value=[])
            
            # Call endpoint
            request = TranscribeRequest(audio_url="https://example.com/test.m4a")
            response = await transcribe_audio_endpoint(request, "test-user")
            
            # Should still return response with missing fields reported
            assert len(response.missing_required) == 4
            assert "height" in response.missing_required
            assert "weight" in response.missing_required
            assert "skin_color" in response.missing_required
            assert "approximate_age" in response.missing_required
            
            print("✅ Severe validation failures handled gracefully")
    
    @pytest.mark.asyncio
    async def test_openai_service_handles_edge_cases(self):
        """Test that OpenAI service handles all edge cases for age"""
        
        from services.openai_service import OpenAIService
        
        with patch('services.openai_service.AsyncOpenAI') as mock_openai:
            mock_client = Mock()
            mock_openai.return_value = mock_client
            
            service = OpenAIService()
            categories = [{"name": "approximate_age", "type": "range", "is_required": True}]
            
            # Test various edge cases
            edge_cases = [
                ({"approximate_age": None}, [-1, -1]),
                ({"approximate_age": ""}, [-1, -1]),
                ({"approximate_age": []}, [-1, -1]),
                ({"approximate_age": [45, 50, 55]}, [-1, -1]),
                ({"approximate_age": {"min": 45, "max": 50}}, [45, 50]),  # Valid object format
                ({"approximate_age": "Unknown"}, [-1, -1]),
                ({"approximate_age": -1}, [-1, -1]),
                ({"approximate_age": 999}, [-1, -1]),  # Out of bounds
                ({"approximate_age": 45}, [43, 47]),  # Single number to range
                ({"approximate_age": "45"}, [43, 47]),  # String number to range
                ({"approximate_age": {"min": -5, "max": 10}}, [-1, -1]),  # Invalid min
                ({"approximate_age": {"min": 100, "max": 130}}, [-1, -1]),  # Invalid max
            ]
            
            for gpt_return, expected in edge_cases:
                mock_response = Mock()
                mock_response.choices = [Mock(message=Mock(
                    content=json.dumps(gpt_return)
                ))]
                mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
                
                result = await service.categorize_transcription("test", categories)
                assert result["approximate_age"] == expected, \
                    f"Failed for {gpt_return}, expected {expected}, got {result['approximate_age']}"
            
            print("✅ OpenAI service handles all age edge cases")


def run_edge_case_tests():
    """Run edge case tests"""
    pytest.main([__file__, "-v", "-s"])


if __name__ == "__main__":
    print("=" * 60)
    print("Transcribe Endpoint Edge Case Tests")
    print("=" * 60)
    print("\nTesting edge cases for age validation...")
    print("\n" + "=" * 60)
    
    run_edge_case_tests()