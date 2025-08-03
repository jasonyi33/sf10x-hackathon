#!/usr/bin/env python3
"""
Fix missing age field for existing individuals in the database
This script updates all individuals that don't have the approximate_age field
"""
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Supabase client
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

if not url or not key:
    print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file")
    sys.exit(1)

try:
    supabase: Client = create_client(url, key)
    print("✅ Connected to Supabase")
except Exception as e:
    print(f"❌ Error connecting to Supabase: {str(e)}")
    sys.exit(1)

print("\n" + "="*60)
print("FIXING MISSING AGE FIELD FOR EXISTING INDIVIDUALS")
print("="*60)

# Step 1: Check current status
print("\n1. Checking current status...")
try:
    result = supabase.table("individuals").select("id, name, data").execute()
    total_individuals = len(result.data)
    missing_age = []
    
    for individual in result.data:
        data = individual.get("data", {})
        if "approximate_age" not in data or data.get("approximate_age") is None:
            missing_age.append({
                "id": individual["id"],
                "name": individual.get("name", "Unknown")
            })
    
    print(f"   Total individuals: {total_individuals}")
    print(f"   Missing age field: {len(missing_age)}")
    
    if len(missing_age) == 0:
        print("\n✅ All individuals already have the age field. No updates needed!")
        sys.exit(0)
    
    print(f"\n   Individuals missing age field:")
    for ind in missing_age[:5]:  # Show first 5
        print(f"   - {ind['name']} (ID: {ind['id']})")
    if len(missing_age) > 5:
        print(f"   ... and {len(missing_age) - 5} more")
        
except Exception as e:
    print(f"❌ Error checking individuals: {str(e)}")
    sys.exit(1)

# Step 2: Update missing records
print("\n2. Updating individuals with missing age field...")
updated_count = 0
failed_count = 0

for individual in result.data:
    if individual.get("data", {}).get("approximate_age") is None:
        try:
            # Get current data or empty dict
            data = individual.get("data", {})
            # Add age field with "Unknown" value
            data["approximate_age"] = [-1, -1]
            
            # Update the record
            update_result = supabase.table("individuals").update({
                "data": data
            }).eq("id", individual["id"]).execute()
            
            updated_count += 1
            
            # Show progress
            if updated_count % 10 == 0:
                print(f"   Updated {updated_count} records...")
                
        except Exception as e:
            failed_count += 1
            print(f"   ❌ Failed to update {individual.get('name', 'Unknown')} (ID: {individual['id']}): {str(e)}")

print(f"\n   ✅ Successfully updated {updated_count} individuals")
if failed_count > 0:
    print(f"   ❌ Failed to update {failed_count} individuals")

# Step 3: Verify the fix
print("\n3. Verifying the fix...")
try:
    result = supabase.table("individuals").select("id, data").execute()
    still_missing = 0
    
    for individual in result.data:
        if individual.get("data", {}).get("approximate_age") is None:
            still_missing += 1
    
    if still_missing == 0:
        print("   ✅ SUCCESS: All individuals now have the age field!")
    else:
        print(f"   ⚠️  WARNING: {still_missing} individuals still missing age field")
        
    # Show a sample of updated records
    print("\n4. Sample of updated records:")
    sample_result = supabase.table("individuals").select("name, data").limit(3).execute()
    for ind in sample_result.data:
        age = ind.get("data", {}).get("approximate_age", "MISSING")
        print(f"   - {ind.get('name', 'Unknown')}: age = {age}")
        
except Exception as e:
    print(f"❌ Error during verification: {str(e)}")

print("\n" + "="*60)
print("MIGRATION FIX COMPLETE")
print("="*60)

# Run the test to confirm
print("\nTo verify with tests, run:")
print("python3 -m pytest tests/test_phase1_success_criteria.py::TestPhase1CriticalSuccessCriteria::test_database_migration_success -xvs")