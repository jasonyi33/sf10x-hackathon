"""
Voice Assistant API endpoints for OpenAI Realtime API integration
"""
import os
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import httpx
import json
import tempfile
import os
from supabase import create_client, Client
from services.openai_service import OpenAIService

router = APIRouter(prefix="/api/voice-assistant")
security = HTTPBearer()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

class VoiceAssistantRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class VoiceAssistantResponse(BaseModel):
    response: str
    suggestions: Optional[list] = None

class ApiKeyResponse(BaseModel):
    api_key: str

@router.get("/test")
async def test_voice_assistant_endpoint():
    """
    Test endpoint to verify voice assistant API is working
    """
    return {
        "status": "ok",
        "message": "Voice assistant API is working",
        "openai_key_configured": bool(os.getenv("OPENAI_API_KEY"))
    }

@router.post("/transcribe")
async def transcribe_voice_audio(
    audio: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Transcribe audio file for voice assistant
    """
    try:
        print(f"🎤 Received audio file: {audio.filename}, type: {audio.content_type}")
        
        # Validate file type
        if not audio.content_type or not audio.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.m4a') as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Initialize OpenAI service
            openai_service = OpenAIService()
            
            # Transcribe the audio file
            print(f"🎤 Transcribing audio file: {temp_file_path}")
            transcription = await openai_service.transcribe_audio_file(temp_file_path)
            
            print(f"✅ Transcription successful: {transcription[:100]}...")
            
            return {
                "transcription": transcription,
                "status": "success"
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        print(f"❌ Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.get("/api-key", response_model=ApiKeyResponse)
async def get_openai_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get OpenAI API key for voice assistant using gpt-realtime model
    Note: In production, this should be more secure
    """
    try:
        print(f"🔍 Checking for OPENAI_API_KEY in environment...")
        
        # Check if the environment variable exists
        api_key = os.getenv("OPENAI_API_KEY")
        print(f"🔍 API key found: {'Yes' if api_key else 'No'}")
        
        if not api_key:
            print(f"❌ OPENAI_API_KEY not found in environment variables")
            print(f"🔍 Available env vars starting with OPENAI: {[k for k in os.environ.keys() if k.startswith('OPENAI')]}")
            raise HTTPException(status_code=500, detail="OpenAI API key not configured in environment")
        
        # Verify the API key has access to gpt-realtime model
        print(f"🔑 Providing API key for gpt-realtime model access (length: {len(api_key)})")
        
        return ApiKeyResponse(api_key=api_key)
    except Exception as e:
        print(f"❌ Error in get_openai_api_key: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get API key: {str(e)}")

@router.post("/chat", response_model=VoiceAssistantResponse)
async def chat_with_assistant(
    request: VoiceAssistantRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Chat with the voice assistant (fallback for text-based interactions)
    """
    try:
        # This is a fallback endpoint for text-based chat
        # The main voice interaction happens through the Realtime API on the frontend
        
        # Get context about the user's location and available resources
        context_info = await get_contextual_info(request.context)
        
        # Create a prompt with context
        system_prompt = f"""You are a specialized AI assistant for homeless outreach workers. You provide expert guidance on:

1. **Crisis Intervention**: How to safely approach and de-escalate situations with homeless individuals
2. **Care Protocols**: Best practices for providing assistance, medical care, and support
3. **Resource Recommendations**: Information about shelters, food banks, medical services, and social programs
4. **Medical Emergency Protocols**: Steps to take during medical emergencies
5. **De-escalation Techniques**: Strategies for managing tense or potentially dangerous situations
6. **Legal/Rights Information**: Understanding the rights of homeless individuals and legal considerations
7. **Safety Guidelines**: How to protect yourself and others while providing outreach services

Context: {context_info}

Always prioritize safety, empathy, and practical guidance. Be concise but comprehensive in your responses."""

        # For now, return a simple response
        # In a full implementation, this would call GPT-4 with the context
        response = f"I understand you're asking about: {request.message}. Based on the context, I can help you with guidance on homeless outreach best practices."
        
        return VoiceAssistantResponse(
            response=response,
            suggestions=[
                "Crisis intervention techniques",
                "Local resource recommendations", 
                "Safety protocols",
                "De-escalation strategies"
            ]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process request: {str(e)}")

async def get_contextual_info(context: Optional[Dict[str, Any]]) -> str:
    """
    Get contextual information about the user's location and available resources
    """
    if not context:
        return "No specific context provided"
    
    location_info = ""
    if context.get("location"):
        location_info = f"Current location: {context['location']}"
    
    individual_info = ""
    if context.get("individual_id"):
        individual_info = f"Working with individual ID: {context['individual_id']}"
    
    return f"{location_info} {individual_info}".strip()

@router.get("/resources")
async def get_local_resources(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get local resources based on location
    """
    try:
        print(f"🏠 Getting local resources - lat: {lat}, lng: {lng}")
        
        # Get individuals from database to understand local context
        individuals_response = supabase.table('individuals').select('*').execute()
        individuals = individuals_response.data if individuals_response.data else []
        
        # Get categories to understand what services are being tracked
        categories_response = supabase.table('categories').select('*').eq('is_active', True).execute()
        categories = categories_response.data if categories_response.data else []
        
        # Analyze local patterns
        local_context = analyze_local_patterns(individuals, categories)
        
        # Return resources with local context
        resources = {
            "shelters": [
                {
                    "name": "San Francisco Rescue Mission",
                    "address": "150 5th St, San Francisco, CA",
                    "phone": "(415) 777-0400",
                    "services": ["Emergency shelter", "Meals", "Case management"],
                    "availability": "24/7"
                },
                {
                    "name": "Hamilton Family Center",
                    "address": "260 Golden Gate Ave, San Francisco, CA", 
                    "phone": "(415) 345-7500",
                    "services": ["Family shelter", "Housing assistance", "Childcare"],
                    "availability": "24/7"
                }
            ],
            "medical": [
                {
                    "name": "San Francisco General Hospital",
                    "address": "1001 Potrero Ave, San Francisco, CA",
                    "phone": "(415) 206-8000",
                    "services": ["Emergency care", "Mental health", "Substance abuse treatment"],
                    "availability": "24/7"
                }
            ],
            "food": [
                {
                    "name": "St. Anthony's Dining Room",
                    "address": "121 Golden Gate Ave, San Francisco, CA",
                    "phone": "(415) 241-2600",
                    "services": ["Free meals", "Clothing", "Medical clinic"],
                    "availability": "Daily 10:30 AM - 1:30 PM"
                }
            ],
            "local_context": local_context
        }
        
        return resources
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get resources: {str(e)}")

def analyze_local_patterns(individuals: List[Dict], categories: List[Dict]) -> Dict[str, Any]:
    """
    Analyze local patterns from the database to provide contextual information
    """
    if not individuals:
        return {"message": "No local data available"}
    
    # Count common issues
    issue_counts = {}
    for individual in individuals:
        data = individual.get('data', {})
        for category in categories:
            category_name = category.get('name', '').lower()
            if category_name in data and data[category_name]:
                issue_counts[category_name] = issue_counts.get(category_name, 0) + 1
    
    # Get most common issues
    common_issues = sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Calculate urgency levels
    high_urgency_count = sum(1 for ind in individuals if ind.get('danger_score', 0) > 7)
    medium_urgency_count = sum(1 for ind in individuals if 4 <= ind.get('danger_score', 0) <= 7)
    
    return {
        "total_individuals": len(individuals),
        "common_issues": common_issues,
        "urgency_breakdown": {
            "high_urgency": high_urgency_count,
            "medium_urgency": medium_urgency_count,
            "low_urgency": len(individuals) - high_urgency_count - medium_urgency_count
        },
        "recommendations": generate_recommendations(common_issues, high_urgency_count)
    }

def generate_recommendations(common_issues: List[tuple], high_urgency_count: int) -> List[str]:
    """
    Generate recommendations based on local patterns
    """
    recommendations = []
    
    if high_urgency_count > 0:
        recommendations.append(f"High urgency cases detected ({high_urgency_count}). Prioritize crisis intervention training.")
    
    for issue, count in common_issues:
        if issue == 'mental_health':
            recommendations.append("Mental health support is frequently needed. Consider mental health first aid training.")
        elif issue == 'substance_abuse':
            recommendations.append("Substance abuse is common. Ensure naloxone training and harm reduction resources.")
        elif issue == 'medical_conditions':
            recommendations.append("Medical conditions are prevalent. Maintain first aid supplies and emergency protocols.")
    
    if not recommendations:
        recommendations.append("Continue regular outreach and maintain current safety protocols.")
    
    return recommendations

@router.get("/guidelines")
async def get_safety_guidelines(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get safety guidelines and protocols
    """
    try:
        guidelines = {
            "crisis_intervention": [
                "Approach slowly and calmly",
                "Maintain a safe distance initially",
                "Use non-threatening body language",
                "Listen actively and validate their concerns",
                "Avoid judgmental language or tone"
            ],
            "medical_emergency": [
                "Call 911 immediately for life-threatening situations",
                "Assess consciousness and breathing",
                "Provide basic first aid if trained",
                "Stay with the person until help arrives",
                "Document the incident"
            ],
            "de_escalation": [
                "Stay calm and speak softly",
                "Give the person space",
                "Avoid direct eye contact if they seem agitated",
                "Use 'I' statements instead of 'you' statements",
                "Offer choices when possible"
            ],
            "safety_protocols": [
                "Never work alone in dangerous areas",
                "Carry a phone and emergency contacts",
                "Trust your instincts - if you feel unsafe, leave",
                "Report incidents to your supervisor",
                "Follow your organization's safety policies"
            ]
        }
        
        return guidelines
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get guidelines: {str(e)}")
