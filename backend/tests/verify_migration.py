#!/usr/bin/env python3
"""
Direct verification script for migration 004
Tests the actual database state
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

def get_supabase_client():
    """Get Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("Supabase credentials not found in environment")
    
    return create_client(url, key)


def verify_migration():
    """Verify migration 004 was applied correctly"""
    print("🔍 Verifying Migration 004...\n")
    
    try:
        supabase = get_supabase_client()
        all_passed = True
        
        # Test 1: Check photo columns in individuals table
        print("Test 1: Checking photo columns...")
        try:
            # Try to select the new columns
            result = supabase.table('individuals').select('id, photo_url, photo_history').limit(1).execute()
            print("✅ Photo columns exist in individuals table")
        except Exception as e:
            print(f"❌ Photo columns missing: {str(e)}")
            all_passed = False
        
        # Test 2: Check photo_consents table
        print("\nTest 2: Checking photo_consents table...")
        try:
            result = supabase.table('photo_consents').select('*').limit(1).execute()
            print("✅ photo_consents table exists")
        except Exception as e:
            print(f"❌ photo_consents table missing: {str(e)}")
            all_passed = False
        
        # Test 3: Check approximate_age category
        print("\nTest 3: Checking approximate_age category...")
        try:
            result = supabase.table('categories').select('*').eq('name', 'approximate_age').execute()
            if result.data and len(result.data) > 0:
                category = result.data[0]
                print("✅ approximate_age category exists")
                print(f"   - Type: {category.get('type')}")
                print(f"   - Required: {category.get('is_required')}")
                print(f"   - Preset: {category.get('is_preset')}")
                print(f"   - Danger weight: {category.get('danger_weight')}")
            else:
                print("❌ approximate_age category not found")
                all_passed = False
        except Exception as e:
            print(f"❌ Error checking categories: {str(e)}")
            all_passed = False
        
        # Test 4: Check if individuals have age field
        print("\nTest 4: Checking age field in existing individuals...")
        try:
            result = supabase.table('individuals').select('id, name, data').limit(5).execute()
            if result.data:
                missing_age = []
                wrong_format = []
                
                for individual in result.data:
                    data = individual.get('data', {})
                    age = data.get('approximate_age')
                    
                    if age is None:
                        missing_age.append(individual['name'])
                    elif age != [-1, -1]:
                        wrong_format.append(f"{individual['name']}: {age}")
                
                if missing_age:
                    print(f"❌ Missing age field for: {', '.join(missing_age)}")
                    all_passed = False
                elif wrong_format:
                    print(f"❌ Wrong age format for: {', '.join(wrong_format)}")
                    all_passed = False
                else:
                    print(f"✅ All {len(result.data)} checked individuals have age = [-1, -1]")
            else:
                print("⚠️  No individuals found in database")
        except Exception as e:
            print(f"❌ Error checking individuals: {str(e)}")
            all_passed = False
        
        # Test 5: Quick index check (just verify no errors)
        print("\nTest 5: Checking indexes...")
        try:
            # Try a query that would use the age index
            result = supabase.table('individuals').select('id').eq('data->>approximate_age', '[-1, -1]').limit(1).execute()
            print("✅ Age index appears to be working")
        except Exception as e:
            print(f"⚠️  Could not verify indexes: {str(e)}")
        
        # Summary
        print("\n" + "=" * 50)
        if all_passed:
            print("✅ All migration checks passed!")
            print("\nNext step: Create photos bucket in Supabase Storage")
        else:
            print("❌ Some migration steps are incomplete!")
            print("\nPlease complete the migration by running the missing parts")
            print("in the Supabase SQL Editor.")
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Error connecting to database: {str(e)}")
        print("\nMake sure your .env file has correct Supabase credentials")
        return False


if __name__ == "__main__":
    verify_migration()