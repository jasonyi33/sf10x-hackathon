#!/usr/bin/env python3
"""
Comprehensive test script to verify OpenAI API key works for all required endpoints
"""
import os
import sys
import asyncio
import tempfile
import wave
import struct
from dotenv import load_dotenv
from openai import AsyncOpenAI

class OpenAITester:
    def __init__(self):
        # Load environment variables
        load_dotenv()
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        
    def print_header(self, test_name):
        print(f"\n{'='*50}")
        print(f"🧪 {test_name}")
        print('='*50)
    
    def print_result(self, test_name, success, message):
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")
    
    async def test_api_key_exists(self):
        """Test 1: Check if API key is loaded"""
        self.print_header("API Key Check")
        
        if not self.api_key:
            self.print_result("API Key", False, "No API key found in environment")
            return False
        
        # Show key format and first few characters
        key_type = "Project Key" if self.api_key.startswith("sk-proj-") else "Regular Key"
        self.print_result("API Key Format", True, f"{key_type} detected")
        print(f"🔑 Key preview: {self.api_key[:20]}...")
        
        return True
    
    async def test_client_initialization(self):
        """Test 2: Check if OpenAI client can be initialized"""
        self.print_header("Client Initialization")
        
        try:
            self.client = AsyncOpenAI(api_key=self.api_key)
            self.print_result("Client Init", True, "OpenAI client created successfully")
            return True
        except Exception as e:
            self.print_result("Client Init", False, f"Failed to create client: {e}")
            return False
    
    async def test_models_access(self):
        """Test 3: Check if we can access model list"""
        self.print_header("Models Access")
        
        try:
            models = await self.client.models.list()
            model_count = len(models.data)
            self.print_result("Models List", True, f"Found {model_count} available models")
            
            # Check for specific models we need
            model_names = [model.id for model in models.data]
            
            # Check for GPT models
            gpt_models = [m for m in model_names if 'gpt' in m.lower()]
            if gpt_models:
                self.print_result("GPT Models", True, f"Found: {gpt_models[:3]}")
            else:
                self.print_result("GPT Models", False, "No GPT models found")
            
            # Check for Whisper
            whisper_models = [m for m in model_names if 'whisper' in m.lower()]
            if whisper_models:
                self.print_result("Whisper Models", True, f"Found: {whisper_models}")
            else:
                self.print_result("Whisper Models", False, "No Whisper models found")
            
            return True
            
        except Exception as e:
            self.print_result("Models Access", False, f"Failed to get models: {e}")
            return False
    
    async def test_chat_completion(self):
        """Test 4: Test GPT chat completion"""
        self.print_header("Chat Completion Test")
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Say 'Hello World' in exactly two words."}],
                max_tokens=10
            )
            
            content = response.choices[0].message.content
            self.print_result("Chat Completion", True, f"Response: '{content}'")
            return True
            
        except Exception as e:
            self.print_result("Chat Completion", False, f"Failed: {e}")
            return False
    
    def create_test_audio(self, duration_seconds=2, sample_rate=16000):
        """Create a simple test audio file for Whisper testing"""
        # Generate a simple sine wave
        import math
        
        frames = []
        for i in range(int(duration_seconds * sample_rate)):
            # Generate a 440Hz tone (A note)
            value = int(32767 * math.sin(2 * math.pi * 440 * i / sample_rate))
            frames.append(struct.pack('<h', value))
        
        # Create temporary WAV file
        temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        
        with wave.open(temp_file.name, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 2 bytes per sample
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(b''.join(frames))
        
        return temp_file.name
    
    async def test_whisper_transcription(self):
        """Test 5: Test Whisper transcription (the critical test)"""
        self.print_header("Whisper Transcription Test")
        
        try:
            # Create a test audio file
            print("📁 Creating test audio file...")
            audio_file_path = self.create_test_audio(duration_seconds=3)
            
            # Test transcription
            print("🎤 Testing Whisper transcription...")
            with open(audio_file_path, 'rb') as audio_file:
                response = await self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
            
            # Clean up
            os.unlink(audio_file_path)
            
            self.print_result("Whisper Transcription", True, f"Success! Transcribed: '{response[:50]}'")
            return True
            
        except Exception as e:
            # Clean up on error
            try:
                os.unlink(audio_file_path)
            except:
                pass
            
            error_msg = str(e)
            if "401" in error_msg or "Incorrect API key" in error_msg:
                self.print_result("Whisper Transcription", False, "❗ API KEY ISSUE: Your API key doesn't work with Whisper")
                print("💡 Solution: You need a regular API key (sk-...) not a project key (sk-proj-...)")
            elif "quota" in error_msg.lower():
                self.print_result("Whisper Transcription", False, "💳 QUOTA ISSUE: Your account has exceeded quota")
            else:
                self.print_result("Whisper Transcription", False, f"Error: {error_msg}")
            
            return False
    
    async def test_pricing_check(self):
        """Test 6: Check account usage (if possible)"""
        self.print_header("Account Status")
        
        try:
            # Try to get account information
            # Note: This might not work with all key types
            print("ℹ️  Account usage information is not available via API")
            print("💡 Check your usage at: https://platform.openai.com/usage")
            return True
            
        except Exception as e:
            print(f"ℹ️  Could not check account status: {e}")
            return True
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting OpenAI API Key Comprehensive Test")
        print("=" * 60)
        
        tests = [
            ("API Key Check", self.test_api_key_exists),
            ("Client Init", self.test_client_initialization),
            ("Models Access", self.test_models_access),
            ("Chat Completion", self.test_chat_completion),
            ("Whisper Transcription", self.test_whisper_transcription),
            ("Account Status", self.test_pricing_check),
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            try:
                results[test_name] = await test_func()
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results[test_name] = False
        
        # Print summary
        self.print_header("Test Summary")
        
        passed = sum(1 for success in results.values() if success)
        total = len(results)
        
        for test_name, success in results.items():
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\n📊 Results: {passed}/{total} tests passed")
        
        if results.get("Whisper Transcription", False):
            print("\n🎉 SUCCESS! Your API key works with Whisper transcription!")
            print("✅ Your voice transcription should work in the app now.")
        else:
            print("\n⚠️  WHISPER ISSUE DETECTED!")
            print("❌ Your API key doesn't work with Whisper transcription.")
            print("\n🔧 TO FIX:")
            print("1. Go to: https://platform.openai.com/account/api-keys")
            print("2. Create a NEW secret key (not a project key)")
            print("3. Replace your API key in backend/.env")
            print("4. Restart your backend server")
        
        return results

async def main():
    """Main test function"""
    tester = OpenAITester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())