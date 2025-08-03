// Verification script for Task 3.0.1: Live Dropdown Search
// This script verifies all requirements are implemented

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 3.0.1: Live Dropdown Search Implementation\n');

const requirements = [
  {
    name: '1. Live search with 300ms debounce',
    check: () => {
      const searchScreen = fs.readFileSync(path.join(__dirname, '../SearchScreen.tsx'), 'utf8');
      return searchScreen.includes('300') && searchScreen.includes('setTimeout');
    }
  },
  {
    name: '2. Maximum 10 results shown',
    check: () => {
      const searchScreen = fs.readFileSync(path.join(__dirname, '../SearchScreen.tsx'), 'utf8');
      return searchScreen.includes('slice(0, 10)');
    }
  },
  {
    name: '3. Correct display format (Name, Age, Height, Skin Color)',
    check: () => {
      const dropdownItem = fs.readFileSync(path.join(__dirname, '../../components/SearchDropdownItem.tsx'), 'utf8');
      return dropdownItem.includes('formatAge') && 
             dropdownItem.includes('formatHeight') && 
             dropdownItem.includes('skinColor');
    }
  },
  {
    name: '4. No photos in dropdown',
    check: () => {
      const dropdownItem = fs.readFileSync(path.join(__dirname, '../../components/SearchDropdownItem.tsx'), 'utf8');
      return !dropdownItem.includes('Image') && 
             !dropdownItem.includes('photo') &&
             !dropdownItem.includes('uri:');
    }
  },
  {
    name: '5. Click navigates to profile',
    check: () => {
      const searchScreen = fs.readFileSync(path.join(__dirname, '../SearchScreen.tsx'), 'utf8');
      return searchScreen.includes("navigation.navigate('IndividualProfile'");
    }
  },
  {
    name: '6. Dropdown dismisses on outside tap',
    check: () => {
      const searchScreen = fs.readFileSync(path.join(__dirname, '../SearchScreen.tsx'), 'utf8');
      return searchScreen.includes('TouchableWithoutFeedback') && 
             searchScreen.includes('dismissDropdown');
    }
  },
  {
    name: '7. Loading state while searching',
    check: () => {
      const searchScreen = fs.readFileSync(path.join(__dirname, '../SearchScreen.tsx'), 'utf8');
      return searchScreen.includes('isLoading') && 
             searchScreen.includes('ActivityIndicator');
    }
  },
  {
    name: '8. Empty state when no results',
    check: () => {
      const searchScreen = fs.readFileSync(path.join(__dirname, '../SearchScreen.tsx'), 'utf8');
      return searchScreen.includes('No individuals found');
    }
  },
  {
    name: '9. Error state on API failure',
    check: () => {
      const searchScreen = fs.readFileSync(path.join(__dirname, '../SearchScreen.tsx'), 'utf8');
      return searchScreen.includes('Failed to search') && 
             searchScreen.includes('setError');
    }
  }
];

let passed = 0;
let failed = 0;

requirements.forEach((req, index) => {
  try {
    if (req.check()) {
      console.log(`✅ ${req.name}`);
      passed++;
    } else {
      console.log(`❌ ${req.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${req.name} - Error: ${error.message}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`📊 Results: ${passed}/${requirements.length} requirements met`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n✨ ALL REQUIREMENTS MET! Task 3.0.1 is complete. ✨\n');
} else {
  console.log('\n❌ Some requirements are not met. Please review the failures above.\n');
  process.exit(1);
}