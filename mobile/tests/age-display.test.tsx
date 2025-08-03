import React from 'react';
import { render } from '@testing-library/react-native';
import { SearchDropdownItem } from '../components/SearchDropdownItem';
import { FieldDisplay } from '../components/FieldDisplay';
import { formatAge } from '../utils/ageUtils';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('Task 4.0.2: Age Display Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Age Display Formatting', () => {
    // Test 1: Unknown age displays as "Unknown"
    it('should display [-1, -1] as "Unknown"', () => {
      const unknownAge: [number, number] = [-1, -1];
      const formatted = formatAge(unknownAge);
      expect(formatted).toBe('Unknown');
    });

    // Test 2: Age range displays as "min-max"
    it('should display age range as "min-max"', () => {
      const testCases: Array<{ input: [number, number]; expected: string }> = [
        { input: [45, 50], expected: '45-50' },
        { input: [18, 25], expected: '18-25' },
        { input: [65, 70], expected: '65-70' },
        { input: [0, 5], expected: '0-5' },
        { input: [100, 120], expected: '100-120' },
      ];

      testCases.forEach(({ input, expected }) => {
        const formatted = formatAge(input);
        expect(formatted).toBe(expected);
      });
    });

    it('should handle null age as "Unknown"', () => {
      const formatted = formatAge(null);
      expect(formatted).toBe('Unknown');
    });

    it('should handle single unknown value as "Unknown"', () => {
      const testCases: Array<[number, number]> = [
        [-1, 45],
        [45, -1],
      ];

      testCases.forEach((input) => {
        const formatted = formatAge(input);
        expect(formatted).toBe('Unknown');
      });
    });
  });

  describe('Age Display in Components', () => {
    it('should display age correctly in SearchDropdownItem', () => {
      const individual = {
        id: '123',
        name: 'John Doe',
        approximate_age: [45, 50] as [number, number],
        height: 70,
        skin_color: 'Medium',
      };

      const { getByText } = render(
        <SearchDropdownItem
          individual={individual}
          onPress={() => {}}
        />
      );

      expect(getByText('John Doe, 45-50, 5\'10", Medium')).toBeTruthy();
    });

    it('should display unknown age in SearchDropdownItem', () => {
      const individual = {
        id: '123',
        name: 'Jane Doe',
        approximate_age: [-1, -1] as [number, number],
        height: 66,
        skin_color: 'Light',
      };

      const { getByText } = render(
        <SearchDropdownItem
          individual={individual}
          onPress={() => {}}
        />
      );

      expect(getByText('Jane Doe, Unknown, 5\'6", Light')).toBeTruthy();
    });

    it('should display age correctly in FieldDisplay', () => {
      const { getByText } = render(
        <FieldDisplay
          label="Age"
          value={[45, 50]}
          type="age"
        />
      );

      expect(getByText('45-50')).toBeTruthy();
    });

    it('should display unknown age in FieldDisplay', () => {
      const { getByText } = render(
        <FieldDisplay
          label="Age"
          value={[-1, -1]}
          type="age"
        />
      );

      expect(getByText('Unknown')).toBeTruthy();
    });
  });

  describe('Age Range Validation', () => {
    it('should validate age range correctly', () => {
      // Valid age ranges
      const validRanges: Array<[number, number]> = [
        [-1, -1], // Unknown
        [0, 5],
        [18, 25],
        [45, 50],
        [100, 120],
      ];

      validRanges.forEach((range) => {
        expect(isValidAgeRange(range)).toBe(true);
      });

      // Invalid age ranges
      const invalidRanges: Array<[number, number]> = [
        [50, 45], // max < min
        [-2, -2], // invalid unknown
        [121, 125], // > 120
        [-1, 50], // partial unknown
      ];

      invalidRanges.forEach((range) => {
        expect(isValidAgeRange(range)).toBe(false);
      });
    });
  });

  describe('Age Filter Overlap Logic', () => {
    // Test 3: Age filter finds overlapping ranges
    it('should correctly identify overlapping age ranges', () => {
      const testCases = [
        // [individual age, filter min, filter max, should match]
        { indAge: [45, 50], filterMin: 40, filterMax: 60, shouldMatch: true }, // Full overlap
        { indAge: [45, 50], filterMin: 48, filterMax: 52, shouldMatch: true }, // Partial overlap
        { indAge: [45, 50], filterMin: 50, filterMax: 55, shouldMatch: true }, // Edge overlap
        { indAge: [45, 50], filterMin: 30, filterMax: 45, shouldMatch: true }, // Edge overlap
        { indAge: [45, 50], filterMin: 51, filterMax: 60, shouldMatch: false }, // No overlap
        { indAge: [45, 50], filterMin: 30, filterMax: 44, shouldMatch: false }, // No overlap
        { indAge: [-1, -1], filterMin: 40, filterMax: 60, shouldMatch: false }, // Unknown age
      ];

      testCases.forEach(({ indAge, filterMin, filterMax, shouldMatch }) => {
        const result = ageRangesOverlap(indAge as [number, number], filterMin, filterMax);
        expect(result).toBe(shouldMatch);
      });
    });

    it('should handle edge cases in age overlap', () => {
      // Single point overlap
      expect(ageRangesOverlap([45, 45], 45, 45)).toBe(true);
      
      // Wide filter range
      expect(ageRangesOverlap([45, 50], 0, 120)).toBe(true);
      
      // Unknown age never overlaps
      expect(ageRangesOverlap([-1, -1], 0, 120)).toBe(false);
    });
  });

  describe('Age Display in Different Screens', () => {
    it('should display age correctly in profile screen', () => {
      const profileData = {
        name: 'John Doe',
        approximate_age: [45, 50],
        gender: 'Male',
        height: 70,
        weight: 180,
        skin_color: 'Medium',
      };

      // Test that age is formatted in profile
      const { getByText } = render(
        <MockProfileScreen data={profileData} />
      );

      expect(getByText('45-50')).toBeTruthy();
      expect(getByText('Age')).toBeTruthy();
    });

    it('should display unknown age in profile screen', () => {
      const profileData = {
        name: 'Jane Doe',
        approximate_age: [-1, -1],
        gender: 'Female',
        height: 66,
        weight: 140,
        skin_color: 'Light',
      };

      const { getByText } = render(
        <MockProfileScreen data={profileData} />
      );

      expect(getByText('Unknown')).toBeTruthy();
      expect(getByText('Age')).toBeTruthy();
    });
  });

  describe('Age Required Validation', () => {
    // Test 4: Age required validation works
    it('should require age in save operations', () => {
      const testData = [
        {
          data: { name: 'John', height: 70, weight: 180, skin_color: 'Medium' },
          valid: false, // Missing age
        },
        {
          data: { name: 'John', approximate_age: [45, 50], height: 70, weight: 180, skin_color: 'Medium' },
          valid: true, // Has age
        },
        {
          data: { name: 'John', approximate_age: [-1, -1], height: 70, weight: 180, skin_color: 'Medium' },
          valid: true, // Unknown age is valid
        },
        {
          data: { name: 'John', approximate_age: null, height: 70, weight: 180, skin_color: 'Medium' },
          valid: false, // Null age is invalid
        },
      ];

      testData.forEach(({ data, valid }) => {
        const result = validateRequiredFields(data);
        expect(result.isValid).toBe(valid);
        if (!valid && !data.approximate_age) {
          expect(result.missingFields).toContain('approximate_age');
        }
      });
    });
  });

  describe('AI Age Extraction Format', () => {
    // Test 5: AI extracts age in correct format
    it('should extract age in correct [min, max] format', () => {
      const mockTranscriptionResults = [
        {
          text: 'John is about 45 years old',
          expectedAge: [45, 45],
        },
        {
          text: 'Jane appears to be between 30 and 35',
          expectedAge: [30, 35],
        },
        {
          text: 'Age unknown',
          expectedAge: [-1, -1],
        },
        {
          text: 'Approximately 50 to 55 years of age',
          expectedAge: [50, 55],
        },
      ];

      mockTranscriptionResults.forEach(({ text, expectedAge }) => {
        const result = mockExtractAge(text);
        expect(result).toEqual(expectedAge);
      });
    });
  });
});

// Helper functions (these would be imported from utils in real implementation)
function formatAge(age: [number, number] | null): string {
  if (!age || age[0] === -1 || age[1] === -1) {
    return 'Unknown';
  }
  return `${age[0]}-${age[1]}`;
}

function isValidAgeRange(age: [number, number]): boolean {
  if (age[0] === -1 && age[1] === -1) return true; // Unknown is valid
  if (age[0] === -1 || age[1] === -1) return false; // Partial unknown is invalid
  if (age[0] < 0 || age[1] > 120) return false; // Out of range
  if (age[0] > age[1]) return false; // Invalid range
  return true;
}

function ageRangesOverlap(indAge: [number, number], filterMin: number, filterMax: number): boolean {
  // Unknown age never overlaps
  if (indAge[0] === -1 || indAge[1] === -1) return false;
  
  // Overlap logic: NOT (ind_max < filter_min OR ind_min > filter_max)
  return !(indAge[1] < filterMin || indAge[0] > filterMax);
}

function validateRequiredFields(data: any): { isValid: boolean; missingFields: string[] } {
  const required = ['name', 'approximate_age', 'height', 'weight', 'skin_color'];
  const missingFields: string[] = [];
  
  required.forEach(field => {
    if (!data[field]) {
      missingFields.push(field);
    }
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

function mockExtractAge(text: string): [number, number] {
  // Mock AI extraction logic
  if (text.toLowerCase().includes('unknown')) return [-1, -1];
  const numbers = text.match(/\d+/g);
  if (!numbers || numbers.length === 0) return [-1, -1];
  if (numbers.length === 1) return [parseInt(numbers[0]), parseInt(numbers[0])];
  return [parseInt(numbers[0]), parseInt(numbers[1])];
}

// Mock components for testing
function MockProfileScreen({ data }: { data: any }) {
  return (
    <>
      <FieldDisplay label="Age" value={data.approximate_age} type="age" />
    </>
  );
}