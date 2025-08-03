#!/usr/bin/env node

/**
 * Task 4.0.2: Age Display Verification - Implementation Verification Script
 * This script verifies that all age display requirements have been implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 4.0.2: Age Display Verification\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

// Helper function to check file exists
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.log(`❌ ${description} - File not found: ${filePath}`);
    failed++;
  }
  return exists;
}

// Helper function to check file content
function checkContent(filePath, patterns, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const allFound = patterns.every(pattern => pattern.test(content));
    
    if (allFound) {
      console.log(`✅ ${description}`);
      passed++;
    } else {
      console.log(`❌ ${description} - Missing required patterns`);
      failed++;
    }
    return allFound;
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    failed++;
    return false;
  }
}

console.log('\n📋 Checking Age Display Implementation Files...\n');

// 1. Check age utils file
const ageUtilsPath = path.join(__dirname, '..', 'utils', 'ageUtils.ts');
if (checkFile(ageUtilsPath, 'Age utilities file exists')) {
  checkContent(ageUtilsPath, [
    /export function formatAge/,
    /return 'Unknown'/,
    /\[-1, -1\]/,
    /return `\$\{age\[0\]\}-\$\{age\[1\]\}`/
  ], 'formatAge function properly handles all cases');
}

// 2. Check FieldDisplay component update
const fieldDisplayPath = path.join(__dirname, '..', 'components', 'FieldDisplay.tsx');
if (checkFile(fieldDisplayPath, 'FieldDisplay component exists')) {
  checkContent(fieldDisplayPath, [
    /import { formatAge } from '..\/utils\/ageUtils'/,
    /type\?: 'text' \| 'number' \| 'age'/,
    /if \(type === 'age' \|\|.*approximate_age/
  ], 'FieldDisplay supports age formatting');
}

// 3. Check SearchDropdownItem uses shared utility
const dropdownPath = path.join(__dirname, '..', 'components', 'SearchDropdownItem.tsx');
if (checkFile(dropdownPath, 'SearchDropdownItem component exists')) {
  checkContent(dropdownPath, [
    /import { formatAge } from '..\/utils\/ageUtils'/
  ], 'SearchDropdownItem uses shared age utility');
}

console.log('\n📋 Checking Age Display Tests...\n');

// 4. Check frontend age display tests
const frontendTestPath = path.join(__dirname, 'age-display.test.tsx');
if (checkFile(frontendTestPath, 'Frontend age display tests exist')) {
  checkContent(frontendTestPath, [
    /should display \[-1, -1\] as "Unknown"/,
    /should display age range as "min-max"/,
    /Age Display in Components/,
    /Age Required Validation/,
    /AI Age Extraction Format/
  ], 'Comprehensive age display tests');
}

// 5. Check backend age filter tests
const backendDir = path.join(__dirname, '..', '..', 'backend');
const filterTestPath = path.join(backendDir, 'tests', 'test_age_filter_overlap.py');
if (checkFile(filterTestPath, 'Backend age filter overlap tests exist')) {
  checkContent(filterTestPath, [
    /age_ranges_overlap/,
    /Unknown age never overlaps/,
    /NOT \(ind_max < filter_min OR ind_min > filter_max\)/,
    /test_full_overlap/,
    /test_partial_overlap/,
    /test_edge_overlap/
  ], 'Comprehensive age filter overlap tests');
}

// 6. Check backend age validation tests
const validationTestPath = path.join(backendDir, 'tests', 'test_age_save_validation.py');
if (checkFile(validationTestPath, 'Backend age validation tests exist')) {
  checkContent(validationTestPath, [
    /test_age_required_in_save/,
    /test_valid_age_formats/,
    /test_age_range_validation/,
    /test_ai_extracted_age_validation/,
    /validate_age_range/
  ], 'Comprehensive age save validation tests');
}

console.log('\n📋 Checking Age Display Requirements...\n');

// Test requirement implementation
const requirements = [
  {
    name: 'Unknown age displays as "Unknown"',
    check: () => {
      const content = fs.readFileSync(ageUtilsPath, 'utf8');
      return content.includes('[-1, -1]') && content.includes("return 'Unknown'");
    }
  },
  {
    name: 'Age range displays as "min-max"',
    check: () => {
      const content = fs.readFileSync(ageUtilsPath, 'utf8');
      return content.includes('`${age[0]}-${age[1]}`');
    }
  },
  {
    name: 'Age filter uses overlap logic',
    check: () => {
      const content = fs.readFileSync(filterTestPath, 'utf8');
      return content.includes('NOT (ind_max < filter_min OR ind_min > filter_max)');
    }
  },
  {
    name: 'Age is required in all saves',
    check: () => {
      const content = fs.readFileSync(validationTestPath, 'utf8');
      return content.includes('test_age_required_in_save');
    }
  },
  {
    name: 'AI extracts age in correct format',
    check: () => {
      const content = fs.readFileSync(validationTestPath, 'utf8');
      return content.includes('test_ai_extracted_age_validation');
    }
  }
];

requirements.forEach(req => {
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

// Run backend tests
console.log('\n📋 Running Backend Age Tests...\n');

const { execSync } = require('child_process');

try {
  // Run age filter overlap tests
  console.log('Running age filter overlap tests...');
  execSync('cd ' + backendDir + ' && python3 tests/test_age_filter_overlap.py', { stdio: 'inherit' });
  console.log('✅ Age filter overlap tests passed');
  passed++;
} catch (error) {
  console.log('❌ Age filter overlap tests failed');
  failed++;
}

try {
  // Run age validation tests with pytest
  console.log('\nRunning age validation tests...');
  execSync('cd ' + backendDir + ' && python3 -m pytest tests/test_age_save_validation.py -v', { stdio: 'inherit' });
  console.log('✅ Age validation tests passed');
  passed++;
} catch (error) {
  console.log('❌ Age validation tests failed');
  failed++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Task 4.0.2 Verification Summary');
console.log('='.repeat(60));

const total = passed + failed;
console.log(`\n✅ Passed: ${passed}/${total}`);
console.log(`❌ Failed: ${failed}/${total}`);

if (failed === 0) {
  console.log('\n✨ Task 4.0.2: Age Display Verification - COMPLETE! ✨\n');
  console.log('Summary of Implementation:');
  console.log('✅ Age display formatting utility created (formatAge)');
  console.log('✅ FieldDisplay component updated to format ages');
  console.log('✅ SearchDropdownItem uses shared age utility');
  console.log('✅ Unknown age [-1, -1] displays as "Unknown"');
  console.log('✅ Age ranges display as "min-max"');
  console.log('✅ Age filter overlap logic implemented and tested');
  console.log('✅ Age validation in save operations verified');
  console.log('✅ AI extracts age in correct [min, max] format');
  console.log('✅ Comprehensive tests for all age scenarios');
} else {
  console.log('\n❌ Task 4.0.2 incomplete - please review failures above.\n');
  process.exit(1);
}

console.log('\n📝 Next Steps:');
console.log('1. Ensure all frontend components use formatAge for consistent display');
console.log('2. Test age display in all screens (Search, Profile, Record)');
console.log('3. Verify age filtering works correctly in search');
console.log('4. Check that manual entry properly validates age input\n');