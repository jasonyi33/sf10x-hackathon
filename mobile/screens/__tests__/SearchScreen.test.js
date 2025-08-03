import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SearchScreen from '../SearchScreen';
import { api } from '../../services/api';
import { NavigationContainer } from '@react-navigation/native';

// Mock the API module
jest.mock('../../services/api', () => ({
  api: {
    searchIndividuals: jest.fn(),
  },
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
};

// Helper function to render with navigation
const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      {component}
    </NavigationContainer>
  );
};

// Mock search results with required fields
const mockSearchResults = [
  {
    id: '1',
    name: 'John Doe',
    danger_score: 75,
    danger_override: null,
    last_seen_days: 2,
    last_interaction_date: '2024-01-15T10:30:00Z',
    data: {
      approximate_age: [45, 50],
      height: 70, // 5'10"
      skin_color: 'Medium',
    },
  },
  {
    id: '2',
    name: 'Jane Smith',
    danger_score: 30,
    danger_override: 40,
    last_seen_days: 5,
    last_interaction_date: '2024-01-12T14:20:00Z',
    data: {
      approximate_age: [-1, -1], // Unknown
      height: 66, // 5'6"
      skin_color: 'Light',
    },
  },
  {
    id: '3',
    name: 'Robert Johnson',
    danger_score: 90,
    danger_override: null,
    last_seen_days: 1,
    last_interaction_date: '2024-01-16T08:00:00Z',
    data: {
      approximate_age: [65, 70],
      height: 72, // 6'0"
      skin_color: 'Dark',
    },
  },
  // Add more to test max 10 limit
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `${i + 4}`,
    name: `Person ${i + 4}`,
    danger_score: 50,
    danger_override: null,
    last_seen_days: i + 1,
    last_interaction_date: '2024-01-10T10:00:00Z',
    data: {
      approximate_age: [30, 40],
      height: 68,
      skin_color: 'Medium',
    },
  })),
];

describe('SearchScreen - Dropdown Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Test 1: Dropdown appears after 300ms of typing
  test('dropdown appears after 300ms of typing', async () => {
    (api.searchIndividuals as jest.Mock).mockResolvedValue(mockSearchResults.slice(0, 3));
    
    const { getByPlaceholderText, queryByTestId } = renderWithNavigation(
      <SearchScreen navigation={mockNavigation} />
    );

    const searchInput = getByPlaceholderText('Search individuals...');
    
    // Type in search
    fireEvent.changeText(searchInput, 'John');
    
    // Dropdown should not appear immediately
    expect(queryByTestId('search-dropdown')).toBeNull();
    
    // Fast forward 300ms
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Wait for API call and dropdown to appear
    await waitFor(() => {
      expect(queryByTestId('search-dropdown')).toBeTruthy();
    });
  });

  // Test 2: Maximum 10 results shown
  test('shows maximum 10 results in dropdown', async () => {
    (api.searchIndividuals as jest.Mock).mockResolvedValue(mockSearchResults);
    
    const { getByPlaceholderText, queryAllByTestId } = renderWithNavigation(
      <SearchScreen navigation={mockNavigation} />
    );

    const searchInput = getByPlaceholderText('Search individuals...');
    fireEvent.changeText(searchInput, 'Person');
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      const dropdownItems = queryAllByTestId(/^dropdown-item-/);
      expect(dropdownItems).toHaveLength(10);
    });
  });

  // Test 3: Results format matches specification
  test('displays results in correct format: Name, Age, Height, Skin Color', async () => {
    (api.searchIndividuals as jest.Mock).mockResolvedValue([mockSearchResults[0]]);
    
    const { getByPlaceholderText, getByTestId } = renderWithNavigation(
      <SearchScreen navigation={mockNavigation} />
    );

    const searchInput = getByPlaceholderText('Search individuals...');
    fireEvent.changeText(searchInput, 'John');
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      const dropdownItem = getByTestId('dropdown-item-1');
      expect(dropdownItem).toBeTruthy();
    });
    
    const dropdownText = getByTestId('dropdown-text-1');
    expect(dropdownText.props.children).toBe('John Doe, 45-50, 5\'10", Medium');
  });

  // Test 4: No photo URLs or images in dropdown
  test('dropdown does not contain any photo elements', async () => {
    (api.searchIndividuals as jest.Mock).mockResolvedValue(mockSearchResults.slice(0, 3));
    
    const { getByPlaceholderText, queryAllByTestId } = renderWithNavigation(
      <SearchScreen navigation={mockNavigation} />
    );

    const searchInput = getByPlaceholderText('Search individuals...');
    fireEvent.changeText(searchInput, 'test');
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      const photoElements = queryAllByTestId(/photo|image/i);
      expect(photoElements).toHaveLength(0);
    });
  });

  // Test 5: Click navigates to profile
  test('clicking dropdown item navigates to profile', async () => {
    (api.searchIndividuals as jest.Mock).mockResolvedValue([mockSearchResults[0]]);
    
    const { getByPlaceholderText, getByTestId } = renderWithNavigation(
      <SearchScreen navigation={mockNavigation} />
    );

    const searchInput = getByPlaceholderText('Search individuals...');
    fireEvent.changeText(searchInput, 'John');
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      const dropdownItem = getByTestId('dropdown-item-1');
      expect(dropdownItem).toBeTruthy();
    });
    
    const dropdownItem = getByTestId('dropdown-item-1');
    fireEvent.press(dropdownItem);
    
    expect(mockNavigate).toHaveBeenCalledWith('IndividualProfile', { individualId: '1' });
  });

  // Test 6: Dropdown dismisses on outside tap
  test('dropdown dismisses when tapping outside', async () => {
    (api.searchIndividuals as jest.Mock).mockResolvedValue([mockSearchResults[0]]);
    
    const { getByPlaceholderText, getByTestId, queryByTestId } = renderWithNavigation(
      <SearchScreen navigation={mockNavigation} />
    );

    const searchInput = getByPlaceholderText('Search individuals...');
    fireEvent.changeText(searchInput, 'John');
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      expect(getByTestId('search-dropdown')).toBeTruthy();
    });
    
    // Tap outside (on the overlay)
    const overlay = getByTestId('dropdown-overlay');
    fireEvent.press(overlay);
    
    expect(queryByTestId('search-dropdown')).toBeNull();
  });

  // Test 7: Loading state while searching
  test('shows loading state while searching', async () => {
    // Create a promise we can control
    let resolveSearch: any;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });
    
    (api.searchIndividuals as jest.Mock).mockReturnValue(searchPromise);
    
    const { getByPlaceholderText, getByTestId, queryByTestId } = renderWithNavigation(
      <SearchScreen navigation={mockNavigation} />
    );

    const searchInput = getByPlaceholderText('Search individuals...');
    fireEvent.changeText(searchInput, 'John');
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Should show loading indicator
    await waitFor(() => {
      expect(getByTestId('dropdown-loading')).toBeTruthy();
    });
    
    // Resolve the search
    act(() => {
      resolveSearch(mockSearchResults.slice(0, 3));
    });
    
    // Loading should disappear
    await waitFor(() => {
      expect(queryByTestId('dropdown-loading')).toBeNull();
    });
  });

  // Test 8: Empty state when no results
  test('shows empty state when no results found', async () => {
    (api.searchIndividuals as jest.Mock).mockResolvedValue([]);
    
    const { getByPlaceholderText, getByTestId } = renderWithNavigation(
      <SearchScreen navigation={mockNavigation} />
    );

    const searchInput = getByPlaceholderText('Search individuals...');
    fireEvent.changeText(searchInput, 'NonExistent');
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      const emptyState = getByTestId('dropdown-empty');
      expect(emptyState).toBeTruthy();
    });
    
    const emptyText = getByTestId('dropdown-empty-text');
    expect(emptyText.props.children).toBe('No individuals found');
  });

  // Test 9: Error state on API failure
  test('shows error state on API failure', async () => {
    (api.searchIndividuals as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    const { getByPlaceholderText, getByTestId } = renderWithNavigation(
      <SearchScreen navigation={mockNavigation} />
    );

    const searchInput = getByPlaceholderText('Search individuals...');
    fireEvent.changeText(searchInput, 'John');
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      const errorState = getByTestId('dropdown-error');
      expect(errorState).toBeTruthy();
    });
    
    const errorText = getByTestId('dropdown-error-text');
    expect(errorText.props.children).toBe('Failed to search. Please try again.');
  });

  // Additional test: Dropdown updates when search query changes
  test('dropdown updates when search query changes', async () => {
    (api.searchIndividuals as jest.Mock)
      .mockResolvedValueOnce([mockSearchResults[0]]) // First search
      .mockResolvedValueOnce([mockSearchResults[1]]); // Second search
    
    const { getByPlaceholderText, getByTestId } = renderWithNavigation(
      <SearchScreen navigation={mockNavigation} />
    );

    const searchInput = getByPlaceholderText('Search individuals...');
    
    // First search
    fireEvent.changeText(searchInput, 'John');
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      const dropdownText = getByTestId('dropdown-text-1');
      expect(dropdownText.props.children).toContain('John Doe');
    });
    
    // Change search
    fireEvent.changeText(searchInput, 'Jane');
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      const dropdownText = getByTestId('dropdown-text-2');
      expect(dropdownText.props.children).toContain('Jane Smith');
    });
  });

  // Test for Unknown age display
  test('displays "Unknown" for age when age is [-1, -1]', async () => {
    (api.searchIndividuals as jest.Mock).mockResolvedValue([mockSearchResults[1]]);
    
    const { getByPlaceholderText, getByTestId } = renderWithNavigation(
      <SearchScreen navigation={mockNavigation} />
    );

    const searchInput = getByPlaceholderText('Search individuals...');
    fireEvent.changeText(searchInput, 'Jane');
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      const dropdownText = getByTestId('dropdown-text-2');
      expect(dropdownText.props.children).toBe('Jane Smith, Unknown, 5\'6", Light');
    });
  });

  // Test height conversion
  test('correctly converts height from inches to feet and inches', async () => {
    const testResults = [
      {
        ...mockSearchResults[0],
        data: { ...mockSearchResults[0].data, height: 60 }, // 5'0"
      },
    ];
    
    (api.searchIndividuals as jest.Mock).mockResolvedValue(testResults);
    
    const { getByPlaceholderText, getByTestId } = renderWithNavigation(
      <SearchScreen navigation={mockNavigation} />
    );

    const searchInput = getByPlaceholderText('Search individuals...');
    fireEvent.changeText(searchInput, 'test');
    
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    await waitFor(() => {
      const dropdownText = getByTestId('dropdown-text-1');
      expect(dropdownText.props.children).toContain('5\'0"');
    });
  });
});