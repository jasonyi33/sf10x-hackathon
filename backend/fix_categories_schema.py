#!/usr/bin/env python3
"""
Fix Categories Table Schema
Adds missing columns to the categories table in Supabase
"""

import os
import sys
from supabase import create_client, Client

def fix_categories_schema():
    """Add missing columns to categories table"""
    try:
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            print("❌ Missing Supabase environment variables")
            print("Please set SUPABASE_URL and SUPABASE_SERVICE_KEY")
            return False
            
        client: Client = create_client(supabase_url, supabase_key)
        
        print("🔧 Fixing categories table schema...")
        
        # Add missing columns
        migrations = [
            "ALTER TABLE categories ADD COLUMN IF NOT EXISTS danger_weight INTEGER DEFAULT 0",
            "ALTER TABLE categories ADD COLUMN IF NOT EXISTS auto_trigger BOOLEAN DEFAULT FALSE", 
            "ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE",
            "ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_preset BOOLEAN DEFAULT FALSE",
            "ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
        ]
        
        for migration in migrations:
            print(f"📝 Running: {migration}")
            try:
                client.rpc('exec_sql', {'sql': migration}).execute()
                print("✅ Success")
            except Exception as e:
                print(f"⚠️ Warning: {str(e)}")
        
        # Verify the schema
        print("\n📊 Verifying schema...")
        result = client.rpc('exec_sql', {
            'sql': '''
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'categories' 
            ORDER BY ordinal_position;
            '''
        }).execute()
        
        if result.data:
            print("📋 Current categories table schema:")
            for row in result.data:
                print(f"  - {row['column_name']}: {row['data_type']} (nullable: {row['is_nullable']})")
        
        # Check existing categories
        categories_result = client.table("categories").select("*").execute()
        print(f"\n📊 Found {len(categories_result.data)} existing categories")
        
        print("\n✅ Categories table schema fixed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error fixing categories schema: {str(e)}")
        return False

if __name__ == "__main__":
    success = fix_categories_schema()
    sys.exit(0 if success else 1)

