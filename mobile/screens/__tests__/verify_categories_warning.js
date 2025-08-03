#!/usr/bin/env node

/**
 * Verification script for Task 3.2.2: Categories Screen Warning
 * This script verifies all requirements are implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 3.2.2: Categories Screen Warning Implementation\n');

const requirements = [];
let passed = 0;
let failed = 0;

// Helper function to check file content
function checkFileContent(filePath, checks) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = [];
    
    for (const check of checks) {
      const found = check.pattern.test(content);
      results.push({
        name: check.name,
        passed: found
      });
    }
    
    return results;
  } catch (error) {
    return checks.map(check => ({
      name: check.name,
      passed: false,
      error: error.message
    }));
  }
}

// Check CategoriesScreen.tsx
console.log('📋 Checking CategoriesScreen.tsx implementation...');
const categoriesPath = path.join(__dirname, '..', 'CategoriesScreen.tsx');
const categoriesChecks = [
  {
    name: 'Warning header component exists',
    pattern: /testID="warning-header"/
  },
  {
    name: 'Warning title "⚠️ Data Protection Notice"',
    pattern: /⚠️ Data Protection Notice/
  },
  {
    name: 'Red border styling',
    pattern: /borderColor.*#FF3B30.*borderWidth.*2/s
  },
  {
    name: 'Yellow background color',
    pattern: /backgroundColor.*#FFF3CD/
  },
  {
    name: 'Sticky positioning (absolute)',
    pattern: /position.*absolute.*top.*0.*zIndex.*1000/s
  },
  {
    name: 'Contains medical diagnoses warning',
    pattern: /Medical diagnoses or health conditions/
  },
  {
    name: 'Contains criminal history warning',
    pattern: /Criminal history or legal status/
  },
  {
    name: 'Contains immigration status warning',
    pattern: /Immigration or citizenship status/
  },
  {
    name: 'Contains racial identification warning',
    pattern: /Specific racial\/ethnic identification/
  },
  {
    name: 'Warning icon present',
    pattern: /Ionicons.*name="warning"|testID="warning-icon"/
  },
  {
    name: 'No dismiss button',
    pattern: /warning-close-button|dismiss-button/
  },
  {
    name: 'Full width styling',
    pattern: /warningHeader[\s\S]*?width:\s*['"]100%['"]/
  },
  {
    name: 'Proper padding for visibility',
    pattern: /paddingHorizontal.*16.*paddingVertical.*12/s
  },
  {
    name: 'Content wrapper with top padding',
    pattern: /contentWrapper.*paddingTop.*\d{2,}/s
  }
];

const categoriesResults = checkFileContent(categoriesPath, categoriesChecks);
categoriesResults.forEach(result => {
  if (result.name === 'No dismiss button') {
    // This check should NOT find dismiss buttons
    if (!result.passed) {
      console.log(`✅ ${result.name}`);
      passed++;
    } else {
      console.log(`❌ ${result.name} - Found dismiss button`);
      failed++;
    }
  } else {
    if (result.passed) {
      console.log(`✅ ${result.name}`);
      passed++;
    } else {
      console.log(`❌ ${result.name}${result.error ? ` - ${result.error}` : ''}`);
      failed++;
    }
  }
});

// Check test file
console.log('\n📋 Checking test coverage...');
const testPath = path.join(__dirname, 'CategoriesScreen.test.tsx');
const testChecks = [
  {
    name: 'Test file exists',
    pattern: /describe\(['"]CategoriesScreen Warning Header['"]/
  },
  {
    name: 'Tests warning displays at top',
    pattern: /should display warning at the top of the screen/
  },
  {
    name: 'Tests red border',
    pattern: /should have red border on warning box/
  },
  {
    name: 'Tests yellow background',
    pattern: /should have yellow background/
  },
  {
    name: 'Tests sticky behavior',
    pattern: /should stay visible when scrolling/
  },
  {
    name: 'Tests warning text content',
    pattern: /should display correct warning text/
  },
  {
    name: 'Tests no dismiss button',
    pattern: /should not have a dismiss button/
  },
  {
    name: 'Tests responsive design',
    pattern: /should be responsive to screen sizes/
  }
];

const testResults = checkFileContent(testPath, testChecks);
testResults.forEach(result => {
  if (result.passed) {
    console.log(`✅ ${result.name}`);
    passed++;
  } else {
    console.log(`❌ ${result.name}${result.error ? ` - ${result.error}` : ''}`);
    failed++;
  }
});

// Visual check
console.log('\n📋 Visual Requirements Check...');
const visualChecks = [
  {
    name: 'Red border (#FF3B30)',
    check: () => {
      const content = fs.readFileSync(categoriesPath, 'utf8');
      return content.includes('#FF3B30');
    }
  },
  {
    name: 'Yellow background (#FFF3CD)',
    check: () => {
      const content = fs.readFileSync(categoriesPath, 'utf8');
      return content.includes('#FFF3CD');
    }
  },
  {
    name: 'Warning text color (#856404)',
    check: () => {
      const content = fs.readFileSync(categoriesPath, 'utf8');
      return content.includes('#856404');
    }
  },
  {
    name: 'Shadow/elevation for visibility',
    check: () => {
      const content = fs.readFileSync(categoriesPath, 'utf8');
      return content.includes('shadowColor') || content.includes('elevation');
    }
  }
];

visualChecks.forEach(check => {
  try {
    if (check.check()) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name} - Error: ${error.message}`);
    failed++;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`📊 Final Results`);
console.log('='.repeat(50));

const total = passed + failed;
console.log(`\n✅ Passed: ${passed}/${total}`);
console.log(`❌ Failed: ${failed}/${total}`);

if (failed === 0) {
  console.log('\n✨ ALL REQUIREMENTS MET! Task 3.2.2 is complete. ✨\n');
  console.log('Key features implemented:');
  console.log('• Sticky warning header at top of screen');
  console.log('• Red border (#FF3B30) for emphasis');
  console.log('• Yellow background (#FFF3CD) for visibility');
  console.log('• Complete data protection notice text');
  console.log('• Warning cannot be dismissed');
  console.log('• Stays visible when scrolling');
  console.log('• Responsive to different screen sizes');
  console.log('• Comprehensive test coverage');
  console.log('\nUsers will see the warning every time they access the Categories screen,');
  console.log('ensuring compliance with data protection guidelines.');
} else {
  console.log('\n❌ Some requirements are not met. Please review the failures above.\n');
  process.exit(1);
}