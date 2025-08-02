"""
Category management endpoints
Minimal implementation for Task 2.0 prerequisite
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
import os
from supabase import create_client, Client
from api.auth import get_current_user
from db.models import CreateCategoryRequest, CategoryResponse
from datetime import datetime, timezone
from uuid import uuid4

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


@router.post("/api/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    request: CreateCategoryRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Create a new custom category with validation.
    
    Validation rules:
    - Only number and single_select types can have danger_weight > 0
    - Only number and single_select types can have auto_trigger = true
    - Category names must be unique (case insensitive)
    - Single-select options must be list of {label, value} objects
    - Multi-select options must be list of strings
    """
    try:
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        # Check for duplicate name (case insensitive)
        existing = supabase.table("categories").select("name").ilike("name", request.name).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Category with name '{request.name}' already exists"
            )
        
        # Prepare category data
        now = datetime.now(timezone.utc).isoformat()
        category_data = {
            "id": str(uuid4()),
            "name": request.name,  # Already capitalized by validator
            "type": request.type,
            "is_required": request.is_required,
            "is_preset": False,  # Custom categories are never preset
            "priority": request.priority,
            "danger_weight": request.danger_weight,
            "auto_trigger": request.auto_trigger,
            "options": request.options,
            "created_at": now,
            "updated_at": now
        }
        
        # Insert into database
        result = supabase.table("categories").insert(category_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create category"
            )
        
        # Return created category
        created = result.data[0]
        return CategoryResponse(
            id=created["id"],
            name=created["name"],
            type=created["type"],
            is_required=created["is_required"],
            is_preset=created["is_preset"],
            priority=created["priority"],
            danger_weight=created["danger_weight"],
            auto_trigger=created["auto_trigger"],
            options=created["options"],
            created_at=created["created_at"],
            updated_at=created["updated_at"]
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        # Pydantic validation errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "errors": {
                    "validation": [str(e)],
                    "missing_required": []
                }
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create category: {str(e)}"
        )