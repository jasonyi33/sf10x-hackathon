# Frontend Testing Checklist: Task 4.4 DangerScore Component

## Test Instructions for Mobile App

### Prerequisites
1. Open Expo Go app on your device/simulator
2. Scan QR code from terminal
3. Navigate to the mobile app

---

## Test 1: Search Screen - DangerScore Display

### Steps:
1. Open the app
2. Tap "Search" tab
3. Look at the search results

### Expected Results:
- [ ] **Large number display**: Danger scores shown prominently (36px font)
- [ ] **Colored backgrounds**: 
  - John Doe (75): Red background (#EF4444)
  - Sarah Smith (20): Green background (#10B981)
- [ ] **No slider**: Search results should NOT show slider
- [ ] **Manual indicator**: Sarah Smith should show "Manual Override" label

### Test Result: ⬜ PASS / ⬜ FAIL

---

## Test 2: Individual Profile - DangerScore with Slider

### Steps:
1. From Search screen, tap on "John Doe"
2. Navigate to Individual Profile screen
3. Look at the DangerScore component

### Expected Results:
- [ ] **Large number display**: Danger score (75) shown prominently
- [ ] **Red background**: Background should be red (#EF4444)
- [ ] **Slider visible**: Slider should be shown below the score
- [ ] **Slider range**: 0-100 with current value (75) selected
- [ ] **Real-time updates**: Moving slider should update the display value

### Test Result: ⬜ PASS / ⬜ FAIL

---

## Test 3: Manual Override - Setting New Value

### Steps:
1. In Individual Profile, drag the slider to a new value (e.g., 85)
2. Release the slider
3. Check for confirmation dialog

### Expected Results:
- [ ] **Confirmation dialog**: "Set Manual Override" dialog appears
- [ ] **Dialog options**: "Cancel" and "Set Override" buttons
- [ ] **Cancel functionality**: Tapping Cancel resets slider to original value
- [ ] **Set Override**: Tapping "Set Override" updates the display

### Test Result: ⬜ PASS / ⬜ FAIL

---

## Test 4: Manual Override - Visual Changes

### Steps:
1. After setting override, observe the display changes

### Expected Results:
- [ ] **Score updates**: Display shows new override value (85)
- [ ] **Manual label**: "Manual Override" label appears below score
- [ ] **Clear button**: "Clear" button appears next to "Manual Override"
- [ ] **Color consistency**: Background color matches new score range

### Test Result: ⬜ PASS / ⬜ FAIL

---

## Test 5: Manual Override - Clearing Override

### Steps:
1. Tap the "Clear" button next to "Manual Override"
2. Check for confirmation dialog

### Expected Results:
- [ ] **Confirmation dialog**: "Clear Manual Override" dialog appears
- [ ] **Dialog options**: "Cancel" and "Clear Override" buttons
- [ ] **Cancel functionality**: Tapping Cancel keeps override active
- [ ] **Clear Override**: Tapping "Clear Override" removes manual override

### Test Result: ⬜ PASS / ⬜ FAIL

---

## Test 6: Manual Override - After Clearing

### Steps:
1. After clearing override, observe the display changes

### Expected Results:
- [ ] **Score reverts**: Display shows original calculated score (75)
- [ ] **Manual label disappears**: "Manual Override" label is gone
- [ ] **Clear button disappears**: "Clear" button is gone
- [ ] **Color consistency**: Background color matches calculated score

### Test Result: ⬜ PASS / ⬜ FAIL

---

## Test 7: Sarah Smith Profile - Existing Override

### Steps:
1. Go back to Search screen
2. Tap on "Sarah Smith"
3. Observe the DangerScore component

### Expected Results:
- [ ] **Override displayed**: Shows manual override value (40)
- [ ] **Yellow background**: Background should be yellow (#F59E0B)
- [ ] **Manual label**: "Manual Override" label should be visible
- [ ] **Clear button**: "Clear" button should be visible

### Test Result: ⬜ PASS / ⬜ FAIL

---

## Test 8: Error Handling

### Steps:
1. Try to set an override value
2. Simulate network error (if possible)

### Expected Results:
- [ ] **Error message**: Clear error message if API fails
- [ ] **Graceful degradation**: App doesn't crash
- [ ] **User feedback**: User knows something went wrong

### Test Result: ⬜ PASS / ⬜ FAIL

---

## Test 9: Accessibility

### Steps:
1. Test with screen reader (if available)
2. Check touch targets

### Expected Results:
- [ ] **Touch targets**: Slider and buttons are large enough
- [ ] **Color contrast**: Text is readable against backgrounds
- [ ] **Screen reader**: Component structure is accessible

### Test Result: ⬜ PASS / ⬜ FAIL

---

## Test 10: Performance

### Steps:
1. Move slider rapidly
2. Set multiple overrides quickly

### Expected Results:
- [ ] **Smooth updates**: No lag in slider movement
- [ ] **Responsive UI**: App remains responsive
- [ ] **No crashes**: App doesn't crash under stress

### Test Result: ⬜ PASS / ⬜ FAIL

---

## Overall Test Results

### Component Display: ⬜ PASS / ⬜ FAIL
### Slider Functionality: ⬜ PASS / ⬜ FAIL  
### Manual Override: ⬜ PASS / ⬜ FAIL
### Integration: ⬜ PASS / ⬜ FAIL
### Error Handling: ⬜ PASS / ⬜ FAIL
### Accessibility: ⬜ PASS / ⬜ FAIL
### Performance: ⬜ PASS / ⬜ FAIL

**Overall Status: ⬜ PASS / ⬜ FAIL**

---

## Notes:
- Test on both iOS and Android if possible
- Document any issues found
- Note any UI/UX improvements needed 