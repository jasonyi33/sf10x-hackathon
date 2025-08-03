-- Migration 005: Search Performance Optimization Indexes
-- This migration adds indexes to optimize search performance for Phase 3
-- Run this AFTER migration 004_add_photos_age.sql

-- 1. Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create GIN index for name with trigram support (for LIKE/ILIKE queries)
-- Drop existing basic index first if it exists
DROP INDEX IF EXISTS idx_individuals_name;
CREATE INDEX IF NOT EXISTS idx_individuals_name_gin ON individuals USING gin(name gin_trgm_ops);

-- 3. Gender index for filter queries
CREATE INDEX IF NOT EXISTS idx_individuals_gender ON individuals((data->>'gender'));

-- 4. Age range indexes for min and max values
-- These help with age overlap queries
CREATE INDEX IF NOT EXISTS idx_individuals_age_min ON individuals(((data->'approximate_age'->0)::int));
CREATE INDEX IF NOT EXISTS idx_individuals_age_max ON individuals(((data->'approximate_age'->1)::int));

-- 5. Has photo index (boolean expression index)
CREATE INDEX IF NOT EXISTS idx_individuals_has_photo ON individuals((photo_url IS NOT NULL));

-- 6. Danger score index for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_individuals_danger ON individuals(danger_score);

-- 7. Updated at index for last_seen sorting
CREATE INDEX IF NOT EXISTS idx_individuals_updated ON individuals(updated_at);

-- 8. Height index for range queries
CREATE INDEX IF NOT EXISTS idx_individuals_height ON individuals(((data->>'height')::int));

-- 9. Weight index for potential future use
CREATE INDEX IF NOT EXISTS idx_individuals_weight ON individuals(((data->>'weight')::int));

-- 10. Skin color index for filter queries
CREATE INDEX IF NOT EXISTS idx_individuals_skin_color ON individuals((data->>'skin_color'));

-- 11. Compound index for danger override check
CREATE INDEX IF NOT EXISTS idx_individuals_danger_composite ON individuals(danger_score, danger_override);

-- 12. Add index on interactions for faster last_seen queries
CREATE INDEX IF NOT EXISTS idx_interactions_individual_created ON interactions(individual_id, created_at DESC);

-- 13. Analyze tables to update statistics for query planner
ANALYZE individuals;
ANALYZE interactions;

-- 14. Add comments for documentation
COMMENT ON INDEX idx_individuals_name_gin IS 'GIN index with trigram support for fast text search on names';
COMMENT ON INDEX idx_individuals_gender IS 'Index on gender field in JSONB data for filter queries';
COMMENT ON INDEX idx_individuals_age_min IS 'Index on minimum age for age range overlap queries';
COMMENT ON INDEX idx_individuals_age_max IS 'Index on maximum age for age range overlap queries';
COMMENT ON INDEX idx_individuals_has_photo IS 'Boolean expression index for has_photo filter';
COMMENT ON INDEX idx_individuals_danger IS 'Index on danger_score for sorting and filtering';
COMMENT ON INDEX idx_individuals_updated IS 'Index on updated_at for last_seen sorting';
COMMENT ON INDEX idx_interactions_individual_created IS 'Compound index for efficient last interaction lookup';

-- 15. Create helper function to check query performance (for testing)
CREATE OR REPLACE FUNCTION explain_query(query_text text)
RETURNS TABLE(query_plan text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ' || query_text;
END;
$$;

-- 16. Create function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE(
    tablename text,
    indexname text,
    idx_scan bigint,
    idx_tup_read bigint,
    idx_tup_fetch bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        schemaname || '.' || tablename AS tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC;
$$;

-- Print confirmation
DO $$
BEGIN
    RAISE NOTICE 'Search performance indexes created successfully';
    RAISE NOTICE 'Run ANALYZE to update statistics for optimal query planning';
END $$;