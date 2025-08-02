"""
Critical path integration tests for all endpoints
Will be implemented throughout development
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "SF Homeless Outreach API"
    assert data["framework"] == "FastAPI"
    assert data["project"] == "sf10x-hackathon"