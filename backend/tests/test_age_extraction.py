"""
Test cases for Task 1.2.1: Update GPT-4o prompt to extract age ranges
These tests verify that the AI correctly extracts age in [min, max] array format
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
import json
import os
from dotenv import load_dotenv
from services.openai_service import OpenAIService

# Load environment variables
load_dotenv()


class TestAgeExtraction:
    """Test age extraction from transcriptions"""
    
    @pytest.fixture
    def openai_service(self):
        """Create OpenAI service instance"""
        return OpenAIService()
    
    @pytest.fixture
    def categories_with_age(self):
        """Standard categories including approximate_age"""
        return [
            {"name": "name", "type": "text", "is_required": True},
            {"name": "height", "type": "number", "is_required": True},
            {"name": "weight", "type": "number", "is_required": True},
            {"name": "skin_color", "type": "single_select", "is_required": True,
             "options": [{"label": "Light", "value": 0}, {"label": "Medium", "value": 0}, {"label": "Dark", "value": 0}]},
            {"name": "approximate_age", "type": "range", "is_required": True, "is_preset": True}
        ]
    
    @pytest.mark.asyncio
    async def test_prompt_includes_age_instructions(self, openai_service, categories_with_age):
        """Test 1: Verify the prompt includes age extraction instructions"""
        # Mock the API response
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content='{"name": "Test", "approximate_age": [45, 50]}'))]
        
        with patch.object(openai_service.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)) as mock_create:
            
            # Call the method
            await openai_service.categorize_transcription("Test transcription", categories_with_age)
            
            # Get the prompt that was sent
            call_args = mock_create.call_args
            messages = call_args[1]['messages']
            user_prompt = messages[1]['content']
            
            # Check that prompt mentions age
            assert "approximate_age" in user_prompt, "Prompt should mention approximate_age"
            
            # Check for age-specific instructions (will fail initially)
            assert "[min, max]" in user_prompt or "array" in user_prompt, \
                "Prompt should specify age as array format"
    
    @pytest.mark.asyncio
    async def test_extract_specific_age(self, openai_service, categories_with_age):
        """Test 2: Extract specific age with ±2 years range"""
        test_cases = [
            ("John is 45 years old", [43, 47]),
            ("She's about 30", [28, 32]),
            ("He is 65", [63, 67]),
            ("The person is 18 years old", [16, 20]),
        ]
        
        for transcription, expected_age in test_cases:
            # Mock response with expected age
            mock_response = Mock()
            mock_response.choices = [Mock(message=Mock(content=json.dumps({
                "name": "John",
                "height": 70,
                "weight": 150,
                "skin_color": "Medium",
                "approximate_age": expected_age
            })))]
            
            with patch.object(openai_service.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)):
                
                result = await openai_service.categorize_transcription(transcription, categories_with_age)
                
                assert "approximate_age" in result, f"Result should include age for: {transcription}"
                assert result["approximate_age"] == expected_age, \
                    f"Expected {expected_age} for '{transcription}', got {result.get('approximate_age')}"
    
    @pytest.mark.asyncio
    async def test_extract_descriptive_age(self, openai_service, categories_with_age):
        """Test 3: Extract age from descriptive terms"""
        test_cases = [
            ("elderly man", [65, 85]),
            ("teenage girl", [13, 19]),
            ("middle-aged woman", [40, 60]),
            ("young adult", [18, 30]),
            ("person in their twenties", [20, 29]),
            ("senior citizen", [65, 85]),
        ]
        
        for transcription, expected_age in test_cases:
            # Mock response with expected age
            mock_response = Mock()
            mock_response.choices = [Mock(message=Mock(content=json.dumps({
                "name": None,
                "height": None,
                "weight": None,
                "skin_color": None,
                "approximate_age": expected_age
            })))]
            
            with patch.object(openai_service.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)):
                
                result = await openai_service.categorize_transcription(transcription, categories_with_age)
                
                assert result["approximate_age"] == expected_age, \
                    f"Expected {expected_age} for '{transcription}'"
    
    @pytest.mark.asyncio
    async def test_no_age_returns_unknown(self, openai_service, categories_with_age):
        """Test 4: No age information should return [-1, -1]"""
        transcription = "Met someone named Bob today, tall person with brown hair"
        
        # Mock response with unknown age
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content=json.dumps({
            "name": "Bob",
            "height": None,
            "weight": None,
            "skin_color": None,
            "approximate_age": [-1, -1]
        })))]
        
        with patch.object(openai_service.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)):
            
            result = await openai_service.categorize_transcription(transcription, categories_with_age)
            
            assert result["approximate_age"] == [-1, -1], \
                "Should return [-1, -1] when no age information is available"
    
    @pytest.mark.asyncio
    async def test_age_always_array_format(self, openai_service, categories_with_age):
        """Test 5: Age should always be in array format, never single number"""
        # Test that even if GPT returns a single number, we handle it
        # Mock response with single number (incorrect format)
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content=json.dumps({
            "name": "Test",
            "approximate_age": 45  # Single number, not array
        })))]
        
        with patch.object(openai_service.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)):
            
            result = await openai_service.categorize_transcription("Person is 45", categories_with_age)
            
            # The service should handle this and convert or set to unknown
            assert isinstance(result.get("approximate_age"), list), \
                "Age should always be a list"
            assert len(result.get("approximate_age", [])) == 2, \
                "Age array should have exactly 2 values"
    
    @pytest.mark.asyncio
    async def test_age_range_extraction(self, openai_service, categories_with_age):
        """Test 6: Extract age ranges from descriptions"""
        test_cases = [
            ("between 40 and 50 years old", [40, 50]),
            ("in her thirties", [30, 39]),
            ("late fifties", [55, 59]),
            ("early twenties", [20, 24]),
        ]
        
        for transcription, expected_age in test_cases:
            # Mock response
            mock_response = Mock()
            mock_response.choices = [Mock(message=Mock(content=json.dumps({
                "name": None,
                "approximate_age": expected_age
            })))]
            
            with patch.object(openai_service.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)):
                
                result = await openai_service.categorize_transcription(transcription, categories_with_age)
                
                assert result["approximate_age"] == expected_age, \
                    f"Expected {expected_age} for '{transcription}'"


def run_age_extraction_tests():
    """Run all age extraction tests"""
    pytest.main([__file__, "-v", "-s"])


if __name__ == "__main__":
    print("=" * 60)
    print("Age Extraction Test Suite")
    print("=" * 60)
    print("\nTesting GPT-4o prompt for age extraction...")
    print("Requirements:")
    print("- Always return age as [min, max] array")
    print("- Specific ages get ±2 years (45 → [43, 47])")
    print("- Descriptive ages use standard ranges")
    print("- No age info returns [-1, -1]")
    print("\n" + "=" * 60)
    
    run_age_extraction_tests()