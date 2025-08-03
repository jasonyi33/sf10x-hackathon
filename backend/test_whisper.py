#!/usr/bin/env python3
"""
Test script to verify OpenAI Whisper API
"""
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
import asyncio

async def test_whisper():
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
        
        # Create a simple test audio file (just for testing the API call)
        # We'll use a minimal audio file or test the API endpoint
        
        print("🎤 Testing Whisper API...")
        
        # Test if we can access the Whisper model
        # Note: We can't actually transcribe without a real audio file
        # But we can test if the API key has access to Whisper
        
        # Try to list models to see if Whisper is available
        models = await client.models.list()
        whisper_available = any("whisper" in model.id.lower() for model in models.data)
        
        if whisper_available:
            print("✅ Whisper API is available with this key!")
        else:
            print("⚠️ Whisper API might not be available with this key")
            print("Available models:", [model.id for model in models.data[:5]])
        
    except Exception as e:
        print(f"❌ Whisper API test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_whisper()) 