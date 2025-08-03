"""
Unit tests for Task 2.1.2 - Photo History Management
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from datetime import datetime, timezone
from services.photo_history import update_photo_history


class TestPhotoHistoryManagement:
    """Test cases for photo history management function"""
    
    def test_1_first_photo_no_history_created(self):
        """Test 1: First photo - no history created"""
        # Individual with no existing photo
        individual = {
            "id": "123",
            "name": "John Doe",
            "data": {"name": "John Doe"},
            "updated_at": "2024-01-15T10:00:00Z"
        }
        
        new_photo_url = "https://example.com/photos/new-photo.jpg"
        
        result = update_photo_history(individual, new_photo_url)
        
        # Should have the new photo as current
        assert result["photo_url"] == new_photo_url
        
        # Should have empty history (first photo doesn't go to history)
        assert result["photo_history"] == []
    
    def test_2_second_photo_first_moves_to_history(self):
        """Test 2: Second photo - first moves to history"""
        # Individual with existing photo
        individual = {
            "id": "123",
            "name": "John Doe",
            "data": {"name": "John Doe"},
            "photo_url": "https://example.com/photos/first-photo.jpg",
            "updated_at": "2024-01-15T10:00:00Z"
        }
        
        new_photo_url = "https://example.com/photos/second-photo.jpg"
        
        result = update_photo_history(individual, new_photo_url)
        
        # Should have the new photo as current
        assert result["photo_url"] == new_photo_url
        
        # Should have first photo in history
        assert len(result["photo_history"]) == 1
        assert result["photo_history"][0]["url"] == "https://example.com/photos/first-photo.jpg"
        assert result["photo_history"][0]["added_at"] == "2024-01-15T10:00:00Z"
    
    def test_3_fourth_photo_oldest_dropped_from_history(self):
        """Test 3: Fourth photo - oldest dropped from history"""
        # Individual with photo and full history (3 items)
        individual = {
            "id": "123",
            "name": "John Doe",
            "data": {"name": "John Doe"},
            "photo_url": "https://example.com/photos/current-photo.jpg",
            "photo_history": [
                {"url": "https://example.com/photos/third-photo.jpg", "added_at": "2024-01-14T10:00:00Z"},
                {"url": "https://example.com/photos/second-photo.jpg", "added_at": "2024-01-13T10:00:00Z"},
                {"url": "https://example.com/photos/first-photo.jpg", "added_at": "2024-01-12T10:00:00Z"}
            ],
            "updated_at": "2024-01-15T10:00:00Z"
        }
        
        new_photo_url = "https://example.com/photos/fourth-photo.jpg"
        
        result = update_photo_history(individual, new_photo_url)
        
        # Should have the new photo as current
        assert result["photo_url"] == new_photo_url
        
        # Should have exactly 3 items in history
        assert len(result["photo_history"]) == 3
        
        # Current photo should be first in history
        assert result["photo_history"][0]["url"] == "https://example.com/photos/current-photo.jpg"
        
        # Oldest photo (first-photo.jpg) should be dropped
        photo_urls = [item["url"] for item in result["photo_history"]]
        assert "https://example.com/photos/first-photo.jpg" not in photo_urls
        assert "https://example.com/photos/second-photo.jpg" in photo_urls
        assert "https://example.com/photos/third-photo.jpg" in photo_urls
    
    def test_4_history_maintains_chronological_order(self):
        """Test 4: History maintains chronological order"""
        individual = {
            "id": "123",
            "name": "John Doe",
            "photo_url": "https://example.com/photos/current.jpg",
            "photo_history": [
                {"url": "https://example.com/photos/prev1.jpg", "added_at": "2024-01-14T10:00:00Z"},
                {"url": "https://example.com/photos/prev2.jpg", "added_at": "2024-01-13T10:00:00Z"}
            ],
            "updated_at": "2024-01-15T10:00:00Z"
        }
        
        new_photo_url = "https://example.com/photos/newest.jpg"
        
        result = update_photo_history(individual, new_photo_url)
        
        # History should be in reverse chronological order (newest first)
        assert result["photo_history"][0]["url"] == "https://example.com/photos/current.jpg"
        assert result["photo_history"][0]["added_at"] == "2024-01-15T10:00:00Z"
        assert result["photo_history"][1]["url"] == "https://example.com/photos/prev1.jpg"
        assert result["photo_history"][2]["url"] == "https://example.com/photos/prev2.jpg"
    
    def test_5_timestamps_preserved_in_history(self):
        """Test 5: Timestamps preserved in history"""
        individual = {
            "id": "123",
            "name": "John Doe",
            "photo_url": "https://example.com/photos/current.jpg",
            "photo_history": [
                {"url": "https://example.com/photos/old1.jpg", "added_at": "2024-01-10T15:30:00Z"},
                {"url": "https://example.com/photos/old2.jpg", "added_at": "2024-01-08T09:15:00Z"}
            ],
            "updated_at": "2024-01-15T10:00:00Z"
        }
        
        new_photo_url = "https://example.com/photos/new.jpg"
        
        result = update_photo_history(individual, new_photo_url)
        
        # Original timestamps should be preserved
        assert result["photo_history"][1]["added_at"] == "2024-01-10T15:30:00Z"
        assert result["photo_history"][2]["added_at"] == "2024-01-08T09:15:00Z"
        
        # Current photo should use updated_at timestamp
        assert result["photo_history"][0]["added_at"] == "2024-01-15T10:00:00Z"
    
    def test_6_handles_missing_photo_history_field(self):
        """Test 6: Handles missing photo_history field"""
        # Individual without photo_history field
        individual = {
            "id": "123",
            "name": "John Doe",
            "photo_url": "https://example.com/photos/current.jpg",
            "updated_at": "2024-01-15T10:00:00Z"
        }
        
        new_photo_url = "https://example.com/photos/new.jpg"
        
        result = update_photo_history(individual, new_photo_url)
        
        # Should create photo_history field
        assert "photo_history" in result
        assert isinstance(result["photo_history"], list)
        assert len(result["photo_history"]) == 1
        assert result["photo_history"][0]["url"] == "https://example.com/photos/current.jpg"
    
    def test_7_returns_updated_individual_dict(self):
        """Test 7: Returns updated individual dict"""
        individual = {
            "id": "123",
            "name": "John Doe",
            "data": {"name": "John Doe", "age": 45},
            "danger_score": 75,
            "photo_url": "https://example.com/photos/current.jpg",
            "updated_at": "2024-01-15T10:00:00Z"
        }
        
        new_photo_url = "https://example.com/photos/new.jpg"
        
        result = update_photo_history(individual, new_photo_url)
        
        # Should return complete individual dict with all original fields
        assert result["id"] == "123"
        assert result["name"] == "John Doe"
        assert result["data"] == {"name": "John Doe", "age": 45}
        assert result["danger_score"] == 75
        
        # Plus updated photo fields
        assert result["photo_url"] == new_photo_url
        assert "photo_history" in result
    
    def test_handles_none_photo_url(self):
        """Additional test: Handles None as new photo URL"""
        individual = {
            "id": "123",
            "name": "John Doe",
            "photo_url": "https://example.com/photos/current.jpg",
            "updated_at": "2024-01-15T10:00:00Z"
        }
        
        # Should handle None gracefully
        result = update_photo_history(individual, None)
        
        # Should clear current photo but preserve in history
        assert result["photo_url"] is None
        assert len(result["photo_history"]) == 1
        assert result["photo_history"][0]["url"] == "https://example.com/photos/current.jpg"
    
    def test_handles_empty_string_photo_url(self):
        """Additional test: Handles empty string as new photo URL"""
        individual = {
            "id": "123",
            "name": "John Doe",
            "photo_url": "https://example.com/photos/current.jpg",
            "updated_at": "2024-01-15T10:00:00Z"
        }
        
        # Should handle empty string
        result = update_photo_history(individual, "")
        
        # Should treat empty string as no photo
        assert result["photo_url"] == ""
        assert len(result["photo_history"]) == 1
        assert result["photo_history"][0]["url"] == "https://example.com/photos/current.jpg"


def test_all_photo_history():
    """Run all photo history tests"""
    print("Testing photo history management...")
    
    test_instance = TestPhotoHistoryManagement()
    tests = [
        test_instance.test_1_first_photo_no_history_created,
        test_instance.test_2_second_photo_first_moves_to_history,
        test_instance.test_3_fourth_photo_oldest_dropped_from_history,
        test_instance.test_4_history_maintains_chronological_order,
        test_instance.test_5_timestamps_preserved_in_history,
        test_instance.test_6_handles_missing_photo_history_field,
        test_instance.test_7_returns_updated_individual_dict,
        test_instance.test_handles_none_photo_url,
        test_instance.test_handles_empty_string_photo_url,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            print(f"✅ {test.__name__}")
            passed += 1
        except Exception as e:
            print(f"❌ {test.__name__}: {str(e)}")
            failed += 1
    
    print(f"\nResults: {passed} passed, {failed} failed")
    return passed == len(tests)


if __name__ == "__main__":
    success = test_all_photo_history()
    exit(0 if success else 1)