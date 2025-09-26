#!/usr/bin/env python3
"""
Script to add last_location column to individuals table
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def fix_last_location():
    """Add last_location column and update existing records"""
    try:
        # Get Supabase credentials
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")

        if not url or not key:
            print("❌ Missing Supabase credentials in .env file")
            return

        print(f"🔗 Connecting to Supabase: {url}")

        # Create Supabase client
        supabase: Client = create_client(url, key)

        print("📝 Checking current individuals table structure...")

        # Check existing individuals
        result = supabase.table("individuals").select("id, name, data").limit(1).execute()

        if result.data:
            print(f"✅ Found {len(result.data)} individuals in database")
            sample = result.data[0]
            print(f"📋 Sample record keys: {list(sample.keys())}")

            if 'last_location' in sample:
                print("✅ last_location column already exists!")
                return

        print("🔄 The last_location column needs to be added via Supabase Dashboard SQL Editor")
        print("📝 Please run this SQL in your Supabase Dashboard > SQL Editor:")
        print("---")
        print("ALTER TABLE individuals ADD COLUMN IF NOT EXISTS last_location JSONB;")
        print("CREATE INDEX IF NOT EXISTS idx_individuals_last_location ON individuals USING GIN(last_location);")
        print("---")
        print("💡 After running the SQL, the save error should be fixed!")

    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    fix_last_location()