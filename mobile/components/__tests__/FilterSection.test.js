import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FilterSection from '../FilterSection';

// Mock the slider component
jest.mock('@react-native-community/slider', () => 'Slider');

describe('FilterSection Component', () => {
  const mockOnFiltersChange = jest.fn();
  const mockOnClearAll = jest.fn();

  const defaultProps = {
    onFiltersChange: mockOnFiltersChange,
    onClearAll: mockOnClearAll,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Filter section collapsed on load
  test('filter section is collapsed by default', () => {
    const { queryByTestId } = render(<FilterSection {...defaultProps} />);
    
    // Collapsed header should be visible
    expect(queryByTestId('filter-header-collapsed')).toBeTruthy();
    
    // Expanded content should not be visible
    expect(queryByTestId('filter-content-expanded')).toBeNull();
  });

  // Test 2: Smooth expand/collapse animation
  test('expands and collapses with animation when tapped', async () => {
    const { getByTestId, queryByTestId } = render(<FilterSection {...defaultProps} />);
    
    const header = getByTestId('filter-header-collapsed');
    
    // Tap to expand
    fireEvent.press(header);
    
    await waitFor(() => {
      expect(queryByTestId('filter-content-expanded')).toBeTruthy();
      expect(queryByTestId('filter-header-collapsed')).toBeNull();
    });
    
    // Tap to collapse
    const expandedHeader = getByTestId('filter-header-expanded');
    fireEvent.press(expandedHeader);
    
    await waitFor(() => {
      expect(queryByTestId('filter-header-collapsed')).toBeTruthy();
      expect(queryByTestId('filter-content-expanded')).toBeNull();
    });
  });

  // Test 3: All filter types render correctly
  test('renders all filter types when expanded', async () => {
    const { getByTestId, getByText } = render(<FilterSection {...defaultProps} />);
    
    // Expand filters
    fireEvent.press(getByTestId('filter-header-collapsed'));
    
    await waitFor(() => {
      // Gender checkboxes
      expect(getByText('Gender')).toBeTruthy();
      expect(getByTestId('gender-checkbox-Male')).toBeTruthy();
      expect(getByTestId('gender-checkbox-Female')).toBeTruthy();
      expect(getByTestId('gender-checkbox-Other')).toBeTruthy();
      expect(getByTestId('gender-checkbox-Unknown')).toBeTruthy();
      
      // Age range slider
      expect(getByText('Age Range')).toBeTruthy();
      expect(getByTestId('age-slider-min')).toBeTruthy();
      expect(getByTestId('age-slider-max')).toBeTruthy();
      
      // Height inputs
      expect(getByText('Height Range')).toBeTruthy();
      expect(getByTestId('height-input-min')).toBeTruthy();
      expect(getByTestId('height-input-max')).toBeTruthy();
      
      // Danger score slider
      expect(getByText('Danger Score')).toBeTruthy();
      expect(getByTestId('danger-slider-min')).toBeTruthy();
      expect(getByTestId('danger-slider-max')).toBeTruthy();
      
      // Has photo options
      expect(getByText('Has Photo')).toBeTruthy();
      expect(getByTestId('photo-option-any')).toBeTruthy();
      expect(getByTestId('photo-option-yes')).toBeTruthy();
      expect(getByTestId('photo-option-no')).toBeTruthy();
    });
  });

  // Test 4: Active filters show as tags
  test('shows active filters as removable tags', async () => {
    const { getByTestId, getByText, queryByTestId } = render(<FilterSection {...defaultProps} />);
    
    // Expand filters
    fireEvent.press(getByTestId('filter-header-collapsed'));
    
    await waitFor(() => {
      expect(getByTestId('filter-content-expanded')).toBeTruthy();
    });
    
    // Apply some filters
    fireEvent.press(getByTestId('gender-checkbox-Male'));
    fireEvent.changeText(getByTestId('height-input-min'), '60');
    
    // Check filter tags appear
    await waitFor(() => {
      expect(getByTestId('filter-tag-gender-Male')).toBeTruthy();
      expect(getByTestId('filter-tag-height')).toBeTruthy();
      expect(getByText('Height: 60+"')).toBeTruthy();
    });
  });

  // Test 5: Remove individual filter tag
  test('removes individual filter when tag is tapped', async () => {
    const { getByTestId, queryByTestId } = render(<FilterSection {...defaultProps} />);
    
    // Expand and apply filters
    fireEvent.press(getByTestId('filter-header-collapsed'));
    
    await waitFor(() => {
      fireEvent.press(getByTestId('gender-checkbox-Male'));
      fireEvent.press(getByTestId('gender-checkbox-Female'));
    });
    
    // Verify tags exist
    expect(getByTestId('filter-tag-gender-Male')).toBeTruthy();
    expect(getByTestId('filter-tag-gender-Female')).toBeTruthy();
    
    // Remove Male tag
    const maleTagRemove = getByTestId('filter-tag-remove-gender-Male');
    fireEvent.press(maleTagRemove);
    
    await waitFor(() => {
      expect(queryByTestId('filter-tag-gender-Male')).toBeNull();
      expect(getByTestId('filter-tag-gender-Female')).toBeTruthy();
    });
    
    // Verify checkbox is unchecked
    expect(getByTestId('gender-checkbox-Male').props.accessibilityState.checked).toBe(false);
  });

  // Test 6: Clear all filters button works
  test('clear all button removes all filters', async () => {
    const { getByTestId, queryByTestId, getByText } = render(<FilterSection {...defaultProps} />);
    
    // Expand and apply multiple filters
    fireEvent.press(getByTestId('filter-header-collapsed'));
    
    await waitFor(() => {
      fireEvent.press(getByTestId('gender-checkbox-Male'));
      fireEvent.changeText(getByTestId('height-input-min'), '65');
      fireEvent(getByTestId('danger-slider-min'), 'onValueChange', 25);
    });
    
    // Verify filters are applied
    expect(getByTestId('filter-tag-gender-Male')).toBeTruthy();
    expect(getByTestId('filter-tag-height')).toBeTruthy();
    expect(getByTestId('filter-tag-danger')).toBeTruthy();
    
    // Clear all
    fireEvent.press(getByTestId('clear-all-button'));
    
    await waitFor(() => {
      expect(queryByTestId('filter-tag-gender-Male')).toBeNull();
      expect(queryByTestId('filter-tag-height')).toBeNull();
      expect(queryByTestId('filter-tag-danger')).toBeNull();
    });
    
    // Verify callback
    expect(mockOnClearAll).toHaveBeenCalled();
  });

  // Test 7: Filter count updates correctly
  test('filter count badge shows correct number of active filters', async () => {
    const { getByTestId, getByText } = render(<FilterSection {...defaultProps} />);
    
    // Initially no badge
    expect(queryByTestId('filter-count-badge')).toBeNull();
    
    // Expand and apply filters
    fireEvent.press(getByTestId('filter-header-collapsed'));
    
    await waitFor(() => {
      fireEvent.press(getByTestId('gender-checkbox-Male'));
      fireEvent.press(getByTestId('gender-checkbox-Female'));
      fireEvent.changeText(getByTestId('height-input-min'), '60');
    });
    
    // Collapse to see badge
    fireEvent.press(getByTestId('filter-header-expanded'));
    
    await waitFor(() => {
      const badge = getByTestId('filter-count-badge');
      expect(badge).toBeTruthy();
      expect(getByText('3')).toBeTruthy(); // 2 gender + 1 height filter
    });
  });

  // Test 8: Filters persist during collapse/expand
  test('filters persist when section is collapsed and expanded', async () => {
    const { getByTestId } = render(<FilterSection {...defaultProps} />);
    
    // Expand and apply filters
    fireEvent.press(getByTestId('filter-header-collapsed'));
    
    await waitFor(() => {
      fireEvent.press(getByTestId('gender-checkbox-Male'));
      fireEvent.changeText(getByTestId('height-input-min'), '72');
      fireEvent(getByTestId('age-slider-min'), 'onValueChange', 30);
    });
    
    // Collapse
    fireEvent.press(getByTestId('filter-header-expanded'));
    
    await waitFor(() => {
      expect(getByTestId('filter-header-collapsed')).toBeTruthy();
    });
    
    // Expand again
    fireEvent.press(getByTestId('filter-header-collapsed'));
    
    await waitFor(() => {
      // Verify filters are still applied
      expect(getByTestId('gender-checkbox-Male').props.accessibilityState.checked).toBe(true);
      expect(getByTestId('height-input-min').props.value).toBe('72');
      expect(getByTestId('age-value-min').props.children).toContain('30');
    });
  });

  // Test 9: Age slider shows numeric values
  test('age range slider displays numeric values', async () => {
    const { getByTestId } = render(<FilterSection {...defaultProps} />);
    
    // Expand filters
    fireEvent.press(getByTestId('filter-header-collapsed'));
    
    await waitFor(() => {
      expect(getByTestId('filter-content-expanded')).toBeTruthy();
    });
    
    // Check default values
    expect(getByTestId('age-value-min').props.children).toBe('Any');
    expect(getByTestId('age-value-max').props.children).toBe('Any');
    
    // Change age range
    fireEvent(getByTestId('age-slider-min'), 'onValueChange', 25);
    fireEvent(getByTestId('age-slider-max'), 'onValueChange', 45);
    
    // Verify numeric display
    expect(getByTestId('age-value-min').props.children).toBe('25');
    expect(getByTestId('age-value-max').props.children).toBe('45');
  });

  // Additional test: Gender multi-select behavior
  test('gender checkboxes allow multiple selections', async () => {
    const { getByTestId } = render(<FilterSection {...defaultProps} />);
    
    // Expand filters
    fireEvent.press(getByTestId('filter-header-collapsed'));
    
    await waitFor(() => {
      // Select multiple genders
      fireEvent.press(getByTestId('gender-checkbox-Male'));
      fireEvent.press(getByTestId('gender-checkbox-Female'));
      fireEvent.press(getByTestId('gender-checkbox-Other'));
    });
    
    // Verify all are selected
    expect(getByTestId('gender-checkbox-Male').props.accessibilityState.checked).toBe(true);
    expect(getByTestId('gender-checkbox-Female').props.accessibilityState.checked).toBe(true);
    expect(getByTestId('gender-checkbox-Other').props.accessibilityState.checked).toBe(true);
    expect(getByTestId('gender-checkbox-Unknown').props.accessibilityState.checked).toBe(false);
    
    // Verify callback with correct data
    expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        gender: ['Male', 'Female', 'Other']
      })
    );
  });

  // Additional test: Has Photo radio button behavior
  test('has photo options work as radio buttons', async () => {
    const { getByTestId } = render(<FilterSection {...defaultProps} />);
    
    // Expand filters
    fireEvent.press(getByTestId('filter-header-collapsed'));
    
    await waitFor(() => {
      // Initially "Any" is selected
      expect(getByTestId('photo-option-any').props.accessibilityState.selected).toBe(true);
      
      // Select "Yes"
      fireEvent.press(getByTestId('photo-option-yes'));
    });
    
    // Verify only "Yes" is selected
    expect(getByTestId('photo-option-yes').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('photo-option-any').props.accessibilityState.selected).toBe(false);
    expect(getByTestId('photo-option-no').props.accessibilityState.selected).toBe(false);
    
    // Select "No"
    fireEvent.press(getByTestId('photo-option-no'));
    
    // Verify only "No" is selected
    expect(getByTestId('photo-option-no').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('photo-option-yes').props.accessibilityState.selected).toBe(false);
    expect(getByTestId('photo-option-any').props.accessibilityState.selected).toBe(false);
  });
});