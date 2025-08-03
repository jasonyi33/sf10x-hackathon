"""
Integration tests for photo history management with individual save endpoint
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from datetime import datetime, timezone
from uuid import uuid4

from services.individual_service import IndividualService
from services.photo_history import update_photo_history
from db.models import LocationData


class MockSupabaseClient:
    """Mock Supabase client for testing"""
    
    def __init__(self):
        self.individuals = {}
        self.interactions = {}
        self.categories = [
            {"id": "1", "name": "name", "type": "text", "is_required": True, "danger_weight": 0},
            {"id": "2", "name": "height", "type": "number", "is_required": True, "danger_weight": 10},
            {"id": "3", "name": "weight", "type": "number", "is_required": True, "danger_weight": 10},
            {"id": "4", "name": "skin_color", "type": "single_select", "is_required": True, "danger_weight": 0},
        ]
    
    def table(self, name):
        return MockTable(self, name)


class MockTable:
    def __init__(self, client, table_name):
        self.client = client
        self.table_name = table_name
        self.filters = {}
        
    def select(self, *args):
        return self
        
    def eq(self, field, value):
        self.filters[field] = value
        return self
        
    def single(self):
        if self.table_name == "individuals":
            for ind_id, ind in self.client.individuals.items():
                if str(ind["id"]) == self.filters.get("id"):
                    return MockResponse(ind)
        return MockResponse(None)
        
    def insert(self, data):
        if self.table_name == "individuals":
            ind_id = str(uuid4())
            data["id"] = ind_id
            data["created_at"] = datetime.now(timezone.utc).isoformat()
            data["updated_at"] = datetime.now(timezone.utc).isoformat()
            self.client.individuals[ind_id] = data
            return MockResponse([data])
        elif self.table_name == "interactions":
            int_id = str(uuid4())
            data["id"] = int_id
            data["created_at"] = datetime.now(timezone.utc).isoformat()
            self.client.interactions[int_id] = data
            return MockResponse([data])
        return MockResponse([])
        
    def update(self, data):
        # Store the update data for execute()
        self.update_data = data
        return self
        
    def execute(self):
        if self.table_name == "categories":
            return MockResponse(self.client.categories)
        elif hasattr(self, 'update_data') and self.table_name == "individuals":
            # Handle update
            ind_id = self.filters.get("id")
            if ind_id and ind_id in self.client.individuals:
                self.client.individuals[ind_id].update(self.update_data)
                return MockResponse([self.client.individuals[ind_id]])
        return MockResponse([])
        
    def order(self, field, desc=False):
        return self
        
    def limit(self, count):
        return self


class MockResponse:
    def __init__(self, data):
        self._data = data
        
    @property
    def data(self):
        return self._data
    
    def execute(self):
        return self


async def test_photo_history_integration():
    """Test photo history management through the individual service"""
    
    print("🔍 Testing Photo History Integration...\n")
    
    # Initialize mock client and service
    mock_client = MockSupabaseClient()
    service = IndividualService(mock_client)
    
    # Test 1: Create new individual with photo
    print("Test 1: Create new individual with photo...")
    result1 = await service.save_individual(
        user_id="test-user",
        user_name="Test User",
        data={
            "name": "John Doe",
            "height": 72,
            "weight": 180,
            "skin_color": "Light"
        },
        photo_url="https://example.com/photos/john-photo1.jpg"
    )
    
    individual_id = result1.individual.id
    individual = mock_client.individuals[str(individual_id)]
    
    assert individual["photo_url"] == "https://example.com/photos/john-photo1.jpg"
    assert individual["photo_history"] == []
    print("✅ New individual created with photo, empty history")
    
    # Test 2: Update with second photo
    print("\nTest 2: Update individual with second photo...")
    result2 = await service.save_individual(
        user_id="test-user",
        user_name="Test User",
        data={
            "name": "John Doe",
            "height": 72,
            "weight": 185,  # Changed weight
            "skin_color": "Light"
        },
        merge_with_id=individual_id,
        photo_url="https://example.com/photos/john-photo2.jpg"
    )
    
    individual = mock_client.individuals[str(individual_id)]
    
    assert individual["photo_url"] == "https://example.com/photos/john-photo2.jpg"
    assert len(individual["photo_history"]) == 1
    assert individual["photo_history"][0]["url"] == "https://example.com/photos/john-photo1.jpg"
    print("✅ First photo moved to history")
    
    # Test 3: Update with third photo
    print("\nTest 3: Update individual with third photo...")
    result3 = await service.save_individual(
        user_id="test-user",
        user_name="Test User",
        data={
            "name": "John Doe",
            "height": 72,
            "weight": 185,
            "skin_color": "Light"
        },
        merge_with_id=individual_id,
        photo_url="https://example.com/photos/john-photo3.jpg"
    )
    
    individual = mock_client.individuals[str(individual_id)]
    
    assert individual["photo_url"] == "https://example.com/photos/john-photo3.jpg"
    assert len(individual["photo_history"]) == 2
    assert individual["photo_history"][0]["url"] == "https://example.com/photos/john-photo2.jpg"
    assert individual["photo_history"][1]["url"] == "https://example.com/photos/john-photo1.jpg"
    print("✅ Photo history maintains chronological order")
    
    # Test 4: Update with fourth photo (test max 3 history)
    print("\nTest 4: Update individual with fourth photo...")
    result4 = await service.save_individual(
        user_id="test-user",
        user_name="Test User",
        data={
            "name": "John Doe",
            "height": 72,
            "weight": 190,
            "skin_color": "Light"
        },
        merge_with_id=individual_id,
        photo_url="https://example.com/photos/john-photo4.jpg"
    )
    
    individual = mock_client.individuals[str(individual_id)]
    
    assert individual["photo_url"] == "https://example.com/photos/john-photo4.jpg"
    assert len(individual["photo_history"]) == 3  # Max 3 items
    assert individual["photo_history"][0]["url"] == "https://example.com/photos/john-photo3.jpg"
    assert individual["photo_history"][1]["url"] == "https://example.com/photos/john-photo2.jpg"
    assert individual["photo_history"][2]["url"] == "https://example.com/photos/john-photo1.jpg"
    print("✅ Photo history limited to 3 items")
    
    # Test 5: Update with fifth photo (oldest should be dropped)
    print("\nTest 5: Update individual with fifth photo...")
    result5 = await service.save_individual(
        user_id="test-user",
        user_name="Test User",
        data={
            "name": "John Doe",
            "height": 72,
            "weight": 190,
            "skin_color": "Light"
        },
        merge_with_id=individual_id,
        photo_url="https://example.com/photos/john-photo5.jpg"
    )
    
    individual = mock_client.individuals[str(individual_id)]
    
    assert individual["photo_url"] == "https://example.com/photos/john-photo5.jpg"
    assert len(individual["photo_history"]) == 3
    assert individual["photo_history"][0]["url"] == "https://example.com/photos/john-photo4.jpg"
    assert individual["photo_history"][1]["url"] == "https://example.com/photos/john-photo3.jpg"
    assert individual["photo_history"][2]["url"] == "https://example.com/photos/john-photo2.jpg"
    # First photo should be dropped
    photo_urls = [item["url"] for item in individual["photo_history"]]
    assert "https://example.com/photos/john-photo1.jpg" not in photo_urls
    print("✅ Oldest photo dropped from history")
    
    # Test 6: Update without photo (photo fields unchanged)
    print("\nTest 6: Update individual without photo...")
    result6 = await service.save_individual(
        user_id="test-user",
        user_name="Test User",
        data={
            "name": "John Doe",
            "height": 73,  # Changed height
            "weight": 190,
            "skin_color": "Light"
        },
        merge_with_id=individual_id
        # No photo_url provided
    )
    
    individual = mock_client.individuals[str(individual_id)]
    
    # Photo fields should remain unchanged
    assert individual["photo_url"] == "https://example.com/photos/john-photo5.jpg"
    assert len(individual["photo_history"]) == 3
    assert individual["photo_history"][0]["url"] == "https://example.com/photos/john-photo4.jpg"
    print("✅ Photo fields unchanged when no photo provided")
    
    print("\n✅ All integration tests passed!")
    print("\nSummary:")
    print("- Photo history management integrated with individual save")
    print("- First photo has empty history")
    print("- Previous photos move to history on update")
    print("- History limited to 3 items")
    print("- Oldest photos dropped when limit exceeded")
    print("- Updates without photo preserve existing photo data")


if __name__ == "__main__":
    asyncio.run(test_photo_history_integration())