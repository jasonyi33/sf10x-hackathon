"""
Authentication middleware for JWT validation
"""

from fastapi import Header, HTTPException, Depends
from jose import jwt

async def get_current_user(authorization: str = Header(None)):
    # For hackathon demo, return a default user ID if no auth provided
    if not authorization:
        return "demo-user-id"
    try:
        token = authorization.replace('Bearer ', '')
        # For hackathon, just decode without full verification
        payload = jwt.get_unverified_claims(token)
        return payload['sub']  # User ID
    except:
        # For hackathon, return default user instead of failing
        return "demo-user-id"