import React from 'react';
import { render, fireEvent, waitFor, within } from '@testing-library/react-native';
import { ScrollView } from 'react-native';
import CategoriesScreen from '../CategoriesScreen';

// Mock the API
jest.mock('../../services/api', () => ({
  api: {
    exportCSV: jest.fn().mockResolvedValue('mock-csv-url'),
  },
}));

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('CategoriesScreen Warning Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Warning displays at top of screen
  it('should display warning at the top of the screen', () => {
    const { getByTestId, getByText } = render(<CategoriesScreen />);
    
    const warningHeader = getByTestId('warning-header');
    expect(warningHeader).toBeTruthy();
    
    // Check that warning appears before other content
    const allTexts = getByTestId('categories-screen').children;
    expect(allTexts[0].props.testID).toBe('warning-header');
  });

  // Test 2: Warning has red border
  it('should have red border on warning box', () => {
    const { getByTestId } = render(<CategoriesScreen />);
    
    const warningHeader = getByTestId('warning-header');
    const styles = warningHeader.props.style;
    
    // Check for red border
    expect(styles).toMatchObject({
      borderColor: '#FF3B30',
      borderWidth: 2,
    });
  });

  // Test 3: Warning has yellow background
  it('should have yellow background', () => {
    const { getByTestId } = render(<CategoriesScreen />);
    
    const warningHeader = getByTestId('warning-header');
    const styles = warningHeader.props.style;
    
    expect(styles).toMatchObject({
      backgroundColor: '#FFF3CD',
    });
  });

  // Test 4: Warning stays visible when scrolling (sticky)
  it('should stay visible when scrolling (sticky header)', () => {
    const { getByTestId } = render(<CategoriesScreen />);
    
    const scrollView = getByTestId('categories-scroll-view');
    const warningHeader = getByTestId('warning-header');
    
    // Check that warning is positioned as sticky
    expect(warningHeader.props.style).toMatchObject({
      position: 'absolute',
      top: 0,
      zIndex: 1000,
    });
  });

  // Test 5: Warning text matches requirements
  it('should display correct warning text', () => {
    const { getByText } = render(<CategoriesScreen />);
    
    // Check main title
    expect(getByText('⚠️ Data Protection Notice')).toBeTruthy();
    
    // Check warning items
    expect(getByText('Do not create categories for:')).toBeTruthy();
    expect(getByText(/Medical diagnoses or health conditions/)).toBeTruthy();
    expect(getByText(/Criminal history or legal status/)).toBeTruthy();
    expect(getByText(/Immigration or citizenship status/)).toBeTruthy();
    expect(getByText(/Specific racial\/ethnic identification/)).toBeTruthy();
  });

  // Test 6: No dismiss button on warning
  it('should not have a dismiss button', () => {
    const { queryByTestId, queryByText } = render(<CategoriesScreen />);
    
    // Check that there's no close/dismiss button
    expect(queryByTestId('warning-close-button')).toBeNull();
    expect(queryByTestId('dismiss-button')).toBeNull();
    expect(queryByText('×')).toBeNull();
    expect(queryByText('Close')).toBeNull();
    expect(queryByText('Dismiss')).toBeNull();
  });

  // Test 7: Warning responsive to screen sizes
  it('should be responsive to screen sizes', () => {
    const { getByTestId } = render(<CategoriesScreen />);
    
    const warningHeader = getByTestId('warning-header');
    const styles = warningHeader.props.style;
    
    // Check that it uses full width
    expect(styles).toMatchObject({
      width: '100%',
      left: 0,
      right: 0,
    });
    
    // Check padding is reasonable
    expect(styles.paddingHorizontal).toBeGreaterThanOrEqual(16);
    expect(styles.paddingVertical).toBeGreaterThanOrEqual(12);
  });

  // Additional test: Warning icon is visible
  it('should display warning icon', () => {
    const { getByTestId } = render(<CategoriesScreen />);
    
    const warningIcon = getByTestId('warning-icon');
    expect(warningIcon).toBeTruthy();
    expect(warningIcon.props.name).toBe('warning');
  });

  // Additional test: Warning text styling
  it('should have proper text styling for visibility', () => {
    const { getByTestId } = render(<CategoriesScreen />);
    
    const warningTitle = getByTestId('warning-title');
    const titleStyles = warningTitle.props.style;
    
    // Title should be prominent
    expect(titleStyles).toMatchObject({
      fontSize: expect.any(Number),
      fontWeight: expect.stringMatching(/600|bold|700/),
      color: expect.stringMatching(/#[A-F0-9]{6}|#[A-F0-9]{3}/i),
    });
    expect(titleStyles.fontSize).toBeGreaterThanOrEqual(16);
  });

  // Additional test: Content padding adjustment
  it('should adjust content padding to account for sticky header', () => {
    const { getByTestId } = render(<CategoriesScreen />);
    
    const scrollContent = getByTestId('scroll-content');
    const contentStyles = scrollContent.props.style;
    
    // Content should have top padding to avoid being hidden under warning
    expect(contentStyles.paddingTop).toBeGreaterThanOrEqual(80);
  });
});