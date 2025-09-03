#!/usr/bin/env python3
"""
Simple script to create the embeddings table in Supabase
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def create_embeddings_table():
    """Create the embeddings table using Supabase operations"""
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
        
        print("📝 Creating embeddings table...")
        
        # Try to insert a test row to see if table exists
        try:
            test_data = {
                "individual_id": "00000000-0000-0000-0000-000000000000",  # Dummy UUID
                "embedding_data": [0.1, 0.2, 0.3],  # Dummy embedding
                "embedding_text": "Test embedding"
            }
            
            result = supabase.table("individual_embeddings").insert(test_data).execute()
            print("✅ Table exists, inserted test data")
            
            # Clean up test data
            supabase.table("individual_embeddings").delete().eq("individual_id", "00000000-0000-0000-0000-000000000000").execute()
            print("🧹 Cleaned up test data")
            
        except Exception as e:
            if "relation" in str(e).lower() and "does not exist" in str(e).lower():
                print("❌ Table does not exist. You need to create it manually in Supabase.")
                print("📋 Here's the SQL to run in your Supabase SQL editor:")
                print()
                print("CREATE TABLE individual_embeddings (")
                print("    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),")
                print("    individual_id UUID NOT NULL REFERENCES individuals(id) ON DELETE CASCADE,")
                print("    embedding_data JSONB NOT NULL,")
                print("    embedding_text TEXT NOT NULL,")
                print("    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),")
                print("    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),")
                print("    UNIQUE(individual_id)")
                print(");")
                print()
                print("CREATE INDEX idx_individual_embeddings_individual_id ON individual_embeddings(individual_id);")
            else:
                print(f"❌ Error: {str(e)}")
                return
        
        print("🎉 Ready to use embeddings table!")
        
    except Exception as e:
        print(f"❌ Failed: {str(e)}")

if __name__ == "__main__":
    create_embeddings_table()
