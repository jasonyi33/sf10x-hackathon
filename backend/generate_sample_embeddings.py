#!/usr/bin/env python3
"""
Script to generate embeddings for a few individuals to test semantic search
"""
import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client
from services.embedding_service import EmbeddingService

# Load environment variables
load_dotenv()

async def generate_sample_embeddings():
    """Generate embeddings for a few individuals"""
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
        
        # Initialize embedding service
        embedding_service = EmbeddingService()
        
        # Get a few individuals to generate embeddings for
        result = supabase.table("individuals").select("*").limit(5).execute()
        
        if not result.data:
            print("❌ No individuals found in database")
            return
        
        individuals = result.data
        print(f"📝 Generating embeddings for {len(individuals)} individuals...")
        
        generated_count = 0
        for i, individual in enumerate(individuals, 1):
            try:
                print(f"  [{i}/{len(individuals)}] Generating embedding for {individual.get('name', 'Unknown')}...")
                
                # Generate embedding
                embedding = await embedding_service.generate_individual_embedding(individual)
                
                # Create text representation
                text_parts = []
                if individual.get('name'):
                    text_parts.append(f"Name: {individual['name']}")
                if individual.get('data'):
                    data = individual['data']
                    if isinstance(data, dict):
                        for key, value in data.items():
                            if value and str(value).strip():
                                text_parts.append(f"{key}: {value}")
                
                embedding_text = " | ".join(text_parts)
                
                # Store embedding in database
                supabase.table("individual_embeddings").upsert({
                    "individual_id": individual['id'],
                    "embedding_data": embedding,
                    "embedding_text": embedding_text
                }).execute()
                
                generated_count += 1
                print(f"    ✅ Success")
                
                # Rate limiting
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"    ❌ Error: {str(e)}")
                continue
        
        print(f"🎉 Generated embeddings for {generated_count} individuals!")
        
        # Verify embeddings were created
        try:
            result = supabase.table("individual_embeddings").select("id", count="exact").execute()
            count = result.count if hasattr(result, 'count') else len(result.data)
            print(f"📊 Total embeddings in database: {count}")
        except Exception as e:
            print(f"❌ Could not verify embeddings: {str(e)}")
        
    except Exception as e:
        print(f"❌ Failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(generate_sample_embeddings())
