/**
 * Test suite for IndividualProfileScreen photo display functionality
 * 
 * Requirements:
 * 1. Show current photo prominently at top
 * 2. Use placeholder image if no photo
 * 3. Tap photo to show/hide gallery bar
 * 4. Gallery appears below photo
 * 5. Smooth animation for gallery toggle
 * 6. Handle missing photo gracefully
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Image } from 'react-native';
import IndividualProfileScreen from '../IndividualProfileScreen';
import { api } from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  setOptions: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {
    individualId: 'test-individual-123'
  }
};

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock Image.getSize to handle network image loading
Image.getSize = jest.fn((uri, success, failure) => {
  if (uri && uri.includes('error')) {
    failure(new Error('Network error'));
  } else {
    success(300, 300);
  }
});

describe('IndividualProfileScreen Photo Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Photo displays when photo_url exists
  test('1. Photo displays when photo_url exists', async () => {
    const mockProfile = {
      id: 'test-individual-123',
      name: 'John Doe',
      photo_url: 'https://example.com/photos/test.jpg',
      photo_history: [],
      data: {
        height: 180,
        weight: 75,
        skin_color: 'Medium'
      },
      danger_score: 50,
      danger_override: null,
      total_interactions: 2,
      interactions: []
    };

    api.getIndividualProfile.mockResolvedValue(mockProfile);

    const { getByTestId, queryByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      const photoImage = getByTestId('individual-photo');
      expect(photoImage).toBeTruthy();
      expect(photoImage.props.source.uri).toBe(mockProfile.photo_url);
    });

    // Photo should be prominently displayed at top
    const photoContainer = getByTestId('photo-container');
    expect(photoContainer).toBeTruthy();
  });

  // Test 2: Placeholder shown when no photo
  test('2. Placeholder shown when no photo', async () => {
    const mockProfile = {
      id: 'test-individual-123',
      name: 'Jane Doe',
      photo_url: null,
      photo_history: [],
      data: {
        height: 165,
        weight: 60,
        skin_color: 'Light'
      },
      danger_score: 30,
      danger_override: null,
      total_interactions: 1,
      interactions: []
    };

    api.getIndividualProfile.mockResolvedValue(mockProfile);

    const { getByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      const placeholderImage = getByTestId('photo-placeholder');
      expect(placeholderImage).toBeTruthy();
      
      // Should use placeholder icon
      expect(placeholderImage.props.name).toBe('person-circle-outline');
    });
  });

  // Test 3: Tap toggles gallery visibility
  test('3. Tap toggles gallery visibility', async () => {
    const mockProfile = {
      id: 'test-individual-123',
      name: 'John Doe',
      photo_url: 'https://example.com/photos/current.jpg',
      photo_history: [
        {
          url: 'https://example.com/photos/old1.jpg',
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          url: 'https://example.com/photos/old2.jpg',
          timestamp: '2024-01-02T10:00:00Z'
        }
      ],
      data: {
        height: 180,
        weight: 75,
        skin_color: 'Medium'
      },
      danger_score: 50,
      danger_override: null,
      total_interactions: 3,
      interactions: []
    };

    api.getIndividualProfile.mockResolvedValue(mockProfile);

    const { getByTestId, queryByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    // Gallery should be hidden initially
    expect(queryByTestId('photo-gallery')).toBeFalsy();

    // Tap on photo
    const photoTouchable = getByTestId('photo-touchable');
    fireEvent.press(photoTouchable);

    // Gallery should now be visible
    await waitFor(() => {
      expect(getByTestId('photo-gallery')).toBeTruthy();
    });

    // Tap again to hide
    fireEvent.press(photoTouchable);

    // Gallery should be hidden again
    await waitFor(() => {
      expect(queryByTestId('photo-gallery')).toBeFalsy();
    });
  });

  // Test 4: Gallery animates smoothly
  test('4. Gallery animates smoothly', async () => {
    const mockProfile = {
      id: 'test-individual-123',
      name: 'John Doe',
      photo_url: 'https://example.com/photos/current.jpg',
      photo_history: [
        {
          url: 'https://example.com/photos/old1.jpg',
          timestamp: '2024-01-01T10:00:00Z'
        }
      ],
      data: {
        height: 180,
        weight: 75,
        skin_color: 'Medium'
      },
      danger_score: 50,
      danger_override: null,
      total_interactions: 2,
      interactions: []
    };

    api.getIndividualProfile.mockResolvedValue(mockProfile);

    const { getByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    // Get the animated view
    const photoTouchable = getByTestId('photo-touchable');
    fireEvent.press(photoTouchable);

    await waitFor(() => {
      const galleryAnimatedView = getByTestId('gallery-animated-view');
      expect(galleryAnimatedView).toBeTruthy();
      
      // Check that it has animation styles
      expect(galleryAnimatedView.props.style).toBeTruthy();
    });
  });

  // Test 5: Handles network errors loading photo
  test('5. Handles network errors when loading photo', async () => {
    const mockProfile = {
      id: 'test-individual-123',
      name: 'John Doe',
      photo_url: 'https://example.com/photos/error.jpg',
      photo_history: [],
      data: {
        height: 180,
        weight: 75,
        skin_color: 'Medium'
      },
      danger_score: 50,
      danger_override: null,
      total_interactions: 1,
      interactions: []
    };

    api.getIndividualProfile.mockResolvedValue(mockProfile);

    const { getByTestId, queryByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      const photoImage = getByTestId('individual-photo');
      expect(photoImage).toBeTruthy();
    });

    // Fire error event on image
    const photoImage = getByTestId('individual-photo');
    fireEvent(photoImage, 'error');

    // Should show placeholder on error
    await waitFor(() => {
      expect(getByTestId('photo-placeholder')).toBeTruthy();
      expect(queryByTestId('individual-photo')).toBeFalsy();
    });
  });

  // Test 6: Photo scales properly to container
  test('6. Photo scales properly to container', async () => {
    const mockProfile = {
      id: 'test-individual-123',
      name: 'John Doe',
      photo_url: 'https://example.com/photos/test.jpg',
      photo_history: [],
      data: {
        height: 180,
        weight: 75,
        skin_color: 'Medium'
      },
      danger_score: 50,
      danger_override: null,
      total_interactions: 1,
      interactions: []
    };

    api.getIndividualProfile.mockResolvedValue(mockProfile);

    const { getByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      const photoImage = getByTestId('individual-photo');
      expect(photoImage).toBeTruthy();
      
      // Check image has proper scaling props
      expect(photoImage.props.resizeMode).toBe('cover');
      
      // Check container has proper dimensions
      const photoContainer = getByTestId('photo-container');
      const containerStyle = photoContainer.props.style;
      expect(containerStyle).toMatchObject({
        width: '100%',
        aspectRatio: 1
      });
    });
  });

  // Test 7: Gallery shows photo history
  test('7. Gallery shows photo history with current photo', async () => {
    const mockProfile = {
      id: 'test-individual-123',
      name: 'John Doe',
      photo_url: 'https://example.com/photos/current.jpg',
      photo_history: [
        {
          url: 'https://example.com/photos/old1.jpg',
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          url: 'https://example.com/photos/old2.jpg',
          timestamp: '2024-01-02T10:00:00Z'
        }
      ],
      data: {
        height: 180,
        weight: 75,
        skin_color: 'Medium'
      },
      danger_score: 50,
      danger_override: null,
      total_interactions: 3,
      interactions: []
    };

    api.getIndividualProfile.mockResolvedValue(mockProfile);

    const { getByTestId, getAllByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    // Open gallery
    const photoTouchable = getByTestId('photo-touchable');
    fireEvent.press(photoTouchable);

    await waitFor(() => {
      const galleryPhotos = getAllByTestId(/^gallery-photo-/);
      // Should have current photo + 2 history photos = 3 total
      expect(galleryPhotos).toHaveLength(3);
      
      // First photo should be current
      expect(galleryPhotos[0].props.source.uri).toBe(mockProfile.photo_url);
      
      // Rest should be from history
      expect(galleryPhotos[1].props.source.uri).toBe(mockProfile.photo_history[0].url);
      expect(galleryPhotos[2].props.source.uri).toBe(mockProfile.photo_history[1].url);
    });
  });

  // Test 8: Gallery handles empty photo history
  test('8. Gallery handles empty photo history gracefully', async () => {
    const mockProfile = {
      id: 'test-individual-123',
      name: 'John Doe',
      photo_url: 'https://example.com/photos/current.jpg',
      photo_history: [],
      data: {
        height: 180,
        weight: 75,
        skin_color: 'Medium'
      },
      danger_score: 50,
      danger_override: null,
      total_interactions: 1,
      interactions: []
    };

    api.getIndividualProfile.mockResolvedValue(mockProfile);

    const { getByTestId, getAllByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    // Open gallery
    const photoTouchable = getByTestId('photo-touchable');
    fireEvent.press(photoTouchable);

    await waitFor(() => {
      const galleryPhotos = getAllByTestId(/^gallery-photo-/);
      // Should only have current photo
      expect(galleryPhotos).toHaveLength(1);
      expect(galleryPhotos[0].props.source.uri).toBe(mockProfile.photo_url);
    });
  });

  // Test 9: Tapping gallery photo updates main photo
  test('9. Tapping gallery photo updates main photo display', async () => {
    const mockProfile = {
      id: 'test-individual-123',
      name: 'John Doe',
      photo_url: 'https://example.com/photos/current.jpg',
      photo_history: [
        {
          url: 'https://example.com/photos/old1.jpg',
          timestamp: '2024-01-01T10:00:00Z'
        }
      ],
      data: {
        height: 180,
        weight: 75,
        skin_color: 'Medium'
      },
      danger_score: 50,
      danger_override: null,
      total_interactions: 2,
      interactions: []
    };

    api.getIndividualProfile.mockResolvedValue(mockProfile);

    const { getByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    // Open gallery
    const photoTouchable = getByTestId('photo-touchable');
    fireEvent.press(photoTouchable);

    await waitFor(() => {
      expect(getByTestId('photo-gallery')).toBeTruthy();
    });

    // Tap on history photo
    const historyPhoto = getByTestId('gallery-photo-1');
    fireEvent.press(historyPhoto);

    // Main photo should update to show selected photo
    await waitFor(() => {
      const mainPhoto = getByTestId('individual-photo');
      expect(mainPhoto.props.source.uri).toBe(mockProfile.photo_history[0].url);
    });
  });

  // Test 10: Photo container positioned correctly
  test('10. Photo container positioned at top of profile', async () => {
    const mockProfile = {
      id: 'test-individual-123',
      name: 'John Doe',
      photo_url: 'https://example.com/photos/test.jpg',
      photo_history: [],
      data: {
        height: 180,
        weight: 75,
        skin_color: 'Medium'
      },
      danger_score: 50,
      danger_override: null,
      total_interactions: 1,
      interactions: []
    };

    api.getIndividualProfile.mockResolvedValue(mockProfile);

    const { getByTestId, UNSAFE_getByType } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('photo-container')).toBeTruthy();
    });

    // Get ScrollView to check photo is first child
    const scrollView = UNSAFE_getByType(require('react-native').ScrollView);
    const scrollViewChildren = scrollView.props.children;
    
    // Photo container should be the first element in ScrollView
    const firstChild = Array.isArray(scrollViewChildren) ? scrollViewChildren[0] : scrollViewChildren;
    expect(firstChild.props.testID).toBe('photo-section');
  });
});