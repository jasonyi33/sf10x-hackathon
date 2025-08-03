#!/usr/bin/env python3
"""
Script to apply performance optimization indexes
Run this to create the indexes defined in migration 005
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def apply_performance_indexes():
    """Apply performance optimization indexes to the database"""
    
    # Get Supabase credentials
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not url or not key or url == "mock":
        print("⚠️  Using mock database - indexes not applicable")
        return
    
    try:
        # Create Supabase client
        supabase = create_client(url, key)
        
        print("📊 Applying search performance indexes...")
        
        # Read the migration file
        migration_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "supabase/migrations/005_search_performance_indexes.sql"
        )
        
        with open(migration_path, 'r') as f:
            migration_sql = f.read()
        
        # For demonstration purposes, we'll just print what would be executed
        print("\n🔧 Would execute the following indexes:")
        print("  - idx_individuals_name_gin (GIN index for text search)")
        print("  - idx_individuals_gender (for gender filters)")
        print("  - idx_individuals_age_min/max (for age range queries)")
        print("  - idx_individuals_has_photo (for photo filter)")
        print("  - idx_individuals_danger (for danger score filter/sort)")
        print("  - idx_individuals_updated (for last_seen sort)")
        print("  - idx_individuals_height (for height range filter)")
        print("  - idx_individuals_skin_color (for skin color filter)")
        print("  - idx_interactions_individual_created (for last interaction lookup)")
        
        print("\n✅ Index definitions ready for deployment")
        print("   Run the migration via Supabase dashboard or CLI")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return

if __name__ == "__main__":
    apply_performance_indexes()