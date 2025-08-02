"""
Category management endpoints
Minimal implementation for Task 2.0 prerequisite
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import os
from supabase import create_client, Client
from api.auth import get_current_user

router = APIRouter()

@router.get("/api/categories", response_model=Dict[str, List[Dict[str, Any]]])
async def get_categories(user_id: str = Depends(get_current_user)):
    """
    Get all categories (preset and custom) for dynamic prompt generation.
    Returns categories with their configuration for use in GPT-4o categorization.
    """
    try:
        # Initialize Supabase client inside function to ensure env vars are loaded
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")  # Use service key for full access
        )
        
        # Fetch all categories from database
        response = supabase.table("categories").select("*").order("created_at").execute()
        
        # Format response
        categories = []
        for category in response.data:
            # Parse options if they exist (for select types)
            cat_data = {
                "id": category["id"],
                "name": category["name"],
                "type": category["type"],
                "is_required": category["is_required"],
                "is_preset": category["is_preset"],
                "priority": category.get("priority", "medium"),
                "danger_weight": category.get("danger_weight", 0),
                "auto_trigger": category.get("auto_trigger", False),
                "options": category.get("options", None)
            }
            categories.append(cat_data)
        
        return {"categories": categories}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")