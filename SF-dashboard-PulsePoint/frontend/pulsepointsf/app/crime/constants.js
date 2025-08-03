/**
 * ==================================================================================
 * Crime Dashboard Constants
 * ==================================================================================
 *
 * Shared constants used across the crime dashboard components
 */

// DataSF API Configuration
export const DATASF_API_URL = 'https://data.sfgov.org/resource/wg3w-h783.json';
export const FETCH_LIMIT = 5000;
export const API_QUERY = `${DATASF_API_URL}?$limit=${FETCH_LIMIT}&$where=latitude IS NOT NULL AND longitude IS NOT NULL`;

// Color schemes for different incident categories
export const CATEGORY_COLORS = {
  'Assault': '#ef4444',
  'Burglary': '#f97316',
  'Larceny Theft': '#eab308',
  'Motor Vehicle Theft': '#8b5cf6',
  'Robbery': '#dc2626',
  'Vandalism': '#06b6d4',
  'Drug Offense': '#10b981',
  'Fraud': '#f59e0b',
  'Arson': '#e11d48',
  'Weapon Laws': '#7c2d12'
};

// Crime category groupings for the explorer
export const CRIME_CATEGORIES = {
  violent: [
    'Assault', 'Homicide', 'Robbery', 'Rape', 'Human Trafficking (A), Commercial Sex Acts',
    'Human Trafficking (B), Involuntary Servitude', 'Sex Offenses', 'Weapons Offense',
    'Weapons Carrying Etc', 'Kidnapping'
  ],
  property: [
    'Larceny Theft', 'Burglary', 'Motor Vehicle Theft', 'Arson', 'Vandalism',
    'Stolen Property', 'Embezzlement', 'Fraud', 'Forgery And Counterfeiting',
    'Recovered Vehicle', 'Vehicle Impounded', 'Vehicle Misplaced'
  ],
  drug: [
    'Drug Offense', 'Liquor Laws'
  ],
  publicOrder: [
    'Disorderly Conduct', 'Warrant', 'Traffic Violation Arrest', 'Traffic Collision',
    'Suspicious Occ', 'Prostitution', 'Gambling', 'Family Offenses',
    'Offences Against The Family And Children', 'Civil Sidewalks'
  ]
};

// Chart colors
export const CHART_COLORS = ['#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

// Pagination settings
export const INITIAL_VISIBLE_ITEMS = 20;
export const ITEMS_PER_LOAD = 20;
export const SCROLL_THRESHOLD = 0.8;

// Year-over-Year Comparison Settings
export const MONTHS = [
  { value: 1, label: 'January', short: 'Jan' },
  { value: 2, label: 'February', short: 'Feb' },
  { value: 3, label: 'March', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'May', short: 'May' },
  { value: 6, label: 'June', short: 'Jun' },
  { value: 7, label: 'July', short: 'Jul' },
  { value: 8, label: 'August', short: 'Aug' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'October', short: 'Oct' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'December', short: 'Dec' }
];

export const DEFAULT_COMPARISON_MONTH = 7; // July
export const COMPARISON_YEARS = {
  current: 2025,
  previous: 2024
};

// Chart colors for year comparison
export const YEAR_COMPARISON_COLORS = {
  current: '#3b82f6', // Blue for 2025
  previous: '#6b7280'  // Gray for 2024
};
