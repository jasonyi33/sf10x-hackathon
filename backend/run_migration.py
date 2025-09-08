#!/usr/bin/env python3
"""
Script to run the embeddings table migration against Supabase
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def run_migration():
    """Run the embeddings table migration"""
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
        
        # Read migration SQL
        with open('migrations/add_embeddings_table.sql', 'r') as f:
            migration_sql = f.read()
        
        print("📝 Running migration...")
        
        # Split SQL into individual statements
        statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
        
        for i, statement in enumerate(statements, 1):
            if statement and not statement.startswith('--'):
                try:
                    print(f"  [{i}/{len(statements)}] Executing: {statement[:50]}...")
                    
                    # Execute the SQL statement
                    result = supabase.rpc('exec_sql', {'sql': statement}).execute()
                    
                    print(f"    ✅ Success")
                except Exception as e:
                    print(f"    ❌ Error: {str(e)}")
                    # Continue with other statements
                    continue
        
        print("🎉 Migration completed!")
        
        # Verify the table was created
        try:
            result = supabase.table("individual_embeddings").select("id", count="exact").execute()
            count = result.count if hasattr(result, 'count') else len(result.data)
            print(f"📊 individual_embeddings table exists with {count} rows")
        except Exception as e:
            print(f"❌ Could not verify table: {str(e)}")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")

if __name__ == "__main__":
    run_migration()
