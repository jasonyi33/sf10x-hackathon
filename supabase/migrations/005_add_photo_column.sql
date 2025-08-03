-- Add photo_url column to individuals table
ALTER TABLE individuals ADD COLUMN photo_url TEXT;

-- Add photo_url column to interactions table for photo uploads
ALTER TABLE interactions ADD COLUMN photo_url TEXT;

-- Update existing demo data to include some photo URLs (mock data)
UPDATE individuals 
SET photo_url = 'https://via.placeholder.com/200x200/007AFF/FFFFFF?text=Photo'
WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003'
); 