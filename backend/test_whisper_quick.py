#!/usr/bin/env python3
"""
Quick Whisper test - focused on the transcription issue
"""
import os
import sys
import asyncio
import tempfile
from dotenv import load_dotenv
from openai import AsyncOpenAI

async def test_whisper_key():
    print("🎯 WHISPER TRANSCRIPTION TEST")
    print("=" * 40)
    
    # Load environment
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("❌ NO API KEY FOUND!")
        print("💡 Create a .env file with: OPENAI_API_KEY=your-key-here")
        return
    
    # Show key type
    key_type = "Project Key (sk-proj-)" if api_key.startswith("sk-proj-") else "Regular Key (sk-)"
    print(f"🔑 Key Type: {key_type}")
    print(f"🔑 Key Preview: {api_key[:20]}...")
    
    if api_key.startswith("sk-proj-"):
        print("\n⚠️  WARNING: Project keys don't work with Whisper!")
        print("💡 You need a regular API key (sk-) for Whisper transcription.")
    
    print("\n🧪 Testing Whisper API...")
    
    try:
        client = AsyncOpenAI(api_key=api_key)
        
        # Create a minimal test audio file
        test_audio = create_test_audio()
        
        # Test Whisper transcription
        with open(test_audio, 'rb') as audio_file:
            response = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        
        # Clean up
        os.unlink(test_audio)
        
        print("✅ SUCCESS! Whisper transcription works!")
        print(f"📝 Result: {response[:50]}...")
        print("\n🎉 Your voice transcription should work now!")
        
    except Exception as e:
        # Clean up on error
        try:
            os.unlink(test_audio)
        except:
            pass
            
        error_str = str(e)
        print(f"❌ WHISPER TEST FAILED!")
        print(f"💥 Error: {error_str}")
        
        if "401" in error_str or "Incorrect API key" in error_str:
            print("\n🔧 SOLUTION:")
            print("1. Go to: https://platform.openai.com/account/api-keys")
            print("2. Create a NEW secret key (NOT a project key)")
            print("3. Copy the key (should start with 'sk-' not 'sk-proj-')")
            print("4. Replace OPENAI_API_KEY in your .env file")
            print("5. Restart your backend server")
        elif "quota" in error_str.lower():
            print("\n💳 QUOTA ISSUE: Check your OpenAI billing")
        else:
            print(f"\n🤔 Unexpected error: {error_str}")

def create_test_audio():
    """Create a minimal test audio file"""
    import wave
    import struct
    import math
    
    # Create a 1-second test tone
    sample_rate = 16000
    duration = 1.0
    frequency = 440  # A note
    
    frames = []
    for i in range(int(duration * sample_rate)):
        value = int(16000 * math.sin(2 * math.pi * frequency * i / sample_rate))
        frames.append(struct.pack('<h', value))
    
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    
    with wave.open(temp_file.name, 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 2 bytes per sample
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(b''.join(frames))
    
    return temp_file.name

if __name__ == "__main__":
    asyncio.run(test_whisper_key())