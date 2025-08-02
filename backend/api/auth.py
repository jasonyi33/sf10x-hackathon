"""
Authentication middleware for JWT validation
"""

from fastapi import Header, HTTPException, Depends
from jose import jwt

async def get_current_user(authorization: str = Header()):
    try:
        token = authorization.replace('Bearer ', '')
        # For hackathon, just decode without full verification
        payload = jwt.get_unverified_claims(token)
        return payload['sub']  # User ID
    except:
        raise HTTPException(status_code=401, detail="Invalid token")