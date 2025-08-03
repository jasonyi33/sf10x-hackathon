"""
Test Task 1.2.2: Unit tests for age format in transcribe endpoint
Tests age extraction and validation without requiring a running server
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
import json
from fastapi.testclient import TestClient
from api.transcription import router, TranscribeResponse
from services.validation_helper import validate_categorized_data


class TestTranscribeAgeFormatUnit:
    """Unit tests for age format validation in transcribe endpoint"""
    
    @pytest.fixture
    def mock_supabase(self):
        """Mock Supabase client"""
        with patch('api.transcription.create_client') as mock:
            mock_client = Mock()
            mock.return_value = mock_client
            
            # Mock categories response
            categories_data = [
                {"name": "name", "type": "text", "is_required": True},
                {"name": "height", "type": "number", "is_required": True},
                {"name": "weight", "type": "number", "is_required": True},
                {"name": "skin_color", "type": "single_select", "is_required": True,
                 "options": [{"label": "Light", "value": 0}, {"label": "Medium", "value": 0}, {"label": "Dark", "value": 0}]},
                {"name": "approximate_age", "type": "range", "is_required": True}
            ]
            mock_client.table.return_value.select.return_value.order.return_value.execute.return_value.data = categories_data
            
            # Mock individuals response for duplicate detection
            mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
            mock_client.table.return_value.select.return_value.ilike.return_value.limit.return_value.execute.return_value.data = []
            
            yield mock_client
    
    @pytest.fixture  
    def mock_openai(self):
        """Mock OpenAI service"""
        with patch('api.transcription.OpenAIService') as mock:
            yield mock
    
    @pytest.fixture
    def mock_auth(self):
        """Mock authentication"""
        with patch('api.transcription.get_current_user') as mock:
            mock.return_value = "test-user-123"
            yield mock
    
    def test_age_format_validation_logic(self):
        """Test 1: Verify age format validation logic works correctly"""
        
        categories = [
            {"name": "name", "type": "text", "is_required": True},
            {"name": "approximate_age", "type": "range", "is_required": True}
        ]
        
        # Test valid age formats
        valid_cases = [
            {"approximate_age": [45, 50], "name": "Test"},
            {"approximate_age": [-1, -1], "name": "Unknown"},
            {"approximate_age": [0, 2], "name": "Baby"},
            {"approximate_age": [118, 120], "name": "Elder"}
        ]
        
        for data in valid_cases:
            result = validate_categorized_data(data, categories)
            assert result.is_valid == True, f"Valid age {data['approximate_age']} should pass"
            assert "approximate_age" not in result.missing_required
        
        # Test invalid age formats
        invalid_cases = [
            {"approximate_age": 45, "name": "Test"},  # Single number
            {"approximate_age": [45], "name": "Test"},  # Single element
            {"approximate_age": [50, 45], "name": "Test"},  # Min > Max
            {"approximate_age": [-5, 10], "name": "Test"},  # Negative
            {"approximate_age": [100, 130], "name": "Test"},  # Over 120
            {"name": "Test"}  # Missing age
        ]
        
        for data in invalid_cases:
            result = validate_categorized_data(data, categories)
            assert result.is_valid == False, f"Invalid age {data.get('approximate_age')} should fail"
    
    @pytest.mark.asyncio
    async def test_transcribe_response_includes_validation(self, mock_supabase, mock_openai, mock_auth):
        """Test 2: Verify transcribe endpoint includes validation in response"""
        
        # Mock OpenAI responses
        mock_openai_instance = Mock()
        mock_openai.return_value = mock_openai_instance
        
        mock_openai_instance.transcribe_audio = AsyncMock(
            return_value="Person is 45 years old"
        )
        mock_openai_instance.categorize_transcription = AsyncMock(
            return_value={
                "name": "Test Person",
                "height": 70,
                "weight": 150,
                "skin_color": "Medium",
                "approximate_age": [43, 47]
            }
        )
        mock_openai_instance.find_duplicates = AsyncMock(return_value=[])
        
        # Import main app to test
        from main import app
        
        # Test client
        with TestClient(app) as client:
            response = client.post(
                "/api/transcribe",
                json={"audio_url": "https://example.com/test.m4a"},
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Verify response structure
            assert "transcription" in data
            assert "categorized_data" in data
            assert "missing_required" in data
            
            # Verify age format in response
            age = data["categorized_data"]["approximate_age"]
            assert isinstance(age, list), "Age must be a list"
            assert len(age) == 2, "Age must have 2 elements"
            assert age == [43, 47], "Age should match expected format"
            
            # Verify no missing required fields
            assert len(data["missing_required"]) == 0, "Should have no missing required fields"
    
    @pytest.mark.asyncio
    async def test_age_post_processing_in_openai_service(self):
        """Test 3: Verify OpenAIService post-processes age to correct format"""
        
        from services.openai_service import OpenAIService
        
        with patch('services.openai_service.AsyncOpenAI') as mock_openai_class:
            mock_client = Mock()
            mock_openai_class.return_value = mock_client
            
            service = OpenAIService()
            
            # Test cases where GPT returns wrong format
            test_cases = [
                {
                    "gpt_returns": {"approximate_age": 45},  # Single number
                    "expected": [43, 47]
                },
                {
                    "gpt_returns": {"approximate_age": None},  # Null
                    "expected": [-1, -1]
                },
                {
                    "gpt_returns": {"approximate_age": "45"},  # String
                    "expected": [43, 47]
                },
                {
                    "gpt_returns": {},  # Missing field
                    "expected": [-1, -1]  # Should default to unknown when missing
                }
            ]
            
            categories = [{"name": "approximate_age", "type": "range", "is_required": True}]
            
            for test_case in test_cases:
                # Mock GPT response
                mock_response = Mock()
                mock_response.choices = [Mock(message=Mock(
                    content=json.dumps(test_case["gpt_returns"])
                ))]
                mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
                
                # Call categorize
                result = await service.categorize_transcription("test", categories)
                
                assert result["approximate_age"] == test_case["expected"], \
                    f"Failed for GPT return: {test_case['gpt_returns']}"
    
    def test_transcribe_response_model_structure(self):
        """Test 4: Verify TranscribeResponse model structure"""
        
        # Test valid response
        response = TranscribeResponse(
            transcription="Test transcription",
            categorized_data={
                "name": "Test",
                "approximate_age": [45, 50]
            },
            missing_required=[],
            potential_matches=[]
        )
        
        # Verify model serialization
        data = response.model_dump()
        assert data["categorized_data"]["approximate_age"] == [45, 50]
        
        # Test response with invalid age should still serialize
        response2 = TranscribeResponse(
            transcription="Test",
            categorized_data={
                "name": "Test",
                "approximate_age": 45  # Wrong format but model should accept it
            },
            missing_required=["height", "weight"],
            potential_matches=[]
        )
        
        data2 = response2.model_dump()
        assert data2["categorized_data"]["approximate_age"] == 45
        assert "height" in data2["missing_required"]
    
    @pytest.mark.asyncio
    async def test_missing_age_in_validation(self, mock_supabase, mock_openai, mock_auth):
        """Test 5: Verify missing age is caught in validation"""
        
        # Mock OpenAI to return data without age
        mock_openai_instance = Mock()
        mock_openai.return_value = mock_openai_instance
        
        mock_openai_instance.transcribe_audio = AsyncMock(
            return_value="Person needs help"
        )
        mock_openai_instance.categorize_transcription = AsyncMock(
            return_value={
                "name": "Test Person",
                "height": 70,
                "weight": 150,
                "skin_color": "Medium"
                # Missing approximate_age
            }
        )
        mock_openai_instance.find_duplicates = AsyncMock(return_value=[])
        
        from main import app
        
        with TestClient(app) as client:
            response = client.post(
                "/api/transcribe",
                json={"audio_url": "https://example.com/test.m4a"},
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Should report age as missing required
            assert "approximate_age" in data["missing_required"], \
                "Missing age should be reported in missing_required"


def run_unit_tests():
    """Run unit tests for age format"""
    pytest.main([__file__, "-v", "-s"])


if __name__ == "__main__":
    print("=" * 60)
    print("Transcribe Age Format Unit Tests (Task 1.2.2)")
    print("=" * 60)
    print("\nTesting age format validation without server...")
    print("\n" + "=" * 60)
    
    run_unit_tests()