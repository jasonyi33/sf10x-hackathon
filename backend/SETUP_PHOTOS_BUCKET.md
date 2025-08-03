# Photos Bucket Setup

## Task 1.1.2: Create Photos Bucket in Supabase Storage

### Option 1: Automated Setup (Recommended)

Run the setup script:
```bash
cd backend
python3 setup_photos_bucket.py
```

### Option 2: Manual Setup

If the script doesn't work, set up manually in Supabase Dashboard:

1. **Go to Supabase Dashboard**
   - Visit [https://app.supabase.com/](https://app.supabase.com/)
   - Select your project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar

3. **Create New Bucket**
   - Click "Create a new bucket"
   - **Name**: `photos`
   - **Public bucket**: ✅ Check this
   - **File size limit**: `5MB`
   - **Allowed MIME types**: `image/jpeg, image/png`
   - **Lifecycle rules**: Leave empty (keep indefinitely)

4. **Click "Create bucket"**

### Verification

The bucket should be created with:
- ✅ Public bucket with auth required
- ✅ 5MB file size limit
- ✅ JPEG and PNG files only
- ✅ No lifecycle rules (keep photos indefinitely)

This completes Task 1.1.2 for the hackathon! 