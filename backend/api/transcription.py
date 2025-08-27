"""
Audio transcription and categorization endpoints
"""
import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from supabase import create_client, Client

from api.auth import get_current_user
from services.openai_service import OpenAIService
from services.danger_calculator import calculate_danger_score
from services.validation_helper import validate_categorized_data


router = APIRouter()


class TranscribeRequest(BaseModel):
    audio_url: Optional[str] = None
    audio_data: Optional[str] = None  # Base64 encoded audio data
    location: Optional[Dict[str, float]] = None  # {"latitude": 37.7749, "longitude": -122.4194}


class TranscribeResponse(BaseModel):
    transcription: str
    categorized_data: Dict[str, Any]
    missing_required: List[str]
    potential_matches: List[Dict[str, Any]]


@router.post("/api/transcribe", response_model=TranscribeResponse)
async def transcribe_audio_endpoint(
    request: TranscribeRequest,
    user_id: str = Depends(get_current_user)
):
    """
    Transcribe audio and extract categorized data
    
    Process:
    1. Fetch all categories
    2. Transcribe audio using Whisper
    3. Categorize transcription using GPT-4o
    4. Validate required fields
    5. Find potential duplicates
    6. Return complete results (no streaming)
    """
    try:
        # Initialize services
        openai_service = OpenAIService()
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_ANON_KEY")  # Use anon key for now
        )
        
        # 1. Fetch all categories (simplified for testing)
        categories = [
            {"name": "Name", "type": "text", "is_required": True},
            {"name": "Age", "type": "number", "is_required": False},
            {"name": "Height", "type": "number", "is_required": False},
            {"name": "Weight", "type": "number", "is_required": False},
            {"name": "Gender", "type": "text", "is_required": False},
            {"name": "Medical Conditions", "type": "text", "is_required": False},
            {"name": "Location", "type": "text", "is_required": False}
        ]
        
        # 2. Transcribe audio
        if request.audio_data:
            # Handle base64 audio data
            import base64
            import tempfile
            
            # Decode base64 audio data
            audio_data = base64.b64decode(request.audio_data.split(',')[1])  # Remove data URL prefix
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.m4a') as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name
            
            try:
                # Transcribe from temporary file
                transcription = await openai_service.transcribe_audio_file(temp_file_path)
            finally:
                # Clean up temporary file
                os.unlink(temp_file_path)
        elif request.audio_url:
            # Handle audio URL
            transcription = await openai_service.transcribe_audio(request.audio_url)
        else:
            raise HTTPException(status_code=400, detail="Either audio_url or audio_data must be provided")
        
        # 3. Categorize transcription
        categorized_data = await openai_service.categorize_transcription(transcription, categories)
        
        # 4. Validate categorized data
        validation_result = validate_categorized_data(categorized_data, categories)
        missing_required = validation_result.missing_required
        
        # Note: We could also return validation_errors in the response if needed
        # For now, we'll just log them for debugging
        if validation_result.validation_errors:
            print(f"Validation errors: {validation_result.validation_errors}")
        
        # 5. Find potential duplicates (simplified for testing)
        potential_matches = []
        
        # Only search if we have a name (check both capitalized and lowercase)
        name = categorized_data.get("Name") or categorized_data.get("name")
        if name:
            
            # Simple mock duplicate detection for testing
            if name.lower() in ["john", "jane", "mike"]:
                potential_matches = [
                    {
                        "id": "mock-123",
                        "name": name,
                        "confidence": 85
                    }
                ]
        
        # 6. Return complete results
        return TranscribeResponse(
            transcription=transcription,
            categorized_data=categorized_data,
            missing_required=missing_required,
            potential_matches=potential_matches
        )
        
    except ValueError as e:
        # Handle validation errors from services
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log error for debugging
        print(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")