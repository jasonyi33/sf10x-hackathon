"""
Demonstration of retry behavior
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import time
from unittest.mock import Mock
from services.upload_retry import upload_with_retry


async def demo_retry_behavior():
    """Demonstrate different retry scenarios"""
    
    print("🎯 Demonstrating Upload Retry Behavior\n")
    print("=" * 50)
    
    # Scenario 1: Success on first attempt
    print("\n📌 Scenario 1: Success on first attempt")
    print("-" * 30)
    
    mock_storage = Mock()
    mock_storage.upload.return_value = Mock(error=None)
    
    start = time.time()
    result = await upload_with_retry(mock_storage, b"data", "test.jpg")
    elapsed = time.time() - start
    
    print(f"✅ Upload succeeded on attempt 1")
    print(f"⏱️  Total time: {elapsed:.2f} seconds")
    print(f"📊 Total attempts: {mock_storage.upload.call_count}")
    
    # Scenario 2: Success after 1 retry
    print("\n\n📌 Scenario 2: Transient failure, success on retry")
    print("-" * 30)
    
    mock_storage = Mock()
    mock_storage.upload.side_effect = [
        Mock(error="Network timeout"),
        Mock(error=None)
    ]
    
    start = time.time()
    result = await upload_with_retry(mock_storage, b"data", "test.jpg")
    elapsed = time.time() - start
    
    print(f"❌ Attempt 1 failed: Network timeout")
    print(f"⏳ Waiting 1 second before retry...")
    print(f"✅ Attempt 2 succeeded")
    print(f"⏱️  Total time: {elapsed:.2f} seconds")
    print(f"📊 Total attempts: {mock_storage.upload.call_count}")
    
    # Scenario 3: Failure after 3 attempts
    print("\n\n📌 Scenario 3: Persistent failure")
    print("-" * 30)
    
    mock_storage = Mock()
    mock_storage.upload.return_value = Mock(error="Storage unavailable")
    
    start = time.time()
    try:
        result = await upload_with_retry(mock_storage, b"data", "test.jpg")
    except Exception as e:
        elapsed = time.time() - start
        print(f"❌ Attempt 1 failed: Storage unavailable")
        print(f"⏳ Waiting 1 second...")
        print(f"❌ Attempt 2 failed: Storage unavailable")
        print(f"⏳ Waiting 1 second...")
        print(f"❌ Attempt 3 failed: Storage unavailable")
        print(f"🚫 Upload failed after 3 attempts")
        print(f"⏱️  Total time: {elapsed:.2f} seconds")
        print(f"📊 Total attempts: {mock_storage.upload.call_count}")
        print(f"🔥 Error: {str(e)}")
    
    # Scenario 4: Auth error (no retry)
    print("\n\n📌 Scenario 4: Authentication error (no retry)")
    print("-" * 30)
    
    mock_storage = Mock()
    mock_storage.upload.side_effect = Exception("Invalid credentials")
    
    start = time.time()
    try:
        result = await upload_with_retry(mock_storage, b"data", "test.jpg")
    except Exception as e:
        elapsed = time.time() - start
        print(f"🔐 Authentication error detected")
        print(f"❌ Failed immediately without retry")
        print(f"⏱️  Total time: {elapsed:.2f} seconds")
        print(f"📊 Total attempts: {mock_storage.upload.call_count}")
        print(f"🔥 Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("\n📋 Summary:")
    print("- Successful uploads complete immediately")
    print("- Transient failures retry up to 3 times with 1s delay")
    print("- Auth errors fail fast without retry")
    print("- Maximum wait time: ~2 seconds for 3 attempts")


if __name__ == "__main__":
    asyncio.run(demo_retry_behavior())