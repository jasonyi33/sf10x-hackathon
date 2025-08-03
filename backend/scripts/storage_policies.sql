-- Storage policies for photos bucket
-- These should be run in Supabase SQL Editor

-- Allow authenticated users to upload photos
CREATE POLICY "Users can upload photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'photos');

-- Allow authenticated users to view all photos
CREATE POLICY "Users can view photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public to view photos (for app display)
CREATE POLICY "Public can view photos" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'photos');