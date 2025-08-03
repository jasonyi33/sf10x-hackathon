#!/usr/bin/env python3
"""
Debug script to find what's wrong with Whisper transcription
Since the sk-proj key worked yesterday, something else changed.
"""
import os
import sys
import asyncio
import tempfile
import traceback
from dotenv import load_dotenv
from openai import AsyncOpenAI

async def debug_whisper_issue():
    print("🔍 DEBUGGING WHISPER ISSUE")
    print("=" * 50)
    print("🕒 Since your sk-proj- key worked YESTERDAY, let's find what changed...")
    print()
    
    # 1. Check environment loading
    print("1️⃣ CHECKING ENVIRONMENT...")
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("❌ No API key found!")
        print("💡 Check if .env file exists and has OPENAI_API_KEY")
        return
    
    print(f"✅ API key loaded: {api_key[:15]}...{api_key[-4:]}")
    print(f"🔑 Key type: {'Project Key' if api_key.startswith('sk-proj-') else 'Regular Key'}")
    print()
    
    # 2. Test OpenAI client creation
    print("2️⃣ TESTING CLIENT CREATION...")
    try:
        client = AsyncOpenAI(api_key=api_key)
        print("✅ OpenAI client created successfully")
    except Exception as e:
        print(f"❌ Client creation failed: {e}")
        return
    print()
    
    # 3. Test basic API access
    print("3️⃣ TESTING BASIC API ACCESS...")
    try:
        # Try to list models first
        models = await client.models.list()
        print(f"✅ Can access models API ({len(models.data)} models available)")
        
        # Check if whisper-1 is available
        model_ids = [m.id for m in models.data]
        if "whisper-1" in model_ids:
            print("✅ whisper-1 model is available")
        else:
            print("⚠️ whisper-1 model not found in available models")
            print(f"Available audio models: {[m for m in model_ids if 'whisper' in m.lower()]}")
    except Exception as e:
        print(f"❌ API access failed: {e}")
        print("🔍 Full error details:")
        traceback.print_exc()
        return
    print()
    
    # 4. Test simple chat completion (to confirm key works for other APIs)
    print("4️⃣ TESTING GPT API (to confirm key works)...")
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Say 'test' only"}],
            max_tokens=1
        )
        print(f"✅ GPT API works: '{response.choices[0].message.content}'")
    except Exception as e:
        print(f"❌ GPT API failed: {e}")
        if "401" in str(e):
            print("🚨 API key is invalid for ALL OpenAI APIs!")
            return
        print("⚠️ GPT failed but continuing to test Whisper...")
    print()
    
    # 5. Test Whisper with detailed error handling
    print("5️⃣ TESTING WHISPER API (with detailed error info)...")
    try:
        # Create minimal test audio
        test_audio = create_minimal_audio()
        print(f"📁 Created test audio: {test_audio}")
        
        # Test Whisper
        with open(test_audio, 'rb') as audio_file:
            print("🎤 Calling Whisper API...")
            response = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        
        # Clean up
        os.unlink(test_audio)
        
        print(f"✅ WHISPER WORKS! Response: '{response[:50]}...'")
        print("🎉 Your transcription should work now!")
        
    except Exception as e:
        # Clean up
        try:
            os.unlink(test_audio)
        except:
            pass
        
        print(f"❌ WHISPER FAILED: {e}")
        print("🔍 Full error details:")
        traceback.print_exc()
        
        error_str = str(e)
        print(f"\n📋 ERROR ANALYSIS:")
        
        if "401" in error_str:
            print("🔑 401 Unauthorized - API key issue")
            if "Incorrect API key" in error_str:
                print("   - The key format might have changed")
                print("   - Try regenerating your project key")
                print("   - Or create a new regular key (sk-)")
        elif "quota" in error_str.lower():
            print("💳 Quota exceeded - check your OpenAI billing")
        elif "rate" in error_str.lower():
            print("🚦 Rate limited - wait a moment and try again")
        elif "model" in error_str.lower():
            print("🤖 Model issue - whisper-1 might be temporarily unavailable")
        elif "timeout" in error_str.lower():
            print("⏰ Timeout - OpenAI API might be slow")
        else:
            print(f"🤔 Unknown error: {error_str}")
        
        print(f"\n💡 POSSIBLE SOLUTIONS:")
        print("1. Check your OpenAI account status at: https://platform.openai.com/usage")
        print("2. Try regenerating your API key")
        print("3. Check if you have remaining quota")
        print("4. Wait a few minutes and try again")

def create_minimal_audio():
    """Create the smallest possible valid audio file for testing"""
    import wave
    import struct
    
    # Create 0.1 second of silence (minimal but valid)
    sample_rate = 16000
    duration = 0.1
    
    frames = []
    for i in range(int(duration * sample_rate)):
        # Silence (value 0)
        frames.append(struct.pack('<h', 0))
    
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    
    with wave.open(temp_file.name, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 2 bytes per sample
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(b''.join(frames))
    
    return temp_file.name

if __name__ == "__main__":
    asyncio.run(debug_whisper_issue())