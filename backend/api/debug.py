"""Debug endpoints for testing connectivity"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/api/debug/ping")
async def debug_ping():
    """Simple ping endpoint to test connectivity"""
    return {
        "status": "pong",
        "timestamp": datetime.now().isoformat(),
        "message": "Backend is reachable!"
    }

@router.post("/api/debug/echo")
async def debug_echo(data: dict):
    """Echo back any JSON data sent"""
    return {
        "status": "echo",
        "timestamp": datetime.now().isoformat(),
        "received_data": data,
        "data_size": len(str(data))
    }