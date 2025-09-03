#!/usr/bin/env python3
"""
Test script to demonstrate automatic embedding generation
"""
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client
import os

# Load environment variables
load_dotenv()

async def test_auto_embeddings():
    """Test automatic embedding generation"""
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
        
        # Check current embedding count
        print("📊 Checking current embedding count...")
        embeddings_result = supabase.table("individual_embeddings").select("id", count="exact").execute()
        current_count = embeddings_result.count if hasattr(embeddings_result, 'count') else len(embeddings_result.data)
        print(f"📊 Current embeddings: {current_count}")
        
        # Create a test individual
        print("📝 Creating test individual...")
        test_individual = {
            "name": "Auto-Embedding Test",
            "data": {
                "age": 30,
                "gender": "Other",
                "height": 68,
                "weight": 160,
                "medical_conditions": ["Test Condition"],
                "notes": "This individual was created to test automatic embedding generation"
            }
        }
        
        # Insert the test individual
        result = supabase.table("individuals").insert(test_individual).execute()
        
        if result.data:
            individual_id = result.data[0]['id']
            print(f"✅ Created test individual with ID: {individual_id}")
            
            # Wait a moment for background task to complete
            print("⏳ Waiting for background embedding generation...")
            await asyncio.sleep(5)
            
            # Check if embedding was generated
            embedding_result = supabase.table("individual_embeddings").select("*").eq("individual_id", individual_id).execute()
            
            if embedding_result.data:
                print(f"✅ Embedding automatically generated for: {test_individual['name']}")
                print(f"📊 Embedding text: {embedding_result.data[0].get('embedding_text', 'N/A')[:100]}...")
            else:
                print(f"❌ No embedding found for: {test_individual['name']}")
                print("💡 This might mean the background task hasn't completed yet")
            
            # Check total embedding count
            new_embeddings_result = supabase.table("individual_embeddings").select("id", count="exact").execute()
            new_count = new_embeddings_result.count if hasattr(new_embeddings_result, 'count') else len(new_embeddings_result.data)
            print(f"📊 New total embeddings: {new_count}")
            
            # Clean up test individual
            print("🧹 Cleaning up test individual...")
            supabase.table("individuals").delete().eq("id", individual_id).execute()
            supabase.table("individual_embeddings").delete().eq("individual_id", individual_id).execute()
            print("✅ Cleanup completed")
            
        else:
            print("❌ Failed to create test individual")
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_auto_embeddings())
