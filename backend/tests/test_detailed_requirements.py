#!/usr/bin/env python3
"""
Detailed test to verify all PRD requirements are met
"""
import asyncio
import httpx
import json
from tests.test_api_integration import TEST_AUDIO_FILES

BASE_URL = "http://localhost:8001"
TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIn0.test"

async def run_detailed_test():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        
        print("="*60)
        print("DETAILED REQUIREMENTS TEST")
        print("="*60)
        
        # Test 1: Verify all required fields from PRD
        print("\n1. Testing Required Fields (PRD lines 131-137)")
        print("   Required: Name, Height, Weight, Skin Color")
        
        for name, test_data in TEST_AUDIO_FILES.items():
            print(f"\n   Testing '{name}' audio...")
            
            response = await client.post(
                "/api/transcribe",
                json={
                    "audio_url": test_data["url"],
                    "location": {"latitude": 37.7749, "longitude": -122.4194}
                },
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                data = result["categorized_data"]
                missing = result["missing_required"]
                
                print(f"\n   Transcription: {result['transcription'][:80]}...")
                print(f"\n   Extracted Data:")
                print(f"   - Name: {data.get('name')} {'✅' if 'name' in data else '❌ MISSING'}")
                print(f"   - Height: {data.get('height')} {'✅' if 'height' in data else '❌ MISSING'}")
                print(f"   - Weight: {data.get('weight')} {'✅' if 'weight' in data else '❌ MISSING'}")
                print(f"   - Skin Color: {data.get('skin_color')} {'✅' if 'skin_color' in data else '❌ MISSING'}")
                
                print(f"\n   Missing Required Fields: {missing}")
                
                # Check if any required fields are missing
                if missing:
                    print(f"   ⚠️  WARNING: Required fields missing! {missing}")
                
                # Verify skin color mapping (PRD line 136)
                if data.get('skin_color'):
                    valid_colors = ["Light", "Medium", "Dark"]
                    if data['skin_color'] in valid_colors:
                        print(f"   ✅ Skin color correctly mapped to: {data['skin_color']}")
                    else:
                        print(f"   ❌ Invalid skin color value: {data['skin_color']}")
                
                # Verify number ranges (PRD lines 134-135)
                if 'height' in data:
                    if 0 <= data['height'] <= 300:
                        print(f"   ✅ Height within valid range (0-300)")
                    else:
                        print(f"   ❌ Height out of range: {data['height']}")
                
                if 'weight' in data:
                    if 0 <= data['weight'] <= 300:
                        print(f"   ✅ Weight within valid range (0-300)")
                    else:
                        print(f"   ❌ Weight out of range: {data['weight']}")
        
        # Test 2: Verify response format (PRD lines 382-428)
        print("\n\n2. Testing Response Format (PRD lines 382-428)")
        response = await client.post(
            "/api/transcribe",
            json={"audio_url": TEST_AUDIO_FILES["john"]["url"]},
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            required_fields = ["transcription", "categorized_data", "missing_required", "potential_matches"]
            
            for field in required_fields:
                if field in result:
                    print(f"   ✅ Response contains '{field}'")
                else:
                    print(f"   ❌ Response missing '{field}'")
        
        # Test 3: Test categories endpoint
        print("\n\n3. Testing Categories Endpoint")
        response = await client.get("/api/categories", headers=headers)
        
        if response.status_code == 200:
            categories = response.json()["categories"]
            print(f"   Found {len(categories)} categories")
            
            # Check for required preset categories
            required_categories = ["name", "height", "weight", "skin_color"]
            found_categories = [cat["name"] for cat in categories]
            
            for req_cat in required_categories:
                if req_cat in found_categories:
                    cat = next(c for c in categories if c["name"] == req_cat)
                    print(f"   ✅ {req_cat}: type={cat['type']}, required={cat['is_required']}")
                else:
                    print(f"   ❌ Missing required category: {req_cat}")
        
        # Test 4: Audio format validation (PRD line 76)
        print("\n\n4. Testing Audio URL Validation")
        
        # Non-Supabase URL
        response = await client.post(
            "/api/transcribe",
            json={"audio_url": "https://example.com/audio.m4a"},
            headers=headers
        )
        print(f"   Non-Supabase URL: {response.status_code} {'✅' if response.status_code == 400 else '❌'}")
        
        # Invalid URL format
        response = await client.post(
            "/api/transcribe",
            json={"audio_url": "not-a-url"},
            headers=headers
        )
        print(f"   Invalid URL format: {response.status_code} {'✅' if response.status_code == 400 else '❌'}")
        
        print("\n" + "="*60)
        print("Detailed test complete!")
        print("="*60)

if __name__ == "__main__":
    asyncio.run(run_detailed_test())