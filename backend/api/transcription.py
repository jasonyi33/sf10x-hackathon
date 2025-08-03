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
    audio_url: str
    location: Optional[Dict[str, float]] = None  # {"latitude": 37.7749, "longitude": -122.4194}


class TranscribeResponse(BaseModel):
    transcription: str
    categorized_data: Dict[str, Any]
    missing_required: List[str]
    potential_matches: List[Dict[str, Any]]
    validation_errors: List[Dict[str, Any]] = []  # Track validation errors for debugging


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
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        # 1. Fetch all categories
        categories_response = supabase.table("categories").select("*").order("created_at").execute()
        categories = categories_response.data
        
        # 2. Transcribe audio
        transcription = await openai_service.transcribe_audio(request.audio_url)
        
        # 3. Categorize transcription
        categorized_data = await openai_service.categorize_transcription(transcription, categories)
        
        # 4. Validate categorized data (including age format)
        validation_result = validate_categorized_data(categorized_data, categories)
        missing_required = validation_result.missing_required
        
        # Handle validation errors, especially age format issues
        if validation_result.validation_errors:
            print(f"Validation errors: {validation_result.validation_errors}")
            
            # Check for age-specific validation errors
            age_errors = [error for error in validation_result.validation_errors 
                         if error.get("field") == "approximate_age"]
            
            if age_errors:
                # Log age validation errors for debugging
                print(f"Age validation errors: {age_errors}")
                
                # For age format errors, we could either:
                # 1. Return error to user (strict validation)
                # 2. Auto-correct to [-1, -1] (lenient validation)
                # For hackathon simplicity, we'll auto-correct
                if "approximate_age" in categorized_data:
                    print("Auto-correcting invalid age format to [-1, -1]")
                    categorized_data["approximate_age"] = [-1, -1]
        
        # 5. Find potential duplicates
        potential_matches = []
        
        # Only search if we have a name
        if categorized_data.get("name"):
            name = categorized_data["name"]
            
            # Smart duplicate detection per PRD updates
            # First: exact name match (indexed)
            exact_matches = supabase.table("individuals") \
                .select("id, name, data") \
                .eq("name", name) \
                .execute()
            
            candidates = exact_matches.data
            
            # Second: fuzzy name search if few exact matches
            if len(candidates) < 10:
                # Search for similar names (contains search)
                parts = name.split()
                if parts:
                    # Search by first name or last name
                    # Note: Supabase Python client doesn't support or_ directly
                    # So we'll do a broader search and filter
                    fuzzy_matches = supabase.table("individuals") \
                        .select("id, name, data") \
                        .ilike("name", f"%{parts[0]}%") \
                        .limit(50) \
                        .execute()
                    
                    # Add to candidates avoiding duplicates
                    existing_ids = {c['id'] for c in candidates}
                    for match in fuzzy_matches.data:
                        if match['id'] not in existing_ids:
                            candidates.append(match)
                            existing_ids.add(match['id'])
                    
                    # Limit total candidates to 50
                    candidates = candidates[:50]
            
            # Use LLM to compare candidates
            if candidates:
                matches = await openai_service.find_duplicates(categorized_data, candidates)
                # Format for response
                potential_matches = [
                    {
                        "id": match["id"],
                        "confidence": match["confidence"],
                        "name": match["name"]
                    }
                    for match in matches
                ]
        
        # 6. Return complete results
        return TranscribeResponse(
            transcription=transcription,
            categorized_data=categorized_data,
            missing_required=missing_required,
            potential_matches=potential_matches,
            validation_errors=validation_result.validation_errors
        )
        
    except ValueError as e:
        # Handle validation errors from services
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log error for debugging
        print(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")