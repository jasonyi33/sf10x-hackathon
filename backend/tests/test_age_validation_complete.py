"""
Comprehensive test to verify Task 1.3 is complete
Tests all requirements from TaskList and PRD
"""
import pytest
from services.validation_helper import validate_age_range, validate_categorized_data
from db.models import SaveIndividualRequest
from pydantic import ValidationError


def test_task_1_3_requirements():
    """Test all Task 1.3 requirements are met"""
    
    print("\n" + "="*60)
    print("Task 1.3 Verification: Update validation to require age")
    print("="*60)
    
    # 1. Test validate_age_range function exists and matches spec
    print("\n1. Testing validate_age_range function...")
    
    # Test exact spec from task list
    assert validate_age_range([-1, -1]) == True, "Unknown age [-1, -1] should be valid"
    assert validate_age_range([45, 50]) == True, "Valid range [45, 50] should pass"
    assert validate_age_range([0, 1]) == True, "Baby age [0, 1] should pass"
    assert validate_age_range([119, 120]) == True, "Max age [119, 120] should pass"
    
    # Invalid cases
    assert validate_age_range([50, 45]) == False, "Min > Max should fail"
    assert validate_age_range([-5, 10]) == False, "Negative age should fail"
    assert validate_age_range([100, 130]) == False, "Over 120 should fail"
    assert validate_age_range(45) == False, "Single number should fail"
    assert validate_age_range("45-50") == False, "String should fail"
    
    print("✅ validate_age_range function works correctly")
    
    # 2. Test age is required in SaveIndividualRequest model
    print("\n2. Testing age requirement in API model...")
    
    # Valid request with age
    try:
        valid_request = SaveIndividualRequest(
            data={
                "name": "Test Person",
                "height": 70,
                "weight": 160,
                "skin_color": "Medium",
                "approximate_age": [45, 50]
            }
        )
        print("✅ Valid request with age accepted")
    except ValidationError as e:
        pytest.fail(f"Valid request should not fail: {e}")
    
    # Invalid request without age
    try:
        invalid_request = SaveIndividualRequest(
            data={
                "name": "Test Person",
                "height": 70,
                "weight": 160,
                "skin_color": "Medium"
                # Missing approximate_age
            }
        )
        pytest.fail("Request without age should fail validation")
    except ValidationError as e:
        assert "approximate_age" in str(e), "Error should mention approximate_age"
        print("✅ Request without age correctly rejected")
    
    # 3. Test validation helper handles range type
    print("\n3. Testing validation helper with range type...")
    
    categories = [
        {"name": "name", "type": "text", "is_required": True},
        {"name": "height", "type": "number", "is_required": True},
        {"name": "weight", "type": "number", "is_required": True},
        {"name": "skin_color", "type": "single_select", "is_required": True,
         "options": [{"label": "Light", "value": 0}, {"label": "Medium", "value": 0}, {"label": "Dark", "value": 0}]},
        {"name": "approximate_age", "type": "range", "is_required": True}
    ]
    
    # Valid data
    valid_data = {
        "name": "John Doe",
        "height": 72,
        "weight": 180,
        "skin_color": "Medium",
        "approximate_age": [45, 50]
    }
    
    result = validate_categorized_data(valid_data, categories)
    assert result.is_valid == True, "Valid data should pass"
    print("✅ Valid age range passes validation")
    
    # Unknown age
    unknown_age_data = valid_data.copy()
    unknown_age_data["approximate_age"] = [-1, -1]
    
    result = validate_categorized_data(unknown_age_data, categories)
    assert result.is_valid == True, "Unknown age [-1, -1] should pass"
    print("✅ Unknown age [-1, -1] passes validation")
    
    # Invalid age formats
    invalid_tests = [
        (45, "Age must be an array"),
        ([50, 45], "min.*must be less than max"),
        ([45], "must have exactly 2 values"),
        ([-5, 10], "minimum age cannot be negative"),
        ([100, 130], "maximum age cannot exceed 120")
    ]
    
    for invalid_age, expected_error in invalid_tests:
        invalid_data = valid_data.copy()
        invalid_data["approximate_age"] = invalid_age
        
        result = validate_categorized_data(invalid_data, categories)
        assert result.is_valid == False, f"Age {invalid_age} should fail"
        assert len(result.validation_errors) > 0, "Should have validation errors"
        
        # Check error message
        age_error = next((e for e in result.validation_errors if e['field'] == 'approximate_age'), None)
        assert age_error is not None, "Should have age error"
        
        # Check that expected error pattern is in message
        import re
        assert re.search(expected_error, age_error['message'], re.IGNORECASE), \
            f"Expected '{expected_error}' in '{age_error['message']}'"
    
    print("✅ All invalid age formats correctly rejected with proper errors")
    
    # 4. Test missing age is caught
    print("\n4. Testing missing age detection...")
    
    missing_age_data = {
        "name": "No Age",
        "height": 70,
        "weight": 150,
        "skin_color": "Dark"
        # Missing approximate_age
    }
    
    result = validate_categorized_data(missing_age_data, categories)
    assert result.is_valid == False, "Missing age should fail"
    assert "approximate_age" in result.missing_required, "Age should be in missing required"
    print("✅ Missing age correctly detected")
    
    # Summary
    print("\n" + "="*60)
    print("✅ TASK 1.3 VERIFICATION COMPLETE")
    print("="*60)
    print("\nAll requirements met:")
    print("1. ✅ validate_age_range function implemented per spec")
    print("2. ✅ Age added to required fields in API model") 
    print("3. ✅ Validation helper handles 'range' type correctly")
    print("4. ✅ Proper error messages for all invalid cases")
    print("5. ✅ Special case [-1, -1] for Unknown handled")
    print("6. ✅ Age validation integrated into data flow")


if __name__ == "__main__":
    test_task_1_3_requirements()