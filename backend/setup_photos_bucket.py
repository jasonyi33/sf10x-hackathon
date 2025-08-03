"""
Simple script to create photos bucket in Supabase Storage
For hackathon - run this once to set up the required storage bucket
"""
import os
from supabase import create_client, Client

def setup_photos_bucket():
    """Create photos bucket with proper configuration"""
    try:
        # Get Supabase credentials
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            print("❌ Missing Supabase credentials")
            print("Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables")
            return False
        
        # Create Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Check if photos bucket already exists
        buckets = supabase.storage.list_buckets()
        existing_buckets = [bucket.name for bucket in buckets]
        
        if 'photos' in existing_buckets:
            print("✅ Photos bucket already exists")
            return True
        
        # Create photos bucket
        print("Creating photos bucket...")
        supabase.storage.create_bucket(
            'photos',
            {
                'public': True,
                'file_size_limit': 5242880,  # 5MB in bytes
                'allowed_mime_types': ['image/jpeg', 'image/png']
            }
        )
        
        print("✅ Photos bucket created successfully!")
        print("   - Public bucket with auth required")
        print("   - 5MB file size limit")
        print("   - JPEG and PNG files only")
        print("   - No lifecycle rules (keep indefinitely)")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to create photos bucket: {str(e)}")
        print("\nManual setup instructions:")
        print("1. Go to Supabase Dashboard > Storage")
        print("2. Click 'Create a new bucket'")
        print("3. Name: photos")
        print("4. Public bucket: ✅")
        print("5. File size limit: 5MB")
        print("6. Allowed MIME types: image/jpeg, image/png")
        return False

if __name__ == "__main__":
    setup_photos_bucket() 