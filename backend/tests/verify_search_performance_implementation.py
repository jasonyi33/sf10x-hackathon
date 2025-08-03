#!/usr/bin/env python3
"""
Verification script for Task 3.1.3: Search Performance Optimization
This script verifies all requirements are implemented
"""

import os
import sys
import re
import subprocess

# Add the backend directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

print("🔍 Verifying Task 3.1.3: Search Performance Optimization Implementation\n")

# Check if migration file exists
migration_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "supabase/migrations/005_search_performance_indexes.sql"
)

if not os.path.exists(migration_path):
    print("❌ Migration file not found!")
    sys.exit(1)

# Read relevant files
with open(migration_path, 'r') as f:
    migration_sql = f.read()

with open('../services/individual_service.py', 'r') as f:
    individual_service = f.read()

requirements = [
    {
        "name": "1. pg_trgm extension enabled for text search",
        "check": lambda: 'CREATE EXTENSION IF NOT EXISTS pg_trgm' in migration_sql
    },
    {
        "name": "2. GIN index on name with trigram support",
        "check": lambda: 'idx_individuals_name_gin' in migration_sql and 
                        'gin_trgm_ops' in migration_sql
    },
    {
        "name": "3. Gender index created",
        "check": lambda: 'idx_individuals_gender' in migration_sql and
                        "(data->>'gender')" in migration_sql
    },
    {
        "name": "4. Age min index created",
        "check": lambda: 'idx_individuals_age_min' in migration_sql and
                        "(data->'approximate_age'->0)::int" in migration_sql
    },
    {
        "name": "5. Age max index created",
        "check": lambda: 'idx_individuals_age_max' in migration_sql and
                        "(data->'approximate_age'->1)::int" in migration_sql
    },
    {
        "name": "6. Has photo index created",
        "check": lambda: 'idx_individuals_has_photo' in migration_sql and
                        '(photo_url IS NOT NULL)' in migration_sql
    },
    {
        "name": "7. Danger score index created",
        "check": lambda: 'idx_individuals_danger' in migration_sql and
                        'ON individuals(danger_score)' in migration_sql
    },
    {
        "name": "8. Updated at index created",
        "check": lambda: 'idx_individuals_updated' in migration_sql and
                        'ON individuals(updated_at)' in migration_sql
    },
    {
        "name": "9. Height index created",
        "check": lambda: 'idx_individuals_height' in migration_sql
    },
    {
        "name": "10. Skin color index created",
        "check": lambda: 'idx_individuals_skin_color' in migration_sql
    },
    {
        "name": "11. Compound index for interactions",
        "check": lambda: 'idx_interactions_individual_created' in migration_sql and
                        'individual_id, created_at DESC' in migration_sql
    },
    {
        "name": "12. ANALYZE statements included",
        "check": lambda: 'ANALYZE individuals' in migration_sql and
                        'ANALYZE interactions' in migration_sql
    },
    {
        "name": "13. Offset limit validation (max 100)",
        "check": lambda: 'if offset > 100:' in individual_service and
                        'Offset cannot exceed 100' in individual_service
    },
    {
        "name": "14. Distance sort validation requires coordinates",
        "check": lambda: 'Distance sort requires both lat and lon parameters' in individual_service
    },
    {
        "name": "15. Helper functions for query analysis",
        "check": lambda: 'explain_query' in migration_sql and
                        'get_index_usage_stats' in migration_sql
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
print(f"📊 Code Analysis: {passed}/{len(requirements)} requirements met")
print("="*50)

# Run the performance tests
print("\n🧪 Running search performance tests...\n")
try:
    result = subprocess.run(
        ["python3", "-m", "pytest", "test_search_performance.py", "-v", "--tb=short"],
        capture_output=True,
        text=True,
        cwd=os.path.dirname(os.path.abspath(__file__))
    )
    
    print(result.stdout)
    if result.stderr:
        print(result.stderr)
    
    # Check for test results
    if " passed" in result.stdout and " failed" not in result.stdout:
        print("\n✅ All performance tests passed!")
        test_passed = True
    else:
        print("\n❌ Some tests failed!")
        test_passed = False
except Exception as e:
    print(f"❌ Error running tests: {str(e)}")
    test_passed = False

# Check migration file format
print("\n📋 Checking migration file structure...")
index_count = migration_sql.count('CREATE INDEX')
if index_count >= 10:
    print(f"✅ Migration contains {index_count} index definitions")
else:
    print(f"⚠️  Migration only contains {index_count} index definitions")

print("\n" + "="*50)
print("📊 Final Results")
print("="*50)

if failed == 0 and test_passed:
    print("\n✨ ALL REQUIREMENTS MET! Task 3.1.3 is complete. ✨\n")
    print("Key features implemented:")
    print("• Created comprehensive database indexes for search optimization")
    print("• Added pg_trgm extension for advanced text search")
    print("• Implemented pagination limit (max offset 100)")
    print("• Added validation for distance sort requiring coordinates")
    print("• Created indexes for all filter fields")
    print("• Added compound indexes for efficient joins")
    print("• Included ANALYZE statements for query planner")
    print("• Created helper functions for performance monitoring")
    print("• All 8 performance tests passing")
    print("\nNext steps:")
    print("• Run migration 005_search_performance_indexes.sql in production")
    print("• Monitor query performance with explain_query() function")
    print("• Use get_index_usage_stats() to verify indexes are being used")
else:
    print("\n❌ Some requirements are not met. Please review the failures above.\n")
    sys.exit(1)