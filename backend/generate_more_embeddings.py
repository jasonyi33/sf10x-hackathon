#!/usr/bin/env python3
"""
Script to generate embeddings for more individuals to increase semantic search coverage
"""
import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client
from services.embedding_service import EmbeddingService

# Load environment variables
load_dotenv()

async def generate_more_embeddings():
    """Generate embeddings for more individuals"""
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
        
        # Get individuals that don't have embeddings yet
        print("🔍 Finding individuals without embeddings...")
        
        # Get all individuals
        all_result = supabase.table("individuals").select("id, name").execute()
        all_individuals = all_result.data
        
        # Get individuals that already have embeddings
        embeddings_result = supabase.table("individual_embeddings").select("individual_id").execute()
        existing_embedding_ids = {row['individual_id'] for row in embeddings_result.data} if embeddings_result.data else set()
        
        # Find individuals without embeddings
        individuals_needing_embeddings = [
            ind for ind in all_individuals 
            if ind['id'] not in existing_embedding_ids
        ]
        
        print(f"📊 Found {len(all_individuals)} total individuals")
        print(f"📊 Found {len(existing_embedding_ids)} existing embeddings")
        print(f"📝 Need to generate {len(individuals_needing_embeddings)} new embeddings")
        
        if not individuals_needing_embeddings:
            print("✅ All individuals already have embeddings!")
            return
        
        # Generate embeddings for individuals that need them
        print(f"📝 Generating embeddings for {len(individuals_needing_embeddings)} individuals...")
        
        generated_count = 0
        for i, individual in enumerate(individuals_needing_embeddings[:10], 1):  # Limit to 10 for now
            try:
                print(f"  [{i}/{min(10, len(individuals_needing_embeddings))}] Generating embedding for {individual.get('name', 'Unknown')}...")
                
                # Get full individual data
                full_result = supabase.table("individuals").select("*").eq("id", individual['id']).execute()
                if not full_result.data:
                    print(f"    ⚠️ Could not get full data for {individual['name']}")
                    continue
                
                full_individual = full_result.data[0]
                
                # Generate embedding
                embedding = await embedding_service.generate_individual_embedding(full_individual)
                
                # Create text representation
                text_parts = []
                if full_individual.get('name'):
                    text_parts.append(f"Name: {full_individual['name']}")
                if full_individual.get('data'):
                    data = full_individual['data']
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
    asyncio.run(generate_more_embeddings())
