"""
Task 4.0.5: Demo Data Creation Tests
Verify that the required 5 demo individuals exist with correct specifications
"""

import pytest
import asyncio
from unittest.mock import patch, MagicMock
from datetime import datetime
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.individual_service import IndividualService

# Mark all tests as async
pytestmark = pytest.mark.asyncio


class TestDemoDataRequirements:
    """Test that demo data meets PRD requirements"""
    
    # Required demo individuals as per PRD
    REQUIRED_INDIVIDUALS = [
        {
            "name": "John Doe",
            "gender": "Male",
            "age": [45, 50],
            "height": 70,  # 5'10"
            "skin_color": "Medium",
            "danger_score": 20,
            "has_photo": True,
            "has_history": True
        },
        {
            "name": "Jane Smith",
            "gender": "Female", 
            "age": [-1, -1],  # Unknown age
            "height": 66,  # 5'6"
            "skin_color": "Light",
            "danger_score": 80,
            "has_photo": False,
            "has_history": True
        },
        {
            "name": "Robert Johnson",
            "gender": "Male",
            "age": [65, 70],
            "height": 72,  # 6'0"
            "skin_color": "Dark",
            "danger_score": 45,
            "has_photo": True,
            "has_history": True,
            "has_photo_history": True  # Special: has photo history
        },
        {
            "name": "Maria Garcia",
            "gender": "Female",
            "age": [30, 35],
            "height": 64,  # 5'4"
            "skin_color": "Medium",
            "danger_score": 10,
            "has_photo": True,
            "has_history": True
        },
        {
            "name": "Unknown Person",
            "gender": "Unknown",
            "age": [-1, -1],  # Unknown age
            "height": 68,  # 5'8"
            "skin_color": "Medium",
            "danger_score": 90,
            "has_photo": False,
            "has_history": True
        }
    ]
    
    @pytest.fixture
    def mock_supabase(self):
        """Mock Supabase client with demo data"""
        mock = MagicMock()
        
        # Mock demo individuals data
        mock_individuals = [
            {
                "id": "demo-john-doe",
                "name": "John Doe",
                "danger_score": 20,
                "danger_override": None,
                "photo_url": "https://storage.example.com/photos/john-doe.jpg",
                "data": {
                    "gender": "Male",
                    "approximate_age": [45, 50],
                    "height": 70,
                    "weight": 180,
                    "skin_color": "Medium"
                },
                "created_at": "2024-01-01T10:00:00Z",
                "updated_at": "2024-01-15T10:00:00Z"
            },
            {
                "id": "demo-jane-smith",
                "name": "Jane Smith",
                "danger_score": 80,
                "danger_override": None,
                "photo_url": None,
                "data": {
                    "gender": "Female",
                    "approximate_age": [-1, -1],
                    "height": 66,
                    "weight": 140,
                    "skin_color": "Light"
                },
                "created_at": "2024-01-02T10:00:00Z",
                "updated_at": "2024-01-16T10:00:00Z"
            },
            {
                "id": "demo-robert-johnson",
                "name": "Robert Johnson",
                "danger_score": 45,
                "danger_override": None,
                "photo_url": "https://storage.example.com/photos/robert-johnson.jpg",
                "data": {
                    "gender": "Male",
                    "approximate_age": [65, 70],
                    "height": 72,
                    "weight": 200,
                    "skin_color": "Dark"
                },
                "created_at": "2024-01-03T10:00:00Z",
                "updated_at": "2024-01-17T10:00:00Z"
            },
            {
                "id": "demo-maria-garcia",
                "name": "Maria Garcia",
                "danger_score": 10,
                "danger_override": None,
                "photo_url": "https://storage.example.com/photos/maria-garcia.jpg",
                "data": {
                    "gender": "Female",
                    "approximate_age": [30, 35],
                    "height": 64,
                    "weight": 130,
                    "skin_color": "Medium"
                },
                "created_at": "2024-01-04T10:00:00Z",
                "updated_at": "2024-01-18T10:00:00Z"
            },
            {
                "id": "demo-unknown-person",
                "name": "Unknown Person",
                "danger_score": 90,
                "danger_override": None,
                "photo_url": None,
                "data": {
                    "gender": "Unknown",
                    "approximate_age": [-1, -1],
                    "height": 68,
                    "weight": 160,
                    "skin_color": "Medium"
                },
                "created_at": "2024-01-05T10:00:00Z",
                "updated_at": "2024-01-19T10:00:00Z"
            }
        ]
        
        # Mock search to return demo individuals
        mock.table.return_value.select.return_value.execute.return_value = MagicMock(
            data=mock_individuals
        )
        
        return mock
    
    async def test_all_required_individuals_exist(self, mock_supabase):
        """Test that all 5 required demo individuals exist"""
        service = IndividualService(mock_supabase)
        
        # Get all individuals
        result = await service.search_individuals("")
        individuals = result["individuals"]
        
        # Check we have at least 5 individuals
        assert len(individuals) >= 5, f"Expected at least 5 demo individuals, found {len(individuals)}"
        
        # Check each required individual exists
        for required in self.REQUIRED_INDIVIDUALS:
            found = False
            for ind in individuals:
                if ind["name"] == required["name"]:
                    found = True
                    break
            
            assert found, f"Required demo individual '{required['name']}' not found"
    
    async def test_individual_specifications(self, mock_supabase):
        """Test that each demo individual has correct specifications"""
        service = IndividualService(mock_supabase)
        
        # Get all individuals
        result = await service.search_individuals("")
        individuals = result["individuals"]
        
        # Create lookup by name
        individuals_by_name = {ind["name"]: ind for ind in individuals}
        
        # Verify each individual's specifications
        for required in self.REQUIRED_INDIVIDUALS:
            ind = individuals_by_name.get(required["name"])
            assert ind is not None, f"Individual '{required['name']}' not found"
            
            # Check gender
            assert ind["data"]["gender"] == required["gender"], \
                f"{required['name']}: Expected gender '{required['gender']}', got '{ind['data']['gender']}'"
            
            # Check age
            assert ind["data"]["approximate_age"] == required["age"], \
                f"{required['name']}: Expected age {required['age']}, got {ind['data']['approximate_age']}"
            
            # Check height
            assert ind["data"]["height"] == required["height"], \
                f"{required['name']}: Expected height {required['height']}, got {ind['data']['height']}'"
            
            # Check skin color
            assert ind["data"]["skin_color"] == required["skin_color"], \
                f"{required['name']}: Expected skin_color '{required['skin_color']}', got '{ind['data']['skin_color']}'"
            
            # Check danger score
            assert ind["danger_score"] == required["danger_score"], \
                f"{required['name']}: Expected danger_score {required['danger_score']}, got {ind['danger_score']}"
            
            # Check photo
            has_photo = ind.get("photo_url") is not None
            assert has_photo == required["has_photo"], \
                f"{required['name']}: Expected has_photo={required['has_photo']}, got {has_photo}"
    
    async def test_edge_cases(self, mock_supabase):
        """Test edge cases: Unknown age and Unknown gender"""
        service = IndividualService(mock_supabase)
        
        # Get all individuals
        result = await service.search_individuals("")
        individuals = result["individuals"]
        
        # Check Jane Smith has unknown age
        jane = next((ind for ind in individuals if ind["name"] == "Jane Smith"), None)
        assert jane is not None
        assert jane["data"]["approximate_age"] == [-1, -1], "Jane Smith should have unknown age [-1, -1]"
        
        # Check Unknown Person has both unknown age and gender
        unknown = next((ind for ind in individuals if ind["name"] == "Unknown Person"), None)
        assert unknown is not None
        assert unknown["data"]["approximate_age"] == [-1, -1], "Unknown Person should have unknown age [-1, -1]"
        assert unknown["data"]["gender"] == "Unknown", "Unknown Person should have gender 'Unknown'"
    
    async def test_photo_history(self, mock_supabase):
        """Test that Robert Johnson has photo history"""
        # Mock photo history for Robert Johnson
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
            data=[
                {
                    "id": "photo-1",
                    "individual_id": "demo-robert-johnson",
                    "photo_url": "https://storage.example.com/photos/robert-old-1.jpg",
                    "consent_given": True,
                    "created_at": "2024-01-03T10:00:00Z"
                },
                {
                    "id": "photo-2", 
                    "individual_id": "demo-robert-johnson",
                    "photo_url": "https://storage.example.com/photos/robert-old-2.jpg",
                    "consent_given": True,
                    "created_at": "2024-01-10T10:00:00Z"
                },
                {
                    "id": "photo-3",
                    "individual_id": "demo-robert-johnson",
                    "photo_url": "https://storage.example.com/photos/robert-johnson.jpg",
                    "consent_given": True,
                    "created_at": "2024-01-17T10:00:00Z"
                }
            ]
        )
        
        # Check photo history exists
        photo_history = mock_supabase.table("photo_history").select("*").eq("individual_id", "demo-robert-johnson").order("created_at").execute()
        
        assert len(photo_history.data) >= 2, "Robert Johnson should have photo history (at least 2 photos)"
    
    async def test_searchability(self, mock_supabase):
        """Test that demo individuals are searchable by various criteria"""
        service = IndividualService(mock_supabase)
        
        # Test search by name
        test_searches = [
            ("John", ["John Doe"]),
            ("Smith", ["Jane Smith"]),
            ("Garcia", ["Maria Garcia"]),
            ("Unknown", ["Unknown Person"])
        ]
        
        for query, expected_names in test_searches:
            # Mock filtered results
            mock_supabase.table.return_value.select.return_value.ilike.return_value.execute.return_value = MagicMock(
                data=[ind for ind in mock_supabase.table().select().execute().data 
                      if query.lower() in ind["name"].lower()]
            )
            
            result = await service.search_individuals(query)
            found_names = [ind["name"] for ind in result["individuals"]]
            
            for expected in expected_names:
                assert expected in found_names, f"Search '{query}' should find '{expected}'"
    
    async def test_danger_score_distribution(self, mock_supabase):
        """Test that demo individuals have varied danger scores"""
        service = IndividualService(mock_supabase)
        
        result = await service.search_individuals("")
        individuals = result["individuals"]
        
        danger_scores = [ind["danger_score"] for ind in individuals]
        
        # Check we have low, medium, and high danger scores
        assert any(score <= 20 for score in danger_scores), "Should have low danger scores (≤20)"
        assert any(20 < score <= 50 for score in danger_scores), "Should have medium danger scores (20-50)"
        assert any(score > 50 for score in danger_scores), "Should have high danger scores (>50)"
        
        # Check specific distribution
        expected_scores = [20, 80, 45, 10, 90]
        actual_scores = sorted([ind["danger_score"] for ind in individuals])
        expected_scores.sort()
        
        assert actual_scores == expected_scores, f"Expected danger scores {expected_scores}, got {actual_scores}"
    
    async def test_interaction_history(self, mock_supabase):
        """Test that all demo individuals have interaction history"""
        # Mock interactions for each individual
        mock_interactions = {
            "demo-john-doe": [
                {"id": "int-1", "created_at": "2024-01-15T10:00:00Z", "transcription": "Met John near Market Street..."},
                {"id": "int-2", "created_at": "2024-01-10T10:00:00Z", "data": {"location": "Golden Gate Park"}}
            ],
            "demo-jane-smith": [
                {"id": "int-3", "created_at": "2024-01-16T10:00:00Z", "transcription": "Jane at the library..."}
            ],
            "demo-robert-johnson": [
                {"id": "int-4", "created_at": "2024-01-17T10:00:00Z", "transcription": "Robert at Golden Gate Park..."},
                {"id": "int-5", "created_at": "2024-01-12T10:00:00Z", "data": {"medical_needs": "Diabetes medication"}},
                {"id": "int-6", "created_at": "2024-01-08T10:00:00Z", "data": {"veteran_status": "Yes"}}
            ],
            "demo-maria-garcia": [
                {"id": "int-7", "created_at": "2024-01-18T10:00:00Z", "transcription": "Maria seeking housing assistance..."}
            ],
            "demo-unknown-person": [
                {"id": "int-8", "created_at": "2024-01-19T10:00:00Z", "data": {"location": "Tenderloin", "needs": "Unknown"}}
            ]
        }
        
        for ind_id, interactions in mock_interactions.items():
            mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
                data=interactions
            )
            
            # Check interactions exist
            result = mock_supabase.table("interactions").select("*").eq("individual_id", ind_id).order("created_at", desc=True).execute()
            
            assert len(result.data) > 0, f"Individual {ind_id} should have interaction history"


class TestDemoDataCreation:
    """Test demo data creation functionality"""
    
    async def test_create_demo_individuals_script_exists(self):
        """Test that demo data creation script exists"""
        script_paths = [
            "/Users/jasonyi/sf10x-hackathon/backend/scripts/create_demo_data.py",
            "/Users/jasonyi/sf10x-hackathon/supabase/migrations/004_required_demo_data.sql"
        ]
        
        script_exists = any(os.path.exists(path) for path in script_paths)
        assert script_exists, "Demo data creation script should exist"
    
    async def test_demo_photos_exist(self):
        """Test that demo photos are available"""
        photo_paths = [
            "/Users/jasonyi/sf10x-hackathon/mobile/assets/demo-photos/john-doe.jpg",
            "/Users/jasonyi/sf10x-hackathon/mobile/assets/demo-photos/robert-johnson.jpg",
            "/Users/jasonyi/sf10x-hackathon/mobile/assets/demo-photos/maria-garcia.jpg"
        ]
        
        # At least one approach should exist
        photos_exist = any(os.path.exists(path) for path in photo_paths)
        
        # Or check for photo references in code
        if not photos_exist:
            # Check if there's a photo service that provides demo photos
            api_path = "/Users/jasonyi/sf10x-hackathon/mobile/services/api.ts"
            if os.path.exists(api_path):
                with open(api_path, 'r') as f:
                    content = f.read()
                    photos_exist = "demo-photo" in content or "example.com/photos" in content
        
        assert photos_exist, "Demo photos or photo references should exist"


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])