"""
Photo upload and consent management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, File, Form, UploadFile
from typing import Optional
import os
import json
import asyncio
from supabase import create_client, Client
from api.auth import get_current_user
from services.validation_helper import validate_age_range

router = APIRouter()

@router.post("/api/photos/upload")
async def upload_photo(
    photo: UploadFile = File(...),
    individual_id: Optional[str] = Form(None),
    consent_location: Optional[str] = Form(None),  # JSON string
    user_id: str = Depends(get_current_user)
):
    """
    Upload photo for an individual with consent tracking
    
    Args:
        photo: Image file (JPEG/PNG, max 5MB)
        individual_id: UUID of the individual
        consent_location: JSON string with location data
        user_id: Current user ID from auth
        
    Returns:
        Dict with photo_url and consent_id
    """
    try:
        # Validate file type
        if not photo.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image (JPEG/PNG)"
            )
        
        # Validate file size (5MB limit)
        if photo.size > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 5MB"
            )
        
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        # Parse consent location if provided
        location_data = None
        if consent_location:
            try:
                location_data = json.loads(consent_location)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid consent_location JSON"
                )
        
        # Upload photo with retry logic
        photo_url = await upload_with_retry(supabase, photo, individual_id or "temp")
        
        # Create consent record if individual_id provided
        consent_id = None
        if individual_id:
            consent_data = {
                "individual_id": individual_id,
                "photo_url": photo_url,
                "consented_by": user_id,
                "consent_location": location_data
            }
            
            consent_response = supabase.table("photo_consents").insert(consent_data).execute()
            consent_id = consent_response.data[0]["id"]
            
            # Update individual's photo history
            await update_photo_history(supabase, individual_id, photo_url)
        
        return {
            "photo_url": photo_url,
            "consent_id": consent_id,
            "message": "Photo uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Photo upload failed: {str(e)}"
        )

@router.post("/api/photos/upload-simple")
async def upload_photo_simple(
    photo: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Simple photo upload without individual association
    For use when individual hasn't been created yet
    
    Args:
        photo: Image file (JPEG/PNG, max 5MB)
        user_id: Current user ID from auth
        
    Returns:
        Dict with photo_url
    """
    try:
        # Validate file type
        if not photo.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image (JPEG/PNG)"
            )
        
        # Validate file size (5MB limit)
        if photo.size > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be less than 5MB"
            )
        
        # Initialize Supabase client
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        # Upload photo with retry logic
        photo_url = await upload_with_retry(supabase, photo, "temp")
        
        return {
            "photo_url": photo_url,
            "message": "Photo uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Photo upload failed: {str(e)}"
        )

async def upload_with_retry(supabase: Client, photo: UploadFile, individual_id: str, max_retries: int = 2):
    """Upload photo with retry logic - exactly 3 attempts total"""
    for attempt in range(max_retries + 1):
        try:
            # Generate filename
            timestamp = asyncio.get_event_loop().time()
            filename = f"{individual_id}_{timestamp}.jpg"
            file_path = f"photos/{individual_id}/{filename}"
            
            # Read file content
            content = await photo.read()
            
            # Upload to Supabase Storage
            response = supabase.storage.from_('photos').upload(
                file_path,
                content,
                {"content-type": photo.content_type}
            )
            
            # Get public URL
            url_response = supabase.storage.from_('photos').get_public_url(file_path)
            return url_response
            
        except Exception as e:
            if attempt == max_retries:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Photo upload failed after 3 attempts"
                )
            await asyncio.sleep(1)
            # Reset file pointer for retry
            await photo.seek(0)

async def update_photo_history(supabase: Client, individual_id: str, new_photo_url: str):
    """Update individual's photo history"""
    try:
        # Get current individual data
        response = supabase.table("individuals").select("*").eq("id", individual_id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Individual not found"
            )
        
        individual = response.data[0]
        
        # Get current history (max 3)
        history = individual.get('photo_history', [])
        
        # Add current photo to history if exists
        if individual.get('photo_url'):
            history.insert(0, {
                'url': individual['photo_url'],
                'added_at': individual.get('updated_at')
            })
        
        # Keep only last 3
        history = history[:3]
        
        # Update individual
        update_data = {
            'photo_url': new_photo_url,
            'photo_history': history
        }
        
        supabase.table("individuals").update(update_data).eq("id", individual_id).execute()
        
    except Exception as e:
        # Log error but don't fail the upload
        print(f"Failed to update photo history: {str(e)}") 