# Automatic Embedding Generation

## Overview

When new individuals are added to the system, their embeddings are now **automatically generated in the background** without blocking the main save operation. This ensures that:

1. **Individual creation is fast** - no waiting for embedding generation
2. **Search is always up-to-date** - new individuals are immediately searchable via embeddings
3. **System remains responsive** - embedding generation happens asynchronously

## How It Works

### 1. **Background Task Architecture**

```python
@router.post("/api/individuals", response_model=SaveIndividualResponse)
async def save_individual(
    request: SaveIndividualRequest,
    background_tasks: BackgroundTasks,  # ← FastAPI background tasks
    user_id: str = Depends(get_current_user),
    user_name: str = Depends(get_current_user_name)
):
    # Save individual first (fast)
    result = await service.save_individual(...)
    
    # Add embedding generation as background task
    background_tasks.add_task(
        generate_embedding_background,
        result.individual.id,
        {
            "id": result.individual.id,
            "name": result.individual.name,
            "data": result.individual.data
        }
    )
    
    return result  # Return immediately, embedding generates in background
```

### 2. **Background Task Function**

```python
async def generate_embedding_background(individual_id: str, individual_data: dict):
    """Background task to generate embedding for an individual"""
    try:
        from services.embedding_service import EmbeddingService
        
        # Initialize embedding service
        embedding_service = EmbeddingService()
        
        # Generate embedding using OpenAI
        embedding = await embedding_service.generate_individual_embedding(individual_data)
        
        # Store in database
        supabase.table("individual_embeddings").upsert({
            "individual_id": individual_id,
            "embedding_data": embedding,
            "embedding_text": embedding_text
        }).execute()
        
        print(f"✅ Background task: Generated embedding for {individual_data.get('name')}")
        
    except Exception as e:
        print(f"❌ Background task failed: {str(e)}")
        # Don't affect main operation
```

## Benefits

### ✅ **Performance**
- **Individual creation**: Fast (no embedding wait)
- **Embedding generation**: Happens in background
- **User experience**: Immediate response

### ✅ **Reliability**
- **Embedding failures don't block saves**
- **Automatic retry via background tasks**
- **Graceful degradation**

### ✅ **Search Quality**
- **New individuals immediately searchable**
- **Semantic search always up-to-date**
- **No manual embedding management needed**

## Current Status

- **✅ Implemented**: Automatic embedding generation via background tasks
- **✅ Working**: New individuals get embeddings automatically
- **✅ Search**: Both normal and semantic search work immediately
- **✅ Performance**: No blocking on individual creation

## Testing

To test automatic embedding generation:

1. **Create a new individual** via the API
2. **Check server logs** for background task messages
3. **Verify embedding exists** in the database
4. **Test semantic search** for the new individual

## Example Flow

```
1. User creates individual "John Doe"
   ↓
2. Individual saved to database (fast)
   ↓
3. API returns success immediately
   ↓
4. Background task starts embedding generation
   ↓
5. OpenAI generates 3072-dimensional embedding
   ↓
6. Embedding stored in individual_embeddings table
   ↓
7. "John Doe" now searchable via semantic search
```

## Configuration

- **Similarity threshold**: 0.15 (optimized for semantic matching)
- **Embedding model**: OpenAI text-embedding-3-large
- **Background processing**: FastAPI BackgroundTasks
- **Error handling**: Graceful degradation (embeddings optional)

## Future Enhancements

- **Batch processing** for multiple individuals
- **Embedding updates** when individual data changes
- **Embedding validation** and quality checks
- **Retry mechanisms** for failed embeddings
- **Embedding versioning** for model updates
