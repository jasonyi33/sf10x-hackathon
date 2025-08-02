# Demo Script: Voice Transcription App for SF Homeless Outreach

## 5-Minute Demo Flow

### 🎯 Demo Goals
- Show voice recording → AI transcription → categorization → save flow
- Demonstrate manual entry as alternative
- Show duplicate detection and merging
- Highlight location capture and validation

---

## 📋 Demo Preparation

### Prerequisites
1. **Demo Audio Files**: Generate using `./scripts/generate-audio.sh`
2. **Backend Running**: Ensure Dev 1's backend is deployed and accessible
3. **App Running**: Start the Expo app with `npm start`
4. **Test Data**: Ensure demo individuals exist in database

### Demo Audio Files (Task 3.9)
```bash
# Generate demo audio files
cd mobile
./scripts/generate-audio.sh

# This creates:
# - john-market-street.m4a
# - sarah-library.m4a  
# - robert-golden-gate.m4a
```

---

## 🎬 Demo Script

### Introduction (30 seconds)
"Welcome to the Voice Transcription App for SF Homeless Outreach. This app helps street workers document interactions quickly using voice recording and AI categorization. Let me show you the complete workflow."

### 1. Voice Recording Flow (2 minutes)

#### Step 1: Start Recording
- Open app → Auto-login with demo credentials
- Show Record screen (default tab)
- Point out location capture button
- Click "📍 Set Location" → Show map with draggable pin
- Confirm location → Return to recording screen

#### Step 2: Record Audio
- Click "🎤 Start Recording"
- Show live duration display "0:45 / 2:00"
- Point out red text after 1:30 (warning)
- Stop recording after 10+ seconds
- Show upload progress → "Uploading audio..."

#### Step 3: AI Transcription & Categorization
- Show "Transcribing audio..." spinner
- Display transcription results:
  - Original transcription text
  - Categorized fields (Name, Age, Height, Weight, Skin Color, etc.)
  - Required field validation (highlighted if missing)

#### Step 4: Duplicate Detection
- Show potential match with 87% confidence
- Explain: "This triggers our duplicate detection system"
- Click "Save" → Show MergeUI
- Demonstrate side-by-side field comparison
- Choose "Merge" to update existing individual

#### Step 5: Success
- Show "Save Successful" message
- Explain: "Data is now saved to our database with location"

### 2. Manual Entry Alternative (1 minute)

#### Step 1: Manual Entry
- Return to Record screen
- Click "📝 Manual Entry"
- Show form with required fields highlighted
- Fill in: Name, Height, Weight, Skin Color
- Show validation (try to save without required fields)
- Complete form and save

#### Step 2: Location Integration
- Show location data included in manual entry
- Explain: "Location is captured for all interactions"

### 3. Advanced Features (1 minute)

#### High Confidence Auto-Merge
- Use different demo audio (if available)
- Show 96% confidence match
- Demonstrate auto-merge dialog
- Explain: "High confidence matches are auto-merged"

#### Error Handling
- Show recording duration limits (10-second minimum)
- Demonstrate error states (if time permits)

### 4. Demo Wrap-up (30 seconds)

#### Key Benefits
- "This app reduces documentation time from hours to minutes"
- "AI ensures consistent data categorization"
- "Duplicate detection prevents data fragmentation"
- "Location tracking provides geographic insights"

#### Technical Highlights
- "Built with React Native Expo for cross-platform compatibility"
- "Uses OpenAI Whisper for transcription and GPT-4o for categorization"
- "Supabase for real-time database and authentication"
- "Google Maps integration for location services"

---

## 🧪 Testing the Implementation

### Run Integration Tests
```bash
cd mobile
./scripts/run-integration-tests.sh
```

### Test Coverage
The integration tests verify:
- ✅ Complete recording → upload → transcribe → save flow
- ✅ Manual entry flow with validation
- ✅ Location capture during recording
- ✅ High confidence auto-merge
- ✅ Recording duration limits
- ✅ Error handling

### Manual Testing Checklist
- [ ] Audio recording starts and stops correctly
- [ ] Location capture works with map interface
- [ ] Upload to Supabase Storage succeeds
- [ ] Transcription API returns categorized data
- [ ] Required field validation works
- [ ] Duplicate detection shows MergeUI
- [ ] Manual entry form validates correctly
- [ ] Save operations complete successfully

---

## 🚀 Demo Tips

### Before Demo
1. **Test everything**: Run through the complete flow at least once
2. **Prepare audio files**: Have demo audio ready to play
3. **Check backend**: Ensure API endpoints are working
4. **Practice timing**: Keep demo under 5 minutes

### During Demo
1. **Speak clearly**: Explain each step as you perform it
2. **Show confidence**: The app works well, demonstrate that
3. **Handle errors gracefully**: If something fails, explain it's expected in demo
4. **Engage audience**: Ask if they have questions about specific features

### After Demo
1. **Highlight benefits**: Emphasize time savings and data quality
2. **Discuss next steps**: Mention future features and improvements
3. **Q&A**: Be ready to answer technical and business questions

---

## 📊 Expected Demo Results

### For John Market Street Audio:
- **Transcription**: "Met John near Market Street..."
- **Categorized Data**:
  - Name: "John"
  - Age: 45
  - Height: 72 inches
  - Weight: 180 pounds
  - Skin Color: "Light"
  - Substance Abuse: "Moderate"
  - Medical Conditions: "Diabetes"
- **Duplicate Match**: 87% confidence with "John Smith"
- **Action**: Manual merge via MergeUI

### For Sarah Library Audio:
- **Transcription**: "Sarah by the library..."
- **Categorized Data**:
  - Name: "Sarah"
  - Age: 35
  - Height: 64 inches
  - Weight: 120 pounds
  - Skin Color: "Dark"
  - Substance Abuse: "In Recovery"
- **Duplicate Match**: None (new individual)
- **Action**: Create new individual

### For Robert Golden Gate Audio:
- **Transcription**: "Robert at Golden Gate Park..."
- **Categorized Data**:
  - Name: "Robert"
  - Age: 55
  - Height: 70 inches
  - Weight: 200 pounds
  - Skin Color: "Medium"
  - Veteran Status: "Veteran"
- **Duplicate Match**: None (new individual)
- **Action**: Create new individual

---

## 🎯 Success Metrics

The demo is successful if:
- ✅ Complete flow works end-to-end
- ✅ AI categorization is accurate
- ✅ Duplicate detection functions correctly
- ✅ Location capture works seamlessly
- ✅ Manual entry provides good alternative
- ✅ Audience understands the value proposition
- ✅ Technical questions can be answered confidently

**Remember**: This is a hackathon demo - focus on showing the core functionality working well rather than perfect edge case handling. 