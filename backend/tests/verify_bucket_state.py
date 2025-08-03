#!/usr/bin/env python3
"""
Quick verification of photos bucket state
Run this before and after creating the bucket
"""
import os
from supabase import create_client
from dotenv import load_dotenv
import json

load_dotenv()

def check_bucket_state():
    """Check if photos bucket exists and its configuration"""
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not url or not service_key:
        print("❌ Missing Supabase credentials")
        return
    
    try:
        supabase = create_client(url, service_key)
        
        # List all buckets
        buckets = supabase.storage.list_buckets()
        
        print("📦 Current Storage Buckets:")
        print("-" * 40)
        
        if not buckets:
            print("No buckets found")
        else:
            # Handle different response formats
            if isinstance(buckets, list):
                bucket_list = buckets
            elif hasattr(buckets, '__iter__'):
                bucket_list = list(buckets)
            else:
                bucket_list = []
            
            for bucket in bucket_list:
                # Handle bucket as object or dict
                if hasattr(bucket, 'name'):
                    name = bucket.name
                    public = getattr(bucket, 'public', False)
                    created = getattr(bucket, 'created_at', 'Unknown')
                    bucket_id = getattr(bucket, 'id', 'Unknown')
                else:
                    name = bucket.get('name', 'Unknown')
                    public = bucket.get('public', False)
                    created = bucket.get('created_at', 'Unknown')
                    bucket_id = bucket.get('id', 'Unknown')
                
                print(f"\n• {name}")
                print(f"  - Public: {public}")
                print(f"  - Created: {created}")
                print(f"  - ID: {bucket_id}")
        
        # Check specifically for photos bucket
        photos_bucket = None
        if isinstance(buckets, list):
            photos_bucket = next((b for b in buckets if (hasattr(b, 'name') and b.name == 'photos') or (isinstance(b, dict) and b.get('name') == 'photos')), None)
        elif hasattr(buckets, '__iter__'):
            for b in buckets:
                if (hasattr(b, 'name') and b.name == 'photos') or (isinstance(b, dict) and b.get('name') == 'photos'):
                    photos_bucket = b
                    break
        
        print("\n" + "=" * 40)
        if photos_bucket:
            print("✅ Photos bucket EXISTS")
            print(f"\nConfiguration:")
            # Convert to dict if it's an object
            if hasattr(photos_bucket, '__dict__'):
                config = {k: v for k, v in photos_bucket.__dict__.items() if not k.startswith('_')}
            else:
                config = photos_bucket
            try:
                print(json.dumps(config, indent=2, default=str))
            except:
                print(f"Raw: {photos_bucket}")
        else:
            print("❌ Photos bucket NOT FOUND")
            print("\nTo create it, run:")
            print("python scripts/create_photos_bucket.py")
        
    except Exception as e:
        print(f"❌ Error checking buckets: {str(e)}")
        if "unauthorized" in str(e).lower():
            print("\n💡 Make sure you're using SUPABASE_SERVICE_KEY (not anon key)")


if __name__ == "__main__":
    print("🔍 Checking Photos Bucket State\n")
    check_bucket_state()