#!/usr/bin/env python3
"""
Simple migration to remove skin_color and update terminology
"""
import os
from supabase import create_client, Client

def run_simple_migration():
    """Execute the database migration using direct Supabase operations"""

    supabase_url = "https://vhfyquescrbwbbvvhxdg.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZnlxdWVzY3Jid2JidnZoeGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDEyNDk0OSwiZXhwIjoyMDY5NzAwOTQ5fQ.GcSdg8w-0mf2J9m22jwYxu_2D4IjgUWMaq8DX4KD3EA"

    supabase: Client = create_client(supabase_url, supabase_key)

    print("🔄 Running simple database migration...")

    try:
        # Step 1: Delete skin_color category
        print("   - Removing skin_color category...")
        result = supabase.table('categories').delete().eq('name', 'skin_color').execute()
        print(f"     Deleted {len(result.data)} skin_color categories")

        # Step 2: Rename violent_behavior to behavior in categories
        print("   - Renaming violent_behavior to behavior in categories...")
        result = supabase.table('categories').update({'name': 'behavior'}).eq('name', 'violent_behavior').execute()
        print(f"     Updated {len(result.data)} violent_behavior categories to behavior")

        # Step 3: Get all individuals to clean their data
        print("   - Cleaning individual data...")
        individuals_result = supabase.table('individuals').select('*').execute()
        individuals = individuals_result.data

        updated_count = 0
        for individual in individuals:
            data = individual.get('data', {})
            updated_data = dict(data)  # Make a copy

            # Remove skin_color
            if 'skin_color' in updated_data:
                del updated_data['skin_color']

            # Rename violent_behavior to behavior
            if 'violent_behavior' in updated_data:
                updated_data['behavior'] = updated_data.pop('violent_behavior')

            # Update if data changed
            if updated_data != data:
                update_result = supabase.table('individuals').update({'data': updated_data}).eq('id', individual['id']).execute()
                if update_result.data:
                    updated_count += 1

        print(f"     Updated {updated_count} individual records")

        # Step 4: Get all interactions to clean their data
        print("   - Cleaning interaction data...")
        interactions_result = supabase.table('interactions').select('*').execute()
        interactions = interactions_result.data

        updated_interaction_count = 0
        for interaction in interactions:
            data = interaction.get('data', {})
            updated_data = dict(data)  # Make a copy

            # Remove skin_color
            if 'skin_color' in updated_data:
                del updated_data['skin_color']

            # Rename violent_behavior to behavior
            if 'violent_behavior' in updated_data:
                updated_data['behavior'] = updated_data.pop('violent_behavior')

            # Update if data changed
            if updated_data != data:
                update_result = supabase.table('interactions').update({'data': updated_data}).eq('id', interaction['id']).execute()
                if update_result.data:
                    updated_interaction_count += 1

        print(f"     Updated {updated_interaction_count} interaction records")

        print("✅ Migration completed successfully!")

        # Verify the changes
        print("\n🔍 Verifying migration results...")

        # Check categories
        categories_result = supabase.table('categories').select('name').execute()
        category_names = [cat['name'] for cat in categories_result.data]

        if 'skin_color' not in category_names:
            print("   ✅ skin_color category removed")
        else:
            print("   ❌ skin_color category still exists")

        if 'behavior' in category_names and 'violent_behavior' not in category_names:
            print("   ✅ violent_behavior renamed to behavior")
        elif 'violent_behavior' not in category_names:
            print("   ✅ violent_behavior category not found (may not have existed)")
        else:
            print("   ❌ violent_behavior rename may have failed")

        print("   ✅ Database migration verification complete")

        return True

    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_simple_migration()
    exit(0 if success else 1)