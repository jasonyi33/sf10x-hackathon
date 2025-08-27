#!/usr/bin/env python3
"""
Script to update database schema from danger_score/danger_override to urgency_score/urgency_override
"""
import os
from dotenv import load_dotenv
from supabase import create_client

def update_database_schema():
    """Update the database schema to use urgency terminology"""
    
    # Load environment variables
    load_dotenv()
    
    # Create Supabase client
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file")
        return False
    
    client = create_client(supabase_url, supabase_key)
    
    try:
        print("🔄 Updating database schema...")
        
        # Step 1: Add new columns
        print("📝 Adding new urgency columns...")
        client.rpc('exec_sql', {
            'sql': '''
            ALTER TABLE individuals 
            ADD COLUMN IF NOT EXISTS urgency_score INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS urgency_override INTEGER;
            '''
        }).execute()
        
        # Step 2: Copy data from old columns to new columns
        print("📋 Copying data from danger_score to urgency_score...")
        client.rpc('exec_sql', {
            'sql': '''
            UPDATE individuals 
            SET urgency_score = danger_score 
            WHERE urgency_score IS NULL AND danger_score IS NOT NULL;
            '''
        }).execute()
        
        print("📋 Copying data from danger_override to urgency_override...")
        client.rpc('exec_sql', {
            'sql': '''
            UPDATE individuals 
            SET urgency_override = danger_override 
            WHERE urgency_override IS NULL AND danger_override IS NOT NULL;
            '''
        }).execute()
        
        # Step 3: Update categories table to rename danger_weight to urgency_weight
        print("📝 Updating categories table...")
        client.rpc('exec_sql', {
            'sql': '''
            ALTER TABLE categories 
            ADD COLUMN IF NOT EXISTS urgency_weight INTEGER DEFAULT 0;
            '''
        }).execute()
        
        client.rpc('exec_sql', {
            'sql': '''
            UPDATE categories 
            SET urgency_weight = danger_weight 
            WHERE urgency_weight IS NULL AND danger_weight IS NOT NULL;
            '''
        }).execute()
        
        print("✅ Database schema updated successfully!")
        print("📊 New columns added: urgency_score, urgency_override, urgency_weight")
        print("📊 Data copied from old columns to new columns")
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating database schema: {str(e)}")
        return False

if __name__ == "__main__":
    success = update_database_schema()
    if success:
        print("\n🎉 Database migration completed successfully!")
        print("💡 You can now safely remove the old columns if needed.")
    else:
        print("\n💥 Database migration failed!")
        exit(1)
