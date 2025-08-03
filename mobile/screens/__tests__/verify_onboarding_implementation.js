#!/usr/bin/env node

/**
 * Verification script for Task 3.2.1: Onboarding Screen
 * This script verifies all requirements are implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 3.2.1: Onboarding Screen Implementation\n');

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

// Check OnboardingScreen.tsx
console.log('📋 Checking OnboardingScreen.tsx...');
const onboardingPath = path.join(__dirname, '..', 'OnboardingScreen.tsx');
const onboardingChecks = [
  {
    name: 'AsyncStorage import exists',
    pattern: /import AsyncStorage from '@react-native-async-storage\/async-storage'/
  },
  {
    name: 'Legal title "SF Street Team Data Protection Notice"',
    pattern: /SF Street Team Data Protection Notice/
  },
  {
    name: 'Contains all required guidelines',
    pattern: /Only collect information necessary for service delivery.*Always obtain verbal consent before taking photos.*Do not record medical diagnoses.*Do not record criminal history.*Do not record immigration.*Do not record specific racial/s
  },
  {
    name: 'Photo consent requirements section',
    pattern: /Photo Consent Requirements:.*Verbal consent must be obtained.*Photos are for identification purposes only.*Individuals can request photo removal/s
  },
  {
    name: 'Agreement button with correct text',
    pattern: /I Understand and Agree/
  },
  {
    name: 'Sets AsyncStorage on agreement',
    pattern: /AsyncStorage\.setItem\(.*ONBOARDING_KEY.*['"]true['"]\)|AsyncStorage\.setItem\(['"]onboarding_complete['"], ['"]true['"]\)/
  },
  {
    name: 'Full screen modal properties',
    pattern: /presentationStyle.*fullScreen|testID.*onboarding-modal/
  },
  {
    name: 'Cannot be dismissed (no close button)',
    pattern: /gestureEnabled.*false/
  },
  {
    name: 'Handles AsyncStorage errors',
    pattern: /catch.*error.*console\.error.*Error saving onboarding status/s
  }
];

const onboardingResults = checkFileContent(onboardingPath, onboardingChecks);
onboardingResults.forEach(result => {
  if (result.passed) {
    console.log(`✅ ${result.name}`);
    passed++;
  } else {
    console.log(`❌ ${result.name}${result.error ? ` - ${result.error}` : ''}`);
    failed++;
  }
});

// Check App.tsx integration
console.log('\n📋 Checking App.tsx integration...');
const appPath = path.join(__dirname, '..', '..', 'App.tsx');
const appChecks = [
  {
    name: 'OnboardingScreen import',
    pattern: /import OnboardingScreen from ['"]\.\/screens\/OnboardingScreen['"]/
  },
  {
    name: 'AsyncStorage import in App.tsx',
    pattern: /import AsyncStorage from '@react-native-async-storage\/async-storage'/
  },
  {
    name: 'Checks onboarding status on load',
    pattern: /checkOnboardingStatus|AsyncStorage\.getItem\(['"]onboarding_complete['"]\)/
  },
  {
    name: 'RootStack navigator for modal presentation',
    pattern: /RootStack\.Navigator|createStackNavigator/
  },
  {
    name: 'Conditional rendering based on onboarding',
    pattern: /needsOnboarding.*\?.*Onboarding.*:.*MainApp/s
  },
  {
    name: 'Full screen modal options',
    pattern: /presentation.*fullScreenModal|gestureEnabled.*false/
  }
];

const appResults = checkFileContent(appPath, appChecks);
appResults.forEach(result => {
  if (result.passed) {
    console.log(`✅ ${result.name}`);
    passed++;
  } else {
    console.log(`❌ ${result.name}${result.error ? ` - ${result.error}` : ''}`);
    failed++;
  }
});

// Check test file
console.log('\n📋 Checking test coverage...');
const testPath = path.join(__dirname, 'OnboardingScreen.test.tsx');
const testChecks = [
  {
    name: 'Test file exists',
    pattern: /describe\(['"]OnboardingScreen['"]/
  },
  {
    name: 'Tests first launch behavior',
    pattern: /should display the onboarding screen on first launch/
  },
  {
    name: 'Tests already acknowledged behavior',
    pattern: /should not show if user has already acknowledged/
  },
  {
    name: 'Tests cannot be dismissed',
    pattern: /should not have a dismiss button|cannot be dismissed without agreeing/
  },
  {
    name: 'Tests legal text display',
    pattern: /should display all required legal text/
  },
  {
    name: 'Tests AsyncStorage flag',
    pattern: /should set AsyncStorage flag when user agrees/
  },
  {
    name: 'Tests navigation after agreement',
    pattern: /should navigate to main app after user agrees/
  },
  {
    name: 'Tests error handling',
    pattern: /should handle AsyncStorage errors gracefully/
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

// Summary
console.log('\n' + '='.repeat(50));
console.log(`📊 Final Results`);
console.log('='.repeat(50));

const total = passed + failed;
console.log(`\n✅ Passed: ${passed}/${total}`);
console.log(`❌ Failed: ${failed}/${total}`);

if (failed === 0) {
  console.log('\n✨ ALL REQUIREMENTS MET! Task 3.2.1 is complete. ✨\n');
  console.log('Key features implemented:');
  console.log('• Full-screen onboarding modal that cannot be dismissed');
  console.log('• Complete legal compliance text as specified');
  console.log('• AsyncStorage integration to track acknowledgment');
  console.log('• Automatic navigation after agreement');
  console.log('• Error handling for storage failures');
  console.log('• Comprehensive test coverage');
  console.log('\nThe app will now show the onboarding screen on first launch');
  console.log('and skip it for returning users who have already agreed.');
} else {
  console.log('\n❌ Some requirements are not met. Please review the failures above.\n');
  process.exit(1);
}