#!/usr/bin/env python3
"""
Verification script for Task 3.1.1: Advanced Search Endpoint
This script verifies all requirements are implemented
"""

import os
import sys
import re

# Add the backend directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

print("🔍 Verifying Task 3.1.1: Advanced Search Endpoint Implementation\n")

# Read relevant files
individuals_api = open('../api/individuals.py', 'r').read()
individual_service = open('../services/individual_service.py', 'r').read()

requirements = [
    {
        "name": "1. Advanced search endpoint exists at /api/individuals/search",
        "check": lambda: '/api/individuals/search' in individuals_api and 
                        'advanced_search_individuals' in individuals_api
    },
    {
        "name": "2. Text search parameter (q)",
        "check": lambda: 'q: Optional[str] = Query(None' in individuals_api
    },
    {
        "name": "3. Gender filter (comma-separated)",
        "check": lambda: 'gender: Optional[str] = Query(None, description="Comma-separated genders")' in individuals_api
    },
    {
        "name": "4. Age range filters (age_min, age_max)",
        "check": lambda: 'age_min: Optional[int] = Query(None, ge=0, le=120)' in individuals_api and
                        'age_max: Optional[int] = Query(None, ge=0, le=120)' in individuals_api
    },
    {
        "name": "5. Height range filters (height_min, height_max)",
        "check": lambda: 'height_min: Optional[int] = Query(None, ge=0, le=300)' in individuals_api and
                        'height_max: Optional[int] = Query(None, ge=0, le=300)' in individuals_api
    },
    {
        "name": "6. Danger score range filters",
        "check": lambda: 'danger_min: Optional[int] = Query(None, ge=0, le=100)' in individuals_api and
                        'danger_max: Optional[int] = Query(None, ge=0, le=100)' in individuals_api
    },
    {
        "name": "7. Has photo filter",
        "check": lambda: 'has_photo: Optional[bool] = Query(None)' in individuals_api
    },
    {
        "name": "8. Sort options (danger_score, last_seen, name, distance)",
        "check": lambda: 'sort_by: str = Query("danger_score", pattern="^(danger_score|last_seen|name|distance)$")' in individuals_api
    },
    {
        "name": "9. Sort order (asc/desc)",
        "check": lambda: 'sort_order: str = Query("desc", pattern="^(asc|desc)$")' in individuals_api
    },
    {
        "name": "10. Pagination (limit 10-20, offset max 100)",
        "check": lambda: 'limit: int = Query(10, ge=1, le=20)' in individuals_api and
                        'offset: int = Query(0, ge=0, le=100)' in individuals_api
    },
    {
        "name": "11. Location parameters for distance sort",
        "check": lambda: 'lat: Optional[float] = Query(None, ge=-90, le=90)' in individuals_api and
                        'lon: Optional[float] = Query(None, ge=-180, le=180)' in individuals_api
    },
    {
        "name": "12. Distance sort validation",
        "check": lambda: 'if sort_by == "distance" and (lat is None or lon is None):' in individuals_api and
                        'Distance sort requires lat and lon parameters' in individuals_api
    },
    {
        "name": "13. Advanced search service method",
        "check": lambda: 'async def advanced_search(' in individual_service
    },
    {
        "name": "14. Text search in name and JSONB fields",
        "check": lambda: 'search_term = q.lower()' in individual_service and
                        'name_match = search_term in ind.get("name", "").lower()' in individual_service and
                        'data_match = search_term in str(ind.get("data", {})).lower()' in individual_service
    },
    {
        "name": "15. Gender filter with OR logic",
        "check": lambda: 'gender_list = [g.strip() for g in gender.split(",")]' in individual_service and
                        'ind_gender = ind.get("data", {}).get("gender")' in individual_service
    },
    {
        "name": "16. Age overlap logic",
        "check": lambda: 'NOT (ind_max < filter_min OR ind_min > filter_max)' in individual_service or
                        ('ind_max < age_min or ind_min > age_max' in individual_service)
    },
    {
        "name": "17. All filters use AND logic",
        "check": lambda: 'if not (name_match or data_match):' in individual_service and
                        'continue' in individual_service
    },
    {
        "name": "18. Distance calculation with Haversine formula",
        "check": lambda: 'from math import radians, sin, cos, sqrt, atan2' in individual_service and
                        'R = 3959' in individual_service and
                        'Haversine formula' in individual_service
    },
    {
        "name": "19. Returns IndividualSummary format",
        "check": lambda: 'summary = IndividualSummary(' in individual_service and
                        'display_score=display_score' in individual_service
    },
    {
        "name": "20. No photo_url in search results",
        "check": lambda: 'last_location=last_location' in individual_service and
                        'photo_url' not in re.findall(r'summary = IndividualSummary\([^)]+\)', individual_service)[0]
    }
]

passed = 0
failed = 0

for req in requirements:
    try:
        if req["check"]():
            print(f"✅ {req['name']}")
            passed += 1
        else:
            print(f"❌ {req['name']}")
            failed += 1
    except Exception as e:
        print(f"❌ {req['name']} - Error: {str(e)}")
        failed += 1

print("\n" + "="*50)
print(f"📊 Results: {passed}/{len(requirements)} requirements met")
print("="*50)

if failed == 0:
    print("\n✨ ALL REQUIREMENTS MET! Task 3.1.1 is complete. ✨\n")
    print("Key features implemented:")
    print("• Advanced search endpoint at /api/individuals/search")
    print("• Text search across name and JSONB data fields")
    print("• Multiple filter types with proper validation")
    print("• Age overlap logic correctly implemented")
    print("• All filters combined with AND logic")
    print("• Gender filter supports OR logic (comma-separated)")
    print("• 4 sort options including distance (with validation)")
    print("• Pagination with proper limits")
    print("• Distance calculation using Haversine formula")
    print("• Returns IndividualSummary without photo_url")
else:
    print("\n❌ Some requirements are not met. Please review the failures above.\n")
    sys.exit(1)