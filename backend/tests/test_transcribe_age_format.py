"""
Test Task 1.2.2: Verify /api/transcribe returns age in correct format
Tests the complete flow from audio URL to categorized data with age validation
"""
import pytest
import httpx
import json
from unittest.mock import patch, Mock, AsyncMock
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = "http://localhost:8001"
TEST_TOKEN = "test-token-123"


class TestTranscribeAgeFormat:
    """Test that /api/transcribe returns age in correct [min, max] format"""
    
    @pytest.fixture
    def auth_headers(self):
        """Auth headers for API requests"""
        return {"Authorization": f"Bearer {TEST_TOKEN}"}
    
    @pytest.fixture
    def test_cases(self):
        """Test cases with different age scenarios"""
        return [
            {
                "name": "specific_age",
                "transcription": "Met John who is 45 years old near the shelter",
                "expected_age": [43, 47],  # ±2 years
                "description": "Specific age should return ±2 years range"
            },
            {
                "name": "descriptive_age",
                "transcription": "Saw an elderly man by the library",
                "expected_age": [65, 85],
                "description": "Descriptive age 'elderly' should map to standard range"
            },
            {
                "name": "age_range",
                "transcription": "Woman in her thirties needs assistance",
                "expected_age": [30, 39],
                "description": "Age range description should map correctly"
            },
            {
                "name": "no_age",
                "transcription": "Person named Bob needs help with food",
                "expected_age": [-1, -1],
                "description": "No age info should return [-1, -1]"
            },
            {
                "name": "teenage",
                "transcription": "Teenage girl named Sarah at the park",
                "expected_age": [13, 19],
                "description": "Teenage should map to [13, 19]"
            },
            {
                "name": "middle_aged",
                "transcription": "Middle-aged woman called Mary",
                "expected_age": [40, 60],
                "description": "Middle-aged should map to [40, 60]"
            }
        ]
    
    @pytest.mark.asyncio
    async def test_transcribe_returns_age_format(self, auth_headers, test_cases):
        """Test 1: Verify /api/transcribe always returns age as [min, max] array"""
        
        # Mock the OpenAI services
        with patch('services.openai_service.AsyncOpenAI') as mock_openai_class:
            mock_client = Mock()
            mock_openai_class.return_value = mock_client
            
            # Import after patching to use mocked client
            from services.openai_service import OpenAIService
            
            for test_case in test_cases:
                print(f"\n--- Testing: {test_case['description']} ---")
                
                # Mock transcription response
                mock_transcription = AsyncMock(return_value=test_case['transcription'])
                mock_client.audio.transcriptions.create = mock_transcription
                
                # Mock categorization response with age
                mock_categorization_response = Mock()
                mock_categorization_response.choices = [Mock(message=Mock(
                    content=json.dumps({
                        "name": "Test Person",
                        "height": 70,
                        "weight": 150,
                        "skin_color": "Medium",
                        "approximate_age": test_case['expected_age']
                    })
                ))]
                mock_client.chat.completions.create = AsyncMock(
                    return_value=mock_categorization_response
                )
                
                # Make API request
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{BASE_URL}/api/transcribe",
                        json={"audio_url": "https://example.com/test.m4a"},
                        headers=auth_headers
                    )
                
                # Verify response format
                assert response.status_code == 200, f"Expected 200, got {response.status_code}"
                data = response.json()
                
                # Check categorized_data structure
                assert "categorized_data" in data, "Response should include categorized_data"
                categorized = data["categorized_data"]
                
                # Verify age format
                assert "approximate_age" in categorized, "Should include approximate_age field"
                age = categorized["approximate_age"]
                
                # Critical format checks
                assert isinstance(age, list), f"Age must be a list, got {type(age)}"
                assert len(age) == 2, f"Age must have exactly 2 values, got {len(age)}"
                assert all(isinstance(x, int) for x in age), f"Age values must be integers"
                
                # Verify expected values
                assert age == test_case['expected_age'], \
                    f"Expected {test_case['expected_age']}, got {age} for: {test_case['name']}"
                
                print(f"✅ {test_case['name']}: {age} - PASSED")
    
    @pytest.mark.asyncio
    async def test_age_validation_in_response(self, auth_headers):
        """Test 2: Verify age validation is included in response"""
        
        with patch('services.openai_service.AsyncOpenAI') as mock_openai_class:
            mock_client = Mock()
            mock_openai_class.return_value = mock_client
            
            # Mock with valid age
            mock_client.audio.transcriptions.create = AsyncMock(
                return_value="Person is 45 years old"
            )
            
            mock_response = Mock()
            mock_response.choices = [Mock(message=Mock(
                content=json.dumps({
                    "name": "Test",
                    "height": 70,
                    "weight": 150,
                    "skin_color": "Medium",
                    "approximate_age": [43, 47]
                })
            ))]
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{BASE_URL}/api/transcribe",
                    json={"audio_url": "https://example.com/test.m4a"},
                    headers=auth_headers
                )
            
            assert response.status_code == 200
            data = response.json()
            
            # Check validation result
            assert "validation" in data, "Response should include validation"
            validation = data["validation"]
            
            assert validation["is_valid"] == True, "Valid age should pass validation"
            assert "approximate_age" not in validation.get("missing_required", []), \
                "Age should not be in missing required fields"
    
    @pytest.mark.asyncio
    async def test_edge_cases_age_format(self, auth_headers):
        """Test 3: Edge cases for age format handling"""
        
        edge_cases = [
            {
                "description": "Very young age",
                "transcription": "Baby is 6 months old",
                "expected_age": [0, 2],  # Should handle infants
            },
            {
                "description": "Exact boundary age",
                "transcription": "Person just turned 120 years old",
                "expected_age": [118, 120],  # Max age boundary
            },
            {
                "description": "Multiple ages mentioned",
                "transcription": "John is 45 and his daughter is 20",
                "expected_age": [43, 47],  # Should extract first/primary person's age
            },
            {
                "description": "Uncertain age",
                "transcription": "Maybe around 50 or 60 years old",
                "expected_age": [48, 62],  # Should handle uncertainty
            }
        ]
        
        with patch('services.openai_service.AsyncOpenAI') as mock_openai_class:
            mock_client = Mock()
            mock_openai_class.return_value = mock_client
            
            for edge_case in edge_cases:
                print(f"\n--- Edge case: {edge_case['description']} ---")
                
                # Mock responses
                mock_client.audio.transcriptions.create = AsyncMock(
                    return_value=edge_case['transcription']
                )
                
                mock_response = Mock()
                mock_response.choices = [Mock(message=Mock(
                    content=json.dumps({
                        "name": "Test",
                        "approximate_age": edge_case['expected_age']
                    })
                ))]
                mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{BASE_URL}/api/transcribe",
                        json={"audio_url": "https://example.com/test.m4a"},
                        headers=auth_headers
                    )
                
                assert response.status_code == 200
                age = response.json()["categorized_data"]["approximate_age"]
                
                # Verify format
                assert isinstance(age, list) and len(age) == 2, \
                    f"Invalid age format for edge case: {edge_case['description']}"
                
                print(f"✅ {edge_case['description']}: {age} - PASSED")
    
    @pytest.mark.asyncio
    async def test_gpt_returns_wrong_format(self, auth_headers):
        """Test 4: Verify system handles if GPT returns wrong age format"""
        
        wrong_formats = [
            {"wrong": 45, "description": "Single number instead of array"},
            {"wrong": "45", "description": "String instead of array"},
            {"wrong": [45], "description": "Single-element array"},
            {"wrong": [45, 50, 55], "description": "Too many elements"},
            {"wrong": None, "description": "Null value"},
            {"wrong": {}, "description": "Object instead of array"}
        ]
        
        with patch('services.openai_service.AsyncOpenAI') as mock_openai_class:
            mock_client = Mock()
            mock_openai_class.return_value = mock_client
            
            for wrong_format in wrong_formats:
                print(f"\n--- Testing wrong format: {wrong_format['description']} ---")
                
                # Mock responses
                mock_client.audio.transcriptions.create = AsyncMock(
                    return_value="Person is 45 years old"
                )
                
                mock_response = Mock()
                mock_response.choices = [Mock(message=Mock(
                    content=json.dumps({
                        "name": "Test",
                        "approximate_age": wrong_format['wrong']
                    })
                ))]
                mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
                
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{BASE_URL}/api/transcribe",
                        json={"audio_url": "https://example.com/test.m4a"},
                        headers=auth_headers
                    )
                
                assert response.status_code == 200
                age = response.json()["categorized_data"]["approximate_age"]
                
                # System should convert wrong format to valid format
                assert isinstance(age, list), \
                    f"Should convert {wrong_format['description']} to list"
                assert len(age) == 2, \
                    f"Should have exactly 2 elements for {wrong_format['description']}"
                
                # Should either convert sensibly or default to unknown
                if isinstance(wrong_format['wrong'], (int, float)):
                    # Single number should be converted to range
                    expected_min = max(0, int(wrong_format['wrong']) - 2)
                    expected_max = min(120, int(wrong_format['wrong']) + 2)
                    assert age == [expected_min, expected_max], \
                        f"Single number should convert to ±2 range"
                else:
                    # Invalid formats should default to unknown
                    assert age == [-1, -1], \
                        f"Invalid format should default to [-1, -1]"
                
                print(f"✅ Handled {wrong_format['description']}: {age}")


def run_transcribe_age_tests():
    """Run all transcribe age format tests"""
    pytest.main([__file__, "-v", "-s"])


if __name__ == "__main__":
    print("=" * 60)
    print("Transcribe Age Format Test Suite (Task 1.2.2)")
    print("=" * 60)
    print("\nTesting that /api/transcribe returns age in correct format...")
    print("Requirements:")
    print("- Always returns [min, max] array")
    print("- Handles all age descriptions correctly")
    print("- Validates age format in response")
    print("- Handles edge cases and wrong formats")
    print("\n" + "=" * 60)
    
    run_transcribe_age_tests()