"""
Integration test for CSV export functionality
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
from main import app
from api.auth import get_current_user
from datetime import datetime, timezone
import csv
import io
from uuid import uuid4


@pytest.mark.asyncio
class TestExportIntegration:
    
    def setup_method(self):
        """Setup test dependencies"""
        async def mock_auth():
            return "test_user_id"
        app.dependency_overrides[get_current_user] = mock_auth
        
    def teardown_method(self):
        """Cleanup test dependencies"""
        app.dependency_overrides.clear()
    
    async def test_export_with_various_data_types(self):
        """Test export handles various data types and edge cases"""
        
        with patch("api.export.create_client") as mock_create_client:
            mock_client = MagicMock()
            mock_create_client.return_value = mock_client
            
            # Create diverse test data
            mock_individuals = [
                {
                    "id": str(uuid4()),
                    "name": "Complete Individual",
                    "data": {
                        "height": 72,
                        "weight": 180,
                        "skin_color": "Light",
                        "gender": "Male",
                        "substance_abuse_history": ["Moderate", "In Recovery"]  # Multi-select
                    },
                    "danger_score": 65,
                    "danger_override": None
                },
                {
                    "id": str(uuid4()),
                    "name": "Override Individual",
                    "data": {
                        "height": 60,
                        "weight": 120,
                        "skin_color": "Dark"
                    },
                    "danger_score": 85,
                    "danger_override": 30  # Manual override
                },
                {
                    "id": str(uuid4()),
                    "name": "Minimal Individual",
                    "data": {
                        "height": 0,  # Edge case: zero value
                        "weight": None,  # Missing value
                        "skin_color": ""  # Empty string
                    },
                    "danger_score": 0,
                    "danger_override": None
                }
            ]
            
            # Mock different interaction patterns
            mock_interactions = [
                {"individual_id": mock_individuals[0]["id"], "created_at": "2024-01-20T09:00:00Z"},
                {"individual_id": mock_individuals[0]["id"], "created_at": "2024-01-15T10:00:00Z"},  # Multiple interactions
                {"individual_id": mock_individuals[1]["id"], "created_at": "2024-01-18T14:30:00Z"},
                # Third individual has no interactions
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
        assert "text/csv" in response.headers["content-type"]
        assert "individuals_export.csv" in response.headers["content-disposition"]
        
        # Parse and verify CSV content
        csv_content = response.text
        reader = csv.DictReader(io.StringIO(csv_content))
        rows = list(reader)
        
        assert len(rows) == 3
        
        # Verify first individual (complete data)
        assert rows[0]["name"] == "Complete Individual"
        assert rows[0]["height"] == "72"
        assert rows[0]["weight"] == "180"
        assert rows[0]["skin_color"] == "Light"
        assert rows[0]["danger_score"] == "65"  # No override
        assert rows[0]["last_seen"] == "2024-01-20T09:00:00Z"  # Most recent
        
        # Verify second individual (with override)
        assert rows[1]["name"] == "Override Individual"
        assert rows[1]["danger_score"] == "30"  # Override value, not 85
        assert rows[1]["last_seen"] == "2024-01-18T14:30:00Z"
        
        # Verify third individual (edge cases)
        assert rows[2]["name"] == "Minimal Individual"
        assert rows[2]["height"] == "0"  # Zero preserved
        assert rows[2]["weight"] == ""  # Null becomes empty
        assert rows[2]["skin_color"] == ""  # Empty preserved
        assert rows[2]["danger_score"] == "0"
        assert rows[2]["last_seen"] == ""  # No interactions