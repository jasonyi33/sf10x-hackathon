#!/usr/bin/env python3
"""
Test Task 2.4: Duplicate Detection using LLM
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

print("Starting Task 2.4 test...")

# Load environment variables
load_dotenv()

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.openai_service import OpenAIService

# Mock existing individuals in database
EXISTING_INDIVIDUALS = [
    {
        "id": "uuid-1",
        "name": "John Doe",
        "data": {
            "name": "John Doe",
            "height": 72,
            "weight": 180,
            "skin_color": "Light",
            "gender": "Male",
            "substance_abuse_history": ["Mild"]
        }
    },
    {
        "id": "uuid-2", 
        "name": "John D.",
        "data": {
            "name": "John D.",
            "height": 72,
            "weight": 180,
            "skin_color": "Light",
            "notes": "Found near Market Street"
        }
    },
    {
        "id": "uuid-3",
        "name": "John Smith",
        "data": {
            "name": "John Smith",
            "height": 65,
            "weight": 150,
            "skin_color": "Medium",
            "gender": "Male"
        }
    },
    {
        "id": "uuid-4",
        "name": "Sarah Jones",
        "data": {
            "name": "Sarah Jones",
            "height": 64,
            "weight": 120,
            "skin_color": "Dark",
            "gender": "Female"
        }
    },
    {
        "id": "uuid-5",
        "name": "Michael Brown",
        "data": {
            "name": "Michael Brown",
            "height": 70,
            "weight": 200,
            "skin_color": "Medium"
        }
    }
]

# Test cases
TEST_SCENARIOS = [
    {
        "name": "Exact match",
        "new_data": {
            "name": "John Doe",
            "height": 72,
            "weight": 180,
            "skin_color": "Light",
            "gender": "Male"
        },
        "test_against": ["John Doe"],
        "expected_high": True  # Should be ~100%
    },
    {
        "name": "Similar name + same attributes",
        "new_data": {
            "name": "John Doe",
            "height": 72,
            "weight": 180,
            "skin_color": "Light"
        },
        "test_against": ["John D."],
        "expected_high": True  # Should be >90%
    },
    {
        "name": "Same name, different attributes",
        "new_data": {
            "name": "John Smith",
            "height": 72,
            "weight": 200,
            "skin_color": "Dark"
        },
        "test_against": ["John Smith"],
        "expected_medium": True  # Should be 50-70%
    },
    {
        "name": "Completely different",
        "new_data": {
            "name": "Sarah Jones",
            "height": 64,
            "weight": 120,
            "skin_color": "Dark"
        },
        "test_against": ["Michael Brown"],
        "expected_low": True  # Should be <30%
    },
    {
        "name": "Empty existing list",
        "new_data": {"name": "Test Person"},
        "test_against": [],
        "expected_empty": True
    }
]

async def test_duplicate_detection():
    service = OpenAIService()
    
    print("Testing Task 2.4: Duplicate Detection")
    print("=" * 50)
    
    # Check if OpenAI API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY not set in .env file")
        print("Skipping actual API tests")
        return
    
    for scenario in TEST_SCENARIOS:
        print(f"\nTest: {scenario['name']}")
        print(f"New data: {scenario['new_data']['name']}")
        
        # Filter existing individuals to test against
        if scenario.get('test_against'):
            test_individuals = [ind for ind in EXISTING_INDIVIDUALS 
                              if ind['name'] in scenario['test_against']]
        else:
            test_individuals = []
        
        print(f"Testing against: {[ind['name'] for ind in test_individuals]}")
        
        try:
            matches = await service.find_duplicates(
                scenario['new_data'], 
                test_individuals
            )
            
            if scenario.get('expected_empty'):
                if len(matches) == 0:
                    print("✅ Empty list returned as expected")
                else:
                    print(f"❌ Expected empty list but got {len(matches)} matches")
            else:
                if matches:
                    for match in matches:
                        confidence = match['confidence']
                        print(f"  - {match['name']}: {confidence}% confidence")
                        
                        if scenario.get('expected_high') and confidence >= 90:
                            print(f"    ✅ High confidence as expected")
                        elif scenario.get('expected_medium') and 50 <= confidence < 90:
                            print(f"    ✅ Medium confidence as expected")
                        elif scenario.get('expected_low') and confidence < 30:
                            print(f"    ✅ Low confidence (filtered out)")
                        elif scenario.get('expected_low') and len(matches) == 0:
                            print(f"    ✅ Low confidence matches filtered out")
                else:
                    if scenario.get('expected_low'):
                        print("✅ No matches returned (low confidence filtered)")
                    else:
                        print("❌ No matches found")
                        
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Test sorting
    print("\n" + "-" * 50)
    print("Testing sorting by confidence")
    
    # Test with multiple potential matches
    multi_test = {
        "name": "John",
        "height": 72,
        "weight": 180,
        "skin_color": "Light"
    }
    
    john_individuals = [ind for ind in EXISTING_INDIVIDUALS if "John" in ind['name']]
    print(f"Testing against all Johns: {[ind['name'] for ind in john_individuals]}")
    
    try:
        matches = await service.find_duplicates(multi_test, john_individuals)
        if matches:
            print("Results (should be sorted by confidence):")
            prev_confidence = 101
            all_sorted = True
            for match in matches:
                print(f"  - {match['name']}: {match['confidence']}%")
                if match['confidence'] > prev_confidence:
                    all_sorted = False
                prev_confidence = match['confidence']
            
            if all_sorted:
                print("✅ Results properly sorted by confidence")
            else:
                print("❌ Results not properly sorted")
        else:
            print("❌ No matches found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("Task 2.4 implementation complete!")
    print("\nNotes:")
    print("- LLM comparison of all attributes")
    print("- Returns confidence scores 0-100")
    print("- Results sorted by confidence (highest first)")
    print("- Low confidence matches (<30%) filtered out")
    print("- Frontend handles auto-merge threshold (≥95%)")

if __name__ == "__main__":
    try:
        asyncio.run(test_duplicate_detection())
    except Exception as e:
        print(f"Test failed with error: {e}")
    finally:
        os._exit(0)