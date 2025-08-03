#!/usr/bin/env python3
"""
Script to test migration 004 - run tests before and after migration
This demonstrates that tests fail before migration and pass after.
"""
import subprocess
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_tests():
    """Run the migration tests and return True if all pass"""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "test_migration_004.py", "-v", "-x"],
            cwd=os.path.dirname(os.path.abspath(__file__)),
            capture_output=True,
            text=True
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def main():
    print("=" * 60)
    print("Migration 004 Test Runner")
    print("=" * 60)
    
    # Check if we have Supabase credentials
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_ANON_KEY"):
        print("\n❌ ERROR: Supabase credentials not found!")
        print("Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables")
        return
    
    print("\n📋 Test Plan:")
    print("1. Photo columns should be added to individuals table")
    print("2. Photo consents table should be created")
    print("3. Approximate age category should be added as required")
    print("4. All individuals should have age set to [-1, -1]")
    print("5. Performance indexes should be created")
    
    print("\n🧪 Running tests BEFORE migration...")
    print("-" * 40)
    
    passed, stdout, stderr = run_tests()
    
    if passed:
        print("⚠️  WARNING: Tests passed before migration!")
        print("This likely means the migration has already been applied.")
        print("\nTest output:")
        print(stdout)
    else:
        print("✅ Tests failed as expected (migration not yet applied)")
        print("\nExpected failures:")
        # Parse and show which tests failed
        for line in stdout.split('\n'):
            if 'FAILED' in line or 'ERROR' in line:
                print(f"  - {line.strip()}")
    
    print("\n" + "=" * 60)
    print("📝 Migration Instructions:")
    print("=" * 60)
    print("\n1. Apply the migration using Supabase CLI:")
    print("   supabase db push")
    print("\n2. Or apply directly in Supabase SQL Editor:")
    print("   - Go to Supabase Dashboard > SQL Editor")
    print("   - Copy contents of supabase/migrations/004_add_photos_age.sql")
    print("   - Run the SQL")
    
    print("\n3. After applying migration, run this script again to verify")
    
    print("\n" + "=" * 60)
    print("📋 Expected Results After Migration:")
    print("=" * 60)
    print("✅ All 5 tests should pass")
    print("✅ Photo columns added to individuals table")
    print("✅ Photo consents table created")
    print("✅ Age field required and set to [-1, -1] for all existing records")
    print("✅ Indexes created for performance")
    
    # Check if migration might already be applied
    if not passed:
        print("\n💡 To check migration status manually:")
        print("   - Check if 'photo_url' column exists in individuals table")
        print("   - Check if 'photo_consents' table exists")
        print("   - Check if 'approximate_age' category exists")

if __name__ == "__main__":
    main()