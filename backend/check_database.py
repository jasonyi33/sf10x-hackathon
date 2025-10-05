#!/usr/bin/env python3
"""
Check database contents and help debug issues
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
        return None
    
    return create_client(url, key)

def check_database_connection():
    """Check if we can connect to the database"""
    print("🔌 Checking database connection...")
    
    supabase = get_supabase_client()
    if not supabase:
        return False
    
    try:
        # Try a simple query
        response = supabase.table("individuals").select("count").execute()
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def list_individuals():
    """List all individuals with their IDs"""
    print("\n👥 Individuals in database:")
    print("-" * 50)
    
    supabase = get_supabase_client()
    if not supabase:
        return
    
    try:
        response = supabase.table("individuals").select("id, name, urgency_score, urgency_override, created_at").execute()
        
        if not response.data:
            print("❌ No individuals found")
            print("\n💡 To add demo data:")
            print("1. Run: python backend/load_demo_data.py")
            print("2. Or manually run the SQL in Supabase dashboard")
            return
        
        print(f"📊 Found {len(response.data)} individuals:")
        for i, individual in enumerate(response.data, 1):
            override_text = f" (override: {individual.get('urgency_override')})" if individual.get('urgency_override') else ""
            print(f"  {i:2d}. {individual['name']}")
            print(f"      ID: {individual['id']}")
            print(f"      Score: {individual['urgency_score']}{override_text}")
            print(f"      Created: {individual['created_at']}")
            print()
            
    except Exception as e:
        print(f"❌ Error listing individuals: {str(e)}")

def check_specific_individual(individual_id: str):
    """Check if a specific individual exists"""
    print(f"\n🔍 Checking individual: {individual_id}")
    print("-" * 50)
    
    supabase = get_supabase_client()
    if not supabase:
        return
    
    try:
        response = supabase.table("individuals").select("*").eq("id", individual_id).execute()
        
        if not response.data:
            print(f"❌ Individual {individual_id} not found")
            print("\n💡 Available individuals:")
            list_individuals()
            return
        
        individual = response.data[0]
        print(f"✅ Found individual: {individual['name']}")
        print(f"   ID: {individual['id']}")
        print(f"   Score: {individual['urgency_score']}")
        print(f"   Override: {individual.get('urgency_override', 'None')}")
        print(f"   Data: {individual['data']}")
        
    except Exception as e:
        print(f"❌ Error checking individual: {str(e)}")

def check_categories():
    """Check categories in database"""
    print("\n📂 Categories in database:")
    print("-" * 50)
    
    supabase = get_supabase_client()
    if not supabase:
        return
    
    try:
        response = supabase.table("categories").select("name, type, urgency_weight, auto_trigger").execute()
        
        if not response.data:
            print("❌ No categories found")
            return
        
        print(f"📊 Found {len(response.data)} categories:")
        for category in response.data:
            auto_trigger = " (auto-trigger)" if category.get('auto_trigger') else ""
            print(f"  • {category['name']} ({category['type']}) - Weight: {category.get('urgency_weight', 0)}{auto_trigger}")
            
    except Exception as e:
        print(f"❌ Error listing categories: {str(e)}")

def main():
    """Main function"""
    print("🏠 SF Homeless Outreach - Database Checker")
    print("=" * 50)
    
    # Check connection
    if not check_database_connection():
        print("\n❌ Cannot connect to database")
        print("Please check your environment variables:")
        print("- SUPABASE_URL")
        print("- SUPABASE_SERVICE_KEY")
        return
    
    # List individuals
    list_individuals()
    
    # List categories
    check_categories()
    
    # Check specific individual if provided
    if len(sys.argv) > 1:
        individual_id = sys.argv[1]
        check_specific_individual(individual_id)
    
    print("\n" + "=" * 50)
    print("✅ Database check complete")

if __name__ == "__main__":
    main()
