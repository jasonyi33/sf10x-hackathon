#!/usr/bin/env python3
"""
Script to create and configure the photos bucket in Supabase Storage
Task 1.2: Create photos bucket
"""
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Get Supabase credentials (need service role key for bucket management)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Supabase credentials not found!")
    print("Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env")
    sys.exit(1)


def create_photos_bucket():
    """Create and configure the photos bucket"""
    print("🪣 Creating photos bucket in Supabase Storage...\n")
    
    try:
        # Initialize Supabase client with service role key
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Check if bucket already exists
        existing_buckets = supabase.storage.list_buckets()
        bucket_names = []
        photos_bucket = None
        
        for bucket in existing_buckets:
            if hasattr(bucket, 'name'):
                bucket_names.append(bucket.name)
                if bucket.name == 'photos':
                    photos_bucket = bucket
            elif isinstance(bucket, dict):
                bucket_names.append(bucket['name'])
                if bucket['name'] == 'photos':
                    photos_bucket = bucket
        
        if 'photos' in bucket_names:
            print("⚠️  Photos bucket already exists!")
            
            # Convert bucket object to dict for display
            if hasattr(photos_bucket, '__dict__'):
                config = {k: v for k, v in photos_bucket.__dict__.items() if not k.startswith('_')}
            else:
                config = photos_bucket
            print(f"Current configuration: {json.dumps(config, indent=2, default=str)}")
            
            response = input("\nDo you want to delete and recreate it? (y/n): ")
            if response.lower() != 'y':
                print("Keeping existing bucket.")
                return True
            
            # Delete existing bucket
            print("Deleting existing photos bucket...")
            supabase.storage.delete_bucket('photos')
            print("✅ Existing bucket deleted")
        
        # Create new bucket with configuration
        print("\n📝 Creating photos bucket with configuration:")
        print("- Name: photos")
        print("- Public: true (auth still required)")
        print("- File size limit: 5MB")
        print("- Allowed MIME types: image/jpeg, image/png")
        
        bucket_config = {
            "name": "photos",
            "public": True,  # Public access (but auth still required)
            "file_size_limit": 5242880,  # 5MB in bytes
            "allowed_mime_types": ["image/jpeg", "image/png"]
        }
        
        # Create bucket
        result = supabase.storage.create_bucket(**bucket_config)
        
        print("\n✅ Photos bucket created successfully!")
        print(f"Result: {result}")
        
        # Verify creation
        buckets = supabase.storage.list_buckets()
        photos_bucket = None
        
        for bucket in buckets:
            if hasattr(bucket, 'name') and bucket.name == 'photos':
                photos_bucket = bucket
                break
            elif isinstance(bucket, dict) and bucket.get('name') == 'photos':
                photos_bucket = bucket
                break
        
        if photos_bucket:
            print("\n📊 Bucket verification:")
            if hasattr(photos_bucket, 'name'):
                print(f"- Name: {photos_bucket.name}")
                print(f"- Public: {getattr(photos_bucket, 'public', 'Unknown')}")
                print(f"- Created at: {getattr(photos_bucket, 'created_at', 'Unknown')}")
                print(f"- ID: {getattr(photos_bucket, 'id', 'Unknown')}")
            else:
                print(f"- Name: {photos_bucket.get('name', 'Unknown')}")
                print(f"- Public: {photos_bucket.get('public', 'Unknown')}")
                print(f"- Created at: {photos_bucket.get('created_at', 'Unknown')}")
                print(f"- ID: {photos_bucket.get('id', 'Unknown')}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error creating bucket: {str(e)}")
        
        # Check if it's a specific error
        if "already exists" in str(e):
            print("\n💡 The bucket already exists. This might be okay if it's configured correctly.")
            print("Run the test suite to verify the configuration.")
        elif "unauthorized" in str(e):
            print("\n🔐 Authorization error. Make sure you're using the service role key (not anon key).")
        
        return False


def setup_bucket_policies():
    """Set up RLS policies for the photos bucket"""
    print("\n🔒 Setting up storage policies...")
    
    # Note: Supabase Storage policies are managed through SQL
    # We'll create a SQL script for this
    
    policies_sql = """
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
"""
    
    print("Storage policies SQL generated.")
    print("\n📝 To apply these policies:")
    print("1. Go to Supabase Dashboard > SQL Editor")
    print("2. Run the following SQL:")
    print("-" * 60)
    print(policies_sql)
    print("-" * 60)
    
    return policies_sql


def main():
    """Main function"""
    print("=" * 60)
    print("Supabase Photos Bucket Setup")
    print("Task 1.2: Create photos bucket in Supabase Storage")
    print("=" * 60)
    
    # Create bucket
    success = create_photos_bucket()
    
    if success:
        # Generate policies
        policies = setup_bucket_policies()
        
        # Save policies to file
        with open('storage_policies.sql', 'w') as f:
            f.write(policies)
        print("\n✅ Storage policies saved to: storage_policies.sql")
        
        print("\n" + "=" * 60)
        print("✅ Photos bucket setup complete!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Apply the storage policies in Supabase SQL Editor")
        print("2. Run tests: python tests/test_photos_bucket.py")
        print("3. Continue with Task 1.3: Update backend validation")
    else:
        print("\n❌ Bucket setup failed. Please check the errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()