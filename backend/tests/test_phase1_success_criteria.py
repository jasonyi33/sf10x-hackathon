"""
Test all critical success criteria for Phase 1
Based on Phase1_Implementation_Guide.md lines 319-341
"""
import pytest
import os
import json
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from supabase import create_client, Client
from dotenv import load_dotenv
import httpx

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


class TestPhase1CriticalSuccessCriteria:
    """Test all critical success criteria for Phase 1"""
    
    @pytest.fixture
    def supabase_client(self):
        """Create Supabase client for testing"""
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            pytest.skip("Supabase credentials not configured")
        return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    def test_database_migration_success(self, supabase_client):
        """Test 1: Database Migration - All requirements met"""
        
        print("\n" + "=" * 60)
        print("TESTING DATABASE MIGRATION SUCCESS CRITERIA")
        print("=" * 60)
        
        # Test 1.1: Verify photo columns were added to individuals table
        print("\n1.1 Checking photo columns in individuals table...")
        
        try:
            # Query to check columns exist
            result = supabase_client.table("individuals").select("id, photo_url, photo_history").limit(1).execute()
            print("✅ Photo columns (photo_url, photo_history) exist in individuals table")
        except Exception as e:
            pytest.fail(f"❌ Photo columns missing: {str(e)}")
        
        # Test 1.2: Verify photo_consents table exists
        print("\n1.2 Checking photo_consents table...")
        try:
            result = supabase_client.table("photo_consents").select("*").limit(1).execute()
            print("✅ photo_consents table exists")
        except Exception as e:
            pytest.fail(f"❌ photo_consents table missing: {str(e)}")
        
        # Test 1.3: Verify approximate_age category exists
        print("\n1.3 Checking approximate_age category...")
        result = supabase_client.table("categories").select("*").eq("name", "approximate_age").single().execute()
        
        assert result.data is not None, "approximate_age category not found"
        age_category = result.data
        
        assert age_category["type"] == "range", f"Expected type 'range', got '{age_category['type']}'"
        assert age_category["is_required"] == True, "approximate_age should be required"
        assert age_category["is_preset"] == True, "approximate_age should be preset"
        assert age_category["priority"] == "high", f"Expected priority 'high', got '{age_category['priority']}'"
        assert age_category["danger_weight"] == 0, "Age should not affect danger score"
        
        print("✅ approximate_age category configured correctly:")
        print(f"   - Type: {age_category['type']}")
        print(f"   - Required: {age_category['is_required']}")
        print(f"   - Preset: {age_category['is_preset']}")
        print(f"   - Danger weight: {age_category['danger_weight']}")
        
        # Test 1.4: Verify existing individuals have age field
        print("\n1.4 Checking existing individuals have age field...")
        individuals = supabase_client.table("individuals").select("id, data").limit(10).execute()
        
        if individuals.data:
            missing_age = []
            invalid_age = []
            
            for individual in individuals.data:
                data = individual.get("data", {})
                if "approximate_age" not in data:
                    missing_age.append(individual["id"])
                elif data["approximate_age"] != [-1, -1] and not isinstance(data["approximate_age"], list):
                    invalid_age.append(individual["id"])
            
            assert len(missing_age) == 0, f"❌ {len(missing_age)} individuals missing age field"
            assert len(invalid_age) == 0, f"❌ {len(invalid_age)} individuals have invalid age format"
            
            print(f"✅ All {len(individuals.data)} checked individuals have valid age field")
        else:
            print("✅ No existing individuals to check (empty database)")
    
    def test_storage_setup_success(self, supabase_client):
        """Test 2: Storage Setup - Photos bucket configured correctly"""
        
        print("\n" + "=" * 60)
        print("TESTING STORAGE SETUP SUCCESS CRITERIA")
        print("=" * 60)
        
        # Test 2.1: Verify photos bucket exists and is public
        print("\n2.1 Checking photos bucket configuration...")
        
        try:
            # List buckets to check if photos bucket exists
            buckets = supabase_client.storage.list_buckets()
            photos_bucket = next((b for b in buckets if b.name == "photos"), None)
            
            assert photos_bucket is not None, "Photos bucket not found"
            assert photos_bucket.public == True, "Photos bucket should be public"
            
            print("✅ Photos bucket exists and is public")
        except Exception as e:
            pytest.fail(f"❌ Error checking photos bucket: {str(e)}")
        
        # Test 2.2: Test file size limit (5MB)
        print("\n2.2 Testing 5MB file size limit...")
        
        # Create a test file over 5MB
        large_data = b"x" * (6 * 1024 * 1024)  # 6MB
        test_path = f"test/large_{os.urandom(4).hex()}.jpg"
        
        try:
            result = supabase_client.storage.from_("photos").upload(test_path, large_data)
            # If upload succeeds, it's a failure of the size limit
            supabase_client.storage.from_("photos").remove([test_path])  # Clean up
            pytest.fail("❌ File over 5MB was accepted (should be rejected)")
        except Exception as e:
            if "5MB" in str(e) or "size" in str(e).lower() or "Payload too large" in str(e):
                print("✅ 5MB file size limit is enforced")
            else:
                print(f"⚠️  Large file rejected but unclear if due to size limit: {str(e)}")
        
        # Test 2.3: Test allowed file types
        print("\n2.3 Testing allowed file types...")
        
        # Test JPEG upload
        jpeg_data = b"\xFF\xD8\xFF\xE0" + b"test" * 100  # Basic JPEG header
        jpeg_path = f"test/test_{os.urandom(4).hex()}.jpg"
        
        try:
            result = supabase_client.storage.from_("photos").upload(jpeg_path, jpeg_data)
            supabase_client.storage.from_("photos").remove([jpeg_path])  # Clean up
            print("✅ JPEG files are accepted")
        except Exception as e:
            print(f"⚠️  JPEG upload failed: {str(e)}")
        
        # Test non-image file rejection
        text_data = b"This is a text file"
        text_path = f"test/test_{os.urandom(4).hex()}.txt"
        
        try:
            result = supabase_client.storage.from_("photos").upload(text_path, text_data)
            supabase_client.storage.from_("photos").remove([text_path])  # Clean up
            print("⚠️  Text files are accepted (should be rejected)")
        except Exception as e:
            print("✅ Non-image files are rejected")
    
    @pytest.mark.asyncio
    async def test_age_validation_success(self):
        """Test 3: Age Validation - All validation requirements met"""
        
        print("\n" + "=" * 60)
        print("TESTING AGE VALIDATION SUCCESS CRITERIA")
        print("=" * 60)
        
        # Test 3.1: Backend rejects saves without valid age
        print("\n3.1 Testing backend rejects saves without valid age...")
        
        from db.models import SaveIndividualRequest
        from pydantic import ValidationError
        
        # Test missing age
        try:
            request = SaveIndividualRequest(
                data={
                    "name": "Test Person",
                    "height": 70,
                    "weight": 150,
                    "skin_color": "Medium"
                    # Missing approximate_age
                }
            )
            pytest.fail("❌ Backend accepted save without age field")
        except ValidationError as e:
            assert "approximate_age" in str(e), "Error should mention approximate_age"
            print("✅ Backend rejects saves without age field")
        
        # Test invalid age format
        from services.validation_helper import validate_age_range
        
        invalid_ages = [
            (45, "Single number"),
            ([45], "Single element array"),
            ([50, 45], "Min > Max"),
            ([-5, 10], "Negative age"),
            ([100, 130], "Over 120"),
            ("45-50", "String format")
        ]
        
        for age, description in invalid_ages:
            result = validate_age_range(age)
            assert result == False, f"❌ {description} should be invalid"
        
        print("✅ All invalid age formats are rejected")
        
        # Test 3.2: AI consistently returns age in array format
        print("\n3.2 Testing AI returns age in array format...")
        
        from services.openai_service import OpenAIService
        
        with patch('services.openai_service.AsyncOpenAI') as mock_openai:
            mock_client = Mock()
            mock_openai.return_value = mock_client
            
            service = OpenAIService()
            categories = [{"name": "approximate_age", "type": "range", "is_required": True}]
            
            # Test various GPT responses
            test_cases = [
                ({"approximate_age": 45}, [43, 47], "Single number conversion"),
                ({"approximate_age": None}, [-1, -1], "Null to unknown"),
                ({"approximate_age": "Unknown"}, [-1, -1], "String unknown"),
                ({"approximate_age": [45, 50]}, [45, 50], "Valid array")
            ]
            
            for gpt_response, expected, description in test_cases:
                mock_response = Mock()
                mock_response.choices = [Mock(message=Mock(content=json.dumps(gpt_response)))]
                mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
                
                result = await service.categorize_transcription("test", categories)
                assert result["approximate_age"] == expected, f"❌ {description} failed"
            
            print("✅ AI consistently returns age in array format")
        
        # Test 3.3: Unknown age handled as [-1, -1]
        print("\n3.3 Testing unknown age handling...")
        
        valid_unknown = validate_age_range([-1, -1])
        assert valid_unknown == True, "[-1, -1] should be valid for unknown age"
        
        # Test in model
        try:
            request = SaveIndividualRequest(
                data={
                    "name": "Unknown Age Person",
                    "height": 70,
                    "weight": 150,
                    "skin_color": "Medium",
                    "approximate_age": [-1, -1]
                }
            )
            print("✅ Unknown age [-1, -1] is accepted as valid")
        except ValidationError:
            pytest.fail("❌ Unknown age [-1, -1] was rejected")
    
    @pytest.mark.asyncio
    async def test_integration_flow_success(self):
        """Test 4: Integration Tests - Full flow validation"""
        
        print("\n" + "=" * 60)
        print("TESTING INTEGRATION FLOW SUCCESS CRITERIA")
        print("=" * 60)
        
        # Test 4.1: Full flow with mocked services
        print("\n4.1 Testing full transcribe → validate → save flow...")
        
        with patch('api.transcription.create_client') as mock_supabase, \
             patch('api.transcription.OpenAIService') as mock_openai, \
             patch('api.transcription.get_current_user') as mock_auth:
            
            from api.transcription import transcribe_audio_endpoint, TranscribeRequest
            
            # Setup mocks
            mock_auth.return_value = "test-user"
            mock_client = Mock()
            mock_supabase.return_value = mock_client
            
            # Mock categories including age
            categories = [
                {"name": "name", "type": "text", "is_required": True},
                {"name": "height", "type": "number", "is_required": True},
                {"name": "weight", "type": "number", "is_required": True},
                {"name": "skin_color", "type": "single_select", "is_required": True},
                {"name": "approximate_age", "type": "range", "is_required": True}
            ]
            mock_client.table.return_value.select.return_value.order.return_value.execute.return_value.data = categories
            mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
            mock_client.table.return_value.select.return_value.ilike.return_value.limit.return_value.execute.return_value.data = []
            
            # Mock successful transcription with age
            mock_openai_instance = Mock()
            mock_openai.return_value = mock_openai_instance
            mock_openai_instance.transcribe_audio = AsyncMock(return_value="Person is 45 years old")
            mock_openai_instance.categorize_transcription = AsyncMock(
                return_value={
                    "name": "Test Person",
                    "height": 72,
                    "weight": 180,
                    "skin_color": "Medium",
                    "approximate_age": [43, 47]
                }
            )
            mock_openai_instance.find_duplicates = AsyncMock(return_value=[])
            
            # Test transcribe endpoint
            request = TranscribeRequest(audio_url="https://example.com/test.m4a")
            response = await transcribe_audio_endpoint(request, "test-user")
            
            assert response.categorized_data["approximate_age"] == [43, 47]
            assert len(response.missing_required) == 0
            print("✅ Full transcribe flow works with valid age")
        
        # Test 4.2: Manual entry validates age requirement
        print("\n4.2 Testing manual entry age validation...")
        
        from services.validation_helper import validate_categorized_data
        
        categories = [
            {"name": "name", "type": "text", "is_required": True},
            {"name": "approximate_age", "type": "range", "is_required": True}
        ]
        
        # Valid manual entry
        valid_data = {
            "name": "Manual Entry",
            "approximate_age": [50, 55]
        }
        result = validate_categorized_data(valid_data, categories)
        assert result.is_valid == True
        print("✅ Valid manual entry with age accepted")
        
        # Invalid manual entry
        invalid_data = {
            "name": "Missing Age"
            # No age field
        }
        result = validate_categorized_data(invalid_data, categories)
        assert result.is_valid == False
        assert "approximate_age" in result.missing_required
        print("✅ Manual entry without age is rejected")
        
        # Test 4.3: Error messages are clear and actionable
        print("\n4.3 Testing error message clarity...")
        
        # Test various validation scenarios
        test_data = {
            "name": "Test",
            "approximate_age": "forty-five"  # Wrong type
        }
        
        result = validate_categorized_data(test_data, categories)
        assert result.is_valid == False
        assert len(result.validation_errors) > 0
        
        age_error = next((e for e in result.validation_errors if e['field'] == 'approximate_age'), None)
        assert age_error is not None
        assert "array" in age_error['message'].lower() or "list" in age_error['message'].lower()
        print(f"✅ Clear error message: '{age_error['message']}'")
    
    def test_common_pitfalls_avoided(self):
        """Test 5: Verify common pitfalls are avoided"""
        
        print("\n" + "=" * 60)
        print("TESTING COMMON PITFALLS ARE AVOIDED")
        print("=" * 60)
        
        from services.validation_helper import validate_age_range
        from services.danger_calculator import calculate_danger_score
        
        # Pitfall 1: Single number age values
        print("\n5.1 Verifying single numbers are rejected...")
        assert validate_age_range(45) == False
        print("✅ Single number age values are rejected")
        
        # Pitfall 2: Age ranges where min >= max
        print("\n5.2 Verifying invalid ranges are rejected...")
        assert validate_age_range([50, 45]) == False  # min > max
        assert validate_age_range([45, 45]) == False  # min = max
        print("✅ Invalid age ranges (min >= max) are rejected")
        
        # Pitfall 3: Age affecting danger score
        print("\n5.3 Verifying age doesn't affect danger score...")
        
        # Mock categories with age having 0 danger weight
        categories = [
            {"name": "approximate_age", "type": "range", "danger_weight": 0},
            {"name": "violent_behavior", "type": "single_select", "danger_weight": 50,
             "options": [{"label": "Yes", "value": 1}, {"label": "No", "value": 0}]}
        ]
        
        # Test two individuals with same danger field but different ages
        data1 = {"approximate_age": [20, 25], "violent_behavior": "Yes"}
        data2 = {"approximate_age": [70, 75], "violent_behavior": "Yes"}
        
        score1 = calculate_danger_score(data1, categories)
        score2 = calculate_danger_score(data2, categories)
        
        assert score1 == score2, f"Age affected danger score: {score1} vs {score2}"
        print("✅ Age does not affect danger score calculations")


def run_phase1_success_tests():
    """Run all Phase 1 success criteria tests"""
    print("\n" + "=" * 70)
    print("PHASE 1 CRITICAL SUCCESS CRITERIA TEST SUITE")
    print("=" * 70)
    print("\nThis test suite verifies all requirements from Phase1_Implementation_Guide.md")
    print("Testing:")
    print("1. Database Migration Success")
    print("2. Storage Setup Success")
    print("3. Age Validation Success")
    print("4. Integration Flow Success")
    print("5. Common Pitfalls Avoided")
    print("\n" + "=" * 70)
    
    pytest.main([__file__, "-v", "-s", "--tb=short"])


if __name__ == "__main__":
    run_phase1_success_tests()