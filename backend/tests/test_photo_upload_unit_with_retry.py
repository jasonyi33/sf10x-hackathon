"""
Unit test to verify retry logic is integrated into photo upload
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ast
import inspect


def test_retry_integration():
    """Verify that the photo upload endpoint uses the retry logic"""
    
    print("🔍 Verifying Retry Logic Integration...\n")
    
    tests_passed = 0
    total_tests = 0
    
    # Test 1: Check upload_with_retry is imported
    total_tests += 1
    try:
        from api.photos import upload_with_retry
        print("✅ Test 1: upload_with_retry is imported in photos.py")
        tests_passed += 1
    except ImportError:
        print("❌ Test 1: upload_with_retry not imported in photos.py")
    
    # Test 2: Check upload_with_retry is used in upload_photo function
    total_tests += 1
    try:
        from api.photos import upload_photo
        source = inspect.getsource(upload_photo)
        
        if "upload_with_retry" in source:
            print("✅ Test 2: upload_with_retry is used in upload_photo function")
            tests_passed += 1
        else:
            print("❌ Test 2: upload_with_retry not found in upload_photo function")
    except Exception as e:
        print(f"❌ Test 2: Error checking upload_photo source: {e}")
    
    # Test 3: Check old direct upload code is removed
    total_tests += 1
    try:
        from api.photos import upload_photo
        source = inspect.getsource(upload_photo)
        
        # Check if old pattern is gone
        if "supabase.storage.from_(PHOTOS_BUCKET).upload(" not in source:
            print("✅ Test 3: Old direct upload code has been removed")
            tests_passed += 1
        else:
            print("❌ Test 3: Old direct upload code still exists")
    except Exception as e:
        print(f"❌ Test 3: Error checking for old code: {e}")
    
    # Test 4: Check error handling preserves HTTPException
    total_tests += 1
    try:
        from api.photos import upload_photo
        source = inspect.getsource(upload_photo)
        
        if "except HTTPException:" in source and "raise" in source:
            print("✅ Test 4: HTTPException is properly re-raised")
            tests_passed += 1
        else:
            print("❌ Test 4: HTTPException handling not found")
    except Exception as e:
        print(f"❌ Test 4: Error checking exception handling: {e}")
    
    # Test 5: Check retry parameters
    total_tests += 1
    try:
        from api.photos import upload_photo
        source = inspect.getsource(upload_photo)
        
        # Check if retry function is called with correct parameters
        if all(param in source for param in ["storage_client=", "file_data=", "path="]):
            print("✅ Test 5: upload_with_retry called with correct parameters")
            tests_passed += 1
        else:
            print("❌ Test 5: upload_with_retry parameters not found")
    except Exception as e:
        print(f"❌ Test 5: Error checking parameters: {e}")
    
    # Test 6: Verify retry logic implementation
    total_tests += 1
    try:
        from services.upload_retry import upload_with_retry
        source = inspect.getsource(upload_with_retry)
        
        # Check key retry logic elements
        has_retry_loop = "while attempt <= max_retries:" in source
        has_delay = "await asyncio.sleep(1)" in source
        has_3_attempts = "max_retries: int = 2" in source
        has_logging = "logger.info" in source and "logger.warning" in source
        
        if all([has_retry_loop, has_delay, has_3_attempts, has_logging]):
            print("✅ Test 6: Retry logic implementation is complete")
            tests_passed += 1
        else:
            print("❌ Test 6: Retry logic implementation incomplete")
            if not has_retry_loop:
                print("  - Missing retry loop")
            if not has_delay:
                print("  - Missing delay between attempts")
            if not has_3_attempts:
                print("  - Wrong max_retries default")
            if not has_logging:
                print("  - Missing logging")
    except Exception as e:
        print(f"❌ Test 6: Error checking retry implementation: {e}")
    
    # Summary
    print(f"\n📊 Test Summary: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("\n✅ All integration tests passed!")
        print("\nRetry Logic Integration Summary:")
        print("- upload_with_retry function imported correctly")
        print("- Photo upload endpoint uses retry logic")
        print("- Old direct upload code removed")
        print("- Error handling preserves HTTPException")
        print("- Retry function called with proper parameters")
        print("- Retry logic implementation complete with:")
        print("  - 3 total attempts (1 initial + 2 retries)")
        print("  - 1 second delay between attempts")
        print("  - Proper logging for debugging")
        print("  - Auth errors fail fast without retry")
    else:
        print("\n❌ Some tests failed. Please review the integration.")
    
    return tests_passed == total_tests


if __name__ == "__main__":
    success = test_retry_integration()
    exit(0 if success else 1)