"""
Test cases for GET /api/export endpoint
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock
from main import app
from datetime import datetime, timezone
import csv
import io
from api.auth import get_current_user


@pytest.mark.asyncio
class TestExportCSV:
    
    def setup_method(self):
        """Setup test dependencies"""
        async def mock_auth():
            return "test_user_id"
        app.dependency_overrides[get_current_user] = mock_auth
        
    def teardown_method(self):
        """Cleanup test dependencies"""
        app.dependency_overrides.clear()
    
    async def test_export_csv_success(self):
        """Test successful CSV export with all individuals"""
        # Mock data
        mock_individuals = [
            {
                "id": "123",
                "name": "John Doe",
                "data": {
                    "height": 72,
                    "weight": 180,
                    "skin_color": "Light"
                },
                "danger_score": 75,
                "danger_override": None
            },
            {
                "id": "456", 
                "name": "Jane Smith",
                "data": {
                    "height": 64,
                    "weight": 130,
                    "skin_color": "Dark"
                },
                "danger_score": 30,
                "danger_override": 50  # Override set
            }
        ]
        
        mock_interactions = [
            {"individual_id": "123", "created_at": "2024-01-15T10:00:00Z"},
            {"individual_id": "456", "created_at": "2024-01-16T14:30:00Z"}
        ]
        
        with patch("api.export.create_client") as mock_create_client:
            mock_client = MagicMock()
            mock_create_client.return_value = mock_client
            
            # Mock individuals query
            individuals_table = MagicMock()
            individuals_select = MagicMock()
            individuals_table.select.return_value = individuals_select
            individuals_select.execute.return_value.data = mock_individuals
            
            # Mock interactions query
            interactions_table = MagicMock()
            interactions_select = MagicMock()
            interactions_order = MagicMock()
            interactions_table.select.return_value = interactions_select
            interactions_select.order.return_value = interactions_order
            interactions_order.execute.return_value.data = mock_interactions
            
            # Set up table routing
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
                
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]
        assert "attachment" in response.headers["content-disposition"]
        
        # Parse CSV content
        csv_content = response.text
        reader = csv.DictReader(io.StringIO(csv_content))
        rows = list(reader)
        
        assert len(rows) == 2
        assert rows[0]["name"] == "John Doe"
        assert rows[0]["danger_score"] == "75"  # No override
        assert rows[1]["danger_score"] == "50"  # Override used
            
    async def test_export_empty_database(self):
        """Test CSV export with no individuals"""
        with patch("api.export.create_client") as mock_create_client:
            mock_client = MagicMock()
            mock_create_client.return_value = mock_client
            
            # Mock individuals query (empty)
            individuals_table = MagicMock()
            individuals_select = MagicMock()
            individuals_table.select.return_value = individuals_select
            individuals_select.execute.return_value.data = []
            
            # Mock interactions query (empty)
            interactions_table = MagicMock()
            interactions_select = MagicMock()
            interactions_order = MagicMock()
            interactions_table.select.return_value = interactions_select
            interactions_select.order.return_value = interactions_order
            interactions_order.execute.return_value.data = []
            
            # Set up table routing
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
                
        assert response.status_code == 200
        csv_content = response.text
        assert "name,height,weight,skin_color,danger_score,last_seen" in csv_content
        assert len(csv_content.strip().split('\n')) == 1  # Headers only
            
    async def test_export_null_values(self):
        """Test CSV export handles null values properly"""
        mock_individual = {
            "id": "789",
            "name": "Incomplete Person",
            "data": {
                "height": None,  # Null value
                "weight": 150,
                "skin_color": "Medium"
            },
            "danger_score": 0,
            "danger_override": None
        }
        
        with patch("api.export.create_client") as mock_create_client:
            mock_client = MagicMock()
            mock_create_client.return_value = mock_client
            
            # Mock individuals query
            individuals_table = MagicMock()
            individuals_select = MagicMock()
            individuals_table.select.return_value = individuals_select
            individuals_select.execute.return_value.data = [mock_individual]
            
            # Mock interactions query (empty)
            interactions_table = MagicMock()
            interactions_select = MagicMock()
            interactions_order = MagicMock()
            interactions_table.select.return_value = interactions_select
            interactions_select.order.return_value = interactions_order
            interactions_order.execute.return_value.data = []
            
            # Set up table routing
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
                
        csv_content = response.text
        reader = csv.DictReader(io.StringIO(csv_content))
        row = list(reader)[0]
        assert row["height"] == ""  # Null becomes empty string
        assert row["last_seen"] == ""  # No interactions
            
    async def test_export_requires_auth(self):
        """Test authentication required for export"""
        # Clear auth override for this test
        app.dependency_overrides.clear()
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/export")
            
        assert response.status_code in [401, 422]
        
        # Restore auth override for other tests
        async def mock_auth():
            return "test_user_id"
        app.dependency_overrides[get_current_user] = mock_auth