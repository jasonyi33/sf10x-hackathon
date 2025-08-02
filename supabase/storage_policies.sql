-- Storage bucket configuration for hackathon MVP
-- Supabase Storage automatically handles authentication for private buckets
-- No custom RLS policies needed for MVP

-- For reference: audio files will be stored as:
-- audio/{user_id}/{timestamp}.m4a

-- The bucket should be configured as:
-- 1. Name: audio
-- 2. Public: OFF (private bucket)
-- 3. File size limit: 5MB
-- 4. Allowed MIME types: audio/mp4, audio/x-m4a, audio/m4a

-- Authenticated users can automatically:
-- - Upload files to the bucket
-- - Download files from the bucket
-- - Delete their own files

-- Note: For production, you would add custom RLS policies
-- to restrict users to their own folders only