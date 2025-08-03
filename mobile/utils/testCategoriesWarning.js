/**
 * Manual test instructions for Categories Screen Warning
 * 
 * To test the warning header implementation:
 * 
 * 1. Launch the app
 * 2. Navigate to the Categories tab (settings icon)
 * 3. Verify the following:
 * 
 * Visual Check:
 * ✓ Yellow warning box appears at the very top of the screen
 * ✓ Red border (2px) around the warning box
 * ✓ Warning icon (⚠️) is visible
 * ✓ Text "Data Protection Notice" is prominent
 * ✓ All 4 warning items are listed:
 *   - Medical diagnoses or health conditions
 *   - Criminal history or legal status
 *   - Immigration or citizenship status
 *   - Specific racial/ethnic identification
 * 
 * Behavior Check:
 * ✓ Scroll down through the categories list
 * ✓ Warning header remains visible at the top (sticky)
 * ✓ Content scrolls underneath the warning
 * ✓ No dismiss/close button on the warning
 * ✓ Warning cannot be hidden or removed
 * 
 * Responsive Check:
 * ✓ Rotate device to landscape (if on physical device)
 * ✓ Warning adjusts to full width
 * ✓ Text remains readable
 * 
 * The warning ensures users are constantly reminded not to create
 * categories that would violate privacy regulations for vulnerable
 * populations.
 */

// Color reference for visual verification
const WARNING_COLORS = {
  background: '#FFF3CD',  // Light yellow
  border: '#FF3B30',      // Red
  text: '#856404',        // Dark amber
};

export default WARNING_COLORS;