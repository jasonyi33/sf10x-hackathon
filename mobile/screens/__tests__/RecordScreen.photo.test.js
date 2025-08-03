import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RecordScreen } from '../RecordScreen';
import { api } from '../../services/api';
import { compressImage } from '../../services/imageCompression';
import { ErrorHandler } from '../../utils/errorHandler';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('../../services/imageCompression');
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' }, loading: false }),
}));
jest.mock('../../services/supabase', () => ({
  supabase: {},
}));
jest.mock('../../utils/errorHandler');

// Mock child components
jest.mock('../../components/AudioRecorder', () => ({
  AudioRecorder: React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      resetRecording: jest.fn(),
    }));
    
    return (
      <div testID="audio-recorder">
        <button
          testID="start-recording"
          onPress={() => {
            props.onRecordingStart?.();
            // Simulate recording completion after a moment
            setTimeout(() => {
              props.onRecordingComplete('file:///audio.m4a', {
                location: {
                  latitude: 37.7749,
                  longitude: -122.4194,
                  address: 'Test Address',
                },
              });
            }, 100);
          }}
        >
          Start Recording
        </button>
      </div>
    );
  }),
}));

jest.mock('../../components/TranscriptionResults', () => ({
  TranscriptionResults: ({ onSave, onCancel }) => (
    <div testID="transcription-results">
      <button
        testID="save-transcription"
        onPress={() =>
          onSave({
            name: 'Test Person',
            height: 70,
            weight: 150,
            skin_color: 'Medium',
            approximate_age: [45, 50],
          })
        }
      >
        Save
      </button>
      <button testID="cancel-transcription" onPress={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

jest.mock('../../components/PhotoCapture', () => ({
  __esModule: true,
  default: ({ onPhotoCapture }) => (
    <div testID="photo-capture">
      <button
        testID="capture-photo"
        onPress={() =>
          onPhotoCapture({
            photoUri: 'file:///test-photo.jpg',
            hasConsent: true,
          })
        }
      >
        Capture
      </button>
      <button
        testID="skip-photo"
        onPress={() =>
          onPhotoCapture({
            photoUri: null,
            hasConsent: false,
          })
        }
      >
        Skip
      </button>
    </div>
  ),
}));

jest.mock('../../components/ManualEntryForm', () => ({
  ManualEntryForm: ({ onSave, onCancel }) => (
    <div testID="manual-entry-form">
      <button testID="save-manual" onPress={onSave}>
        Save Manual
      </button>
      <button testID="cancel-manual" onPress={onCancel}>
        Cancel Manual
      </button>
    </div>
  ),
}));

jest.mock('../../components/LocationPicker', () => ({
  LocationPicker: ({ onLocationSelected, onCancel }) => (
    <div testID="location-picker">
      <button testID="select-location" onPress={onLocationSelected}>
        Select Location
      </button>
      <button testID="cancel-location" onPress={onCancel}>
        Cancel Location
      </button>
    </div>
  ),
}));

describe('RecordScreen Photo Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    api.transcribe.mockResolvedValue({
      transcription: 'Test transcription',
      categorized_data: {
        name: 'Test Person',
        height: 70,
        weight: 150,
        skin_color: 'Medium',
        approximate_age: [45, 50],
      },
      missing_required: [],
      potential_matches: [],
    });

    api.saveIndividual.mockResolvedValue({ id: 'test-id' });
    api.uploadAudio.mockResolvedValue({ url: 'mock-audio-url' });
    compressImage.mockResolvedValue('file:///compressed.jpg');
    ErrorHandler.showSuccess = jest.fn();
    ErrorHandler.showError = jest.fn();
    ErrorHandler.handleError = jest.fn((err) => ({ message: err.message }));
    ErrorHandler.handleApiError = jest.fn((err) => ({ message: err.message }));
  });

  // Test 1: Photo uploads before individual save
  test('1. Photo uploads before individual save', async () => {
    const mockUploadPhoto = jest.fn().mockResolvedValue({
      photo_url: 'https://example.com/photo.jpg',
      consent_id: 'consent-123',
    });
    api.uploadPhoto = mockUploadPhoto;

    const { getByTestId } = render(<RecordScreen />);

    // Wait for render
    await waitFor(() => {
      expect(getByTestId('audio-recorder')).toBeTruthy();
    });

    // Start recording
    fireEvent.press(getByTestId('start-recording'));

    // Wait for transcription
    await waitFor(() => {
      expect(api.transcribe).toHaveBeenCalled();
    });

    // Wait for transcription results
    await waitFor(() => {
      expect(getByTestId('transcription-results')).toBeTruthy();
    });

    // Open photo capture
    fireEvent.press(getByTestId('add-photo-button'));

    // Capture photo
    fireEvent.press(getByTestId('capture-photo'));

    // Save the transcription
    fireEvent.press(getByTestId('save-transcription'));

    await waitFor(() => {
      // Photo should be uploaded first
      expect(mockUploadPhoto).toHaveBeenCalled();
      expect(api.saveIndividual).toHaveBeenCalled();

      // Verify order
      const uploadCallOrder = mockUploadPhoto.mock.invocationCallOrder[0];
      const saveCallOrder = api.saveIndividual.mock.invocationCallOrder[0];
      expect(uploadCallOrder).toBeLessThan(saveCallOrder);
    });
  });

  // Test 2: photo_url included in save request
  test('2. photo_url included in save request', async () => {
    const mockUploadPhoto = jest.fn().mockResolvedValue({
      photo_url: 'https://example.com/photo.jpg',
    });
    api.uploadPhoto = mockUploadPhoto;

    const { getByTestId } = render(<RecordScreen />);

    await waitFor(() => {
      expect(getByTestId('audio-recorder')).toBeTruthy();
    });

    // Start recording
    fireEvent.press(getByTestId('start-recording'));

    await waitFor(() => {
      expect(api.transcribe).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(getByTestId('transcription-results')).toBeTruthy();
    });

    // Open photo capture
    fireEvent.press(getByTestId('add-photo-button'));
    fireEvent.press(getByTestId('capture-photo'));
    fireEvent.press(getByTestId('save-transcription'));

    await waitFor(() => {
      expect(api.saveIndividual).toHaveBeenCalledWith(
        expect.objectContaining({
          photo_url: 'https://example.com/photo.jpg',
          name: 'Test Person',
          height: 70,
          weight: 150,
          skin_color: 'Medium',
          approximate_age: [45, 50],
        })
      );
    });
  });

  // Test 3: Save continues without photo on upload failure
  test('3. Save continues without photo on upload failure', async () => {
    const mockUploadPhoto = jest.fn().mockRejectedValue(new Error('Upload failed'));
    api.uploadPhoto = mockUploadPhoto;

    const { getByTestId } = render(<RecordScreen />);

    await waitFor(() => {
      expect(getByTestId('audio-recorder')).toBeTruthy();
    });

    // Start recording
    fireEvent.press(getByTestId('start-recording'));

    await waitFor(() => {
      expect(api.transcribe).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(getByTestId('transcription-results')).toBeTruthy();
    });

    // Add photo and save
    fireEvent.press(getByTestId('add-photo-button'));
    fireEvent.press(getByTestId('capture-photo'));
    fireEvent.press(getByTestId('save-transcription'));

    await waitFor(() => {
      // Photo upload should have been attempted
      expect(mockUploadPhoto).toHaveBeenCalled();

      // Save should still be called without photo_url
      expect(api.saveIndividual).toHaveBeenCalledWith(
        expect.not.objectContaining({
          photo_url: expect.any(String),
        })
      );

      // Error should be shown but success should still show for individual save
      expect(ErrorHandler.showError).toHaveBeenCalled();
      expect(ErrorHandler.showSuccess).toHaveBeenCalledWith('Data saved successfully');
    });
  });

  // Test 4: Loading spinner during photo upload
  test('4. Loading spinner during photo upload', async () => {
    let resolveUpload;
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve;
    });
    const mockUploadPhoto = jest.fn().mockReturnValue(uploadPromise);
    api.uploadPhoto = mockUploadPhoto;

    const { getByTestId, queryByTestId } = render(<RecordScreen />);

    await waitFor(() => {
      expect(getByTestId('audio-recorder')).toBeTruthy();
    });

    // Start recording
    fireEvent.press(getByTestId('start-recording'));

    await waitFor(() => {
      expect(api.transcribe).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(getByTestId('transcription-results')).toBeTruthy();
    });

    // Add photo
    fireEvent.press(getByTestId('add-photo-button'));
    fireEvent.press(getByTestId('capture-photo'));

    // Before pressing save, no loading
    expect(queryByTestId('photo-upload-loading')).toBeNull();

    fireEvent.press(getByTestId('save-transcription'));

    // Should show loading during upload
    await waitFor(() => {
      expect(queryByTestId('photo-upload-loading')).toBeTruthy();
    });

    // Resolve the upload
    resolveUpload({ photo_url: 'https://example.com/photo.jpg' });

    // Loading should disappear
    await waitFor(() => {
      expect(queryByTestId('photo-upload-loading')).toBeNull();
    });
  });

  // Test 5: No consent_id sent to /api/individuals
  test('5. No consent_id sent to /api/individuals', async () => {
    const mockUploadPhoto = jest.fn().mockResolvedValue({
      photo_url: 'https://example.com/photo.jpg',
      consent_id: 'consent-123', // This should NOT be passed to saveIndividual
    });
    api.uploadPhoto = mockUploadPhoto;

    const { getByTestId } = render(<RecordScreen />);

    await waitFor(() => {
      expect(getByTestId('audio-recorder')).toBeTruthy();
    });

    // Start recording
    fireEvent.press(getByTestId('start-recording'));

    await waitFor(() => {
      expect(api.transcribe).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(getByTestId('transcription-results')).toBeTruthy();
    });

    // Add photo and save
    fireEvent.press(getByTestId('add-photo-button'));
    fireEvent.press(getByTestId('capture-photo'));
    fireEvent.press(getByTestId('save-transcription'));

    await waitFor(() => {
      const saveCall = api.saveIndividual.mock.calls[0][0];
      expect(saveCall).not.toHaveProperty('consent_id');
      expect(saveCall).toHaveProperty('photo_url');
    });
  });

  // Test 6: Error toast on upload failure
  test('6. Error toast on upload failure', async () => {
    const mockUploadPhoto = jest.fn().mockRejectedValue(new Error('Network error'));
    api.uploadPhoto = mockUploadPhoto;

    const { getByTestId } = render(<RecordScreen />);

    await waitFor(() => {
      expect(getByTestId('audio-recorder')).toBeTruthy();
    });

    // Start recording
    fireEvent.press(getByTestId('start-recording'));

    await waitFor(() => {
      expect(api.transcribe).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(getByTestId('transcription-results')).toBeTruthy();
    });

    // Add photo and save
    fireEvent.press(getByTestId('add-photo-button'));
    fireEvent.press(getByTestId('capture-photo'));
    fireEvent.press(getByTestId('save-transcription'));

    await waitFor(() => {
      expect(ErrorHandler.showError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Network error'),
        })
      );
    });
  });

  // Additional test: Skip photo flow
  test('Skip photo flow - save without photo', async () => {
    const mockUploadPhoto = jest.fn();
    api.uploadPhoto = mockUploadPhoto;

    const { getByTestId } = render(<RecordScreen />);

    await waitFor(() => {
      expect(getByTestId('audio-recorder')).toBeTruthy();
    });

    // Start recording
    fireEvent.press(getByTestId('start-recording'));

    await waitFor(() => {
      expect(api.transcribe).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(getByTestId('transcription-results')).toBeTruthy();
    });

    // Skip photo and save directly
    fireEvent.press(getByTestId('save-transcription'));

    await waitFor(() => {
      // Photo upload should NOT be called
      expect(mockUploadPhoto).not.toHaveBeenCalled();

      // Save should be called without photo_url
      expect(api.saveIndividual).toHaveBeenCalledWith(
        expect.not.objectContaining({
          photo_url: expect.any(String),
        })
      );
    });
  });
});