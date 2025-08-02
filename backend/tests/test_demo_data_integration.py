"""
Integration test demonstrating demo data usage
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
from main import app
from api.auth import get_current_user
import csv
import io


@pytest.mark.asyncio
class TestDemoDataIntegration:
    
    def setup_method(self):
        """Setup test dependencies"""
        async def mock_auth():
            return "test_user_id"
        app.dependency_overrides[get_current_user] = mock_auth
        
    def teardown_method(self):
        """Cleanup test dependencies"""
        app.dependency_overrides.clear()
    
    async def test_demo_data_in_export(self):
        """Test that demo data can be exported via CSV endpoint"""
        
        with patch("api.export.create_client") as mock_create_client:
            mock_client = MagicMock()
            mock_create_client.return_value = mock_client
            
            # Mock the demo individuals
            mock_individuals = [
                {"id": "550e8400-e29b-41d4-a716-446655440001", "name": "John Doe", 
                 "data": {"height": 72, "weight": 180, "skin_color": "Light"},
                 "danger_score": 75, "danger_override": None},
                {"id": "550e8400-e29b-41d4-a716-446655440002", "name": "Sarah Smith",
                 "data": {"height": 64, "weight": 130, "skin_color": "Dark"},
                 "danger_score": 20, "danger_override": 40},
                {"id": "550e8400-e29b-41d4-a716-446655440003", "name": "Robert Johnson",
                 "data": {"height": 70, "weight": 200, "skin_color": "Medium"},
                 "danger_score": 90, "danger_override": None}
            ]
            
            # Mock interactions
            mock_interactions = [
                {"individual_id": "550e8400-e29b-41d4-a716-446655440001", "created_at": "2024-01-15T10:00:00Z"},
                {"individual_id": "550e8400-e29b-41d4-a716-446655440002", "created_at": "2024-01-16T14:30:00Z"},
                {"individual_id": "550e8400-e29b-41d4-a716-446655440003", "created_at": "2024-01-17T09:00:00Z"}
            ]
            
            # Set up mocks
            individuals_table = MagicMock()
            individuals_select = MagicMock()
            individuals_table.select.return_value = individuals_select
            individuals_select.execute.return_value.data = mock_individuals
            
            interactions_table = MagicMock()
            interactions_select = MagicMock()
            interactions_order = MagicMock()
            interactions_table.select.return_value = interactions_select
            interactions_select.order.return_value = interactions_order
            interactions_order.execute.return_value.data = mock_interactions
            
            def table_router(table_name):
                if table_name == "individuals":
                    return individuals_table
                elif table_name == "interactions":
                    return interactions_table
                return MagicMock()
            
            mock_client.table.side_effect = table_router
            
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/export",
                    headers={"Authorization": "Bearer test_token"}
                )
                
        # Verify response
        assert response.status_code == 200
        
        # Parse CSV and verify demo data
        csv_content = response.text
        reader = csv.DictReader(io.StringIO(csv_content))
        rows = list(reader)
        
        # Verify specific individuals from demo data
        john = next((r for r in rows if r["name"] == "John Doe"), None)
        assert john is not None
        assert john["danger_score"] == "75"
        
        sarah = next((r for r in rows if r["name"] == "Sarah Smith"), None)
        assert sarah is not None
        assert sarah["danger_score"] == "40"  # Override value
        
        robert = next((r for r in rows if r["name"] == "Robert Johnson"), None)
        assert robert is not None
        assert robert["danger_score"] == "90"
        
