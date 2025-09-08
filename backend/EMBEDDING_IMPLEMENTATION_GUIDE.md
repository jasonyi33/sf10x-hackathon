# Embedding Search Implementation Guide

This guide explains how to set up and use the embedding-based semantic search functionality for individual profiles.

## Overview

The embedding search system uses OpenAI's `text-embedding-3-large` model to create vector representations of individual profiles, enabling semantic search across all profile data including:

- Names
- Physical attributes (age, height, weight, skin color, gender)
- Medical conditions
- Substance abuse history
- Veteran status
- Housing status
- Behavioral patterns
- Danger scores

## Architecture

```
Frontend Search → API Call → Embedding Service → OpenAI API → Vector Similarity → Results
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

The requirements now include:
- `numpy>=1.24.0` - For vector operations
- `scikit-learn>=1.3.0` - For cosine similarity calculations

### 2. Database Migration

Run the migration to create the embeddings table:

```bash
# Connect to your database and run:
psql -d your_database -f migrations/add_embeddings_table.sql
```

Or manually execute the SQL from `migrations/add_embeddings_table.sql`.

### 3. Environment Variables

Ensure your `.env` file contains:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Generate Initial Embeddings

Run the setup script to generate embeddings for all existing individuals:

```bash
cd backend
python setup_embeddings.py
```

This script will:
- Connect to your database
- Find all existing individuals
- Generate embeddings for each profile
- Store embeddings in the `individual_embeddings` table

**Note**: This process uses OpenAI API calls and may take time depending on the number of individuals. The script includes rate limiting to avoid API limits.

### 5. Start the Backend

```bash
cd backend
python main.py
```

## API Endpoints

### Generate Embedding for Individual
```
POST /api/embeddings/generate
Body: {"individual_id": "uuid"}
```

### Semantic Search
```
POST /api/embeddings/search
Body: {
  "query": "search text",
  "top_k": 10,
  "similarity_threshold": 0.7
}
```

### Generate All Embeddings
```
POST /api/embeddings/generate-all
```

### Get Embedding Status
```
GET /api/embeddings/status
```

## Frontend Integration

The frontend automatically uses semantic search when available, with fallback to regular search:

1. **SearchScreen** calls `api.semanticSearchIndividuals()`
2. If semantic search fails, it falls back to `api.searchIndividuals()`
3. Results include similarity scores when available
4. **SearchResultItem** displays match percentages for embedding results

## How It Works

### 1. Embedding Generation
When an individual profile is created/updated:
- All profile data is combined into a comprehensive text representation
- OpenAI's `text-embedding-3-large` generates a 3072-dimensional vector
- The vector is stored in the database as JSON

### 2. Search Process
When a user searches:
- The search query is converted to an embedding
- Cosine similarity is calculated between query and all profile embeddings
- Results are ranked by similarity score
- Top matches above the threshold are returned

### 3. Text Representation
Example of how profile data is converted to text for embedding:

```
"Name: John Doe Age: 45 years old Height: 72 inches Weight: 180 pounds 
Skin color: Light Gender: Male Substance abuse: Moderate Medical conditions: Diabetes 
Veteran status: No Housing status: Homeless Danger score: 75"
```

## Performance Considerations

### Database Storage
- Each embedding is ~12KB (3072 floats × 4 bytes)
- For 1000 individuals: ~12MB storage
- Consider archiving old embeddings if storage becomes an issue

### API Costs
- `text-embedding-3-large`: $0.00013 per 1K tokens
- Typical profile: ~50-100 tokens
- 1000 profiles: ~$0.0065 to generate all embeddings

### Search Performance
- Cosine similarity calculation: O(n) where n = number of individuals
- For large datasets (>10K), consider:
  - Vector database (pgvector, Pinecone)
  - Approximate nearest neighbor search
  - Embedding clustering/indexing

## Monitoring and Maintenance

### Check Embedding Coverage
```bash
curl http://localhost:8000/api/embeddings/status
```

### Regenerate Embeddings
If you need to regenerate all embeddings:
```bash
curl -X POST http://localhost:8000/api/embeddings/generate-all
```

### Individual Updates
When individual profiles are updated, regenerate their embedding:
```bash
curl -X POST http://localhost:8000/api/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"individual_id": "uuid"}'
```

## Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Check API key validity
   - Verify rate limits
   - Check API quota

2. **Database Errors**
   - Ensure migrations ran successfully
   - Check database permissions
   - Verify table structure

3. **Performance Issues**
   - Monitor API response times
   - Check database query performance
   - Consider reducing similarity threshold

### Debug Mode

Enable detailed logging in the embedding service by adding:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Future Enhancements

1. **Vector Database Integration**
   - Use pgvector for PostgreSQL
   - Implement approximate nearest neighbor search
   - Add vector indexing

2. **Embedding Caching**
   - Cache frequently accessed embeddings
   - Implement embedding versioning
   - Add embedding compression

3. **Advanced Search Features**
   - Multi-modal search (text + metadata)
   - Filtered similarity search
   - Search result clustering

4. **Real-time Updates**
   - Webhook-based embedding regeneration
   - Incremental embedding updates
   - Background embedding generation

## Security Considerations

1. **API Key Management**
   - Store OpenAI API key securely
   - Use environment variables
   - Consider key rotation

2. **Data Privacy**
   - Embeddings contain profile information
   - Ensure database access controls
   - Consider embedding encryption

3. **Rate Limiting**
   - Implement API rate limiting
   - Monitor OpenAI API usage
   - Set appropriate thresholds

## Support

For issues or questions about the embedding implementation:
1. Check the logs for error messages
2. Verify database connectivity
3. Test OpenAI API access
4. Review this documentation

The system is designed to gracefully fall back to regular search if embedding search fails, ensuring continued functionality even during setup or maintenance.
