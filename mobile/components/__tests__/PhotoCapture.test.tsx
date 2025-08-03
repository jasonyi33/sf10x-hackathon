import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PhotoCapture from '../PhotoCapture';

// Mock expo modules
jest.mock('expo-camera');
jest.mock('expo-image-picker');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('PhotoCapture Component', () => {
  const mockOnPhotoCapture = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for camera permissions
    const Camera = require('expo-camera').Camera;
    Camera.useCameraPermissions = jest.fn().mockReturnValue([
      { granted: true },
      jest.fn(),
    ]);
  });

  // Test 1: Component renders camera preview
  test('1. Component renders camera preview when permissions granted', () => {
    const { getByTestId, queryByTestId } = render(
      <PhotoCapture onPhotoCapture={mockOnPhotoCapture} />
    );

    // Should show camera preview
    expect(getByTestId('camera-preview')).toBeTruthy();
    expect(getByTestId('capture-button')).toBeTruthy();
    expect(queryByTestId('photo-preview')).toBeNull();
  });

  // Test 2: Capture button takes photo
  test('2. Capture button takes photo successfully', async () => {
    const mockPhotoUri = 'file:///test-photo.jpg';
    const ImagePicker = require('expo-image-picker');
    ImagePicker.launchCameraAsync = jest.fn().mockResolvedValue({
      canceled: false,
      assets: [{ uri: mockPhotoUri }],
    });
    ImagePicker.MediaTypeOptions = { Images: 'Images' };

    const { getByTestId, queryByTestId } = render(
      <PhotoCapture onPhotoCapture={mockOnPhotoCapture} />
    );

    // Press capture button
    fireEvent.press(getByTestId('capture-button'));

    await waitFor(() => {
      // Should show photo preview instead of camera
      expect(queryByTestId('camera-preview')).toBeNull();
      expect(getByTestId('photo-preview')).toBeTruthy();
      expect(getByTestId('retake-button')).toBeTruthy();
    });

    // Verify ImagePicker was called with correct options
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith({
      mediaTypes: 'Images',
      allowsEditing: false,
      quality: 0.8,
      base64: false,
    });
  });

  // Test 3: Retake button resets to camera view
  test('3. Retake button resets to camera view', async () => {
    const mockPhotoUri = 'file:///test-photo.jpg';
    const ImagePicker = require('expo-image-picker');
    ImagePicker.launchCameraAsync = jest.fn().mockResolvedValue({
      canceled: false,
      assets: [{ uri: mockPhotoUri }],
    });

    const { getByTestId } = render(
      <PhotoCapture onPhotoCapture={mockOnPhotoCapture} />
    );

    // Take a photo first
    fireEvent.press(getByTestId('capture-button'));

    await waitFor(() => {
      expect(getByTestId('photo-preview')).toBeTruthy();
    });

    // Press retake button
    fireEvent.press(getByTestId('retake-button'));

    // Should be back to camera view
    expect(getByTestId('camera-preview')).toBeTruthy();
    expect(getByTestId('capture-button')).toBeTruthy();
  });

  // Test 4: Consent checkbox toggles correctly
  test('4. Consent checkbox toggles correctly', async () => {
    const mockPhotoUri = 'file:///test-photo.jpg';
    const ImagePicker = require('expo-image-picker');
    ImagePicker.launchCameraAsync = jest.fn().mockResolvedValue({
      canceled: false,
      assets: [{ uri: mockPhotoUri }],
    });

    const { getByTestId, getByText } = render(
      <PhotoCapture onPhotoCapture={mockOnPhotoCapture} />
    );

    // Take a photo
    fireEvent.press(getByTestId('capture-button'));

    await waitFor(() => {
      expect(getByTestId('consent-checkbox')).toBeTruthy();
    });

    const checkbox = getByTestId('consent-checkbox');
    const consentText = getByText(/Verbal consent has been received/);

    // Initially unchecked
    expect(checkbox.props.value).toBe(false);

    // Toggle on
    fireEvent(checkbox, 'valueChange', true);
    await waitFor(() => {
      expect(checkbox.props.value).toBe(true);
    });

    // Toggle off
    fireEvent(checkbox, 'valueChange', false);
    await waitFor(() => {
      expect(checkbox.props.value).toBe(false);
    });

    // Consent text should be visible
    expect(consentText).toBeTruthy();
  });

  // Test 5: Photo cleared when consent unchecked
  test('5. Photo cleared when consent unchecked after being checked', async () => {
    const mockPhotoUri = 'file:///test-photo.jpg';
    const ImagePicker = require('expo-image-picker');
    ImagePicker.launchCameraAsync = jest.fn().mockResolvedValue({
      canceled: false,
      assets: [{ uri: mockPhotoUri }],
    });

    const { getByTestId, queryByTestId } = render(
      <PhotoCapture onPhotoCapture={mockOnPhotoCapture} />
    );

    // Take a photo
    fireEvent.press(getByTestId('capture-button'));

    await waitFor(() => {
      expect(getByTestId('photo-preview')).toBeTruthy();
    });

    const checkbox = getByTestId('consent-checkbox');

    // Check consent
    fireEvent(checkbox, 'valueChange', true);
    await waitFor(() => {
      expect(checkbox.props.value).toBe(true);
    });

    // Uncheck consent - should clear photo
    fireEvent(checkbox, 'valueChange', false);

    await waitFor(() => {
      // Should be back to camera view
      expect(getByTestId('camera-preview')).toBeTruthy();
      expect(queryByTestId('photo-preview')).toBeNull();
    });
  });

  // Test 6: Save disabled without consent
  test('6. Save button disabled without consent', async () => {
    const mockPhotoUri = 'file:///test-photo.jpg';
    const ImagePicker = require('expo-image-picker');
    ImagePicker.launchCameraAsync = jest.fn().mockResolvedValue({
      canceled: false,
      assets: [{ uri: mockPhotoUri }],
    });

    const { getByTestId } = render(
      <PhotoCapture onPhotoCapture={mockOnPhotoCapture} />
    );

    // Take a photo
    fireEvent.press(getByTestId('capture-button'));

    await waitFor(() => {
      expect(getByTestId('save-button')).toBeTruthy();
    });

    const saveButton = getByTestId('save-button');
    const checkbox = getByTestId('consent-checkbox');

    // Save button should be disabled initially (no consent)
    expect(saveButton.props.disabled).toBe(true);

    // Enable consent
    fireEvent(checkbox, 'valueChange', true);
    await waitFor(() => {
      expect(saveButton.props.disabled).toBe(false);
    });

    // Disable consent again
    fireEvent(checkbox, 'valueChange', false);
    await waitFor(() => {
      expect(saveButton.props.disabled).toBe(true);
    });
  });

  // Test 7: Returns correct data structure
  test('7. Returns {photoUri: string, hasConsent: boolean} on save', async () => {
    const mockPhotoUri = 'file:///test-photo.jpg';
    const ImagePicker = require('expo-image-picker');
    ImagePicker.launchCameraAsync = jest.fn().mockResolvedValue({
      canceled: false,
      assets: [{ uri: mockPhotoUri }],
    });

    const { getByTestId } = render(
      <PhotoCapture onPhotoCapture={mockOnPhotoCapture} />
    );

    // Take a photo
    fireEvent.press(getByTestId('capture-button'));

    await waitFor(() => {
      expect(getByTestId('save-button')).toBeTruthy();
    });

    // Enable consent
    fireEvent(getByTestId('consent-checkbox'), 'valueChange', true);

    await waitFor(() => {
      expect(getByTestId('save-button').props.disabled).toBe(false);
    });

    // Press save
    fireEvent.press(getByTestId('save-button'));

    // Verify callback was called with correct structure
    expect(mockOnPhotoCapture).toHaveBeenCalledWith({
      photoUri: mockPhotoUri,
      hasConsent: true,
    });
  });

  // Additional test: Handle camera permission denied
  test('Shows permission denied message when camera access not granted', () => {
    const Camera = require('expo-camera').Camera;
    Camera.useCameraPermissions = jest.fn().mockReturnValue([
      { granted: false },
      jest.fn(),
    ]);

    const { getByText, queryByTestId } = render(
      <PhotoCapture onPhotoCapture={mockOnPhotoCapture} />
    );

    expect(getByText(/Camera permission is required/)).toBeTruthy();
    expect(queryByTestId('camera-preview')).toBeNull();
  });

  // Additional test: Handle photo capture cancellation
  test('Handles photo capture cancellation gracefully', async () => {
    const ImagePicker = require('expo-image-picker');
    ImagePicker.launchCameraAsync = jest.fn().mockResolvedValue({
      canceled: true,
    });

    const { getByTestId } = render(
      <PhotoCapture onPhotoCapture={mockOnPhotoCapture} />
    );

    // Press capture button
    fireEvent.press(getByTestId('capture-button'));

    await waitFor(() => {
      // Should still show camera preview (not photo preview)
      expect(getByTestId('camera-preview')).toBeTruthy();
    });

    // Callback should not have been called
    expect(mockOnPhotoCapture).not.toHaveBeenCalled();
  });

  // Additional test: Skip button functionality
  test('Skip button calls callback with null values', () => {
    const { getByTestId } = render(
      <PhotoCapture onPhotoCapture={mockOnPhotoCapture} />
    );

    const skipButton = getByTestId('skip-button');
    fireEvent.press(skipButton);

    expect(mockOnPhotoCapture).toHaveBeenCalledWith({
      photoUri: null,
      hasConsent: false,
    });
  });
});