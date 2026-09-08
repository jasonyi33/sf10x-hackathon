# SF Homeless Outreach App - Demo Script
## 5-Minute Hackathon Presentation

### **Pre-Demo Setup (30 seconds)**
- Open the app on iOS simulator
- Ensure backend is running with demo data
- Have the demo script ready for reference

---

### **Demo Flow (5 minutes total)**

#### **1. App Launch & Auto-Login (30 seconds)**
**Script**: "Welcome to the SF Homeless Outreach Voice Transcription App. As you can see, the app automatically logs in with demo credentials and takes us directly to the recording interface."

**Actions**:
- Show app launching
- Point out auto-login (no login screen)
- Navigate to Record tab (default)

**Key Points**:
- ✅ Auto-login with demo credentials
- ✅ Direct access to recording interface
- ✅ Clean, professional UI

---

#### **2. Voice Recording & AI Transcription (2 minutes)**

**Script**: "Let me demonstrate the core functionality - voice recording with AI transcription. I'll record a brief interaction and show you how the AI processes it."

**Actions**:
1. **Start Recording** (30 seconds)
   - Tap "Start Recording" button
   - Show live duration counter
   - Point out location capture
   - Record: "Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication."

2. **AI Processing** (30 seconds)
   - Show "Processing audio..." screen
   - Explain: "The app uploads the audio to our backend, where OpenAI Whisper transcribes it and GPT-4o categorizes the information."

3. **Transcription Results** (1 minute)
   - Show categorized results
   - Highlight required field validation (missing fields in red)
   - Point out potential duplicate detection
   - Edit a field to show real-time updates

**Key Points**:
- ✅ 10-second minimum enforced
- ✅ Real-time duration display
- ✅ Location capture with GPS
- ✅ AI transcription and categorization
- ✅ Required field validation
- ✅ Duplicate detection

---

#### **3. Duplicate Detection & Merge Flow (1 minute)**

**Script**: "The AI detected a potential match with an existing individual. Let me show you the merge interface."

**Actions**:
1. **Show Merge UI** (30 seconds)
   - Display confidence score (87%)
   - Show field-by-field comparison
   - Explain merge decision process

2. **Complete Merge** (30 seconds)
   - Select which fields to keep
   - Tap "Merge" button
   - Show success message

**Key Points**:
- ✅ Smart duplicate detection
- ✅ Confidence-based UI (streamlined vs. full merge)
- ✅ Field-by-field selection
- ✅ Seamless merge process

---

#### **4. Search & Profile Management (1 minute)**

**Script**: "Now let's search for individuals and view their profiles with danger assessment."

**Actions**:
1. **Search Functionality** (30 seconds)
   - Navigate to Search tab
   - Search for "John"
   - Show results with danger scores
   - Point out color-coded danger levels

2. **Profile View** (30 seconds)
   - Tap on John Doe's profile
   - Show interaction history
   - Demonstrate danger override slider
   - Show manual override functionality

**Key Points**:
- ✅ Multi-field search
- ✅ Color-coded danger scores
- ✅ Interaction history
- ✅ Manual danger override
- ✅ Real-time updates

---

#### **5. Category Management & Export (30 seconds)**

**Script**: "Finally, let me show you the category management and data export features."

**Actions**:
1. **Categories Tab** (15 seconds)
   - Navigate to Categories tab
   - Show active categories list
   - Point out priority distribution

2. **CSV Export** (15 seconds)
   - Tap "Export CSV" button
   - Show export progress
   - Demonstrate downloaded file

**Key Points**:
- ✅ Dynamic category management
- ✅ Priority-based organization
- ✅ CSV export functionality
- ✅ Complete data portability

---

### **Demo Conclusion (30 seconds)**

**Script**: "This app transforms hours of manual data entry into minutes of voice-based documentation. The AI handles transcription and categorization, while the danger assessment system helps ensure worker safety. The searchable database provides real-time access to individual histories during field interactions."

**Key Benefits Highlighted**:
- ✅ **Time Savings**: Hours → Minutes
- ✅ **AI-Powered**: Whisper + GPT-4o
- ✅ **Safety Focused**: Danger assessment
- ✅ **Real-time Access**: Searchable database
- ✅ **Customizable**: Dynamic categories
- ✅ **Export Ready**: CSV integration

---

### **Technical Architecture Summary**

**Backend**: FastAPI + Supabase + OpenAI
**Frontend**: React Native Expo
**AI Services**: Whisper (transcription) + GPT-4o (categorization)
**Database**: PostgreSQL with JSONB for flexible data
**Deployment**: Railway for backend, Expo for frontend

---

### **Demo Tips**

1. **Keep it flowing**: Don't get stuck on technical details
2. **Emphasize benefits**: Focus on time savings and safety
3. **Show real data**: Use the demo data we created
4. **Handle errors gracefully**: If something fails, explain it's a demo
5. **Time management**: Stick to 5 minutes total
6. **Prepare backup**: Have screenshots ready in case of technical issues

---

### **Q&A Preparation**

**Common Questions**:
- "How accurate is the transcription?" → "Whisper achieves 95%+ accuracy"
- "What about privacy?" → "Audio files auto-delete after 24 hours"
- "Can it work offline?" → "Currently requires internet, offline mode planned"
- "How much does it cost?" → "~$0.02 per interaction with current AI pricing"
- "Is it HIPAA compliant?" → "Following best practices, full compliance planned"

**Technical Questions**:
- "Why FastAPI?" → "Better for AI orchestration than pure Supabase"
- "Why React Native?" → "Cross-platform, excellent audio capabilities"
- "How do you handle duplicates?" → "LLM-based similarity scoring"
- "What about data validation?" → "Comprehensive validation on both frontend and backend" 