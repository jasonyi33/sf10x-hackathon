# Demo Guide for Task 4.0.5

## Demo Setup

The database has been populated with 5 demo individuals that match the PRD requirements. None have photos initially - you'll add them during the demo.

## Demo Individuals

### 1. John Doe
- **Profile**: Male, 45-50 years old, 5'10" (70 inches), Medium skin
- **Danger Score**: 20 (Low)
- **Photo**: Add during demo
- **Demo Script**: "Show a typical low-risk individual who just needs basic services"

### 2. Jane Smith
- **Profile**: Female, Unknown age, 5'6" (66 inches), Light skin
- **Danger Score**: 80 (High)
- **Photo**: No photo (demonstrate individual who refuses photos)
- **Demo Script**: "Show edge case - unknown age, high risk, no photo consent"

### 3. Robert Johnson
- **Profile**: Male, 65-70 years old, 6'0" (72 inches), Dark skin
- **Danger Score**: 45 (Medium)
- **Photo**: Add multiple photos during demo to show photo history
- **Demo Script**: "Demonstrate photo update feature and history tracking"

### 4. Maria Garcia
- **Profile**: Female, 30-35 years old, 5'4" (64 inches), Medium skin
- **Danger Score**: 10 (Very low)
- **Photo**: Add during demo
- **Demo Script**: "Show low-risk individual seeking housing assistance"

### 5. Unknown Person
- **Profile**: Unknown gender, Unknown age, 5'8" (68 inches), Medium skin
- **Danger Score**: 90 (Very high)
- **Photo**: No photo (aggressive, refuses assistance)
- **Demo Script**: "Show edge case - all unknown data, very high risk"

## Demo Flow

### 1. Search Functionality
```
- Search "John" → finds John Doe
- Search "Smith" → finds Jane Smith
- Search "Unknown" → finds Unknown Person
- Show empty search returns all individuals
```

### 2. Filter Demonstrations
```
- Filter by gender: Male → John Doe, Robert Johnson
- Filter by age: 40-60 → John Doe, Maria Garcia
- Filter by danger: High (>50) → Jane Smith, Unknown Person
- Filter by has photo → Initially none, then after adding photos
```

### 3. Photo Upload Demo
```
1. Go to John Doe's profile
2. Click "Update Photo"
3. Take/select photo, confirm consent
4. Show photo appears in profile

5. Go to Robert Johnson's profile
6. Add first photo
7. Add second photo
8. Show photo history feature
```

### 4. Edge Cases
```
- Show Jane Smith with Unknown age displays as "Unknown"
- Show Unknown Person with Unknown gender
- Demonstrate high danger scores (80, 90)
- Show individuals without photos
```

### 5. Sort Demonstrations
```
- Sort by Danger Score (default) - Unknown Person first
- Sort by Name A-Z - Jane Smith, John Doe, Maria Garcia...
- Sort by Last Seen - based on interaction dates
```

## Key Points to Highlight

1. **Variety of Profiles**: Different ages, genders, danger scores
2. **Edge Cases**: Unknown age/gender handled gracefully
3. **Photo Management**: Live upload, history tracking
4. **Search Works**: All individuals are searchable
5. **Filters Work**: Can filter by any criteria
6. **No Hardcoded Data**: All photos added live during demo

## Testing Searchability

Run these searches during demo:
- "john" → John Doe
- "jane" → Jane Smith  
- "robert" → Robert Johnson
- "maria" → Maria Garcia
- "unknown" → Unknown Person
- "male" → John Doe, Robert Johnson
- "female" → Jane Smith, Maria Garcia
- Filter: Age unknown → Jane Smith, Unknown Person
- Filter: Danger > 70 → Jane Smith (80), Unknown Person (90)

## Notes

- All individuals start without photos (except those who refuse)
- Photo history only exists after you add multiple photos to Robert Johnson
- Interactions are pre-populated to show history
- Demo data is minimal but covers all PRD requirements