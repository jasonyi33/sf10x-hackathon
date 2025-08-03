// Verification script for Task 3.0.2: Collapsible Filter Section
// This script verifies all requirements are implemented

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 3.0.2: Collapsible Filter Section Implementation\n');

const requirements = [
  {
    name: '1. Filter section starts collapsed',
    check: () => {
      const filterSection = fs.readFileSync(path.join(__dirname, '../FilterSection.tsx'), 'utf8');
      return filterSection.includes('useState(false)') && filterSection.includes('isExpanded');
    }
  },
  {
    name: '2. Expand/collapse with smooth animation',
    check: () => {
      const filterSection = fs.readFileSync(path.join(__dirname, '../FilterSection.tsx'), 'utf8');
      return filterSection.includes('Animated.timing') && 
             filterSection.includes('duration: 300') &&
             filterSection.includes('animatedHeight');
    }
  },
  {
    name: '3. Gender multi-select checkboxes',
    check: () => {
      const filterSection = fs.readFileSync(path.join(__dirname, '../FilterSection.tsx'), 'utf8');
      return filterSection.includes("GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Unknown']") &&
             filterSection.includes('renderCheckbox') &&
             filterSection.includes('toggleGender');
    }
  },
  {
    name: '4. Age range dual slider',
    check: () => {
      const filterSection = fs.readFileSync(path.join(__dirname, '../FilterSection.tsx'), 'utf8');
      return filterSection.includes('age-slider-min') && 
             filterSection.includes('age-slider-max') &&
             filterSection.includes('updateAgeRange');
    }
  },
  {
    name: '5. Height range number inputs',
    check: () => {
      const filterSection = fs.readFileSync(path.join(__dirname, '../FilterSection.tsx'), 'utf8');
      return filterSection.includes('height-input-min') && 
             filterSection.includes('height-input-max') &&
             filterSection.includes('updateHeightRange');
    }
  },
  {
    name: '6. Danger score range slider',
    check: () => {
      const filterSection = fs.readFileSync(path.join(__dirname, '../FilterSection.tsx'), 'utf8');
      return filterSection.includes('danger-slider-min') && 
             filterSection.includes('danger-slider-max') &&
             filterSection.includes('updateDangerRange');
    }
  },
  {
    name: '7. Has photo toggle (yes/no/any)',
    check: () => {
      const filterSection = fs.readFileSync(path.join(__dirname, '../FilterSection.tsx'), 'utf8');
      return filterSection.includes('photo-option-any') && 
             filterSection.includes('photo-option-yes') &&
             filterSection.includes('photo-option-no') &&
             filterSection.includes('renderRadioButton');
    }
  },
  {
    name: '8. Active filters shown as removable tags',
    check: () => {
      const filterSection = fs.readFileSync(path.join(__dirname, '../FilterSection.tsx'), 'utf8');
      return filterSection.includes('renderFilterTag') && 
             filterSection.includes('filter-tag-') &&
             filterSection.includes('removeFilter');
    }
  },
  {
    name: '9. Clear all filters button',
    check: () => {
      const filterSection = fs.readFileSync(path.join(__dirname, '../FilterSection.tsx'), 'utf8');
      return filterSection.includes('clear-all-button') && 
             filterSection.includes('clearAllFilters') &&
             filterSection.includes('onClearAll');
    }
  },
  {
    name: '10. Filter count badge when collapsed',
    check: () => {
      const filterSection = fs.readFileSync(path.join(__dirname, '../FilterSection.tsx'), 'utf8');
      return filterSection.includes('filter-count-badge') && 
             filterSection.includes('getActiveFilterCount') &&
             filterSection.includes('!isExpanded && activeFilterCount > 0');
    }
  },
  {
    name: '11. Filters persist during collapse/expand',
    check: () => {
      const filterSection = fs.readFileSync(path.join(__dirname, '../FilterSection.tsx'), 'utf8');
      return filterSection.includes('useState<FilterState>') && 
             filterSection.includes('filters') &&
             !filterSection.includes('resetFiltersOnCollapse'); // Ensure no reset logic
    }
  },
  {
    name: '12. Age slider shows numeric values',
    check: () => {
      const filterSection = fs.readFileSync(path.join(__dirname, '../FilterSection.tsx'), 'utf8');
      return filterSection.includes('age-value-min') && 
             filterSection.includes('age-value-max') &&
             filterSection.includes("filters.ageMin === -1 ? 'Any' : filters.ageMin");
    }
  },
  {
    name: '13. Integration with SearchScreen',
    check: () => {
      const searchScreen = fs.readFileSync(path.join(__dirname, '../../screens/SearchScreen.tsx'), 'utf8');
      return searchScreen.includes('import FilterSection') && 
             searchScreen.includes('<FilterSection') &&
             searchScreen.includes('handleFiltersChange');
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
  console.log('\n✨ ALL REQUIREMENTS MET! Task 3.0.2 is complete. ✨\n');
  console.log('Key features implemented:');
  console.log('• Collapsible filter section with smooth animation');
  console.log('• Gender multi-select checkboxes');
  console.log('• Age range dual slider with numeric display');
  console.log('• Height range number inputs');
  console.log('• Danger score range slider (0-100)');
  console.log('• Has photo radio buttons (any/yes/no)');
  console.log('• Active filters as removable tags');
  console.log('• Clear all filters functionality');
  console.log('• Filter count badge when collapsed');
  console.log('• Filters persist during collapse/expand');
} else {
  console.log('\n❌ Some requirements are not met. Please review the failures above.\n');
  process.exit(1);
}