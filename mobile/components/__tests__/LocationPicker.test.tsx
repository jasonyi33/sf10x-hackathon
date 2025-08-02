import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LocationPicker } from '../LocationPicker';

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
    }
  })),
  reverseGeocodeAsync: jest.fn(() => Promise.resolve([{
    street: 'Market Street',
    city: 'San Francisco',
    region: 'CA'
  }])),
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    MapView: View,
    Marker: View,
  };
});

describe('LocationPicker', () => {
  const mockOnLocationSelected = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    const { getByText } = render(
      <LocationPicker
        onLocationSelected={mockOnLocationSelected}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(getByText('Select Location')).toBeTruthy();
      expect(getByText('Tap and drag the pin to adjust the location')).toBeTruthy();
    });
  });

  it('shows loading state initially', () => {
    const { getByText } = render(
      <LocationPicker
        onLocationSelected={mockOnLocationSelected}
        onCancel={mockOnCancel}
      />
    );

    expect(getByText('Getting your location...')).toBeTruthy();
  });

  it('handles location permission denied', async () => {
    const { getByText } = render(
      <LocationPicker
        onLocationSelected={mockOnLocationSelected}
        onCancel={mockOnCancel}
      />
    );

    // Mock permission denied
    const expoLocation = require('expo-location');
    expoLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    await waitFor(() => {
      expect(getByText('❌ Location permission denied')).toBeTruthy();
    });
  });

  it('calls onCancel when cancel button is pressed', async () => {
    const { getByText } = render(
      <LocationPicker
        onLocationSelected={mockOnLocationSelected}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
}); 