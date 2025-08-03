#!/usr/bin/env python3
"""
Test script to verify OpenAI API key
"""
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
import asyncio

async def test_api_key():
    # Load environment variables
    load_dotenv()
    
    # Get API key
    api_key = os.getenv("OPENAI_API_KEY")
    print(f"🔑 API Key loaded: {api_key[:20] if api_key else 'None'}...")
    
    if not api_key:
        print("❌ No API key found in environment")
        return
    
    try:
        # Create client
        client = AsyncOpenAI(api_key=api_key)
        
        # Test with a simple completion
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        
        print("✅ API key is working!")
        print(f"Response: {response.choices[0].message.content}")
        
    except Exception as e:
        print(f"❌ API key test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_api_key()) 