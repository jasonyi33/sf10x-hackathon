"""
Validation helper for categorized data
"""
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of validation with errors and missing fields"""
    is_valid: bool
    missing_required: List[str]
    validation_errors: List[Dict[str, str]]  # [{"field": "height", "message": "Value 400 exceeds maximum of 300"}]


def validate_age_range(age_value: Any) -> bool:
    """
    Validate age range format and values
    
    Age is always array: [-1,-1] for Unknown or [min,max]
    
    Args:
        age_value: Value to validate as age range
        
    Returns:
        bool: True if valid age range, False otherwise
    """
    # Must be a list
    if not isinstance(age_value, list):
        return False
    
    # Must have exactly 2 values
    if len(age_value) != 2:
        return False
    
    # Special case: [-1, -1] represents "Unknown"
    if age_value == [-1, -1]:
        return True
    
    # Extract min and max
    try:
        min_age, max_age = age_value
        
        # Must be integers or floats that can be converted to int
        min_age = int(min_age)
        max_age = int(max_age)
        
        # Validate range: 0 <= min < max <= 120
        return 0 <= min_age < max_age <= 120
        
    except (ValueError, TypeError):
        return False


def validate_categorized_data(data: dict, categories: list) -> ValidationResult:
    """
    Validate categorized data against field requirements and constraints
    
    Args:
        data: Dictionary of categorized data to validate
        categories: List of category definitions with types and constraints
        
    Returns:
        ValidationResult with validation status, missing fields, and errors
    """
    missing_required = []
    validation_errors = []
    
    # Create category lookup by name for efficient access
    category_map = {cat['name']: cat for cat in categories}
    
    # Check all categories
    for category in categories:
        field_name = category['name']
        field_type = category['type']
        is_required = category.get('is_required', False)
        value = data.get(field_name)
        
        # Check required fields
        if is_required:
            if value is None or value == "":
                missing_required.append(field_name)
                continue
        
        # Skip validation if field is empty and not required
        if value is None or value == "":
            continue
            
        # Validate based on field type
        if field_type == 'number':
            # Validate number fields
            try:
                num_value = float(value)
                
                # Special validation for height and weight (0-300 range)
                if field_name in ['height', 'weight']:
                    if num_value < 0:
                        validation_errors.append({
                            "field": field_name,
                            "message": f"Value {num_value} is negative"
                        })
                    elif num_value > 300:
                        validation_errors.append({
                            "field": field_name,
                            "message": f"Value {num_value} exceeds maximum of 300"
                        })
                        
            except (ValueError, TypeError):
                validation_errors.append({
                    "field": field_name,
                    "message": f"Invalid number format: {value}"
                })
                
        elif field_type == 'single_select':
            # Validate single-select options
            if category.get('options'):
                valid_labels = [opt['label'] for opt in category['options']]
                if value not in valid_labels:
                    validation_errors.append({
                        "field": field_name,
                        "message": f"Invalid option '{value}'. Must be one of: {', '.join(valid_labels)}"
                    })
                    
        elif field_type == 'multi_select':
            # Validate multi-select options
            if category.get('options') and isinstance(value, list):
                valid_options = category['options']
                for selected in value:
                    if selected not in valid_options:
                        validation_errors.append({
                            "field": field_name,
                            "message": f"Invalid option '{selected}' in selection"
                        })
                        break
                        
        elif field_type == 'range':
            # Validate range fields (like approximate_age)
            if field_name == 'approximate_age':
                # Use the specific age validation
                if not validate_age_range(value):
                    # Provide specific error message based on the issue
                    if not isinstance(value, list):
                        message = "Age must be an array [min, max]"
                    elif len(value) != 2:
                        message = "Age must have exactly 2 values [min, max]"
                    elif value != [-1, -1]:
                        try:
                            min_age, max_age = value
                            if min_age >= max_age:
                                message = f"Invalid age range: min ({min_age}) must be less than max ({max_age})"
                            elif min_age < 0:
                                message = f"Invalid age range: minimum age cannot be negative"
                            elif max_age > 120:
                                message = f"Invalid age range: maximum age cannot exceed 120"
                            else:
                                message = "Invalid age range format"
                        except:
                            message = "Invalid age range values"
                    else:
                        message = "Invalid age range"
                    
                    validation_errors.append({
                        "field": field_name,
                        "message": message
                    })
            else:
                # Generic range validation for other range fields
                if not isinstance(value, list) or len(value) != 2:
                    validation_errors.append({
                        "field": field_name,
                        "message": "Range must be an array with 2 values"
                    })
                        
        # Text, date, location types - no special validation needed
        # They pass as long as they have a value
    
    # Determine overall validity
    is_valid = len(missing_required) == 0 and len(validation_errors) == 0
    
    return ValidationResult(
        is_valid=is_valid,
        missing_required=missing_required,
        validation_errors=validation_errors
    )