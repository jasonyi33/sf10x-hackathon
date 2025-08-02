#!/usr/bin/env python3
"""
Simple integration test for the complete transcription flow
"""
import asyncio
import httpx
import json
import time
from tests.test_api_integration import TEST_AUDIO_FILES

BASE_URL = "http://localhost:8001"
TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIn0.test"

async def run_integration_test():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        
        print("="*60)
        print("INTEGRATION TEST: Complete Transcription Flow")
        print("="*60)
        
        # Test 1: Categories endpoint
        print("\n1. Testing GET /api/categories...")
        response = await client.get("/api/categories", headers=headers)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Found {len(data['categories'])} categories")
        
        # Test 2: Complete transcription flow
        print("\n2. Testing complete transcription flow...")
        
        # Check if URLs are configured
        first_url = TEST_AUDIO_FILES["john"]["url"]
        if "YOUR-PROJECT" in first_url:
            print("   ❌ Test audio URLs not configured!")
            print("   Please upload M4A files to Supabase and update the URLs")
            return
        
        # Test each audio file
        for name, test_data in TEST_AUDIO_FILES.items():
            print(f"\n   Testing '{name}' audio file...")
            print(f"   URL: {test_data['url'][:50]}...")
            
            start_time = time.time()
            
            response = await client.post(
                "/api/transcribe",
                json={
                    "audio_url": test_data["url"],
                    "location": {"latitude": 37.7749, "longitude": -122.4194}
                },
                headers=headers
            )
            
            elapsed = time.time() - start_time
            print(f"   Status: {response.status_code} (took {elapsed:.2f}s)")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Transcription: {result['transcription'][:50]}...")
                print(f"   ✅ Extracted name: {result['categorized_data'].get('name')}")
                print(f"   ✅ Missing fields: {result['missing_required']}")
                print(f"   ✅ Potential matches: {len(result['potential_matches'])}")
                
                # Verify expected data
                expected = test_data["expected_data"]
                actual = result["categorized_data"]
                
                for field in ["name", "skin_color"]:
                    if actual.get(field) == expected.get(field):
                        print(f"   ✅ {field}: {actual.get(field)}")
                    else:
                        print(f"   ❌ {field}: expected {expected.get(field)}, got {actual.get(field)}")
                
                # Check height (allow small variance)
                if abs(actual.get("height", 0) - expected.get("height", 0)) <= 2:
                    print(f"   ✅ height: {actual.get('height')} inches")
                else:
                    print(f"   ❌ height: expected ~{expected.get('height')}, got {actual.get('height')}")
                    
            else:
                print(f"   ❌ Error: {response.text}")
        
        # Test 3: Duplicate detection
        print("\n3. Testing duplicate detection...")
        print("   Running same audio twice to check for duplicates...")
        
        # First run
        response1 = await client.post(
            "/api/transcribe",
            json={"audio_url": TEST_AUDIO_FILES["john"]["url"]},
            headers=headers
        )
        
        # Second run (should find duplicate)
        response2 = await client.post(
            "/api/transcribe",
            json={"audio_url": TEST_AUDIO_FILES["john"]["url"]},
            headers=headers
        )
        
        if response2.status_code == 200:
            matches = response2.json()["potential_matches"]
            if matches and matches[0]["confidence"] > 90:
                print(f"   ✅ Found duplicate with {matches[0]['confidence']}% confidence")
            else:
                print(f"   ❌ No high-confidence duplicate found")
        
        # Test 4: Error handling
        print("\n4. Testing error handling...")
        
        # Invalid URL
        response = await client.post(
            "/api/transcribe",
            json={"audio_url": "not-a-url"},
            headers=headers
        )
        if response.status_code == 400:
            print("   ✅ Invalid URL rejected")
        
        # Non-Supabase URL
        response = await client.post(
            "/api/transcribe",
            json={"audio_url": "https://example.com/test.m4a"},
            headers=headers
        )
        if response.status_code == 400:
            print("   ✅ Non-Supabase URL rejected")
        
        print("\n" + "="*60)
        print("Integration test complete!")
        print("="*60)

if __name__ == "__main__":
    asyncio.run(run_integration_test())