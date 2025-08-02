# Testing Guide: Tasks 4.1-4.3

## Overview
This guide provides detailed instructions for testing the completed tasks:
- **Task 4.1**: Set up tab navigation with icons
- **Task 4.2**: Build SearchScreen with search functionality
- **Task 4.3**: Create IndividualProfileScreen with profile display

## Prerequisites
- React Native Expo development environment
- iOS Simulator or Android Emulator (or physical device)
- Expo Go app installed on device (if testing on physical device)

## Setup Instructions

### 1. Start the Development Server
```bash
cd mobile
npm start
```

### 2. Run on Device/Simulator
- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan QR code with Expo Go app

---

## Task 4.1: Tab Navigation Testing

### Test Objective
Verify that the bottom tab navigation works correctly with proper icons and navigation between screens.

### Test Steps

#### 1. Verify Tab Icons
- [ ] **Record Tab**: Should show camera icon (outline when inactive, filled when active)
- [ ] **Search Tab**: Should show magnifying glass icon (outline when inactive, filled when active)
- [ ] **Categories Tab**: Should show settings icon (outline when inactive, filled when active)
- [ ] **Profile Tab**: Should show person icon (outline when inactive, filled when active)

#### 2. Verify Tab Navigation
- [ ] **Default Tab**: Record tab should be active by default
- [ ] **Tab Switching**: Tap each tab and verify:
  - Icon changes from outline to filled
  - Screen content changes
  - Tab title appears in header
- [ ] **Active State**: Active tab should be blue (#007AFF)
- [ ] **Inactive State**: Inactive tabs should be gray

#### 3. Verify Screen Content
- [ ] **Record Screen**: Shows "Voice Recording" title and subtitle
- [ ] **Search Screen**: Shows search bar and "Recent Individuals" section
- [ ] **Categories Screen**: Shows "Categories" title and subtitle
- [ ] **Profile Screen**: Shows "User Profile" title and subtitle

### Expected Results
- All 4 tabs visible with correct icons
- Smooth navigation between tabs
- Proper active/inactive states
- Each screen displays placeholder content

---

## Task 4.2: SearchScreen Testing

### Test Objective
Verify that the search functionality works correctly with real-time search, results display, and recent individuals.

### Test Steps

#### 1. Verify Search Bar
- [ ] **Search Input**: Tap the search bar and verify keyboard appears
- [ ] **Placeholder Text**: Should show "Search by name..."
- [ ] **Auto-capitalize**: Should be disabled (no auto-capitalization)
- [ ] **Auto-correct**: Should be disabled (no auto-correction)

#### 2. Verify Recent Individuals Section
- [ ] **Default View**: When no search query, should show "Recent Individuals" section
- [ ] **Loading State**: Should show loading spinner initially
- [ ] **Results Display**: Should show 5 mock individuals:
  - John Doe (Danger: 75, Last seen: 2 days ago)
  - Sarah Smith (Danger: 40 override, Last seen: 5 days ago)
  - Robert Johnson (Danger: 90, Last seen: 1 day ago)
  - Maria Garcia (Danger: 15, Last seen: 7 days ago)
  - David Wilson (Danger: 60, Last seen: 3 days ago)

#### 3. Verify Search Results
- [ ] **Search "John"**: Should return "John Doe" only
- [ ] **Search "Sarah"**: Should return "Sarah Smith" only
- [ ] **Search "Robert"**: Should return "Robert Johnson" only
- [ ] **Search "Smith"**: Should return "Sarah Smith" only
- [ ] **Search "xyz"**: Should show "No individuals found"
- [ ] **Empty Search**: Should clear results and show recent individuals

#### 4. Verify Search Result Display
For each search result, verify:
- [ ] **Name**: Displayed prominently in large font
- [ ] **Danger Score**: Color-coded badge with score number
  - Green (#10B981): 0-33
  - Yellow (#F59E0B): 34-66
  - Red (#EF4444): 67-100
- [ ] **Last Seen**: Shows "Last seen: X days ago"
- [ ] **Manual Override**: Sarah Smith should show override value (40) instead of calculated (20)

#### 5. Verify Loading States
- [ ] **Initial Load**: Should show loading spinner for recent individuals
- [ ] **Search Loading**: Should show loading spinner when searching
- [ ] **Error Handling**: Should show error alert if search fails

#### 6. Verify Navigation
- [ ] **Tap Result**: Should navigate to IndividualProfileScreen
- [ ] **Navigation Params**: Should pass correct individualId

### Expected Results
- Search functionality works with real-time results
- Color-coded danger scores display correctly
- Recent individuals show when no search query
- Navigation to profile screen works
- Loading states and error handling work properly

---

## Task 4.3: IndividualProfileScreen Testing

### Test Objective
Verify that the individual profile screen displays all required information correctly with proper danger score logic and interaction history.

### Test Steps

#### 1. Navigate to Profile
- [ ] **From Search**: Tap any search result to navigate to profile
- [ ] **Route Params**: Verify individualId is passed correctly
- [ ] **Loading State**: Should show loading spinner initially

#### 2. Verify Header Section
- [ ] **Individual Name**: Should display prominently (e.g., "John Doe")
- [ ] **Danger Score Display**: Large, prominent score with colored background
- [ ] **Color Coding**: 
  - John Doe: Red background (score 75)
  - Sarah Smith: Yellow background (score 40 override)
  - Robert Johnson: Red background (score 90)
- [ ] **Manual Override**: Sarah Smith should show "Manual Override" label

#### 3. Verify Current Information Section
- [ ] **Section Title**: Should show "Current Information"
- [ ] **Field Display**: Should show all data fields:
  - Height: 72 inches
  - Weight: 180 pounds
  - Skin Color: Light
  - Gender: Male
  - Substance Abuse History: Moderate
  - Age: 45
  - Veteran Status: Yes
  - Medical Conditions: Diabetes
  - Housing Priority: High
- [ ] **Required Fields**: Height, Weight, Skin Color should show red asterisk (*)
- [ ] **Array Values**: Multi-select fields should show comma-separated values
- [ ] **Missing Values**: Should show "Not specified" for null/undefined values

#### 4. Verify Interaction History Section
- [ ] **Section Title**: Should show "Interaction History"
- [ ] **Interaction Count**: Should show "3 interactions" (for John Doe)
- [ ] **Interaction List**: Should show all interactions in chronological order

#### 5. Verify Individual Interaction Items
For each interaction, verify:
- [ ] **Date/Time**: Formatted as "Jan 15, 2024, 10:30 AM"
- [ ] **Entry Type**: Should show "Voice Entry" or "Manual Entry" badge
- [ ] **Worker Name**: Should show worker name (e.g., "Officer Smith")
- [ ] **Address**: Should show abbreviated address (e.g., "Market St & 5th Ave")
- [ ] **Transcription Preview**: Voice entries should show transcription preview in quotes

#### 6. Verify Specific Test Cases

##### Test Case 1: John Doe Profile
- [ ] **Danger Score**: 75 (red background)
- [ ] **Manual Override**: None (should show calculated score)
- [ ] **Interactions**: 3 interactions
- [ ] **Voice Entry**: First interaction should show transcription preview
- [ ] **Data Fields**: All fields populated with John's data

##### Test Case 2: Sarah Smith Profile
- [ ] **Danger Score**: 40 (yellow background, manual override)
- [ ] **Manual Override**: Should show "Manual Override" label
- [ ] **Interactions**: 2 interactions
- [ ] **Data Fields**: All fields populated with Sarah's data

#### 7. Verify Error Handling
- [ ] **Invalid ID**: Should show "Profile not found" and navigate back
- [ ] **Network Error**: Should show error alert
- [ ] **Refresh**: Pull-to-refresh should reload profile data

#### 8. Verify Navigation
- [ ] **Back Button**: Should navigate back to search screen
- [ ] **Header Title**: Should show "Individual Profile"
- [ ] **Interaction Tap**: Should show alert (placeholder for Task 4.5)

### Expected Results
- Profile displays all current field values correctly
- Danger score shows proper color coding and override logic
- Interaction history shows all interactions with proper formatting
- Error handling works for invalid IDs and network errors
- Navigation flows work correctly

---

## Common Issues and Troubleshooting

### TypeScript Errors
- **Issue**: TypeScript compilation errors
- **Solution**: Run `npx tsc --noEmit` to check for errors
- **Fix**: Ensure all imports and types are correct

### Navigation Issues
- **Issue**: Can't navigate to profile screen
- **Solution**: Check that IndividualProfileScreen is properly added to navigation stack
- **Fix**: Verify App.tsx has correct stack navigator setup

### Search Not Working
- **Issue**: Search doesn't return results
- **Solution**: Check mock data in api.ts
- **Fix**: Verify searchIndividuals function is working correctly

### Profile Not Loading
- **Issue**: Profile screen shows loading indefinitely
- **Solution**: Check getIndividualProfile function in api.ts
- **Fix**: Verify mockIndividualProfiles data structure

### Styling Issues
- **Issue**: Colors or layout look wrong
- **Solution**: Check StyleSheet definitions
- **Fix**: Verify color codes and layout properties

---

## Performance Testing

### Search Performance
- [ ] **Response Time**: Search results should appear within 500ms
- [ ] **Debounce**: Should not make excessive API calls while typing
- [ ] **Memory**: Should not cause memory leaks with rapid searches

### Profile Loading Performance
- [ ] **Initial Load**: Profile should load within 1 second
- [ ] **Refresh**: Pull-to-refresh should be responsive
- [ ] **Memory**: Should handle large interaction lists efficiently

---

## Accessibility Testing

### Screen Reader Support
- [ ] **Tab Labels**: Each tab should have proper accessibility labels
- [ ] **Search Input**: Should have proper accessibility hints
- [ ] **Danger Scores**: Should announce color and score to screen readers
- [ ] **Interaction Items**: Should be properly labeled for navigation

### Visual Accessibility
- [ ] **Color Contrast**: Danger score colors should have sufficient contrast
- [ ] **Text Size**: All text should be readable
- [ ] **Touch Targets**: Buttons and interactive elements should be large enough

---

## Test Completion Checklist

### Task 4.1 ✅
- [ ] All 4 tabs display with correct icons
- [ ] Tab navigation works smoothly
- [ ] Active/inactive states display correctly
- [ ] Each screen shows placeholder content

### Task 4.2 ✅
- [ ] Search bar functions correctly
- [ ] Recent individuals display properly
- [ ] Search results show with correct formatting
- [ ] Danger scores are color-coded correctly
- [ ] Navigation to profile works

### Task 4.3 ✅
- [ ] Profile screen loads and displays data
- [ ] Danger score shows correct color and logic
- [ ] All field values display properly
- [ ] Interaction history shows correctly
- [ ] Error handling works
- [ ] Navigation flows properly

---

## Notes for Development

- All data is currently mock data for testing purposes
- Real API integration will replace mock functions
- Error handling is basic and can be enhanced
- Styling follows the PRD color specifications
- TypeScript types ensure type safety throughout

This testing guide covers all the functionality implemented in tasks 4.1-4.3. Each test case should be executed to ensure the features work as expected before proceeding to the next task. 