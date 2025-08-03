# Photos Bucket Storage Policies

## ⚠️ Action Required

The photos bucket has been created, but you need to apply Row Level Security (RLS) policies to control access.

## How to Apply Policies

### Method 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the following SQL:

```sql
-- Storage policies for photos bucket
-- These ensure proper access control

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
```

4. Click **Run**

### Method 2: Check Existing Policies
If you get errors about policies already existing:
1. Go to **Authentication** → **Policies**
2. Check the `storage.objects` table policies
3. Verify the photos bucket policies are configured correctly

## What These Policies Do

1. **Upload Policy**: Only authenticated users can upload photos
2. **View Policy (Auth)**: Authenticated users can view all photos
3. **Delete Policy**: Users can only delete photos in their own folder
4. **View Policy (Public)**: Anyone can view photos via public URL

## Verification

After applying policies, test by:
1. Uploading a test photo (should work for authenticated users)
2. Getting public URL (should be accessible without auth)
3. Trying to delete someone else's photo (should fail)

## Security Notes

- Photos are publicly viewable via URL (needed for app display)
- Only authenticated users can upload
- Users can only delete their own photos
- No one can update/modify existing photos