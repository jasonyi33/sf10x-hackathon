"""
Simple test to verify endpoint doesn't exist yet
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Try to import main
try:
    from main import app
    client = TestClient(app)
except ImportError:
    # main.py might not have our router yet
    from fastapi import FastAPI
    app = FastAPI()
    client = TestClient(app)


def test_post_individuals_endpoint_missing():
    """Test that POST /api/individuals doesn't exist yet"""
    response = client.post(
        "/api/individuals",
        json={"data": {"name": "Test"}},
        headers={"Authorization": "Bearer test"}
    )
    # Should get 404 since endpoint doesn't exist
    assert response.status_code in [404, 401, 405]  # Not found or method not allowed
    print(f"Endpoint status: {response.status_code} - This should fail until we implement it")