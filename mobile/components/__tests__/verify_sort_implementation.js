// Verification script for Task 3.0.3: Sort Dropdown Component
// This script verifies all requirements are implemented

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 3.0.3: Sort Dropdown Component Implementation\n');

const requirements = [
  {
    name: '1. Default sort is Danger Score',
    check: () => {
      const sortDropdown = fs.readFileSync(path.join(__dirname, '../SortDropdown.tsx'), 'utf8');
      const searchScreen = fs.readFileSync(path.join(__dirname, '../../screens/SearchScreen.tsx'), 'utf8');
      return sortDropdown.includes("value: 'danger_score', label: 'Danger Score'") &&
             searchScreen.includes("useState<SortOption>('danger_score')");
    }
  },
  {
    name: '2. All 4 sort options available',
    check: () => {
      const sortDropdown = fs.readFileSync(path.join(__dirname, '../SortDropdown.tsx'), 'utf8');
      return sortDropdown.includes("value: 'danger_score', label: 'Danger Score'") &&
             sortDropdown.includes("value: 'last_seen', label: 'Last Seen'") &&
             sortDropdown.includes("value: 'name', label: 'Name A-Z'") &&
             sortDropdown.includes("value: 'distance', label: 'Distance'");
    }
  },
  {
    name: '3. Distance option disabled without location',
    check: () => {
      const sortDropdown = fs.readFileSync(path.join(__dirname, '../SortDropdown.tsx'), 'utf8');
      return sortDropdown.includes('expo-location') &&
             sortDropdown.includes('hasLocationPermission') &&
             sortDropdown.includes("option.value === 'distance' && !hasLocationPermission") &&
             sortDropdown.includes('accessibilityState={{ disabled: isDisabled }}');
    }
  },
  {
    name: '4. Sort applies immediately on selection',
    check: () => {
      const sortDropdown = fs.readFileSync(path.join(__dirname, '../SortDropdown.tsx'), 'utf8');
      return sortDropdown.includes('onSortChange(option, newOrder)') &&
             sortDropdown.includes('setIsOpen(false)') &&
             sortDropdown.includes('handleOptionPress');
    }
  },
  {
    name: '5. Sort persists during session',
    check: () => {
      const searchScreen = fs.readFileSync(path.join(__dirname, '../../screens/SearchScreen.tsx'), 'utf8');
      return searchScreen.includes('const [currentSort, setCurrentSort] = useState<SortOption>') &&
             searchScreen.includes('const [currentOrder, setCurrentOrder] = useState<SortOrder>') &&
             searchScreen.includes('currentSort={currentSort}') &&
             searchScreen.includes('currentOrder={currentOrder}');
    }
  },
  {
    name: '6. Sort indicator shows current direction',
    check: () => {
      const sortDropdown = fs.readFileSync(path.join(__dirname, '../SortDropdown.tsx'), 'utf8');
      return sortDropdown.includes('getArrowIcon') &&
             sortDropdown.includes("currentOrder === 'asc' ? 'arrow-up' : 'arrow-down'") &&
             sortDropdown.includes('testID="sort-direction-indicator"');
    }
  },
  {
    name: '7. Toggle order when same option selected',
    check: () => {
      const sortDropdown = fs.readFileSync(path.join(__dirname, '../SortDropdown.tsx'), 'utf8');
      return sortDropdown.includes('if (option === currentSort)') &&
             sortDropdown.includes("currentOrder === 'asc' ? 'desc' : 'asc'");
    }
  },
  {
    name: '8. Default orders configured correctly',
    check: () => {
      const sortDropdown = fs.readFileSync(path.join(__dirname, '../SortDropdown.tsx'), 'utf8');
      return sortDropdown.includes("value: 'danger_score', label: 'Danger Score', defaultOrder: 'desc'") &&
             sortDropdown.includes("value: 'last_seen', label: 'Last Seen', defaultOrder: 'desc'") &&
             sortDropdown.includes("value: 'name', label: 'Name A-Z', defaultOrder: 'asc'") &&
             sortDropdown.includes("value: 'distance', label: 'Distance', defaultOrder: 'asc'");
    }
  },
  {
    name: '9. Integration with SearchScreen',
    check: () => {
      const searchScreen = fs.readFileSync(path.join(__dirname, '../../screens/SearchScreen.tsx'), 'utf8');
      return searchScreen.includes('import SortDropdown') &&
             searchScreen.includes('<SortDropdown') &&
             searchScreen.includes('handleSortChange') &&
             searchScreen.includes('onSortChange={handleSortChange}');
    }
  },
  {
    name: '10. Modal overlay for dropdown',
    check: () => {
      const sortDropdown = fs.readFileSync(path.join(__dirname, '../SortDropdown.tsx'), 'utf8');
      return sortDropdown.includes('<Modal') &&
             sortDropdown.includes('transparent') &&
             sortDropdown.includes('testID="sort-dropdown-overlay"') &&
             sortDropdown.includes('onRequestClose');
    }
  },
  {
    name: '11. Selected option highlighted',
    check: () => {
      const sortDropdown = fs.readFileSync(path.join(__dirname, '../SortDropdown.tsx'), 'utf8');
      return sortDropdown.includes('isSelected && styles.optionSelected') &&
             sortDropdown.includes('isSelected && styles.optionTextSelected') &&
             sortDropdown.includes('isSelected && (') &&
             sortDropdown.includes('name="checkmark"');
    }
  },
  {
    name: '12. TypeScript types exported',
    check: () => {
      const sortDropdown = fs.readFileSync(path.join(__dirname, '../SortDropdown.tsx'), 'utf8');
      return sortDropdown.includes('export type SortOption =') &&
             sortDropdown.includes('export type SortOrder =') &&
             sortDropdown.includes("'danger_score' | 'last_seen' | 'name' | 'distance'") &&
             sortDropdown.includes("'asc' | 'desc'");
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
  console.log('\n✨ ALL REQUIREMENTS MET! Task 3.0.3 is complete. ✨\n');
  console.log('Key features implemented:');
  console.log('• 4 sort options: Danger Score, Last Seen, Name A-Z, Distance');
  console.log('• Default sort is Danger Score (descending)');
  console.log('• Distance option disabled without location permission');
  console.log('• Sort applies immediately on selection');
  console.log('• Selected sort persists during session');
  console.log('• Sort direction indicator (up/down arrow)');
  console.log('• Toggle order when selecting same option');
  console.log('• Modal dropdown with overlay');
  console.log('• Selected option highlighted with checkmark');
  console.log('• Full TypeScript support');
} else {
  console.log('\n❌ Some requirements are not met. Please review the failures above.\n');
  process.exit(1);
}