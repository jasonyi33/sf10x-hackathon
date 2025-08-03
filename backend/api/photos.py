"""
Photo upload endpoints for individual photos with consent tracking
"""
import os
import json
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from PIL import Image
from io import BytesIO
from supabase import create_client, Client
from api.auth import get_current_user
from services.upload_retry import upload_with_retry
from services.photo_history import update_photo_history

# Initialize router
router = APIRouter(prefix="/api", tags=["photos"])

# Constants
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']
PHOTOS_BUCKET = 'photos'


@router.post("/photos/upload")
async def upload_photo(
    photo: UploadFile = File(...),
    individual_id: str = Form(...),
    consent_location: str = Form(...),  # JSON string
    user_id: str = Depends(get_current_user)
):
    """
    Upload a photo with consent tracking
    
    Requirements:
    1. Validate file type (image/jpeg, image/png only)
    2. Validate file size (max 5MB)
    3. Generate unique filename: photos/{user_id}/{timestamp}_{uuid}.jpg
    4. Upload to Supabase Storage 'photos' bucket
    5. Create consent record in photo_consents table
    6. Return photo_url for frontend use
    7. Handle upload failures with proper error messages
    """
    
    try:
        # Initialize Supabase client
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')  # Use service key for full access
        
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase configuration missing"
            )
        
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # 1. Validate file type
        if photo.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Only JPEG and PNG are allowed. Got: {photo.content_type}"
            )
        
        # Read file content
        file_content = await photo.read()
        
        # 2. Validate file size
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is 5MB. Got: {len(file_content) / 1024 / 1024:.1f}MB"
            )
        
        # 3. Parse and validate consent_location JSON
        try:
            consent_location_data = json.loads(consent_location)
            if not all(key in consent_location_data for key in ['latitude', 'longitude', 'address']):
                raise ValueError("consent_location must contain latitude, longitude, and address")
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON in consent_location"
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        
        # 4. Convert PNG to JPEG if needed and compress
        img = Image.open(BytesIO(file_content))
        
        # Convert to RGB if necessary (for PNG with transparency)
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = rgb_img
        
        # Save as JPEG
        output = BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        jpeg_content = output.getvalue()
        
        # 5. Generate unique filename
        timestamp = int(datetime.utcnow().timestamp())
        file_uuid = str(uuid.uuid4())
        filename = f"photos/{user_id}/{timestamp}_{file_uuid}.jpg"
        
        # 6. Upload to Supabase Storage with retry logic
        try:
            storage_client = supabase.storage.from_(PHOTOS_BUCKET)
            upload_response = await upload_with_retry(
                storage_client=storage_client,
                file_data=jpeg_content,
                path=filename
            )
        except HTTPException:
            # Re-raise HTTP exceptions from retry logic (auth errors, etc.)
            raise
        except Exception as e:
            # This should not happen as upload_with_retry handles all errors
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error during photo upload: {str(e)}"
            )
        
        # 7. Get public URL
        photo_url = f"{SUPABASE_URL}/storage/v1/object/public/{PHOTOS_BUCKET}/{filename}"
        
        # 8. Create consent record in database
        try:
            consent_record = {
                'individual_id': individual_id,
                'photo_url': photo_url,
                'consented_by': user_id,
                'consent_location': consent_location_data,
                'created_at': datetime.utcnow().isoformat()
            }
            
            consent_response = supabase.table('photo_consents').insert(consent_record).execute()
            
            if not consent_response.data:
                raise Exception("Failed to create consent record")
            
            consent_id = consent_response.data[0]['id']
            
        except Exception as e:
            # Try to delete the uploaded photo if consent record fails
            try:
                supabase.storage.from_(PHOTOS_BUCKET).remove([filename])
            except:
                pass  # Best effort cleanup
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create consent record: {str(e)}"
            )
        
        # 9. Return success response
        return {
            "photo_url": photo_url,
            "consent_id": consent_id
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error during photo upload: {str(e)}"
        )


@router.put("/photos/update/{individual_id}")
async def update_individual_photo(
    individual_id: str,
    photo: UploadFile = File(...),
    consent_location: str = Form(...),  # JSON string
    user_id: str = Depends(get_current_user)
):
    """
    Update an individual's photo without creating an interaction
    
    Requirements:
    1. Same consent requirement as initial capture
    2. Does NOT create new interaction record
    3. Updates photo_url and photo_history
    4. Still creates consent record for legal compliance
    5. Returns updated photo_url
    """
    
    try:
        # Initialize Supabase client
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')  # Use service key for full access
        
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase configuration missing"
            )
        
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # 1. Fetch current individual data
        try:
            result = supabase.table('individuals').select('*').eq('id', individual_id).single().execute()
            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Individual not found"
                )
            current_individual = result.data
        except Exception as e:
            if "not found" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Individual not found"
                )
            raise
        
        # 2. Validate file type
        if photo.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Only JPEG and PNG are allowed. Got: {photo.content_type}"
            )
        
        # Read file content
        file_content = await photo.read()
        
        # 3. Validate file size
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size is 5MB. Got: {len(file_content) / 1024 / 1024:.1f}MB"
            )
        
        # 4. Parse and validate consent_location JSON
        try:
            consent_location_data = json.loads(consent_location)
            if not all(key in consent_location_data for key in ['latitude', 'longitude', 'address']):
                raise ValueError("consent_location must contain latitude, longitude, and address")
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON in consent_location"
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        
        # 5. Convert PNG to JPEG if needed and compress
        img = Image.open(BytesIO(file_content))
        
        # Convert to RGB if necessary (for PNG with transparency)
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = rgb_img
        
        # Save as JPEG
        output = BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        jpeg_content = output.getvalue()
        
        # 6. Generate unique filename
        timestamp = int(datetime.utcnow().timestamp())
        file_uuid = str(uuid.uuid4())
        filename = f"photos/{user_id}/{timestamp}_{file_uuid}.jpg"
        
        # 7. Upload to Supabase Storage with retry logic
        try:
            storage_client = supabase.storage.from_(PHOTOS_BUCKET)
            upload_response = await upload_with_retry(
                storage_client=storage_client,
                file_data=jpeg_content,
                path=filename
            )
        except HTTPException:
            # Re-raise HTTP exceptions from retry logic (auth errors, etc.)
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Photo upload failed: {str(e)}"
            )
        
        # 8. Get public URL
        photo_url = f"{SUPABASE_URL}/storage/v1/object/public/{PHOTOS_BUCKET}/{filename}"
        
        # 9. Update photo history
        updated_individual = update_photo_history(current_individual, photo_url)
        
        # 10. Update individual record (NOT creating an interaction)
        try:
            update_data = {
                'photo_url': updated_individual['photo_url'],
                'photo_history': updated_individual['photo_history'],
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            update_response = supabase.table('individuals').update(update_data).eq('id', individual_id).execute()
            
            if not update_response.data:
                raise Exception("Failed to update individual record")
            
        except Exception as e:
            # Try to delete the uploaded photo if update fails
            try:
                supabase.storage.from_(PHOTOS_BUCKET).remove([filename])
            except:
                pass  # Best effort cleanup
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update individual: {str(e)}"
            )
        
        # 11. Create consent record for legal compliance
        try:
            consent_record = {
                'individual_id': individual_id,
                'photo_url': photo_url,
                'consented_by': user_id,
                'consent_location': consent_location_data,
                'created_at': datetime.utcnow().isoformat(),
                'is_update': True  # Flag to indicate this was an update, not initial capture
            }
            
            consent_response = supabase.table('photo_consents').insert(consent_record).execute()
            
            if not consent_response.data:
                raise Exception("Failed to create consent record")
            
            consent_id = consent_response.data[0]['id']
            
        except Exception as e:
            # Don't fail the update if consent record fails, but log it
            print(f"Warning: Failed to create consent record: {str(e)}")
            consent_id = None
        
        # 12. Return success response
        return {
            "photo_url": photo_url,
            "consent_id": consent_id,
            "message": "Photo updated successfully"
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error during photo update: {str(e)}"
        )