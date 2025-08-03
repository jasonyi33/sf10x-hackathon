#!/usr/bin/env python3
"""
Test script to verify OpenAI Whisper API with backup key
"""
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
import asyncio

async def test_whisper_backup():
    # Load environment variables
    load_dotenv()
    
    # Try backup key first
    backup_key = os.getenv("BACKUP_OPENAI_API_KEY")
    main_key = os.getenv("OPENAI_API_KEY")
    
    print("🔍 TESTING BACKUP KEY FOR WHISPER")
    print("=" * 40)
    
    if backup_key:
        print(f"🔑 Backup API Key found: {backup_key[:15] if len(backup_key) > 15 else backup_key}...")
        api_key = backup_key
    elif main_key:
        print(f"⚠️ No backup key, using main key: {main_key[:15]}...")
        api_key = main_key
    else:
        print("❌ No API keys found!")
        return
    
    if not api_key:
        print("❌ No API key available")
        return
    
    try:
        # Create client with backup key
        client = AsyncOpenAI(api_key=api_key)
        
        # Test if we can access the models API
        print("🎤 Testing Whisper API access...")
        
        try:
            models = await client.models.list()
            whisper_available = any("whisper" in model.id.lower() for model in models.data)
            
            if whisper_available:
                print("✅ Whisper model is available!")
            else:
                print("⚠️ Whisper model not found in available models")
                print("Available models:", [model.id for model in models.data[:5]])
        except Exception as e:
            print(f"❌ Models API failed: {e}")
            # Try whisper directly anyway
            print("🎵 Trying Whisper API directly...")
        
        # Test whisper with minimal audio
        print("🎤 Testing Whisper transcription...")
        
        # Create minimal test audio file
        import tempfile
        import wave
        import struct
        
        # Create 0.1 second of silence
        sample_rate = 16000
        duration = 0.1
        
        frames = []
        for i in range(int(duration * sample_rate)):
            frames.append(struct.pack('<h', 0))  # Silence
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        
        with wave.open(temp_file.name, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 2 bytes per sample
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(b''.join(frames))
        
        # Test Whisper
        try:
            with open(temp_file.name, 'rb') as audio_file:
                response = await client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
            
            print(f"✅ WHISPER WORKS WITH BACKUP KEY!")
            print(f"📝 Response: '{response}'")
            
            # Clean up
            os.unlink(temp_file.name)
            
            print("\n🎉 SUCCESS! Use BACKUP_OPENAI_API_KEY for your backend!")
            
        except Exception as whisper_error:
            # Clean up
            os.unlink(temp_file.name)
            
            print(f"❌ Whisper failed: {whisper_error}")
            
            if "401" in str(whisper_error):
                print("🔑 401 Unauthorized - Backup key also invalid for Whisper")
            elif "quota" in str(whisper_error).lower():
                print("💳 Quota exceeded on backup key")
            else:
                print(f"🤔 Other error: {whisper_error}")
        
    except Exception as e:
        print(f"❌ Client creation or general error: {e}")

if __name__ == "__main__":
    asyncio.run(test_whisper_backup())