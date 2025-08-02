"""
Database models and Pydantic schemas for individual management
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID


# Request Models
class LocationData(BaseModel):
    """Location data from frontend with geocoded address"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: str  # Full address from frontend geocoding


class SaveIndividualRequest(BaseModel):
    """Request to save a new individual or update existing (merge)"""
    data: Dict[str, Any]  # Categorized data from AI or manual entry
    merge_with_id: Optional[UUID] = None  # If merging, ID of existing individual
    location: Optional[LocationData] = None
    transcription: Optional[str] = None  # Original audio transcription if voice entry
    audio_url: Optional[str] = None  # Reference to audio file
    
    @field_validator('data')
    def validate_required_fields(cls, v):
        """Ensure required fields exist per PRD"""
        required = ['name', 'height', 'weight', 'skin_color']
        missing = [f for f in required if f not in v or v[f] is None]
        if missing:
            raise ValueError(f"Missing required fields: {missing}")
        return v


class DangerOverrideRequest(BaseModel):
    """Request to update danger score override"""
    danger_override: Optional[int] = Field(None, ge=0, le=100)


# Response Models
class IndividualSummary(BaseModel):
    """Individual summary for list views"""
    id: UUID
    name: str
    danger_score: int
    danger_override: Optional[int]
    display_score: int  # Computed: danger_override if not null, else danger_score
    last_seen: datetime
    last_location: Optional[Dict[str, Any]]  # Simplified location with abbreviated address


class IndividualResponse(BaseModel):
    """Full individual data"""
    id: UUID
    name: str
    danger_score: int
    danger_override: Optional[int]
    display_score: int  # Computed: danger_override if not null, else danger_score
    data: Dict[str, Any]  # All categorized fields
    created_at: datetime
    updated_at: datetime


class InteractionSummary(BaseModel):
    """Brief interaction info for lists"""
    id: UUID
    created_at: datetime
    user_name: str
    location: Optional[Dict[str, Any]]
    has_transcription: bool


class InteractionDetail(BaseModel):
    """Full interaction details with changes"""
    id: UUID
    created_at: datetime
    user_name: str
    transcription: Optional[str]
    location: Optional[Dict[str, Any]]  # Full location with complete address
    changes: Dict[str, Any]  # Only fields that changed in this interaction


class SaveIndividualResponse(BaseModel):
    """Response after saving individual"""
    individual: IndividualResponse
    interaction: InteractionSummary


class SearchIndividualsResponse(BaseModel):
    """Paginated search results"""
    individuals: List[IndividualSummary]
    total: int
    offset: int
    limit: int


class IndividualDetailResponse(BaseModel):
    """Individual details with recent interactions"""
    individual: IndividualResponse
    recent_interactions: List[InteractionSummary]  # Last 10 interactions


class DangerOverrideResponse(BaseModel):
    """Response after updating danger override"""
    danger_score: int  # Original calculated score
    danger_override: Optional[int]  # Manual override if set
    display_score: int  # What UI should show


class InteractionsResponse(BaseModel):
    """List of detailed interactions"""
    interactions: List[InteractionDetail]