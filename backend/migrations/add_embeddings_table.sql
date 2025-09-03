-- Migration: Add embeddings table for semantic search
-- Date: 2024-01-XX

-- Create embeddings table
CREATE TABLE IF NOT EXISTS individual_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    individual_id UUID NOT NULL REFERENCES individuals(id) ON DELETE CASCADE,
    embedding_data JSONB NOT NULL, -- Store the 3072-dimensional embedding as JSON array
    embedding_text TEXT NOT NULL, -- Store the text used to generate the embedding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(individual_id)
);

-- Create index on individual_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_individual_embeddings_individual_id ON individual_embeddings(individual_id);

-- Create GIN index on embedding_data for vector operations (if using pgvector later)
-- CREATE INDEX IF NOT EXISTS idx_individual_embeddings_embedding_data ON individual_embeddings USING GIN (embedding_data);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_individual_embeddings_updated_at 
    BEFORE UPDATE ON individual_embeddings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial embeddings for existing individuals (this will be populated by the backend)
-- The backend will generate embeddings for all existing individuals when this migration runs
