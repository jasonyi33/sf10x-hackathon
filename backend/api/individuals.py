"""
Individual management API endpoints
"""
import os
from fastapi import APIRouter, HTTPException, Depends, status, Query
from uuid import UUID
from typing import Optional
from datetime import datetime, timezone
from supabase import create_client, Client

from api.auth import get_current_user
from db.models import (
    SaveIndividualRequest,
    SaveIndividualResponse,
    LocationData,
    SearchIndividualsResponse,
    IndividualDetailResponse,
    DangerOverrideRequest,
    DangerOverrideResponse,
    InteractionsResponse
)
from services.individual_service import IndividualService
from services.validation_helper import validate_categorized_data


router = APIRouter()


def get_current_user_name(user_id: str = Depends(get_current_user)) -> str:
    """Get user display name - flexible for future enhancement"""
    # For MVP/demo, return fixed name
    # Future: Could parse from JWT claims or user profile
    return "Demo User"


def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    
    # For demo/hackathon, use mock client if credentials are mock
    if url == "mock" or key == "mock" or not url or not key:
        print("Using mock Supabase client for demo")
        # Return a mock client that returns demo data
        class MockSupabaseClient:
            def table(self, name):
                return MockTable(name)
        
        class MockTable:
            def __init__(self, table_name):
                self.table_name = table_name
                self.mock_data = self._get_mock_data()
            
            def _get_mock_data(self):
                if self.table_name == "individuals":
                    return [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440001",
                            "name": "John Doe",
                            "danger_score": 75,
                            "danger_override": None,
                            "data": {"age": 45, "height": 72, "weight": 180},
                            "created_at": "2024-01-15T10:30:00Z",
                            "updated_at": "2024-01-15T10:30:00Z"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440002", 
                            "name": "Sarah Smith",
                            "danger_score": 20,
                            "danger_override": 40,
                            "data": {"age": 32, "height": 65, "weight": 140},
                            "created_at": "2024-01-12T14:20:00Z",
                            "updated_at": "2024-01-12T14:20:00Z"
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440003",
                            "name": "Robert Johnson", 
                            "danger_score": 90,
                            "danger_override": None,
                            "data": {"age": 58, "height": 70, "weight": 200},
                            "created_at": "2024-01-16T09:15:00Z",
                            "updated_at": "2024-01-16T09:15:00Z"
                        }
                    ]
                elif self.table_name == "interactions":
                    return [
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440101",
                            "individual_id": "550e8400-e29b-41d4-a716-446655440001",
                            "user_id": "user1",
                            "created_at": "2024-01-15T10:30:00Z",
                            "location": {"lat": 37.7749, "lng": -122.4194, "address": "Market St & 5th"}
                        },
                        {
                            "id": "550e8400-e29b-41d4-a716-446655440102", 
                            "individual_id": "550e8400-e29b-41d4-a716-446655440002",
                            "user_id": "user1", 
                            "created_at": "2024-01-12T14:20:00Z",
                            "location": {"lat": 37.7858, "lng": -122.4064, "address": "Ellis St & 6th"}
                        }
                    ]
                elif self.table_name == "categories":
                    return [
                        {"id": "550e8400-e29b-41d4-a716-446655440201", "name": "name", "type": "text", "is_required": True},
                        {"id": "550e8400-e29b-41d4-a716-446655440202", "name": "height", "type": "number", "is_required": True},
                        {"id": "550e8400-e29b-41d4-a716-446655440203", "name": "weight", "type": "number", "is_required": True}
                    ]
                return []
            
            def select(self, *args):
                return self
            
            def eq(self, field, value):
                # Filter by field value
                if field == "individual_id":
                    self.mock_data = [item for item in self.mock_data if item.get("individual_id") == value]
                return self
            
            def ilike(self, field, value):
                # Filter by name (case insensitive)
                if field == "name":
                    search_term = value.replace("%", "").lower()
                    self.mock_data = [item for item in self.mock_data if search_term in item.get("name", "").lower()]
                return self
            
            def order(self, field, desc=False):
                # Sort by field
                reverse = desc
                if field == "created_at":
                    self.mock_data.sort(key=lambda x: x.get("created_at", ""), reverse=reverse)
                elif field == "danger_score":
                    self.mock_data.sort(key=lambda x: x.get("danger_score", 0), reverse=reverse)
                elif field == "name":
                    self.mock_data.sort(key=lambda x: x.get("name", ""), reverse=reverse)
                return self
            
            def limit(self, count):
                # Limit results
                self.mock_data = self.mock_data[:count]
                return self
            
            def update(self, data):
                # Update the first matching record
                if self.mock_data:
                    self.mock_data[0].update(data)
                return MockResponse(self.mock_data)
            
            def single(self):
                # Return single result (for get by ID)
                if self.mock_data:
                    return MockResponse([self.mock_data[0]])
                return MockResponse([])
            
            def execute(self):
                return MockResponse(self.mock_data)
        
        class MockResponse:
            def __init__(self, data):
                self._data = data
            
            @property
            def data(self):
                return self._data
            
            def execute(self):
                # MockResponse should also support execute() for consistency
                return self
    
    if not url or not key:
        raise ValueError("Supabase configuration missing")
    return create_client(url, key)


@router.post("/api/individuals", response_model=SaveIndividualResponse)
async def save_individual(
    request: SaveIndividualRequest,
    user_id: str = Depends(get_current_user),
    user_name: str = Depends(get_current_user_name)
):
    """
    Save new individual or update existing (merge).
    
    Flow:
    1. Validate merge_with_id exists (if provided)
    2. Fetch categories for validation
    3. Validate data using validation_helper
    4. Use individual_service to save
    5. Return individual and interaction records
    """
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Initialize service
        service = IndividualService(supabase)
        
        # If merge_with_id provided, verify it exists first
        if request.merge_with_id:
            existing = await service.get_individual_by_id(request.merge_with_id)
            if not existing:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Individual not found: {request.merge_with_id}"
                )
        
        # Fetch categories for validation
        categories_response = supabase.table("categories").select("*").execute()
        categories = categories_response.data
        
        # Validate the categorized data
        validation_result = validate_categorized_data(request.data, categories)
        
        # If validation fails, return error with details
        if not validation_result.is_valid:
            # Combine missing required and validation errors
            error_detail = []
            if validation_result.missing_required:
                error_detail.append(f"Missing required fields: {validation_result.missing_required}")
            if validation_result.validation_errors:
                for error in validation_result.validation_errors:
                    error_detail.append(f"{error['field']}: {error['message']}")
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=". ".join(error_detail)
            )
        
        # Save individual using service
        result = await service.save_individual(
            user_id=user_id,
            user_name=user_name,
            data=request.data,
            merge_with_id=request.merge_with_id,
            location=request.location,
            transcription=request.transcription,
            audio_url=request.audio_url,
            photo_url=request.photo_url
        )
        
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except ValueError as e:
        # Handle validation errors from service
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Log error for debugging
        print(f"Error saving individual: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save individual: {str(e)}"
        )


@router.get("/api/individuals/search", response_model=SearchIndividualsResponse)
async def advanced_search_individuals(
    q: Optional[str] = Query(None, description="Search query"),
    gender: Optional[str] = Query(None, description="Comma-separated genders"),
    age_min: Optional[int] = Query(None, ge=0, le=120),
    age_max: Optional[int] = Query(None, ge=0, le=120),
    height_min: Optional[int] = Query(None, ge=0, le=300),
    height_max: Optional[int] = Query(None, ge=0, le=300),
    danger_min: Optional[int] = Query(None, ge=0, le=100),
    danger_max: Optional[int] = Query(None, ge=0, le=100),
    has_photo: Optional[bool] = Query(None),
    sort_by: str = Query("danger_score", pattern="^(danger_score|last_seen|name|distance)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(10, ge=1, le=20),
    offset: int = Query(0, ge=0, le=100),
    lat: Optional[float] = Query(None, ge=-90, le=90),
    lon: Optional[float] = Query(None, ge=-180, le=180),
    user_id: str = Depends(get_current_user)
):
    """
    Advanced search endpoint with multiple filters.
    
    Features:
    - Text search across name and JSONB data fields
    - Gender filter (comma-separated for OR logic)
    - Age range with overlap logic
    - Height range filter
    - Danger score range filter
    - Has photo filter
    - Sorting options: danger_score, last_seen, name, distance
    - Distance sort requires lat/lon coordinates
    - Pagination with limit/offset
    """
    try:
        # Validate distance sort requires coordinates
        if sort_by == "distance" and (lat is None or lon is None):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Distance sort requires lat and lon parameters"
            )
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Initialize service
        service = IndividualService(supabase)
        
        # Perform advanced search
        result = await service.advanced_search(
            q=q,
            gender=gender,
            age_min=age_min,
            age_max=age_max,
            height_min=height_min,
            height_max=height_max,
            danger_min=danger_min,
            danger_max=danger_max,
            has_photo=has_photo,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset,
            lat=lat,
            lon=lon
        )
        
        return SearchIndividualsResponse(**result)
        
    except HTTPException:
        # Re-raise HTTPExceptions (like our validation error)
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Log error for debugging
        print(f"Error in advanced search: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search individuals: {str(e)}"
        )


@router.get("/api/individuals", response_model=SearchIndividualsResponse)
async def search_individuals(
    search: Optional[str] = Query(None, description="Search term for name and data fields"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    sort_by: str = Query("last_seen", pattern="^(last_seen|danger_score|name)$", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    user_id: str = Depends(get_current_user)
):
    """
    Search and list individuals.
    
    Features:
    - Search across name and all JSONB data fields
    - Pagination with limit/offset
    - Sorting by last_seen (default), danger_score, or name
    - Returns abbreviated addresses for display
    """
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Initialize service
        service = IndividualService(supabase)
        
        # Perform search
        result = await service.search_individuals(
            search=search,
            limit=limit,
            offset=offset,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        return result
        
    except Exception as e:
        # Log error for debugging
        print(f"Error searching individuals: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search individuals: {str(e)}"
        )


@router.get("/api/individuals/{individual_id}", response_model=IndividualDetailResponse)
async def get_individual(
    individual_id: UUID,
    user_id: str = Depends(get_current_user)
):
    """
    Get individual details with recent interactions.
    
    Returns:
    - Full individual data with all fields
    - Last 10 interactions (summary only)
    - Calculated display danger score
    - 404 if individual not found
    """
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Initialize service
        service = IndividualService(supabase)
        
        # Get individual details
        result = await service.get_individual_by_id(individual_id)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Individual not found: {individual_id}"
            )
        
        return result
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error for debugging
        print(f"Error getting individual {individual_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get individual: {str(e)}"
        )


@router.put("/api/individuals/{individual_id}/danger-override", response_model=DangerOverrideResponse)
async def update_danger_override(
    individual_id: UUID,
    request: DangerOverrideRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Update manual danger score override.
    
    Features:
    - Set danger_override to provided value (0-100)
    - Pass null to remove override
    - Returns all danger scores for UI update
    - 404 if individual not found
    """
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Update the danger_override field
        update_result = supabase.table("individuals").update({
            "danger_override": request.danger_override,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", str(individual_id)).execute()
        
        # Check if individual was found and updated
        if not update_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Individual not found: {individual_id}"
            )
        
        # Get the updated individual data
        individual = update_result.data[0]
        
        # Calculate display score
        display_score = individual["danger_override"] if individual["danger_override"] is not None else individual["danger_score"]
        
        return DangerOverrideResponse(
            danger_score=individual["danger_score"],
            danger_override=individual["danger_override"],
            display_score=display_score
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log error for debugging
        print(f"Error updating danger override for {individual_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update danger override: {str(e)}"
        )


@router.get("/api/individuals/{individual_id}/interactions", response_model=InteractionsResponse)
async def get_interactions(
    individual_id: UUID,
    limit: int = Query(50, ge=1, le=100, description="Maximum interactions per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    user_id: str = Depends(get_current_user)
):
    """
    Get detailed interaction history for an individual.
    
    Features:
    - Returns all interaction records in chronological order (newest first)
    - Shows full addresses (not abbreviated)
    - Contains only fields that changed in each interaction
    - Includes transcription for voice entries
    - Supports pagination with limit/offset
    """
    try:
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Query interactions for this individual
        interactions_result = supabase.table("interactions").select("*").eq(
            "individual_id", str(individual_id)
        ).order(
            "created_at", desc=True
        ).limit(
            limit
        ).offset(
            offset
        ).execute()
        
        # Transform to response format
        interactions = []
        for interaction in interactions_result.data:
            interactions.append({
                "id": interaction["id"],
                "created_at": interaction["created_at"],
                "user_name": interaction["user_name"],
                "transcription": interaction.get("transcription"),
                "location": interaction.get("location"),
                "changes": interaction.get("changes", {})
            })
        
        return InteractionsResponse(interactions=interactions)
        
    except Exception as e:
        # Log error for debugging
        print(f"Error getting interactions for {individual_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get interactions: {str(e)}"
        )