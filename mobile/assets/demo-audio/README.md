# Demo Audio Files for Voice Transcription App

## Instructions for Creating Demo Audio Files

Since we can't generate actual audio files in this environment, here are the three demo scripts that need to be recorded:

### 1. john-market-street.m4a
**Script:** "Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication."

**Expected Categorization:**
- name: "John"
- age: 45
- height: 72 (6 feet = 72 inches)
- weight: 180
- skin_color: "Light"
- substance_abuse_history: "Moderate"
- medical_conditions: "Diabetes"
- location: "Market Street"

### 2. sarah-library.m4a
**Script:** "Sarah by the library, approximately 35, 5 foot 4, 120 pounds, dark skin. Says she's in recovery, looking for shelter. Has two children staying with relatives."

**Expected Categorization:**
- name: "Sarah"
- age: 35
- height: 64 (5 foot 4 = 64 inches)
- weight: 120
- skin_color: "Dark"
- substance_abuse_history: "In Recovery"
- housing_status: "Looking for shelter"
- family_info: "Two children staying with relatives"

### 3. robert-golden-gate.m4a
**Script:** "Robert at Golden Gate Park. 55 years old, 5 foot 10, 200 pounds, medium skin tone. Veteran, mild substance issues. Applied for housing last week."

**Expected Categorization:**
- name: "Robert"
- age: 55
- height: 70 (5 foot 10 = 70 inches)
- weight: 200
- skin_color: "Medium"
- substance_abuse_history: "Mild"
- veteran_status: "Veteran"
- housing_status: "Applied for housing last week"
- location: "Golden Gate Park"

## How to Create These Audio Files

1. **Using Text-to-Speech (Recommended for Demo):**
   - Use macOS: say -o john-market-street.m4a "Met John near Market Street..."
   - Use online TTS services like Google Text-to-Speech
   - Use iOS Voice Memos app and read the scripts

2. **Manual Recording:**
   - Use the app's recording feature to record these scripts
   - Speak clearly and naturally
   - Ensure good audio quality

3. **File Requirements:**
   - Format: M4A with AAC codec
   - Duration: 10-30 seconds each
   - Quality: Clear, understandable speech

## Integration Testing

These audio files will be used to test:
- Audio upload functionality
- Transcription accuracy
- AI categorization
- Required field validation
- Duplicate detection
- Save flow completion

## File Locations

Place the generated .m4a files in:
`mobile/assets/demo-audio/`

The app will reference these files for demo purposes.
