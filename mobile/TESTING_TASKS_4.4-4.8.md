# Testing Guide: Tasks 4.4-4.8

## Overview
This guide provides detailed instructions for testing the remaining tasks:
- **Task 4.4**: Build DangerScore component with slider override
- **Task 4.5**: Create interaction detail modal
- **Task 4.6**: Implement UserProfileScreen
- **Task 4.7**: Add CSV export button
- **Task 4.8**: Write integration test

## Prerequisites
- Tasks 4.1-4.3 completed and tested
- React Native Expo development environment
- iOS Simulator or Android Emulator (or physical device)
- Stack navigation dependencies installed (when Tasks 1, 2, 3 are completed)

---

## Task 4.4: DangerScore Component Testing

### Test Objective
Verify that the DangerScore component displays danger scores correctly and allows manual override via slider.

### Test Steps

#### 1. Verify Component Display
- [ ] **Large number display**: Danger score shown prominently
- [ ] **Colored background**: Background color matches score range
  - Green (#10B981): 0-33
  - Yellow (#F59E0B): 34-66
  - Red (#EF4444): 67-100
- [ ] **Display logic**: Shows override if exists, else calculated score

#### 2. Verify Slider Functionality
- [ ] **Slider range**: 0-100 with proper increments
- [ ] **Slider interaction**: Can drag slider to change value
- [ ] **Value update**: Score display updates in real-time as slider moves
- [ ] **API integration**: Slider changes trigger API call to update danger_override

#### 3. Verify Manual Override Indicator
- [ ] **"Manual" label**: Shows when override is active
- [ ] **Label positioning**: Appears below or near the score
- [ ] **Visual distinction**: Manual overrides are clearly indicated

#### 4. Verify Component Integration
- [ ] **IndividualProfileScreen**: Component displays correctly in profile
- [ ] **Search results**: Component used in search result items
- [ ] **Consistent styling**: Matches design system across screens

### Expected Results
- Danger score displays with proper color coding
- Slider allows manual override (0-100)
- "Manual" indicator shows when override is active
- Component integrates seamlessly with existing screens

---

## Task 4.5: Interaction Detail Modal Testing

### Test Objective
Verify that the interaction detail modal displays complete interaction information.

### Test Steps

#### 1. Verify Modal Trigger
- [ ] **Tap interaction**: Tapping interaction item opens modal
- [ ] **Modal animation**: Smooth open/close animation
- [ ] **Backdrop**: Modal has proper backdrop/overlay

#### 2. Verify Modal Content
- [ ] **Changed fields**: Shows only fields that changed in that interaction
- [ ] **Full address**: Displays complete address from reverse geocoding
- [ ] **Transcription**: Shows original transcription for voice entries
- [ ] **Date/time**: Displays interaction date and time
- [ ] **Worker name**: Shows worker who recorded the interaction

#### 3. Verify Modal Actions
- [ ] **Close button**: Modal can be closed
- [ ] **Backdrop tap**: Tapping backdrop closes modal
- [ ] **Navigation**: Modal doesn't interfere with screen navigation

#### 4. Verify Data Accuracy
- [ ] **Field comparison**: Changed fields match interaction data
- [ ] **Address accuracy**: Full address is correct and readable
- [ ] **Transcription accuracy**: Original transcription is preserved

### Expected Results
- Modal opens smoothly when tapping interactions
- Shows accurate interaction details
- Proper modal behavior (open/close)
- Data integrity maintained

---

## Task 4.6: UserProfileScreen Testing

### Test Objective
Verify that the UserProfileScreen displays user information and logout functionality.

### Test Steps

#### 1. Verify User Information Display
- [ ] **Current user name**: Displays logged-in user's name
- [ ] **User email**: Shows user's email address
- [ ] **User role**: Displays user's role/permissions (if applicable)

#### 2. Verify Logout Functionality
- [ ] **Logout button**: Prominent logout button present
- [ ] **Logout action**: Tapping logout signs out user
- [ ] **Navigation**: After logout, navigates to login screen
- [ ] **Session clear**: User session is properly cleared

#### 3. Verify Screen Integration
- [ ] **Tab navigation**: Screen accessible via Profile tab
- [ ] **Header**: Proper screen title and navigation
- [ ] **Styling**: Consistent with app design system

#### 4. Verify Error Handling
- [ ] **Network errors**: Handles logout API failures gracefully
- [ ] **Session errors**: Handles invalid session states
- [ ] **User feedback**: Shows appropriate error messages

### Expected Results
- User information displays correctly
- Logout functionality works properly
- Screen integrates well with navigation
- Error handling is robust

---

## Task 4.7: CSV Export Testing

### Test Objective
Verify that the CSV export functionality downloads all individuals data correctly.

### Test Steps

#### 1. Verify Export Button
- [ ] **Button location**: Export button is easily accessible
- [ ] **Button styling**: Consistent with app design
- [ ] **Button state**: Shows loading state during export

#### 2. Verify Export Process
- [ ] **API call**: Triggers `/api/export` endpoint
- [ ] **Loading indicator**: Shows progress during export
- [ ] **Success feedback**: Shows success message when complete
- [ ] **Error handling**: Shows error if export fails

#### 3. Verify CSV Content
- [ ] **All individuals**: Includes all individuals in database
- [ ] **All fields**: Includes all category fields as columns
- [ ] **Danger scores**: Includes danger score column
- [ ] **Last interaction**: Includes last interaction date
- [ ] **Multi-select values**: Comma-separated for multi-select fields

#### 4. Verify File Download
- [ ] **File format**: Downloads as .csv file
- [ ] **File naming**: Descriptive filename with date
- [ ] **File size**: Reasonable file size for data amount
- [ ] **File content**: CSV is properly formatted and readable

### Expected Results
- Export button triggers download
- CSV contains all required data
- File downloads successfully
- Error handling works properly

---

## Task 4.8: Integration Test Testing

### Test Objective
Verify that the integration test covers the complete search → profile → danger override flow.

### Test Steps

#### 1. Verify Test Coverage
- [ ] **Search flow**: Tests search functionality
- [ ] **Navigation**: Tests navigation to profile
- [ ] **Profile display**: Tests profile data loading
- [ ] **Danger override**: Tests slider functionality
- [ ] **Data persistence**: Tests that changes are saved

#### 2. Verify Test Execution
- [ ] **Test command**: `npm test` runs integration tests
- [ ] **Test output**: Clear pass/fail results
- [ ] **Test speed**: Tests complete in reasonable time
- [ ] **Test reliability**: Tests are consistent and repeatable

#### 3. Verify Test Scenarios
- [ ] **Happy path**: Complete successful flow
- [ ] **Error scenarios**: Network failures, invalid data
- [ ] **Edge cases**: Empty results, missing data
- [ ] **Performance**: Tests performance requirements

#### 4. Verify Test Maintenance
- [ ] **Test updates**: Tests updated when features change
- [ ] **Test documentation**: Tests are well documented
- [ ] **Test isolation**: Tests don't interfere with each other

### Expected Results
- Integration tests cover complete user flows
- Tests pass consistently
- Tests are maintainable and well-documented
- Performance requirements are verified

---

## Common Issues and Troubleshooting

### DangerScore Component Issues
- **Issue**: Slider not updating score display
- **Solution**: Check state management and event handlers
- **Fix**: Ensure slider onChange updates component state

### Modal Issues
- **Issue**: Modal not opening/closing properly
- **Solution**: Check modal library and navigation
- **Fix**: Verify modal component implementation

### Export Issues
- **Issue**: CSV export fails
- **Solution**: Check API endpoint and file permissions
- **Fix**: Verify backend export functionality

### Test Issues
- **Issue**: Integration tests failing
- **Solution**: Check test setup and mock data
- **Fix**: Update tests to match current implementation

---

## Performance Testing

### Component Performance
- [ ] **DangerScore**: Slider updates smoothly without lag
- [ ] **Modal**: Opens/closes quickly
- [ ] **Export**: Large datasets export in reasonable time
- [ ] **Navigation**: Screen transitions are smooth

### Memory Usage
- [ ] **Component memory**: No memory leaks in components
- [ ] **Modal memory**: Modals don't accumulate in memory
- [ ] **Export memory**: Large exports don't crash app

---

## Accessibility Testing

### Screen Reader Support
- [ ] **DangerScore**: Slider has proper accessibility labels
- [ ] **Modal**: Modal content is accessible to screen readers
- [ ] **Export**: Export button has proper accessibility hints
- [ ] **Navigation**: All interactive elements are accessible

### Visual Accessibility
- [ ] **Color contrast**: All text has sufficient contrast
- [ ] **Touch targets**: Buttons are large enough to tap
- [ ] **Text size**: All text is readable
- [ ] **Focus indicators**: Clear focus indicators for navigation

---

## Test Completion Checklist

### Task 4.4 ✅
- [ ] DangerScore component displays correctly
- [ ] Slider functionality works
- [ ] Manual override indicator shows
- [ ] Component integrates with existing screens

### Task 4.5 ✅
- [ ] Modal opens when tapping interactions
- [ ] Modal shows correct interaction details
- [ ] Modal closes properly
- [ ] Data accuracy is maintained

### Task 4.6 ✅
- [ ] User information displays correctly
- [ ] Logout functionality works
- [ ] Screen integrates with navigation
- [ ] Error handling is robust

### Task 4.7 ✅
- [ ] Export button triggers download
- [ ] CSV contains all required data
- [ ] File downloads successfully
- [ ] Error handling works properly

### Task 4.8 ✅
- [ ] Integration tests cover complete flows
- [ ] Tests pass consistently
- [ ] Tests are maintainable
- [ ] Performance requirements are verified

---

## Notes for Development

- All components should follow the established design system
- Error handling should be consistent across all features
- Performance should be monitored for large datasets
- Accessibility should be considered for all new components
- Tests should be written before or alongside feature implementation

This testing guide covers all the functionality to be implemented in tasks 4.4-4.8. Each test case should be executed to ensure the features work as expected. 