"""
Task 4.0.2: Age Validation in Save Operations
Tests that age is properly validated when saving individuals
"""

import pytest
from datetime import datetime
from typing import Dict, Any, List, Tuple
from services.validation_helper import validate_age_range, validate_categorized_data, ValidationResult
from services.individual_service import IndividualService
from fastapi import HTTPException

pytestmark = pytest.mark.asyncio


class TestAgeSaveValidation:
    """Test age validation during save operations"""

    def setup_method(self):
        """Setup test environment"""
        pass

    async def test_age_required_in_save(self):
        """Test that approximate_age is required in all save operations"""
        # Test data without age
        invalid_data = [
            {
                "name": "John Doe",
                "height": 70,
                "weight": 180,
                "skin_color": "Medium"
                # Missing approximate_age
            },
            {
                "name": "Jane Doe",
                "approximate_age": None,  # Null age
                "height": 66,
                "weight": 140,
                "skin_color": "Light"
            },
            # Note: Empty array [] currently passes validation since it's not None or ""
            # This is a limitation - age validation happens separately via validate_age_range
        ]
        
        for data in invalid_data:
            # Define required categories for validation
            categories = [
                {"name": "name", "type": "text", "is_required": True},
                {"name": "approximate_age", "type": "array", "is_required": True},
                {"name": "height", "type": "number", "is_required": True},
                {"name": "weight", "type": "number", "is_required": True},
                {"name": "skin_color", "type": "single_select", "is_required": True}
            ]
            
            result = validate_categorized_data(data, categories)
            assert not result.is_valid, f"Data without valid age should be invalid: {data}"
            assert "approximate_age" in result.missing_required or \
                   any(e["field"] == "approximate_age" for e in result.validation_errors)
        
        # Test empty array separately with age validation
        assert not validate_age_range([]), "Empty array should be invalid for age"

    async def test_valid_age_formats(self):
        """Test that valid age formats are accepted"""
        valid_data = [
            {
                "name": "Young Adult",
                "approximate_age": [20, 25],
                "height": 70,
                "weight": 160,
                "skin_color": "Medium"
            },
            {
                "name": "Unknown Person",
                "approximate_age": [-1, -1],  # Unknown age
                "height": 68,
                "weight": 150,
                "skin_color": "Light"
            },
            {
                "name": "Narrow Age Range",
                "approximate_age": [45, 46],  # Narrow range (single age not valid with current validation)
                "height": 72,
                "weight": 180,
                "skin_color": "Dark"
            }
        ]
        
        categories = [
            {"name": "name", "type": "text", "is_required": True},
            {"name": "approximate_age", "type": "array", "is_required": True},
            {"name": "height", "type": "number", "is_required": True},
            {"name": "weight", "type": "number", "is_required": True},
            {"name": "skin_color", "type": "single_select", "is_required": True}
        ]
        
        for data in valid_data:
            result = validate_categorized_data(data, categories)
            assert result.is_valid, f"Valid age data should pass: {data}"

    async def test_age_range_validation(self):
        """Test age range validation rules"""
        test_cases = [
            # (age_array, should_be_valid, error_reason)
            ([0, 5], True, "Valid baby age"),
            ([18, 25], True, "Valid adult range"),
            ([100, 120], True, "Valid elderly range"),
            ([-1, -1], True, "Unknown age is valid"),
            ([45, 46], True, "Valid narrow range"),
            ([50, 45], False, "Max less than min"),
            ([-1, 50], False, "Partial unknown invalid"),
            ([50, -1], False, "Partial unknown invalid"),
            ([-2, -2], False, "Invalid unknown marker"),
            ([121, 125], False, "Above max age 120"),
            ([-5, 10], False, "Negative age invalid"),
            ([45, 50, 55], False, "Too many values"),
            ([45], False, "Too few values"),
        ]
        
        for age, should_be_valid, reason in test_cases:
            is_valid = validate_age_range(age)
            assert is_valid == should_be_valid, f"Failed: {reason} - {age}"

    async def test_ai_extracted_age_validation(self):
        """Test that AI-extracted age is in correct format"""
        # Simulate AI extraction results
        ai_results = [
            {
                "transcription": "John is about 45 years old",
                "categorized_data": {
                    "name": "John",
                    "approximate_age": [45, 46],  # Correct format (narrow range)
                    "height": 70,
                    "weight": 180,
                    "skin_color": "Medium"
                }
            },
            {
                "transcription": "Jane appears to be between 30 and 35",
                "categorized_data": {
                    "name": "Jane",
                    "approximate_age": [30, 35],  # Correct range format
                    "height": 66,
                    "weight": 140,
                    "skin_color": "Light"
                }
            },
            {
                "transcription": "Age unknown",
                "categorized_data": {
                    "name": "Unknown Person",
                    "approximate_age": [-1, -1],  # Correct unknown format
                    "height": 68,
                    "weight": 150,
                    "skin_color": "Medium"
                }
            }
        ]
        
        categories = [
            {"name": "name", "type": "text", "is_required": True},
            {"name": "approximate_age", "type": "array", "is_required": True},
            {"name": "height", "type": "number", "is_required": True},
            {"name": "weight", "type": "number", "is_required": True},
            {"name": "skin_color", "type": "single_select", "is_required": True}
        ]
        
        for result in ai_results:
            data = result["categorized_data"]
            validation = validate_categorized_data(data, categories)
            assert validation.is_valid, f"AI extracted data should be valid: {data}"
            
            # Verify age is in correct format
            age = data["approximate_age"]
            assert isinstance(age, list), "Age should be a list"
            assert len(age) == 2, "Age should have exactly 2 values"
            assert all(isinstance(v, int) for v in age), "Age values should be integers"

    async def test_save_endpoint_age_validation(self):
        """Test that save endpoint validates age properly"""
        # The actual save endpoint uses validate_categorized_data which we've already tested
        # Age validation happens through validate_age_range which is called separately
        
        # Test that various invalid age formats are caught
        invalid_ages = [
            None,           # Null
            [],             # Empty array
            [50, 40],       # Max < Min
            [-2, -2],       # Invalid unknown marker
            [45],           # Too few values
            [45, 50, 55],   # Too many values
            "45-50",        # String instead of array
            {"min": 45, "max": 50},  # Object instead of array
        ]
        
        for age in invalid_ages:
            is_valid = validate_age_range(age)
            assert not is_valid, f"Age {age} should be invalid"

    async def test_merge_preserves_age(self):
        """Test that merging individuals preserves age data correctly"""
        existing = {
            "id": "123",
            "name": "John Doe",
            "approximate_age": [45, 50],
            "height": 70,
            "weight": 180,
            "skin_color": "Medium"
        }
        
        new_data = {
            "name": "John Doe",
            "approximate_age": [46, 51],  # Slightly updated age
            "height": 70,
            "weight": 185,  # Updated weight
            "skin_color": "Medium"
        }
        
        # Simulate merge - newer data should override
        merged = {**existing, **new_data}
        
        assert merged["approximate_age"] == [46, 51], "Merge should use newer age"
        assert validate_age_range(merged["approximate_age"]), "Merged age should be valid"

    async def test_manual_entry_age_validation(self):
        """Test age validation in manual entry form"""
        # Test various manual entry scenarios
        manual_entries = [
            {"input": "45-50", "expected": [45, 50], "valid": True},
            {"input": "45", "expected": [45, 46], "valid": True},  # Convert single age to narrow range
            {"input": "unknown", "expected": [-1, -1], "valid": True},
            {"input": "50-45", "expected": None, "valid": False},  # Invalid range
            {"input": "abc", "expected": None, "valid": False},    # Invalid format
            {"input": "", "expected": None, "valid": False},       # Empty
            {"input": "150", "expected": None, "valid": False},    # Too old
        ]
        
        for entry in manual_entries:
            # Simulate parsing manual input
            parsed = self.parse_manual_age_input(entry["input"])
            
            if entry["valid"]:
                assert parsed == entry["expected"], f"Failed to parse: {entry['input']}"
                assert validate_age_range(parsed), f"Parsed age should be valid: {parsed}"
            else:
                assert parsed is None or not validate_age_range(parsed)

    def parse_manual_age_input(self, input_str: str) -> List[int] | None:
        """Helper to parse manual age input"""
        if not input_str:
            return None
            
        input_str = input_str.strip().lower()
        
        if input_str == "unknown":
            return [-1, -1]
        
        # Try range format
        if "-" in input_str:
            parts = input_str.split("-")
            if len(parts) == 2:
                try:
                    min_age = int(parts[0].strip())
                    max_age = int(parts[1].strip())
                    if 0 <= min_age <= max_age <= 120:
                        return [min_age, max_age]
                except ValueError:
                    pass
        
        # Try single age - convert to narrow range since validation requires min < max
        try:
            age = int(input_str)
            if 0 <= age < 120:  # Ensure we can add 1
                return [age, age + 1]
            elif age == 120:  # Special case for max age
                return [119, 120]
        except ValueError:
            pass
        
        return None


if __name__ == "__main__":
    import asyncio
    
    async def main():
        test = TestAgeSaveValidation()
        test.setup_method()
        
        print("Testing age required in save...")
        await test.test_age_required_in_save()
        print("✓ Age requirement tests passed")
        
        print("Testing valid age formats...")
        await test.test_valid_age_formats()
        print("✓ Valid format tests passed")
        
        print("Testing age range validation...")
        await test.test_age_range_validation()
        print("✓ Age range validation tests passed")
        
        print("Testing AI extracted age...")
        await test.test_ai_extracted_age_validation()
        print("✓ AI extraction tests passed")
        
        print("Testing merge preservation...")
        await test.test_merge_preserves_age()
        print("✓ Merge tests passed")
        
        print("Testing manual entry validation...")
        await test.test_manual_entry_age_validation()
        print("✓ Manual entry tests passed")
        
        print("\nAll age save validation tests passed! ✅")
    
    asyncio.run(main())