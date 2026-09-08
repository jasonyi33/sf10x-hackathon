#!/usr/bin/env python3
"""
Load demo data into the database
Run this script to populate the database with demo individuals
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Get Supabase client"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not url or not key:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment")
        print("Please set these in your .env file")
        return None
    
    return create_client(url, key)

def check_existing_data(supabase: Client):
    """Check what data already exists"""
    print("🔍 Checking existing data...")
    
    # Check individuals
    individuals_response = supabase.table("individuals").select("id, name").execute()
    individual_count = len(individuals_response.data) if individuals_response.data else 0
    print(f"📊 Found {individual_count} individuals in database")
    
    # Check categories
    categories_response = supabase.table("categories").select("name").execute()
    category_count = len(categories_response.data) if categories_response.data else 0
    print(f"📊 Found {category_count} categories in database")
    
    # Check interactions
    interactions_response = supabase.table("interactions").select("id").execute()
    interaction_count = len(interactions_response.data) if interactions_response.data else 0
    print(f"📊 Found {interaction_count} interactions in database")
    
    return individual_count, category_count, interaction_count

def load_demo_data():
    """Load demo data from SQL file"""
    print("🚀 Loading demo data...")
    
    # Get Supabase client
    supabase = get_supabase_client()
    if not supabase:
        return False
    
    # Check existing data
    individual_count, category_count, interaction_count = check_existing_data(supabase)
    
    if individual_count > 0:
        print(f"⚠️  Database already has {individual_count} individuals")
        response = input("Do you want to clear existing data and reload? (y/N): ")
        if response.lower() != 'y':
            print("✅ Keeping existing data")
            return True
    
    # Read and execute the demo data SQL
    demo_sql_path = Path(__file__).parent.parent / "supabase" / "migrations" / "003_demo_data.sql"
    
    if not demo_sql_path.exists():
        print(f"❌ Demo data SQL file not found at {demo_sql_path}")
        return False
    
    try:
        with open(demo_sql_path, 'r') as f:
            sql_content = f.read()
        
        # Split SQL into individual statements
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        print(f"📝 Executing {len(statements)} SQL statements...")
        
        for i, statement in enumerate(statements, 1):
            if statement.strip():
                print(f"  {i}/{len(statements)}: {statement[:50]}...")
                # Note: Supabase Python client doesn't support raw SQL execution
                # This would need to be done through the Supabase dashboard or CLI
                print("    ⚠️  Raw SQL execution not supported by Python client")
                print("    💡 Please run the SQL file manually in Supabase dashboard")
        
        print("\n📋 To load the demo data:")
        print("1. Go to your Supabase dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Copy and paste the contents of:")
        print(f"   {demo_sql_path}")
        print("4. Click 'Run' to execute")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading demo data: {str(e)}")
        return False

def list_individuals():
    """List all individuals in the database"""
    print("👥 Listing all individuals...")
    
    supabase = get_supabase_client()
    if not supabase:
        return
    
    try:
        response = supabase.table("individuals").select("id, name, urgency_score, urgency_override").execute()
        
        if not response.data:
            print("❌ No individuals found in database")
            return
        
        print(f"\n📋 Found {len(response.data)} individuals:")
        for individual in response.data:
            override_text = f" (override: {individual.get('urgency_override')})" if individual.get('urgency_override') else ""
            print(f"  • {individual['name']} (ID: {individual['id']}) - Score: {individual['urgency_score']}{override_text}")
            
    except Exception as e:
        print(f"❌ Error listing individuals: {str(e)}")

if __name__ == "__main__":
    print("🏠 SF Homeless Outreach - Demo Data Loader")
    print("=" * 50)
    
    # Load demo data
    success = load_demo_data()
    
    if success:
        print("\n✅ Demo data loading process completed")
        print("\n📋 Next steps:")
        print("1. Run the SQL file in Supabase dashboard")
        print("2. Run this script again to verify data was loaded")
        print("3. Test the mobile app with the new data")
        
        # List individuals after loading
        print("\n" + "=" * 50)
        list_individuals()
    else:
        print("\n❌ Demo data loading failed")
        print("Please check your environment variables and try again")
