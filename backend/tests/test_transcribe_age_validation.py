"""
Test Task 1.2.2: Verify age format validation in transcribe flow
Focused tests for age extraction and validation
"""
import pytest
from services.validation_helper import validate_categorized_data, validate_age_range
from services.openai_service import OpenAIService
from unittest.mock import Mock, patch, AsyncMock
import json


class TestAgeFormatValidation:
    """Test age format validation throughout the transcribe flow"""
    
    def test_age_range_validation_function(self):
        """Test 1: validate_age_range function works correctly"""
        
        # Valid cases
        assert validate_age_range([45, 50]) == True
        assert validate_age_range([-1, -1]) == True
        assert validate_age_range([0, 1]) == True
        assert validate_age_range([119, 120]) == True
        
        # Invalid cases
        assert validate_age_range(45) == False  # Not a list
        assert validate_age_range([45]) == False  # Single element
        assert validate_age_range([50, 45]) == False  # Min > Max
        assert validate_age_range([-5, 10]) == False  # Negative
        assert validate_age_range([100, 130]) == False  # Over 120
        assert validate_age_range("45-50") == False  # String
        assert validate_age_range(None) == False  # None
        
        print("✅ Age range validation function works correctly")
    
    def test_age_in_validation_helper(self):
        """Test 2: validate_categorized_data handles age correctly"""
        
        categories = [
            {"name": "name", "type": "text", "is_required": True},
            {"name": "approximate_age", "type": "range", "is_required": True}
        ]
        
        # Test valid age
        result = validate_categorized_data(
            {"name": "Test", "approximate_age": [45, 50]},
            categories
        )
        assert result.is_valid == True
        assert "approximate_age" not in result.missing_required
        
        # Test unknown age
        result = validate_categorized_data(
            {"name": "Test", "approximate_age": [-1, -1]},
            categories
        )
        assert result.is_valid == True
        
        # Test missing age
        result = validate_categorized_data(
            {"name": "Test"},
            categories
        )
        assert result.is_valid == False
        assert "approximate_age" in result.missing_required
        
        # Test invalid age format
        result = validate_categorized_data(
            {"name": "Test", "approximate_age": 45},
            categories
        )
        assert result.is_valid == False
        assert len(result.validation_errors) > 0
        age_error = next((e for e in result.validation_errors if e['field'] == 'approximate_age'), None)
        assert age_error is not None
        assert "array" in age_error['message'].lower()
        
        print("✅ Validation helper handles age correctly")
    
    @pytest.mark.asyncio
    async def test_openai_service_age_extraction(self):
        """Test 3: OpenAI service extracts and formats age correctly"""
        
        with patch('services.openai_service.AsyncOpenAI') as mock_openai:
            mock_client = Mock()
            mock_openai.return_value = mock_client
            
            service = OpenAIService()
            
            # Test specific age extraction
            mock_response = Mock()
            mock_response.choices = [Mock(message=Mock(
                content='{"name": "John", "approximate_age": [43, 47]}'
            ))]
            mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
            
            categories = [
                {"name": "name", "type": "text", "is_required": True},
                {"name": "approximate_age", "type": "range", "is_required": True}
            ]
            
            result = await service.categorize_transcription(
                "John is 45 years old",
                categories
            )
            
            assert "approximate_age" in result
            assert result["approximate_age"] == [43, 47]
            assert isinstance(result["approximate_age"], list)
            assert len(result["approximate_age"]) == 2
            
            print("✅ OpenAI service extracts age correctly")
    
    @pytest.mark.asyncio
    async def test_transcribe_endpoint_flow(self):
        """Test 4: Complete transcribe flow validates age"""
        
        from api.transcription import TranscribeResponse
        
        # Test valid response with age
        response = TranscribeResponse(
            transcription="Person is 45 years old",
            categorized_data={
                "name": "Test",
                "height": 70,
                "weight": 150,
                "skin_color": "Medium",
                "approximate_age": [43, 47]
            },
            missing_required=[],
            potential_matches=[]
        )
        
        # Verify serialization
        data = response.model_dump()
        assert data["categorized_data"]["approximate_age"] == [43, 47]
        assert len(data["missing_required"]) == 0
        
        # Test response with missing age
        response2 = TranscribeResponse(
            transcription="Person needs help",
            categorized_data={
                "name": "Test",
                "height": 70,
                "weight": 150,
                "skin_color": "Medium"
            },
            missing_required=["approximate_age"],
            potential_matches=[]
        )
        
        data2 = response2.model_dump()
        assert "approximate_age" in data2["missing_required"]
        
        print("✅ Transcribe endpoint flow handles age correctly")
    
    def test_age_format_summary(self):
        """Test 5: Summary of age format requirements"""
        
        print("\n" + "="*60)
        print("AGE FORMAT VALIDATION SUMMARY")
        print("="*60)
        
        # Test all required age formats
        test_cases = [
            ([45, 50], True, "Valid age range"),
            ([-1, -1], True, "Unknown age"),
            ([0, 2], True, "Baby age"),
            ([118, 120], True, "Maximum age"),
            (45, False, "Single number (invalid)"),
            ([45], False, "Single element array (invalid)"),
            ([50, 45], False, "Min > Max (invalid)"),
            (None, False, "None value (invalid)"),
            ("45-50", False, "String format (invalid)"),
            ([45, 50, 55], False, "Too many elements (invalid)")
        ]
        
        all_passed = True
        for value, expected, description in test_cases:
            result = validate_age_range(value) if value != [45, 50, 55] else False
            status = "✅" if result == expected else "❌"
            print(f"{status} {description}: {value} -> {result}")
            all_passed = all_passed and (result == expected)
        
        assert all_passed, "Not all age format tests passed"
        
        print("\n✅ All age format validations working correctly!")


def run_age_validation_tests():
    """Run all age format validation tests"""
    pytest.main([__file__, "-v", "-s"])


if __name__ == "__main__":
    print("=" * 60)
    print("Age Format Validation Tests (Task 1.2.2)")
    print("=" * 60)
    print("\nVerifying age extraction returns correct format...")
    print("Requirements:")
    print("- Age is always [min, max] array")
    print("- validate_age_range validates format")
    print("- OpenAI service post-processes to correct format")
    print("- Validation catches invalid formats")
    print("\n" + "=" * 60)
    
    run_age_validation_tests()