#!/usr/bin/env python3
"""
Clean up old terminology from JSONB data fields
This script removes skin_color fields and renames violent_behavior to behavior
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

def main():
    """Clean up the database JSONB data"""
    load_dotenv()

    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
        return 1

    print("🚀 Starting JSONB data cleanup...")

    try:
        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)

        # 1. Get individuals with skin_color data
        print("📋 Checking individuals with skin_color data...")
        all_individuals = supabase.table("individuals").select("*").execute()
        individuals = all_individuals.data

        skin_color_count = 0
        violent_behavior_count = 0

        for individual in individuals:
            data = individual.get('data', {})
            if 'skin_color' in data:
                skin_color_count += 1
            if 'violent_behavior' in data:
                violent_behavior_count += 1

        print(f"📊 Found {skin_color_count} individuals with skin_color")
        print(f"📊 Found {violent_behavior_count} individuals with violent_behavior")

        # 2. Clean up each individual record
        updated_count = 0
        for individual in individuals:
            data = individual.get('data', {})
            needs_update = False
            new_data = dict(data)

            # Remove skin_color if present
            if 'skin_color' in new_data:
                del new_data['skin_color']
                needs_update = True
                print(f"  🧹 Removing skin_color from {individual.get('name', 'Unknown')}")

            # Rename violent_behavior to behavior if present
            if 'violent_behavior' in new_data:
                new_data['behavior'] = new_data['violent_behavior']
                del new_data['violent_behavior']
                needs_update = True
                print(f"  🔄 Renaming violent_behavior to behavior for {individual.get('name', 'Unknown')}")

            # Update the record if needed
            if needs_update:
                supabase.table("individuals").update({
                    "data": new_data
                }).eq("id", individual["id"]).execute()
                updated_count += 1

        print(f"✅ Updated {updated_count} individual records")

        # 3. Clean up categories table
        print("📋 Cleaning up categories table...")

        # Remove skin_color category
        skin_color_result = supabase.table("categories").delete().eq("name", "skin_color").execute()
        print(f"🗑️ Removed skin_color category (affected {len(skin_color_result.data) if skin_color_result.data else 0} rows)")

        # Update violent_behavior to behavior in categories
        violent_behavior_cats = supabase.table("categories").select("*").eq("name", "violent_behavior").execute()
        if violent_behavior_cats.data:
            for cat in violent_behavior_cats.data:
                supabase.table("categories").update({
                    "name": "behavior"
                }).eq("id", cat["id"]).execute()
            print(f"🔄 Renamed {len(violent_behavior_cats.data)} violent_behavior categories to behavior")

        # 4. Verify the changes
        print("\n📊 Verification:")

        # Check individuals
        final_individuals = supabase.table("individuals").select("*").execute()
        final_skin_color_count = 0
        final_violent_behavior_count = 0
        final_behavior_count = 0

        for individual in final_individuals.data:
            data = individual.get('data', {})
            if 'skin_color' in data:
                final_skin_color_count += 1
            if 'violent_behavior' in data:
                final_violent_behavior_count += 1
            if 'behavior' in data:
                final_behavior_count += 1

        print(f"✅ Final count - skin_color: {final_skin_color_count}")
        print(f"✅ Final count - violent_behavior: {final_violent_behavior_count}")
        print(f"✅ Final count - behavior: {final_behavior_count}")

        # Check categories
        categories = supabase.table("categories").select("name").execute()
        category_names = [cat["name"] for cat in categories.data]

        print(f"✅ Categories now: {category_names}")
        print(f"✅ skin_color in categories: {'skin_color' in category_names}")
        print(f"✅ violent_behavior in categories: {'violent_behavior' in category_names}")
        print(f"✅ behavior in categories: {'behavior' in category_names}")

        print("\n🎉 JSONB data cleanup completed successfully!")
        return 0

    except Exception as e:
        print(f"❌ Cleanup failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())