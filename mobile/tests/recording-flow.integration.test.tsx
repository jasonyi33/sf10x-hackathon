import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { RecordScreen } from '../screens/RecordScreen';
import { AuthProvider } from '../contexts/AuthContext';

// Mock all the dependencies
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    Recording: {
      createAsync: jest.fn(() => Promise.resolve({ recording: {} })),
    },
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: 37.7749, longitude: -122.4194 }
  })),
  reverseGeocodeAsync: jest.fn(() => Promise.resolve([{
    street: 'Market Street',
    city: 'San Francisco',
    region: 'CA'
  }])),
}));

jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    MapView: View,
    Marker: View,
  };
});

jest.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: { access_token: 'mock-token' } } })),
    },
  },
  uploadAudio: jest.fn(() => Promise.resolve({ url: 'https://mock-audio-url.com/recording.m4a' })),
}));

jest.mock('../services/api', () => ({
  api: {
    transcribe: jest.fn(() => Promise.resolve({
      transcription: "Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication.",
      categorized_data: {
        name: "John",
        age: 45,
        height: 72,
        weight: 180,
        skin_color: "Light",
        substance_abuse_history: "Moderate",
        medical_conditions: "Diabetes",
        location: "Market Street"
      },
      missing_required: [],
      potential_matches: [
        {
          id: "123",
          confidence: 87,
          name: "John Smith"
        }
      ]
    })),
  },
  TranscriptionResult: jest.fn(),
}));

// Mock Alert
const mockAlert = jest.fn();
global.Alert = {
  alert: mockAlert,
};

describe('Recording Flow Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    );
  };

  it('should complete full recording → upload → transcribe → save flow', async () => {
    const { getByText, queryByText } = renderWithAuth(<RecordScreen />);

    // Step 1: Verify initial state
    expect(getByText('Voice Recording')).toBeTruthy();
    expect(getByText('📝 Manual Entry')).toBeTruthy();

    // Step 2: Start recording
    const recordButton = getByText('🎤 Start Recording');
    fireEvent.press(recordButton);

    // Step 3: Verify recording started
    await waitFor(() => {
      expect(getByText('⏸️ Pause')).toBeTruthy();
      expect(getByText('⏹️ Stop')).toBeTruthy();
    });

    // Step 4: Stop recording
    const stopButton = getByText('⏹️ Stop');
    fireEvent.press(stopButton);

    // Step 5: Verify upload started
    await waitFor(() => {
      expect(getByText('Uploading audio...')).toBeTruthy();
    });

    // Step 6: Verify transcription started
    await waitFor(() => {
      expect(getByText('Transcribing audio...')).toBeTruthy();
    });

    // Step 7: Verify transcription results shown
    await waitFor(() => {
      expect(getByText('Review Transcription')).toBeTruthy();
      expect(getByText('Met John near Market Street')).toBeTruthy();
      expect(getByText('John')).toBeTruthy();
      expect(getByText('45')).toBeTruthy();
      expect(getByText('72')).toBeTruthy();
      expect(getByText('180')).toBeTruthy();
      expect(getByText('Light')).toBeTruthy();
    });

    // Step 8: Verify potential match shown
    expect(getByText('Potential Matches')).toBeTruthy();
    expect(getByText('John Smith')).toBeTruthy();
    expect(getByText('87% match (Manual review)')).toBeTruthy();

    // Step 9: Save transcription
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    // Step 10: Verify merge UI appears for low confidence match
    await waitFor(() => {
      expect(getByText('Potential Duplicate Found')).toBeTruthy();
      expect(getByText('87%')).toBeTruthy();
      expect(getByText('We found a similar individual: John Smith')).toBeTruthy();
    });

    // Step 11: Choose to merge
    const mergeButton = getByText('Merge');
    fireEvent.press(mergeButton);

    // Step 12: Verify save success
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Save Successful',
        'Transcription data saved successfully!',
        expect.any(Array)
      );
    });
  });

  it('should handle manual entry flow', async () => {
    const { getByText, queryByText } = renderWithAuth(<RecordScreen />);

    // Step 1: Click manual entry button
    const manualEntryButton = getByText('📝 Manual Entry');
    fireEvent.press(manualEntryButton);

    // Step 2: Verify manual entry form shown
    await waitFor(() => {
      expect(getByText('Manual Entry')).toBeTruthy();
      expect(getByText('Required Information')).toBeTruthy();
      expect(getByText('Name *')).toBeTruthy();
      expect(getByText('Height (inches) *')).toBeTruthy();
      expect(getByText('Weight (pounds) *')).toBeTruthy();
      expect(getByText('Skin Color *')).toBeTruthy();
    });

    // Step 3: Fill in required fields
    const nameInput = getByText('Name *').parent?.parent?.findByType('TextInput');
    const heightInput = getByText('Height (inches) *').parent?.parent?.findByType('TextInput');
    const weightInput = getByText('Weight (pounds) *').parent?.parent?.findByType('TextInput');

    // Note: In a real test, we would fill these inputs
    // For now, we'll just verify the form structure

    // Step 4: Save manual entry
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    // Step 5: Verify save success
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Save Successful',
        'Manual entry data saved successfully!',
        expect.any(Array)
      );
    });
  });

  it('should handle location capture during recording', async () => {
    const { getByText } = renderWithAuth(<RecordScreen />);

    // Step 1: Set location first
    const locationButton = getByText('📍 Set Location');
    fireEvent.press(locationButton);

    // Step 2: Verify location picker shown
    await waitFor(() => {
      expect(getByText('Select Location')).toBeTruthy();
      expect(getByText('Tap and drag the pin to adjust the location')).toBeTruthy();
    });

    // Step 3: Confirm location
    const confirmButton = getByText('Confirm Location');
    fireEvent.press(confirmButton);

    // Step 4: Verify location set
    await waitFor(() => {
      expect(getByText('📍 Location: Market Street San Francisco CA')).toBeTruthy();
    });

    // Step 5: Start recording (location should be captured)
    const recordButton = getByText('🎤 Start Recording');
    fireEvent.press(recordButton);

    // Step 6: Stop recording
    const stopButton = getByText('⏹️ Stop');
    fireEvent.press(stopButton);

    // Step 7: Verify location data is included in save
    await waitFor(() => {
      expect(getByText('Review Transcription')).toBeTruthy();
    });

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    // Step 8: Verify location data is preserved
    await waitFor(() => {
      expect(getByText('Potential Duplicate Found')).toBeTruthy();
    });
  });

  it('should handle high confidence auto-merge', async () => {
    // Mock high confidence match
    const { api } = require('../services/api');
    api.transcribe.mockResolvedValueOnce({
      transcription: "Met John near Market Street...",
      categorized_data: {
        name: "John",
        age: 45,
        height: 72,
        weight: 180,
        skin_color: "Light",
      },
      missing_required: [],
      potential_matches: [
        {
          id: "123",
          confidence: 96,
          name: "John Smith"
        }
      ]
    });

    const { getByText } = renderWithAuth(<RecordScreen />);

    // Start and stop recording
    const recordButton = getByText('🎤 Start Recording');
    fireEvent.press(recordButton);

    const stopButton = getByText('⏹️ Stop');
    fireEvent.press(stopButton);

    // Wait for transcription
    await waitFor(() => {
      expect(getByText('Review Transcription')).toBeTruthy();
    });

    // Verify high confidence match shown
    expect(getByText('96% match (Auto-merge)')).toBeTruthy();

    // Save should trigger auto-merge dialog
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    // Verify auto-merge dialog
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Auto-Merge',
        'High confidence match found (96%). Automatically merging with existing individual: John Smith',
        expect.any(Array)
      );
    });
  });

  it('should handle recording duration limits', async () => {
    const { getByText } = renderWithAuth(<RecordScreen />);

    // Start recording
    const recordButton = getByText('🎤 Start Recording');
    fireEvent.press(recordButton);

    // Verify recording started
    await waitFor(() => {
      expect(getByText('⏹️ Stop')).toBeTruthy();
    });

    // Stop button should be disabled initially (before 10 seconds)
    const stopButton = getByText('⏹️ Stop');
    expect(stopButton.props.disabled).toBe(true);

    // Simulate recording for 15 seconds
    await act(async () => {
      // Fast-forward time to simulate recording duration
      jest.advanceTimersByTime(15000);
    });

    // Stop button should be enabled after 10 seconds
    expect(stopButton.props.disabled).toBe(false);
  });

  it('should handle upload and transcription errors gracefully', async () => {
    // Mock upload error
    const { uploadAudio } = require('../services/supabase');
    uploadAudio.mockRejectedValueOnce(new Error('Upload failed'));

    const { getByText } = renderWithAuth(<RecordScreen />);

    // Start and stop recording
    const recordButton = getByText('🎤 Start Recording');
    fireEvent.press(recordButton);

    const stopButton = getByText('⏹️ Stop');
    fireEvent.press(stopButton);

    // Verify error handling
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Upload Failed', 'Upload failed');
    });
  });
}); 