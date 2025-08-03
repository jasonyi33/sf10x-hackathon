"""
Test cases for Task 1.3: Update validation to require age field
These tests verify that the age field validation works correctly.
"""
import pytest
from services.validation_helper import validate_categorized_data, ValidationResult

# Define test categories including the new approximate_age field
TEST_CATEGORIES = [
    {"name": "name", "type": "text", "is_required": True},
    {"name": "height", "type": "number", "is_required": True},
    {"name": "weight", "type": "number", "is_required": True},
    {"name": "skin_color", "type": "single_select", "is_required": True,
     "options": [{"label": "Light", "value": 0}, {"label": "Medium", "value": 0}, {"label": "Dark", "value": 0}]},
    {"name": "approximate_age", "type": "range", "is_required": True, "is_preset": True}
]


class TestAgeValidation:
    """Test age field validation requirements"""
    
    def test_validate_age_range_function_exists(self):
        """Test 1: Verify validate_age_range function exists"""
        try:
            from services.validation_helper import validate_age_range
            assert callable(validate_age_range), "validate_age_range should be a callable function"
        except ImportError:
            pytest.fail("validate_age_range function not found in validation_helper")
    
    def test_valid_age_ranges(self):
        """Test 2: Valid age ranges should pass validation"""
        from services.validation_helper import validate_age_range
        
        # Test valid cases
        valid_cases = [
            ([45, 50], True, "Normal age range"),
            ([0, 1], True, "Baby age"),
            ([119, 120], True, "Max age range"),
            ([-1, -1], True, "Unknown age special case"),
            ([18, 65], True, "Wide age range")
        ]
        
        for age_value, expected, description in valid_cases:
            result = validate_age_range(age_value)
            assert result == expected, f"{description}: {age_value} should return {expected}"
    
    def test_invalid_age_ranges(self):
        """Test 3: Invalid age ranges should fail validation"""
        from services.validation_helper import validate_age_range
        
        # Test invalid cases
        invalid_cases = [
            ([50, 45], False, "Min > Max"),
            ([45, 45], False, "Min = Max"),
            ([-5, 10], False, "Negative age"),
            ([100, 130], False, "Over 120"),
            ([45], False, "Single value array"),
            ([45, 50, 55], False, "Too many values"),
            (45, False, "Not an array"),
            ("45-50", False, "String format"),
            ({"min": 45, "max": 50}, False, "Object format"),
            (None, False, "None value"),
            ([], False, "Empty array")
        ]
        
        for age_value, expected, description in invalid_cases:
            result = validate_age_range(age_value)
            assert result == expected, f"{description}: {age_value} should return {expected}"
    
    def test_age_required_in_validation(self):
        """Test 4: Age should be required in overall validation"""
        # Test data missing age field
        data_without_age = {
            "name": "John Doe",
            "height": 72,
            "weight": 180,
            "skin_color": "Medium"
        }
        
        result = validate_categorized_data(data_without_age, TEST_CATEGORIES)
        
        assert not result.is_valid, "Validation should fail without age"
        assert "approximate_age" in result.missing_required, "Age should be in missing required fields"
    
    def test_age_validation_integration(self):
        """Test 5: Age validation should work with complete data"""
        # Test with valid age
        data_with_valid_age = {
            "name": "John Doe",
            "height": 72,
            "weight": 180,
            "skin_color": "Medium",
            "approximate_age": [45, 50]
        }
        
        result = validate_categorized_data(data_with_valid_age, TEST_CATEGORIES)
        
        assert result.is_valid, f"Should be valid with correct age. Errors: {result.validation_errors}"
        assert len(result.missing_required) == 0, "No fields should be missing"
        assert len(result.validation_errors) == 0, "No validation errors expected"
        
        # Test with unknown age
        data_with_unknown_age = {
            "name": "Jane Doe",
            "height": 65,
            "weight": 140,
            "skin_color": "Light",
            "approximate_age": [-1, -1]
        }
        
        result = validate_categorized_data(data_with_unknown_age, TEST_CATEGORIES)
        
        assert result.is_valid, "Should be valid with unknown age [-1, -1]"
        assert len(result.missing_required) == 0, "No fields should be missing"
    
    def test_age_validation_errors(self):
        """Test 6: Invalid age format should produce validation errors"""
        # Test with invalid age format
        data_with_invalid_age = {
            "name": "Invalid Age Person",
            "height": 70,
            "weight": 160,
            "skin_color": "Dark",
            "approximate_age": [50, 45]  # Min > Max
        }
        
        result = validate_categorized_data(data_with_invalid_age, TEST_CATEGORIES)
        
        assert not result.is_valid, "Should be invalid with wrong age range"
        assert any(error['field'] == 'approximate_age' for error in result.validation_errors), \
            "Should have validation error for age field"
        
        # Test with single number instead of array
        data_with_single_age = {
            "name": "Single Age Person",
            "height": 68,
            "weight": 150,
            "skin_color": "Medium",
            "approximate_age": 45  # Should be array
        }
        
        result = validate_categorized_data(data_with_single_age, TEST_CATEGORIES)
        
        assert not result.is_valid, "Should be invalid with single number age"
    
    def test_range_type_validation(self):
        """Test 7: Range type should be properly handled in validation"""
        # The validation helper should recognize 'range' type fields
        range_category = {"name": "test_range", "type": "range", "is_required": False}
        
        # Valid range
        data_valid = {"test_range": [10, 20]}
        result = validate_categorized_data(data_valid, [range_category])
        assert result.is_valid, "Valid range should pass"
        
        # Invalid range (not array)
        data_invalid = {"test_range": "10-20"}
        result = validate_categorized_data(data_invalid, [range_category])
        assert not result.is_valid, "String range should fail"


def run_age_validation_tests():
    """Run all age validation tests"""
    pytest.main([__file__, "-v", "-s"])


if __name__ == "__main__":
    print("=" * 60)
    print("Age Validation Test Suite")
    print("=" * 60)
    print("\nRequirements:")
    print("- validate_age_range function exists")
    print("- Age must be array format [min, max]")
    print("- Special case [-1, -1] for Unknown")
    print("- Age is a required field")
    print("- Range validation: 0 <= min < max <= 120")
    print("\n" + "=" * 60)
    
    run_age_validation_tests()