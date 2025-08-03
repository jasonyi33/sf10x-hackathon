/**
 * Test suite for IndividualProfileScreen photo update functionality
 * 
 * Requirements:
 * 1. Same consent requirement as initial capture
 * 2. Does NOT create new interaction record
 * 3. Updates photo_url and photo_history
 * 4. Shows success/error feedback
 * 5. Refreshes profile after update
 * 6. Loading state during update
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import IndividualProfileScreen from '../IndividualProfileScreen';
import { api } from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

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

// Mock photo picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

const ImagePicker = require('expo-image-picker');

describe('IndividualProfileScreen Photo Update', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    api.getIndividualProfile.mockResolvedValue(mockProfile);
  });

  // Test 1: Update requires consent checkbox
  test('1. Update requires consent checkbox', async () => {
    const { getByTestId, queryByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    // Open photo update UI
    const updatePhotoButton = getByTestId('update-photo-button');
    fireEvent.press(updatePhotoButton);

    // PhotoCapture component should be visible
    await waitFor(() => {
      expect(getByTestId('photo-capture-modal')).toBeTruthy();
    });

    // Mock photo selection
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{
        uri: 'file://new-photo.jpg',
        type: 'image/jpeg'
      }]
    });

    const selectPhotoButton = getByTestId('select-photo-button');
    fireEvent.press(selectPhotoButton);

    await waitFor(() => {
      expect(getByTestId('consent-checkbox')).toBeTruthy();
    });

    // Try to save without consent
    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);

    // Should show error
    expect(Alert.alert).toHaveBeenCalledWith(
      'Consent Required',
      'You must confirm consent before saving the photo.'
    );

    // Check consent and try again
    const consentCheckbox = getByTestId('consent-checkbox');
    fireEvent.press(consentCheckbox);

    // Should now allow save
    api.updateIndividualPhoto = jest.fn().mockResolvedValue({ 
      photo_url: 'https://example.com/photos/new.jpg' 
    });

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(api.updateIndividualPhoto).toHaveBeenCalled();
    });
  });

  // Test 2: No new interaction created
  test('2. No new interaction created', async () => {
    const { getByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    const initialInteractionCount = mockProfile.total_interactions;

    // Open photo update and complete the flow
    const updatePhotoButton = getByTestId('update-photo-button');
    fireEvent.press(updatePhotoButton);

    await waitFor(() => {
      expect(getByTestId('photo-capture-modal')).toBeTruthy();
    });

    // Mock photo selection
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{
        uri: 'file://new-photo.jpg',
        type: 'image/jpeg'
      }]
    });

    const selectPhotoButton = getByTestId('select-photo-button');
    fireEvent.press(selectPhotoButton);

    await waitFor(() => {
      expect(getByTestId('consent-checkbox')).toBeTruthy();
    });

    // Check consent
    const consentCheckbox = getByTestId('consent-checkbox');
    fireEvent.press(consentCheckbox);

    // Mock the update API to return the same interaction count
    api.updateIndividualPhoto = jest.fn().mockResolvedValue({ 
      photo_url: 'https://example.com/photos/new.jpg' 
    });
    
    api.getIndividualProfile.mockResolvedValue({
      ...mockProfile,
      photo_url: 'https://example.com/photos/new.jpg',
      photo_history: [
        { url: mockProfile.photo_url, timestamp: new Date().toISOString() },
        ...mockProfile.photo_history
      ],
      total_interactions: initialInteractionCount // Same count
    });

    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(api.updateIndividualPhoto).toHaveBeenCalledWith({
        individualId: 'test-individual-123',
        photoUri: 'file://new-photo.jpg',
        consentLocation: expect.any(Object)
      });
    });

    // Verify the interaction count hasn't changed
    await waitFor(() => {
      const interactionCountElement = getByText(`${initialInteractionCount} interaction`, { exact: false });
      expect(interactionCountElement).toBeTruthy();
    });
  });

  // Test 3: Old photo moves to history
  test('3. Old photo moves to history', async () => {
    const { getByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    const oldPhotoUrl = mockProfile.photo_url;

    // Complete photo update flow
    const updatePhotoButton = getByTestId('update-photo-button');
    fireEvent.press(updatePhotoButton);

    await waitFor(() => {
      expect(getByTestId('photo-capture-modal')).toBeTruthy();
    });

    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{
        uri: 'file://new-photo.jpg',
        type: 'image/jpeg'
      }]
    });

    const selectPhotoButton = getByTestId('select-photo-button');
    fireEvent.press(selectPhotoButton);

    await waitFor(() => {
      const consentCheckbox = getByTestId('consent-checkbox');
      fireEvent.press(consentCheckbox);
    });

    // Mock the update to show old photo moved to history
    const newPhotoUrl = 'https://example.com/photos/new.jpg';
    api.updateIndividualPhoto = jest.fn().mockResolvedValue({ 
      photo_url: newPhotoUrl 
    });
    
    api.getIndividualProfile.mockResolvedValue({
      ...mockProfile,
      photo_url: newPhotoUrl,
      photo_history: [
        { url: oldPhotoUrl, timestamp: new Date().toISOString() },
        ...mockProfile.photo_history
      ]
    });

    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(api.getIndividualProfile).toHaveBeenCalledTimes(2); // Initial load + refresh
    });

    // Verify the photo history contains the old photo
    const photoGallery = getByTestId('photo-gallery-component');
    expect(photoGallery).toBeTruthy();
    
    // The old photo should now be in history
    const historyPhotos = photoGallery.props.photoHistory;
    expect(historyPhotos[0].url).toBe(oldPhotoUrl);
  });

  // Test 4: Profile refreshes with new photo
  test('4. Profile refreshes with new photo', async () => {
    const { getByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    // Complete photo update flow
    const updatePhotoButton = getByTestId('update-photo-button');
    fireEvent.press(updatePhotoButton);

    await waitFor(() => {
      expect(getByTestId('photo-capture-modal')).toBeTruthy();
    });

    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{
        uri: 'file://new-photo.jpg',
        type: 'image/jpeg'
      }]
    });

    const selectPhotoButton = getByTestId('select-photo-button');
    fireEvent.press(selectPhotoButton);

    await waitFor(() => {
      const consentCheckbox = getByTestId('consent-checkbox');
      fireEvent.press(consentCheckbox);
    });

    const newPhotoUrl = 'https://example.com/photos/new.jpg';
    api.updateIndividualPhoto = jest.fn().mockResolvedValue({ 
      photo_url: newPhotoUrl 
    });
    
    api.getIndividualProfile.mockResolvedValue({
      ...mockProfile,
      photo_url: newPhotoUrl
    });

    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);

    // Wait for profile refresh
    await waitFor(() => {
      expect(api.getIndividualProfile).toHaveBeenCalledTimes(2);
    });

    // Verify the new photo is displayed
    const individualPhoto = getByTestId('individual-photo');
    expect(individualPhoto.props.source.uri).toBe(newPhotoUrl);
  });

  // Test 5: Error shown on upload failure
  test('5. Error shown on upload failure', async () => {
    const { getByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    // Complete photo update flow
    const updatePhotoButton = getByTestId('update-photo-button');
    fireEvent.press(updatePhotoButton);

    await waitFor(() => {
      expect(getByTestId('photo-capture-modal')).toBeTruthy();
    });

    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{
        uri: 'file://new-photo.jpg',
        type: 'image/jpeg'
      }]
    });

    const selectPhotoButton = getByTestId('select-photo-button');
    fireEvent.press(selectPhotoButton);

    await waitFor(() => {
      const consentCheckbox = getByTestId('consent-checkbox');
      fireEvent.press(consentCheckbox);
    });

    // Mock upload failure
    api.updateIndividualPhoto = jest.fn().mockRejectedValue(
      new Error('Network error')
    );

    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);

    // Wait for error handling
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'Failed to update photo. Please try again.',
        position: 'bottom'
      });
    });

    // Modal should still be open
    expect(getByTestId('photo-capture-modal')).toBeTruthy();
  });

  // Test 6: Loading state during update
  test('6. Loading state during update', async () => {
    const { getByTestId, queryByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    // Complete photo update flow
    const updatePhotoButton = getByTestId('update-photo-button');
    fireEvent.press(updatePhotoButton);

    await waitFor(() => {
      expect(getByTestId('photo-capture-modal')).toBeTruthy();
    });

    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{
        uri: 'file://new-photo.jpg',
        type: 'image/jpeg'
      }]
    });

    const selectPhotoButton = getByTestId('select-photo-button');
    fireEvent.press(selectPhotoButton);

    await waitFor(() => {
      const consentCheckbox = getByTestId('consent-checkbox');
      fireEvent.press(consentCheckbox);
    });

    // Mock slow upload
    let resolveUpload;
    api.updateIndividualPhoto = jest.fn().mockImplementation(() => 
      new Promise(resolve => {
        resolveUpload = resolve;
      })
    );

    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);

    // Loading indicator should be visible
    await waitFor(() => {
      expect(getByTestId('upload-loading-indicator')).toBeTruthy();
    });

    // Save button should be disabled
    expect(saveButton.props.disabled).toBe(true);

    // Resolve the upload
    resolveUpload({ photo_url: 'https://example.com/photos/new.jpg' });

    // Loading should disappear
    await waitFor(() => {
      expect(queryByTestId('upload-loading-indicator')).toBeFalsy();
    });
  });

  // Test 7: Update photo button visibility
  test('7. Update photo button is visible and accessible', async () => {
    const { getByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    // Update photo button should be visible
    const updatePhotoButton = getByTestId('update-photo-button');
    expect(updatePhotoButton).toBeTruthy();
    
    // Should have appropriate icon or text
    const buttonText = getByTestId('update-photo-button-text');
    expect(buttonText.props.children).toBe('Update Photo');
  });

  // Test 8: Cancel photo update
  test('8. Can cancel photo update', async () => {
    const { getByTestId, queryByTestId } = render(
      <IndividualProfileScreen navigation={mockNavigation} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByTestId('individual-photo')).toBeTruthy();
    });

    // Open photo update
    const updatePhotoButton = getByTestId('update-photo-button');
    fireEvent.press(updatePhotoButton);

    await waitFor(() => {
      expect(getByTestId('photo-capture-modal')).toBeTruthy();
    });

    // Cancel the update
    const cancelButton = getByTestId('cancel-photo-button');
    fireEvent.press(cancelButton);

    // Modal should close
    await waitFor(() => {
      expect(queryByTestId('photo-capture-modal')).toBeFalsy();
    });

    // No API calls should have been made
    expect(api.updateIndividualPhoto).not.toHaveBeenCalled();
  });
});