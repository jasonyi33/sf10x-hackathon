"""
Urgency score calculation service
"""
from typing import Dict, List, Any


def calculate_urgency_score(individual_data: dict, categories: list) -> int:
    """
    Calculate urgency score based on weighted category values

    Args:
        individual_data: Dictionary of field values for the individual
        categories: List of category definitions with urgency weights

    Returns:
        Integer urgency score 0-100

    Formula:
        - Auto-trigger: If value exists AND auto_trigger=true → return 100
        - Numbers: (value / 300) * weight
        - Single-select: option_value * weight
        - Final: (sum of weighted values / sum of weights) * 100
    """
    print(f"🧮 URGENCY SCORE CALCULATION DEBUG:")
    print(f"  📊 Individual data keys: {list(individual_data.keys())}")
    print(f"  📋 Categories with weights: {[(cat['name'], cat.get('urgency_weight', 0), cat.get('auto_trigger', False)) for cat in categories if cat.get('urgency_weight', 0) > 0 or cat.get('auto_trigger')]}")
    print(f"  📦 Raw individual data: {individual_data}")
    # Check for auto-trigger first
    for category in categories:
        if category.get('auto_trigger') and category['type'] in ['number', 'single_select']:
            value = individual_data.get(category['name'])
            print(f"  🔥 Auto-trigger check for '{category['name']}': value={value}, type={category['type']}")
            # Auto-trigger if value exists and is not zero/empty
            if value is not None and value != 0 and value != "":
                print(f"  🚨 AUTO-TRIGGER ACTIVATED for '{category['name']}' = {value}! Returning 100")
                return 100
    
    total_weight = 0
    weighted_sum = 0
    
    for category in categories:
        # Skip if no urgency weight or not applicable type
        if category.get('urgency_weight', 0) == 0:
            continue
        if category['type'] not in ['number', 'single_select']:
            continue

        value = individual_data.get(category['name'])
        print(f"  📐 Processing '{category['name']}' (type={category['type']}, weight={category.get('urgency_weight', 0)}): value={value}")
        
        if value is None:
            print(f"    ❌ Skipping '{category['name']}' - no value")
            continue
            
        weight = category['urgency_weight']
        total_weight += weight
        
        if category['type'] == 'number':
            # Normalize numeric values (max 300 for all fields)
            normalized = min(float(value) / 300, 1.0)
            contribution = normalized * weight
            weighted_sum += contribution
            print(f"    📊 Number field: {value} → normalized={normalized:.3f} → contribution={contribution:.1f}")
        elif category['type'] == 'single_select':
            # Find the urgency value for selected option
            if category.get('options'):
                option_found = False
                for option in category['options']:
                    if option.get('label') == value:
                        option_value = float(option.get('value', 0))
                        contribution = option_value * weight
                        weighted_sum += contribution
                        print(f"    🎯 Select field: '{value}' → option_value={option_value} → contribution={contribution:.1f}")
                        option_found = True
                        break
                if not option_found:
                    print(f"    ⚠️ Select field: '{value}' not found in options {[opt.get('label') for opt in category.get('options', [])]}")
    
    print(f"  🔢 Final calculation: weighted_sum={weighted_sum:.1f}, total_weight={total_weight}")
    
    if total_weight == 0:
        print(f"  🆘 No weighted categories found - returning 0")
        return 0
        
    final_score = int((weighted_sum / total_weight) * 100)
    print(f"  🎯 FINAL URGENCY SCORE: {final_score}")
    return final_score


def get_display_urgency_score(individual: dict) -> int:
    """
    Get urgency score to display (override or calculated)

    Args:
        individual: Individual record with urgency_score and urgency_override fields

    Returns:
        Integer urgency score to display
    """
    if individual.get('urgency_override') is not None:
        return individual['urgency_override']
    return individual.get('urgency_score', 0)
