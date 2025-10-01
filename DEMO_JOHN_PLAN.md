# Demo Plan: John Veteran Case
## Minimal implementation for specific demo scenario

### Demo Script
**Voice Input**: "I just met John, a 5'10 200 lb 54-year-old veteran who tells me he has diabetes and has been struggling with housing"

**Expected Flow**:
1. Transcribe and categorize all fields
2. Detect existing John (high confidence match)
3. Merge UI shows with diabetes/housing as new info
4. Complete merge
5. View updated John profile
6. Ask assistant about John's needs

---

## Implementation Steps (Ultra-thin)

### 1. Database Seed (One-time setup)
```sql
-- Add to Supabase SQL editor and run once
INSERT INTO individuals (id, name, created_at, data) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'John',
  NOW() - INTERVAL '30 days',
  '{
    "Name": "John",
    "height": 70,
    "weight": 195,
    "age": 54,
    "veteran_status": "Yes",
    "skin_color": "Medium"
  }'::jsonb
);
```

### 2. Ensure Required Categories Exist
```sql
-- Run in Supabase to add missing categories if needed
INSERT INTO categories (name, type, is_required, options) VALUES
  ('age', 'number', false, null),
  ('veteran_status', 'single_select', false, '[{"label": "Yes", "value": 1}, {"label": "No", "value": 0}]'::jsonb),
  ('medical_conditions', 'multi_select', false, '["Diabetes", "Heart Disease", "Mental Health", "Substance Abuse", "Other"]'::jsonb),
  ('housing_status', 'single_select', false, '[{"label": "Housed", "value": 0}, {"label": "Struggling", "value": 1}, {"label": "Unhoused", "value": 2}]'::jsonb)
ON CONFLICT (name) DO NOTHING;
```

### 3. Quick Backend Tweaks (if needed)

**File**: `backend/services/openai_service.py`

Update GPT prompt (line ~189) to better catch these fields:
```python
- Be attentive to medical conditions. Although the term medical conditions is not explicitly stated, it may be implied in the transcription and there may be multiple. Please be meticulous and extract all of them in a list.
- Map "struggling with housing" to housing_status: "Struggling"
- Extract age as a number
- Map veteran mentions to veteran_status: "Yes"
```

### 4. Assistant Integration (Simplest approach)

**Option A: Mock Response (No code changes)**
- Just demo the concept without real integration
- Show a pre-written response about John

**Option B: Quick Integration (5 min)**
Add to `mobile/components/TranscriptionResults.tsx`:
```tsx
// After merge completes, add button:
<TouchableOpacity onPress={() => askAssistant(mergedData)}>
  <Text>Ask Assistant About This Person</Text>
</TouchableOpacity>

// Simple function:
const askAssistant = async (data) => {
  const prompt = `How can I help ${data.Name} who is a ${data.age} year old ${data.veteran_status === 'Yes' ? 'veteran' : 'person'} with ${data.medical_conditions?.join(', ')} and is ${data.housing_status} with housing?`;

  // Call OpenAI or show mock response
  Alert.alert("Assistant Suggestion",
    "For John (54yo veteran with diabetes struggling with housing):\n\n" +
    "1. Connect with VA healthcare for diabetes management\n" +
    "2. Apply for HUD-VASH housing voucher\n" +
    "3. Contact Swords to Plowshares for veteran services\n" +
    "4. Schedule intake at VA Medical Center"
  );
};
```

---

## Testing Checklist

### Pre-Demo Setup (5 min)
- [ ] Run SQL seeds in Supabase
- [ ] Restart backend: `cd backend && python3 -m uvicorn main:app --reload --port 8001`
- [ ] Clear app cache if needed

### Demo Flow (2 min)
1. [ ] Open app, go to Record tab
2. [ ] Press record, say the exact phrase
3. [ ] Stop recording (after 10 seconds)
4. [ ] Watch transcription appear
5. [ ] See "Potential Duplicate Found" for John
6. [ ] Review merge UI - new fields highlighted
7. [ ] Click "Merge"
8. [ ] Go to Search tab, find John
9. [ ] View John's updated profile
10. [ ] (Optional) Show assistant suggestions

---

## Fallback Options

### If live transcription fails:
- Have a backup recording ready
- Or manually type in Manual Entry with same data

### If merge fails:
- Show the UI and explain the concept
- Have screenshots as backup

### If assistant integration not ready:
- Show a mockup or describe the feature
- Focus on the data capture and merge success

---

## Key Success Metrics
✅ All fields extracted correctly (name, height, weight, age, veteran, conditions, housing)
✅ Duplicate detected with high confidence
✅ Merge UI shows clear before/after
✅ Database updated with new information
✅ Can retrieve and view updated profile

---

## Time Estimate
- Database setup: 2 minutes
- Testing flow: 5 minutes
- Total prep: < 10 minutes

Keep it simple. The existing code should handle 90% of this already.