import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import SortDropdown from '../SortDropdown';

// Mock expo-location
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

describe('SortDropdown Component', () => {
  const mockOnSortChange = jest.fn();

  const defaultProps = {
    onSortChange: mockOnSortChange,
    currentSort: 'danger_score',
    currentOrder: 'desc',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Default sort is Danger Score
  test('default sort is Danger Score', () => {
    const { getByTestId, getByText } = render(<SortDropdown {...defaultProps} />);
    
    const dropdownTrigger = getByTestId('sort-dropdown-trigger');
    expect(dropdownTrigger).toBeTruthy();
    
    // Should show "Danger Score" as the current selection
    expect(getByText('Danger Score')).toBeTruthy();
  });

  // Test 2: All 4 sort options available
  test('shows all 4 sort options when expanded', async () => {
    const { getByTestId, getByText, queryByText } = render(<SortDropdown {...defaultProps} />);
    
    // Open dropdown
    const dropdownTrigger = getByTestId('sort-dropdown-trigger');
    fireEvent.press(dropdownTrigger);
    
    await waitFor(() => {
      expect(getByTestId('sort-option-danger_score')).toBeTruthy();
      expect(getByTestId('sort-option-last_seen')).toBeTruthy();
      expect(getByTestId('sort-option-name')).toBeTruthy();
      expect(getByTestId('sort-option-distance')).toBeTruthy();
      
      // Check labels
      expect(getByText('Danger Score')).toBeTruthy();
      expect(getByText('Last Seen')).toBeTruthy();
      expect(getByText('Name A-Z')).toBeTruthy();
      expect(queryByText('Distance')).toBeTruthy(); // May have additional text if disabled
    });
  });

  // Test 3: Distance option disabled without location
  test('distance option is disabled without location permission', async () => {
    // Mock no location permission
    Location.getForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
    
    const { getByTestId } = render(<SortDropdown {...defaultProps} />);
    
    // Open dropdown
    fireEvent.press(getByTestId('sort-dropdown-trigger'));
    
    await waitFor(() => {
      const distanceOption = getByTestId('sort-option-distance');
      expect(distanceOption).toBeTruthy();
      
      // Check if it's disabled (has disabled styling or can't be pressed)
      expect(distanceOption.props.accessibilityState?.disabled).toBe(true);
    });
  });

  // Test 4: Sort applies immediately
  test('calls onSortChange immediately when option is selected', async () => {
    const { getByTestId } = render(<SortDropdown {...defaultProps} />);
    
    // Open dropdown
    fireEvent.press(getByTestId('sort-dropdown-trigger'));
    
    // Select Name A-Z
    await waitFor(() => {
      fireEvent.press(getByTestId('sort-option-name'));
    });
    
    // Should call callback immediately
    expect(mockOnSortChange).toHaveBeenCalledWith('name', 'asc');
    
    // Dropdown should close
    await waitFor(() => {
      expect(queryByTestId('sort-dropdown-menu')).toBeNull();
    });
  });

  // Test 5: Sort persists during filter changes
  test('maintains selected sort when props change', () => {
    const { rerender, getByText } = render(
      <SortDropdown {...defaultProps} currentSort="name" currentOrder="asc" />
    );
    
    expect(getByText('Name A-Z')).toBeTruthy();
    
    // Rerender with same sort but different props
    rerender(
      <SortDropdown 
        {...defaultProps} 
        currentSort="name" 
        currentOrder="asc"
        someOtherProp="changed"
      />
    );
    
    // Should still show Name A-Z
    expect(getByText('Name A-Z')).toBeTruthy();
  });

  // Test 6: Sort indicator shows correctly
  test('shows correct sort direction indicator', async () => {
    const { getByTestId, rerender } = render(<SortDropdown {...defaultProps} />);
    
    // Default is desc (down arrow for danger score)
    let indicator = getByTestId('sort-direction-indicator');
    expect(indicator.props.name).toBe('arrow-down');
    
    // Change to ascending
    rerender(
      <SortDropdown {...defaultProps} currentSort="danger_score" currentOrder="asc" />
    );
    
    indicator = getByTestId('sort-direction-indicator');
    expect(indicator.props.name).toBe('arrow-up');
  });

  // Test 7: Results re-render on sort change
  test('updates display when sort changes', async () => {
    const { getByTestId, getByText, queryByText } = render(<SortDropdown {...defaultProps} />);
    
    // Initially shows Danger Score
    expect(getByText('Danger Score')).toBeTruthy();
    
    // Open and select Last Seen
    fireEvent.press(getByTestId('sort-dropdown-trigger'));
    
    await waitFor(() => {
      fireEvent.press(getByTestId('sort-option-last_seen'));
    });
    
    // Should now show Last Seen
    expect(queryByText('Danger Score')).toBeNull();
    expect(getByText('Last Seen')).toBeTruthy();
  });

  // Additional test: Toggle sort order
  test('toggles sort order when current option is selected again', async () => {
    const { getByTestId } = render(
      <SortDropdown {...defaultProps} currentSort="danger_score" currentOrder="desc" />
    );
    
    // Open dropdown
    fireEvent.press(getByTestId('sort-dropdown-trigger'));
    
    // Select danger_score again (same as current)
    await waitFor(() => {
      fireEvent.press(getByTestId('sort-option-danger_score'));
    });
    
    // Should toggle order from desc to asc
    expect(mockOnSortChange).toHaveBeenCalledWith('danger_score', 'asc');
  });

  // Additional test: Close dropdown on outside tap
  test('closes dropdown when tapping outside', async () => {
    const { getByTestId, queryByTestId } = render(<SortDropdown {...defaultProps} />);
    
    // Open dropdown
    fireEvent.press(getByTestId('sort-dropdown-trigger'));
    
    await waitFor(() => {
      expect(getByTestId('sort-dropdown-menu')).toBeTruthy();
    });
    
    // Tap outside (on overlay)
    fireEvent.press(getByTestId('sort-dropdown-overlay'));
    
    await waitFor(() => {
      expect(queryByTestId('sort-dropdown-menu')).toBeNull();
    });
  });

  // Additional test: Distance option enabled with location
  test('distance option is enabled with location permission', async () => {
    // Mock location permission granted
    Location.getForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    
    const { getByTestId } = render(<SortDropdown {...defaultProps} />);
    
    // Open dropdown
    fireEvent.press(getByTestId('sort-dropdown-trigger'));
    
    await waitFor(() => {
      const distanceOption = getByTestId('sort-option-distance');
      expect(distanceOption).toBeTruthy();
      
      // Should be enabled
      expect(distanceOption.props.accessibilityState?.disabled).toBe(false);
    });
  });

  // Additional test: Correct labels for each sort option
  test('displays correct labels for all sort options', () => {
    const sortConfigs = [
      { sort: 'danger_score', order: 'desc', label: 'Danger Score' },
      { sort: 'last_seen', order: 'desc', label: 'Last Seen' },
      { sort: 'name', order: 'asc', label: 'Name A-Z' },
      { sort: 'distance', order: 'asc', label: 'Distance' },
    ];

    sortConfigs.forEach(config => {
      const { getByText } = render(
        <SortDropdown 
          {...defaultProps} 
          currentSort={config.sort}
          currentOrder={config.order}
        />
      );
      
      expect(getByText(config.label)).toBeTruthy();
    });
  });
});