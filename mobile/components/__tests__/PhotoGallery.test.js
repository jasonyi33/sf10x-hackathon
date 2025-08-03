/**
 * Test suite for PhotoGallery component
 * 
 * Requirements:
 * 1. Horizontal scrollable bar
 * 2. Shows current + up to 3 history photos (max 4 total)
 * 3. Small thumbnails with dates
 * 4. Tap thumbnail to preview full size
 * 5. "Set as Current" button on preview
 * 6. Smooth scrolling between photos
 * 7. Handles missing history gracefully
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PhotoGallery from '../PhotoGallery';

// Mock dependencies
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('PhotoGallery Component', () => {
  const mockOnPhotoSelect = jest.fn();
  
  const mockPhotos = {
    current: {
      url: 'https://example.com/photos/current.jpg',
      timestamp: '2024-01-15T10:00:00Z'
    },
    history: [
      {
        url: 'https://example.com/photos/old1.jpg',
        timestamp: '2024-01-10T10:00:00Z'
      },
      {
        url: 'https://example.com/photos/old2.jpg',
        timestamp: '2024-01-05T10:00:00Z'
      },
      {
        url: 'https://example.com/photos/old3.jpg',
        timestamp: '2024-01-01T10:00:00Z'
      },
      {
        url: 'https://example.com/photos/old4.jpg',
        timestamp: '2023-12-25T10:00:00Z'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Shows all photos (current + history)
  test('1. Shows all photos (current + history)', async () => {
    const { getByTestId, getAllByTestId } = render(
      <PhotoGallery
        currentPhoto={mockPhotos.current}
        photoHistory={mockPhotos.history.slice(0, 2)}
        onPhotoSelect={mockOnPhotoSelect}
      />
    );

    const thumbnails = getAllByTestId(/^photo-thumbnail-/);
    // Should show current + 2 history = 3 photos
    expect(thumbnails).toHaveLength(3);
    
    // First should be current photo
    expect(thumbnails[0].props.source.uri).toBe(mockPhotos.current.url);
    
    // Rest should be history
    expect(thumbnails[1].props.source.uri).toBe(mockPhotos.history[0].url);
    expect(thumbnails[2].props.source.uri).toBe(mockPhotos.history[1].url);
  });

  // Test 2: Maximum 4 photos displayed
  test('2. Maximum 4 photos displayed', async () => {
    const { getAllByTestId } = render(
      <PhotoGallery
        currentPhoto={mockPhotos.current}
        photoHistory={mockPhotos.history} // 5 history photos
        onPhotoSelect={mockOnPhotoSelect}
      />
    );

    const thumbnails = getAllByTestId(/^photo-thumbnail-/);
    // Should show max 4 photos (current + 3 history)
    expect(thumbnails).toHaveLength(4);
  });

  // Test 3: Dates shown for each photo
  test('3. Dates shown for each photo', async () => {
    const { getByTestId, getAllByTestId } = render(
      <PhotoGallery
        currentPhoto={mockPhotos.current}
        photoHistory={mockPhotos.history.slice(0, 2)}
        onPhotoSelect={mockOnPhotoSelect}
      />
    );

    // Check current photo date
    const currentDate = getByTestId('photo-date-0');
    expect(currentDate).toBeTruthy();
    expect(currentDate.props.children).toContain('Current');
    
    // Check history photo dates
    const historyDate1 = getByTestId('photo-date-1');
    expect(historyDate1).toBeTruthy();
    expect(historyDate1.props.children).toContain('Jan 10, 2024');
    
    const historyDate2 = getByTestId('photo-date-2');
    expect(historyDate2).toBeTruthy();
    expect(historyDate2.props.children).toContain('Jan 5, 2024');
  });

  // Test 4: Tap opens full preview
  test('4. Tap opens full preview', async () => {
    const { getByTestId, queryByTestId } = render(
      <PhotoGallery
        currentPhoto={mockPhotos.current}
        photoHistory={mockPhotos.history.slice(0, 1)}
        onPhotoSelect={mockOnPhotoSelect}
      />
    );

    // Preview should not be visible initially
    expect(queryByTestId('photo-preview-modal')).toBeFalsy();

    // Tap on a thumbnail
    const thumbnail = getByTestId('photo-touchable-0');
    fireEvent.press(thumbnail);

    // Preview should now be visible
    await waitFor(() => {
      expect(getByTestId('photo-preview-modal')).toBeTruthy();
      const previewImage = getByTestId('photo-preview-image');
      expect(previewImage.props.source.uri).toBe(mockPhotos.current.url);
    });
  });

  // Test 5: Set as Current updates main photo
  test('5. Set as Current button updates main photo', async () => {
    const { getByTestId } = render(
      <PhotoGallery
        currentPhoto={mockPhotos.current}
        photoHistory={mockPhotos.history.slice(0, 2)}
        onPhotoSelect={mockOnPhotoSelect}
      />
    );

    // Tap on history photo thumbnail
    const historyThumbnail = getByTestId('photo-touchable-1');
    fireEvent.press(historyThumbnail);

    // Wait for preview to open
    await waitFor(() => {
      expect(getByTestId('photo-preview-modal')).toBeTruthy();
    });

    // Tap "Set as Current" button
    const setCurrentButton = getByTestId('set-as-current-button');
    fireEvent.press(setCurrentButton);

    // Should call onPhotoSelect with the history photo URL
    expect(mockOnPhotoSelect).toHaveBeenCalledWith(mockPhotos.history[0].url);
  });

  // Test 6: Handles missing history gracefully
  test('6. Handles missing history gracefully', async () => {
    const { getByTestId, getAllByTestId, queryByTestId } = render(
      <PhotoGallery
        currentPhoto={mockPhotos.current}
        photoHistory={[]} // No history
        onPhotoSelect={mockOnPhotoSelect}
      />
    );

    // Should still show current photo
    const thumbnails = getAllByTestId(/^photo-thumbnail-/);
    expect(thumbnails).toHaveLength(1);
    expect(thumbnails[0].props.source.uri).toBe(mockPhotos.current.url);
    
    // Should not crash and gallery should be functional
    const gallery = getByTestId('photo-gallery-scroll');
    expect(gallery).toBeTruthy();
  });

  // Test 7: Scrolls horizontally on swipe
  test('7. Scrolls horizontally on swipe', async () => {
    const { getByTestId } = render(
      <PhotoGallery
        currentPhoto={mockPhotos.current}
        photoHistory={mockPhotos.history}
        onPhotoSelect={mockOnPhotoSelect}
      />
    );

    const scrollView = getByTestId('photo-gallery-scroll');
    expect(scrollView).toBeTruthy();
    
    // Check that it's configured for horizontal scrolling
    expect(scrollView.props.horizontal).toBe(true);
    expect(scrollView.props.showsHorizontalScrollIndicator).toBe(false);
  });

  // Test 8: Handles no current photo
  test('8. Handles no current photo gracefully', async () => {
    const { queryByTestId, getAllByTestId } = render(
      <PhotoGallery
        currentPhoto={null}
        photoHistory={mockPhotos.history.slice(0, 2)}
        onPhotoSelect={mockOnPhotoSelect}
      />
    );

    // Should show only history photos
    const thumbnails = getAllByTestId(/^photo-thumbnail-/);
    expect(thumbnails).toHaveLength(2);
    
    // Should not have any "Current" labels
    expect(queryByTestId('photo-date-0')).toBeTruthy();
    const firstDateLabel = queryByTestId('photo-date-0');
    expect(firstDateLabel.props.children).not.toContain('Current');
  });

  // Test 9: Preview modal can be closed
  test('9. Preview modal can be closed', async () => {
    const { getByTestId, queryByTestId } = render(
      <PhotoGallery
        currentPhoto={mockPhotos.current}
        photoHistory={mockPhotos.history.slice(0, 1)}
        onPhotoSelect={mockOnPhotoSelect}
      />
    );

    // Open preview
    const thumbnail = getByTestId('photo-touchable-0');
    fireEvent.press(thumbnail);

    await waitFor(() => {
      expect(getByTestId('photo-preview-modal')).toBeTruthy();
    });

    // Close preview
    const closeButton = getByTestId('preview-close-button');
    fireEvent.press(closeButton);

    // Preview should be closed
    await waitFor(() => {
      expect(queryByTestId('photo-preview-modal')).toBeFalsy();
    });
  });

  // Test 10: Current photo indicator
  test('10. Current photo has visual indicator', async () => {
    const { getByTestId } = render(
      <PhotoGallery
        currentPhoto={mockPhotos.current}
        photoHistory={mockPhotos.history.slice(0, 2)}
        onPhotoSelect={mockOnPhotoSelect}
      />
    );

    // Current photo should have special styling
    const currentThumbnailContainer = getByTestId('photo-container-0');
    expect(currentThumbnailContainer.props.style).toMatchObject(
      expect.objectContaining({
        borderColor: '#3B82F6',
        borderWidth: 2
      })
    );
    
    // History photos should not have the indicator
    const historyThumbnailContainer = getByTestId('photo-container-1');
    expect(historyThumbnailContainer.props.style).not.toMatchObject(
      expect.objectContaining({
        borderColor: '#3B82F6'
      })
    );
  });
});