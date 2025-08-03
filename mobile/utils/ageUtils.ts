/**
 * Age utility functions for consistent age display across the app
 */

/**
 * Formats age array for display
 * @param age - Age array [min, max] or null
 * @returns Formatted age string
 */
export function formatAge(age: [number, number] | number[] | null | undefined): string {
  if (!age || !Array.isArray(age) || age.length !== 2) {
    return 'Unknown';
  }

  // Check for unknown age marker
  if (age[0] === -1 || age[1] === -1) {
    return 'Unknown';
  }

  // Single age (same min and max)
  if (age[0] === age[1]) {
    return age[0].toString();
  }

  // Age range
  return `${age[0]}-${age[1]}`;
}

/**
 * Validates if an age range is valid
 * @param age - Age array to validate
 * @returns true if valid, false otherwise
 */
export function isValidAgeRange(age: any): age is [number, number] {
  if (!Array.isArray(age) || age.length !== 2) return false;
  
  // Unknown age is valid
  if (age[0] === -1 && age[1] === -1) return true;
  
  // Partial unknown is invalid
  if (age[0] === -1 || age[1] === -1) return false;
  
  // Check range validity
  if (age[0] < 0 || age[1] > 120) return false;
  if (age[0] > age[1]) return false;
  
  return true;
}

/**
 * Checks if two age ranges overlap
 * @param indAge - Individual's age range [min, max]
 * @param filterMin - Filter minimum age
 * @param filterMax - Filter maximum age
 * @returns true if ranges overlap, false otherwise
 */
export function ageRangesOverlap(
  indAge: [number, number], 
  filterMin: number, 
  filterMax: number
): boolean {
  // Unknown age never overlaps
  if (indAge[0] === -1 || indAge[1] === -1) return false;
  
  // Overlap logic: NOT (ind_max < filter_min OR ind_min > filter_max)
  return !(indAge[1] < filterMin || indAge[0] > filterMax);
}

/**
 * Parses age from various input formats
 * @param value - Age value from different sources
 * @returns Normalized age array or null
 */
export function parseAge(value: any): [number, number] | null {
  if (!value) return null;

  // Already in correct format
  if (Array.isArray(value) && value.length === 2) {
    if (typeof value[0] === 'number' && typeof value[1] === 'number') {
      return value as [number, number];
    }
  }

  // Single number
  if (typeof value === 'number') {
    return [value, value];
  }

  // String representation
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'unknown') {
      return [-1, -1];
    }
    
    // Try to parse range (e.g., "45-50")
    const rangeMatch = value.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      return [parseInt(rangeMatch[1]), parseInt(rangeMatch[2])];
    }
    
    // Try to parse single number
    const singleMatch = value.match(/^(\d+)$/);
    if (singleMatch) {
      const age = parseInt(singleMatch[1]);
      return [age, age];
    }
  }

  return null;
}

/**
 * Formats age for API submission
 * @param ageString - Age string from form input
 * @returns Age array for API
 */
export function formatAgeForAPI(ageString: string): [number, number] | null {
  if (!ageString || ageString.trim() === '') {
    return null;
  }

  const trimmed = ageString.trim().toLowerCase();
  
  if (trimmed === 'unknown' || trimmed === '') {
    return [-1, -1];
  }

  // Handle range input like "45-50"
  const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]);
    const max = parseInt(rangeMatch[2]);
    if (min <= max && min >= 0 && max <= 120) {
      return [min, max];
    }
  }

  // Handle single age
  const singleMatch = trimmed.match(/^(\d+)$/);
  if (singleMatch) {
    const age = parseInt(singleMatch[1]);
    if (age >= 0 && age <= 120) {
      return [age, age];
    }
  }

  return null;
}