"""
Danger score calculation service
"""
from typing import Dict, List, Any


def calculate_danger_score(individual_data: dict, categories: list) -> int:
    """
    Calculate danger score based on weighted category values
    
    Args:
        individual_data: Dictionary of field values for the individual
        categories: List of category definitions with danger weights
        
    Returns:
        Integer danger score 0-100
        
    Formula:
        - Auto-trigger: If value exists AND auto_trigger=true → return 100
        - Numbers: (value / 300) * weight
        - Single-select: option_value * weight  
        - Final: (sum of weighted values / sum of weights) * 100
    """
    # Check for auto-trigger first
    for category in categories:
        if category.get('auto_trigger') and category['type'] in ['number', 'single_select']:
            value = individual_data.get(category['name'])
            # Auto-trigger if value exists and is not zero/empty
            if value is not None and value != 0 and value != "":
                return 100
    
    total_weight = 0
    weighted_sum = 0
    
    for category in categories:
        # Skip if no danger weight or not applicable type
        if category.get('danger_weight', 0) == 0:
            continue
        if category['type'] not in ['number', 'single_select']:
            continue
            
        value = individual_data.get(category['name'])
        if value is None:
            continue
            
        weight = category['danger_weight']
        total_weight += weight
        
        if category['type'] == 'number':
            # Normalize numeric values (max 300 for all fields)
            normalized = min(float(value) / 300, 1.0)
            weighted_sum += normalized * weight
        elif category['type'] == 'single_select':
            # Find the danger value for selected option
            if category.get('options'):
                for option in category['options']:
                    if option.get('label') == value:
                        # option['value'] is the danger value (0-1)
                        weighted_sum += float(option.get('value', 0)) * weight
                        break
    
    if total_weight == 0:
        return 0
        
    return int((weighted_sum / total_weight) * 100)


def get_display_danger_score(individual: dict) -> int:
    """
    Get danger score to display (override or calculated)
    
    Args:
        individual: Individual record with danger_score and danger_override fields
        
    Returns:
        Integer danger score to display
    """
    if individual.get('danger_override') is not None:
        return individual['danger_override']
    return individual.get('danger_score', 0)