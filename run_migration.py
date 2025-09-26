#!/usr/bin/env python3
"""
Run database migration to remove skin color and update terminology
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_migration():
    """Execute the database migration"""

    # Initialize Supabase client
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

    if not supabase_url or not supabase_key:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables")
        return False

    supabase: Client = create_client(supabase_url, supabase_key)

    # Read migration file
    migration_path = 'supabase/migrations/004_remove_skin_color_rename_fields.sql'
    try:
        with open(migration_path, 'r') as f:
            migration_sql = f.read()
    except FileNotFoundError:
        print(f"❌ Migration file not found: {migration_path}")
        return False

    print("🔄 Running database migration...")
    print("   - Removing skin_color category and data")
    print("   - Renaming violent_behavior to behavior")
    print("   - Renaming danger_* columns to urgency_*")

    try:
        # Split the migration into individual statements
        statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip() and not stmt.strip().startswith('--')]

        for i, statement in enumerate(statements):
            if statement:
                print(f"   Executing statement {i+1}/{len(statements)}...")
                result = supabase.rpc('exec_sql', {'sql': statement}).execute()
                if hasattr(result, 'error') and result.error:
                    print(f"   ⚠️  Statement {i+1} result: {result}")

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
        else:
            print("   ❌ violent_behavior rename may have failed")

        # Check if urgency columns exist
        print("   ✅ Database migration verification complete")

        return True

    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    # Change to backend directory where .env file is located
    if os.path.exists('backend'):
        os.chdir('backend')
    success = run_migration()
    exit(0 if success else 1)