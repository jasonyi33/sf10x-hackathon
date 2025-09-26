# Voice Assistant Database Context Implementation

## Overview
Add database context retrieval to the realtime voice assistant so users can ask about specific homeless individuals (e.g., "What should I do to help John?") and get contextual advice based on their stored information.

## Current Architecture Analysis

### Voice Assistant Flow
1. **Mobile**: ModernVoiceAssistantScreen.tsx connects to backend WebSocket
2. **Backend**: main.py WebSocket proxy forwards to OpenAI Realtime API
3. **Database**: Supabase with individuals, interactions, and categories tables
4. **API**: individual_service.py has search_individuals() and get_individual_by_id() methods

### Key Integration Points
- WebSocket proxy in `/api/voice-assistant/realtime/ws` (main.py:62)
- Individual search in individual_service.py:246
- Session configuration sent to OpenAI (main.py:154)

## Implementation Plan

### Phase 1: Backend Context Retrieval Service

#### 1.1 Create Context Service
**File**: `backend/services/context_service.py`
- `extract_names_from_message(message: str) -> List[str]`
- `search_individuals_by_names(names: List[str]) -> List[Individual]`
- `format_individual_context(individuals: List[Individual]) -> str`

#### 1.2 Create Individual Search Endpoint
**File**: `backend/api/voice_assistant.py`
- Add endpoint: `POST /api/voice-assistant/context`
- Input: `{"message": "What should I do to help John?"}`
- Output: `{"context": "John Smith: substance abuse history...", "individuals_found": [...]}`

### Phase 2: WebSocket Integration

#### 2.1 Modify WebSocket Proxy
**File**: `backend/main.py`
- Intercept messages from client before forwarding to OpenAI
- When message contains potential names, query database
- Inject context into session instructions or conversation

#### 2.2 Context Injection Strategy
**Location**: main.py:154 (session configuration)
- Option A: Update session instructions with relevant individual data
- Option B: Add conversation items with context before user message

### Phase 3: Message Processing Logic

#### 3.1 Name Detection
- Use simple regex/string matching for names in user messages
- Search database using existing `search_individuals()` with name queries
- Handle multiple matches by picking closest or most recent interaction

#### 3.2 Context Formatting
Format individual data for AI context:
```
Individual: John Smith
- Urgency Score: 75
- Substance Abuse History: Severe
- Medical Conditions: Diabetes, Mental Health
- Last Interaction: 2024-01-15
- Housing Priority: Critical
- Behavior: None reported
```

### Phase 4: Error Handling

#### 4.1 No Match Found
- Continue conversation normally without context
- Don't mention failed search to user

#### 4.2 Multiple Matches
- Use most recent interaction or highest urgency score
- Or combine data from multiple matches if similar names

#### 4.3 Database Unavailable
- Log error, continue without context
- Graceful fallback to normal assistant behavior

## Technical Implementation Details

### Database Query Strategy
```python
async def search_individuals_by_names(names: List[str]) -> List[Individual]:
    # Use existing search_individuals() method
    # Query with OR conditions for each name
    # Order by urgency_score DESC, updated_at DESC
    # Limit to top 3 matches per name
```

### WebSocket Message Interception
```python
# In main.py websocket_realtime_proxy()
async def process_client_message(message: str) -> str:
    parsed = json.loads(message)
    if parsed.get("type") == "conversation.item.create":
        content = parsed.get("item", {}).get("content", [])
        if content and content[0].get("type") == "input_text":
            text = content[0].get("text", "")
            context = await get_individual_context(text)
            if context:
                # Inject context into session or add context message
                parsed = inject_context(parsed, context)
    return json.dumps(parsed)
```

### Context Service Implementation
```python
import re
from typing import List, Optional

class ContextService:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def extract_names_from_message(self, message: str) -> List[str]:
        # Simple name detection - capitalized words
        names = re.findall(r'\b[A-Z][a-z]+\b', message)
        # Filter out common words like "What", "Should", etc.
        common_words = {'What', 'Should', 'Can', 'How', 'When', 'Where', 'Why'}
        return [name for name in names if name not in common_words]

    async def search_individuals_by_names(self, names: List[str]) -> List[dict]:
        if not names:
            return []

        # Use existing individual service search
        from services.individual_service import IndividualService
        service = IndividualService(self.supabase)

        all_results = []
        for name in names:
            result = await service.search_individuals(search=name, limit=3)
            all_results.extend(result.individuals)

        # Deduplicate and sort by urgency
        seen_ids = set()
        unique_results = []
        for individual in all_results:
            if individual.id not in seen_ids:
                seen_ids.add(individual.id)
                unique_results.append(individual)

        return sorted(unique_results, key=lambda x: x.urgency_score, reverse=True)

    def format_individual_context(self, individuals: List[dict]) -> str:
        if not individuals:
            return ""

        context_parts = []
        for individual in individuals:
            data = individual.data
            context = f"Individual: {individual.name}\n"
            context += f"- Urgency Score: {individual.urgency_score}\n"

            # Add relevant data fields
            if data.get('substance_abuse_history'):
                context += f"- Substance Abuse: {data['substance_abuse_history']}\n"
            if data.get('medical_conditions'):
                context += f"- Medical: {data['medical_conditions']}\n"
            if data.get('behavior'):
                context += f"- Behavior: {data['behavior']}\n"
            if data.get('housing_priority'):
                context += f"- Housing Priority: {data['housing_priority']}\n"

            context_parts.append(context)

        return "\n\n".join(context_parts)
```

## Implementation Steps

### Step 1: Backend Context Service
1. Create `backend/services/context_service.py`
2. Add context endpoint to `backend/api/voice_assistant.py`
3. Test context retrieval with sample queries

### Step 2: WebSocket Integration
1. Modify `backend/main.py` WebSocket proxy
2. Add message interception and context injection
3. Test with simple name queries

### Step 3: Testing & Refinement
1. Test with voice assistant: "What should I do to help John?"
2. Verify context appears in AI responses
3. Test edge cases (no matches, multiple matches)

### Step 4: Optimization
1. Cache recent individual lookups
2. Improve name detection accuracy
3. Add logging for debugging

## Files to Modify

### New Files
- `backend/services/context_service.py`

### Modified Files
- `backend/main.py` (WebSocket proxy)
- `backend/api/voice_assistant.py` (add context endpoint)
- `backend/requirements.txt` (if new dependencies needed)

## Testing Strategy

### Unit Tests
- Test name extraction from various message formats
- Test individual search and matching logic
- Test context formatting

### Integration Tests
- Test full WebSocket flow with context injection
- Test with real voice assistant queries
- Test error handling scenarios

### Manual Testing Scenarios
1. "What should I do to help John?" (single match)
2. "How can I assist Sarah with her medical issues?" (specific context)
3. "Tell me about Robert's housing situation" (direct query)
4. "What about someone named Mike?" (potential multiple matches)
5. "Help me understand this person's needs" (no name mentioned)

## Success Criteria

✅ User can ask about specific individuals by name
✅ AI assistant receives relevant context from database
✅ Responses are more personalized and actionable
✅ Works for both voice and text input
✅ Graceful handling of no matches or errors
✅ No disruption to existing voice assistant functionality

## Future Enhancements (Optional)
- Context caching for repeated queries
- Location-based context (individuals near user's location)
- Interaction history summaries in context
- Smart name matching (nicknames, partial names)