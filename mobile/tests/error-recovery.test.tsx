/**
 * Task 4.0.4: Error Recovery Testing
 * Tests for all error recovery scenarios including network offline, timeouts, 
 * invalid responses, expired auth, and corrupted files
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { RecordScreen } from '../screens/RecordScreen';
import IndividualProfileScreen from '../screens/IndividualProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import { AuthProvider } from '../contexts/AuthContext';
import { api } from '../services/api';
import { ErrorHandler } from '../utils/errorHandler';
import { supabase } from '../services/supabase';
import Toast from 'react-native-toast-message';

// Mock NetInfo
const NetInfo = {
  fetch: jest.fn(),
  addEventListener: jest.fn()
};

// Mock all dependencies
jest.mock('../services/api');
jest.mock('../services/supabase');
jest.mock('../utils/errorHandler');
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

describe('Task 4.0.4: Error Recovery Testing', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  };

  const mockRoute = {
    params: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks
    NetInfo.fetch.mockResolvedValue({ isConnected: true });
    ErrorHandler.handleError = jest.fn((error) => ({
      code: 'NETWORK_ERROR',
      message: error.message,
      userMessage: 'Network error occurred. Please try again.',
      retryable: true,
      severity: 'high'
    }));
    ErrorHandler.showError = jest.fn();
    ErrorHandler.showSuccess = jest.fn();
  });

  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    );
  };

  describe('Network Offline During Save', () => {
    it('should show offline error when saving individual without network', async () => {
      // Mock network offline
      NetInfo.fetch.mockResolvedValue({ isConnected: false });
      
      // Mock API to throw network error
      api.saveIndividual.mockRejectedValue(new Error('Network request failed'));
      
      const { getByTestId, getByText } = renderWithAuth(
        <RecordScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Fill in required fields
      const nameInput = getByTestId('manual-name-input');
      const heightInput = getByTestId('manual-height-input');
      const weightInput = getByTestId('manual-weight-input');
      
      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(heightInput, '72');
      fireEvent.changeText(weightInput, '180');
      
      // Select skin color
      const skinColorLight = getByTestId('skin-color-Light');
      fireEvent.press(skinColorLight);

      // Try to save
      const saveButton = getByText('Save Individual');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(api.saveIndividual).toHaveBeenCalled();
        expect(ErrorHandler.handleError).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Network request failed' }),
          expect.any(String)
        );
        expect(ErrorHandler.showError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'NETWORK_ERROR',
            userMessage: 'Network error occurred. Please try again.',
            retryable: true
          })
        );
      });

      // Verify data is not lost
      expect(nameInput.props.value).toBe('John Doe');
      expect(heightInput.props.value).toBe('72');
      expect(weightInput.props.value).toBe('180');
    });

    it('should retry save when network comes back online', async () => {
      // Start offline
      NetInfo.fetch.mockResolvedValue({ isConnected: false });
      api.saveIndividual.mockRejectedValue(new Error('Network request failed'));
      
      const { getByTestId, getByText } = renderWithAuth(
        <RecordScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Fill form and try to save
      fireEvent.changeText(getByTestId('manual-name-input'), 'John Doe');
      fireEvent.changeText(getByTestId('manual-height-input'), '72');
      fireEvent.changeText(getByTestId('manual-weight-input'), '180');
      fireEvent.press(getByTestId('skin-color-Light'));
      
      const saveButton = getByText('Save Individual');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(api.saveIndividual).toHaveBeenCalled();
        expect(ErrorHandler.showError).toHaveBeenCalled();
      });

      // Network comes back online
      NetInfo.fetch.mockResolvedValue({ isConnected: true });
      api.saveIndividual.mockResolvedValue({ id: 'test-123', success: true });

      // Retry save
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(api.saveIndividual).toHaveBeenCalledTimes(2);
        expect(ErrorHandler.showSuccess).toHaveBeenCalled();
        expect(mockNavigation.navigate).toHaveBeenCalledWith('IndividualProfile', 
          expect.objectContaining({ individualId: 'test-123' })
        );
      });
    });

    it('should handle offline search gracefully', async () => {
      NetInfo.fetch.mockResolvedValue({ isConnected: false });
      api.searchIndividuals.mockRejectedValue(new Error('Network request failed'));

      const { getByTestId } = renderWithAuth(
        <SearchScreen navigation={mockNavigation} route={mockRoute} />
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'John');

      // Wait for debounce
      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(api.searchIndividuals).toHaveBeenCalled();
        expect(ErrorHandler.showError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'NETWORK_ERROR',
            userMessage: expect.stringContaining('network')
          })
        );
      });
    });
  });

  describe('Photo Upload Timeout and Retry', () => {
    it('should handle photo upload timeout with retry', async () => {
      const mockPhotoUri = 'file://test-photo.jpg';
      let attemptCount = 0;

      // Mock photo upload to fail twice then succeed
      api.uploadPhoto.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Request timeout'));
        }
        return Promise.resolve({ 
          photo_url: 'https://example.com/photo.jpg',
          consent_id: 'consent-123' 
        });
      });

      const { getByTestId, getByText } = renderWithAuth(
        <RecordScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Mock photo capture
      const photoCapture = getByTestId('photo-capture');
      fireEvent(photoCapture, 'onPhotoTaken', mockPhotoUri);

      // Fill required fields
      fireEvent.changeText(getByTestId('manual-name-input'), 'John Doe');
      fireEvent.changeText(getByTestId('manual-height-input'), '72');
      fireEvent.changeText(getByTestId('manual-weight-input'), '180');
      fireEvent.press(getByTestId('skin-color-Light'));

      // Save with photo
      const saveButton = getByText('Save Individual');
      fireEvent.press(saveButton);

      await waitFor(() => {
        // Should retry 3 times
        expect(api.uploadPhoto).toHaveBeenCalledTimes(3);
        expect(ErrorHandler.showError).toHaveBeenCalledTimes(2); // Show error for first 2 failures
        expect(ErrorHandler.showSuccess).toHaveBeenCalled(); // Success on third attempt
      });
    });

    it('should allow save without photo after 3 failed attempts', async () => {
      // Mock photo upload to always fail
      api.uploadPhoto.mockRejectedValue(new Error('Request timeout'));
      api.saveIndividual.mockResolvedValue({ id: 'test-123', success: true });

      const mockAlert = jest.spyOn(Alert, 'alert');

      const { getByTestId, getByText } = renderWithAuth(
        <RecordScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Mock photo capture
      const photoCapture = getByTestId('photo-capture');
      fireEvent(photoCapture, 'onPhotoTaken', 'file://test-photo.jpg');

      // Fill required fields
      fireEvent.changeText(getByTestId('manual-name-input'), 'John Doe');
      fireEvent.changeText(getByTestId('manual-height-input'), '72');
      fireEvent.changeText(getByTestId('manual-weight-input'), '180');
      fireEvent.press(getByTestId('skin-color-Light'));

      // Try to save
      const saveButton = getByText('Save Individual');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(api.uploadPhoto).toHaveBeenCalledTimes(3);
        expect(mockAlert).toHaveBeenCalledWith(
          'Photo Upload Failed',
          expect.stringContaining('continue without the photo'),
          expect.arrayContaining([
            expect.objectContaining({ text: 'Cancel' }),
            expect.objectContaining({ text: 'Save Without Photo' })
          ])
        );
      });

      // Click "Save Without Photo"
      const alertButtons = mockAlert.mock.calls[0][2];
      const saveWithoutPhotoButton = alertButtons.find(btn => btn.text === 'Save Without Photo');
      saveWithoutPhotoButton.onPress();

      await waitFor(() => {
        expect(api.saveIndividual).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            photo_url: null // Should save without photo
          })
        );
        expect(mockNavigation.navigate).toHaveBeenCalled();
      });
    });
  });

  describe('Invalid Server Responses', () => {
    it('should handle malformed JSON response', async () => {
      // Mock API to return invalid JSON
      const mockFetch = jest.spyOn(global, 'fetch');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: jest.fn().mockResolvedValue('Invalid response format'),
      });

      const { getByTestId } = renderWithAuth(
        <SearchScreen navigation={mockNavigation} route={mockRoute} />
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'test');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(ErrorHandler.showError).toHaveBeenCalledWith(
          expect.objectContaining({
            userMessage: expect.stringContaining('error occurred')
          })
        );
      });

      mockFetch.mockRestore();
    });

    it('should handle 500 server errors gracefully', async () => {
      api.saveIndividual.mockRejectedValue(new Error('API request failed: 500 Internal Server Error'));

      ErrorHandler.handleError.mockReturnValue({
        code: 'SERVER_ERROR',
        message: 'Server error',
        userMessage: 'Server error occurred. Please try again later.',
        retryable: true,
        severity: 'high'
      });

      const { getByTestId, getByText } = renderWithAuth(
        <RecordScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Fill and save
      fireEvent.changeText(getByTestId('manual-name-input'), 'John Doe');
      fireEvent.changeText(getByTestId('manual-height-input'), '72');
      fireEvent.changeText(getByTestId('manual-weight-input'), '180');
      fireEvent.press(getByTestId('skin-color-Light'));
      
      fireEvent.press(getByText('Save Individual'));

      await waitFor(() => {
        expect(ErrorHandler.showError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'SERVER_ERROR',
            userMessage: 'Server error occurred. Please try again later.',
            retryable: true
          })
        );
      });
    });

    it('should handle 404 responses appropriately', async () => {
      api.getIndividualProfile.mockRejectedValue(new Error('API request failed: 404 Not Found'));

      ErrorHandler.handleError.mockReturnValue({
        code: 'NOT_FOUND',
        message: 'Resource not found',
        userMessage: 'The requested individual was not found.',
        retryable: false,
        severity: 'medium'
      });

      const { getByText } = renderWithAuth(
        <IndividualProfileScreen 
          navigation={mockNavigation} 
          route={{ params: { individualId: 'non-existent-id' } }} 
        />
      );

      await waitFor(() => {
        expect(api.getIndividualProfile).toHaveBeenCalledWith('non-existent-id');
        expect(ErrorHandler.showError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'NOT_FOUND',
            userMessage: 'The requested individual was not found.',
            retryable: false
          })
        );
      });
    });
  });

  describe('Expired Auth Token Handling', () => {
    it('should handle 401 unauthorized errors', async () => {
      api.saveIndividual.mockRejectedValue(new Error('API request failed: 401 Unauthorized'));
      
      ErrorHandler.handleError.mockReturnValue({
        code: 'UNAUTHORIZED',
        message: 'Authentication failed',
        userMessage: 'Please log in again to continue.',
        retryable: false,
        severity: 'high'
      });

      // Mock auth refresh
      supabase.auth.refreshSession = jest.fn().mockResolvedValue({
        data: { session: { access_token: 'new-token' } },
        error: null
      });

      const { getByTestId, getByText } = renderWithAuth(
        <RecordScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Fill and save
      fireEvent.changeText(getByTestId('manual-name-input'), 'John Doe');
      fireEvent.changeText(getByTestId('manual-height-input'), '72');
      fireEvent.changeText(getByTestId('manual-weight-input'), '180');
      fireEvent.press(getByTestId('skin-color-Light'));
      
      fireEvent.press(getByText('Save Individual'));

      await waitFor(() => {
        expect(api.saveIndividual).toHaveBeenCalled();
        expect(ErrorHandler.showError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'UNAUTHORIZED',
            userMessage: 'Please log in again to continue.'
          })
        );
      });
    });

    it('should automatically refresh token and retry', async () => {
      let callCount = 0;
      
      // First call fails with 401, second succeeds
      api.searchIndividuals.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('API request failed: 401 Unauthorized'));
        }
        return Promise.resolve([
          { id: '1', name: 'John Doe', danger_score: 50 }
        ]);
      });

      // Mock token refresh
      supabase.auth.refreshSession = jest.fn().mockResolvedValue({
        data: { session: { access_token: 'refreshed-token' } },
        error: null
      });

      const { getByTestId } = renderWithAuth(
        <SearchScreen navigation={mockNavigation} route={mockRoute} />
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'John');

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(api.searchIndividuals).toHaveBeenCalledTimes(2); // Initial + retry
        expect(supabase.auth.refreshSession).toHaveBeenCalled();
      });
    });
  });

  describe('Corrupted Audio File Handling', () => {
    it('should handle corrupted audio file during transcription', async () => {
      api.transcribe.mockRejectedValue(new Error('Audio file corrupted or invalid format'));

      ErrorHandler.handleError.mockReturnValue({
        code: 'AUDIO_ERROR',
        message: 'Audio file corrupted',
        userMessage: 'The audio file appears to be corrupted. Please try recording again.',
        retryable: false,
        severity: 'medium'
      });

      const { getByTestId } = renderWithAuth(
        <RecordScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Mock audio recording
      const audioRecorder = getByTestId('audio-recorder');
      fireEvent(audioRecorder, 'onRecordingComplete', {
        uri: 'file://corrupted-audio.m4a',
        duration: 15000
      });

      await waitFor(() => {
        expect(api.transcribe).toHaveBeenCalled();
        expect(ErrorHandler.showError).toHaveBeenCalledWith(
          expect.objectContaining({
            userMessage: expect.stringContaining('corrupted')
          })
        );
      });

      // Verify UI allows re-recording
      expect(getByTestId('start-recording-button')).toBeTruthy();
    });

    it('should validate audio file size before upload', async () => {
      const { getByTestId } = renderWithAuth(
        <RecordScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Mock oversized audio file
      const audioRecorder = getByTestId('audio-recorder');
      fireEvent(audioRecorder, 'onRecordingComplete', {
        uri: 'file://large-audio.m4a',
        duration: 150000, // 2.5 minutes (over 2 minute limit)
        size: 10485760 // 10MB
      });

      await waitFor(() => {
        expect(ErrorHandler.showError).toHaveBeenCalledWith(
          expect.objectContaining({
            userMessage: expect.stringContaining('too large')
          })
        );
      });

      // Should not attempt transcription
      expect(api.transcribe).not.toHaveBeenCalled();
    });
  });

  describe('Error Message Display', () => {
    it('should show appropriate user-friendly error messages', async () => {
      const errorScenarios = [
        {
          error: new Error('Network request failed'),
          expectedMessage: 'No internet connection. Please check your network and try again.'
        },
        {
          error: new Error('Request timeout'),
          expectedMessage: 'Request timed out. Please try again.'
        },
        {
          error: new Error('Recording permission denied'),
          expectedMessage: 'Please allow microphone access to record audio.'
        },
        {
          error: new Error('Location permission denied'),
          expectedMessage: 'Please allow location access to capture GPS coordinates.'
        }
      ];

      for (const scenario of errorScenarios) {
        ErrorHandler.handleError.mockReturnValue({
          code: 'TEST_ERROR',
          message: scenario.error.message,
          userMessage: scenario.expectedMessage,
          retryable: true,
          severity: 'medium'
        });

        api.saveIndividual.mockRejectedValue(scenario.error);

        const { getByTestId, getByText } = renderWithAuth(
          <RecordScreen navigation={mockNavigation} route={mockRoute} />
        );

        // Fill and save
        fireEvent.changeText(getByTestId('manual-name-input'), 'Test');
        fireEvent.changeText(getByTestId('manual-height-input'), '72');
        fireEvent.changeText(getByTestId('manual-weight-input'), '180');
        fireEvent.press(getByTestId('skin-color-Light'));
        fireEvent.press(getByText('Save Individual'));

        await waitFor(() => {
          expect(Toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
              text2: scenario.expectedMessage
            })
          );
        });

        jest.clearAllMocks();
      }
    });
  });

  describe('Data Loss Prevention', () => {
    it('should preserve form data after network error', async () => {
      api.saveIndividual.mockRejectedValue(new Error('Network request failed'));

      const { getByTestId, getByText } = renderWithAuth(
        <RecordScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Fill complex form
      fireEvent.changeText(getByTestId('manual-name-input'), 'John Doe');
      fireEvent.changeText(getByTestId('manual-height-input'), '72');
      fireEvent.changeText(getByTestId('manual-weight-input'), '180');
      fireEvent.press(getByTestId('skin-color-Medium'));
      
      // Add custom fields
      const addFieldButton = getByTestId('add-field-button');
      fireEvent.press(addFieldButton);
      fireEvent.changeText(getByTestId('field-gender'), 'Male');

      // Try to save and fail
      fireEvent.press(getByText('Save Individual'));

      await waitFor(() => {
        expect(api.saveIndividual).toHaveBeenCalled();
        expect(ErrorHandler.showError).toHaveBeenCalled();
      });

      // Verify all data is preserved
      expect(getByTestId('manual-name-input').props.value).toBe('John Doe');
      expect(getByTestId('manual-height-input').props.value).toBe('72');
      expect(getByTestId('manual-weight-input').props.value).toBe('180');
      expect(getByTestId('skin-color-Medium').props.selected).toBe(true);
      expect(getByTestId('field-gender').props.value).toBe('Male');
    });

    it('should save draft to AsyncStorage on error', async () => {
      api.saveIndividual.mockRejectedValue(new Error('Network request failed'));

      const { getByTestId, getByText } = renderWithAuth(
        <RecordScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Fill form
      fireEvent.changeText(getByTestId('manual-name-input'), 'Draft Test');
      fireEvent.changeText(getByTestId('manual-height-input'), '70');
      fireEvent.changeText(getByTestId('manual-weight-input'), '160');
      fireEvent.press(getByTestId('skin-color-Dark'));

      // Try to save
      fireEvent.press(getByText('Save Individual'));

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'draft_individual',
          expect.stringContaining('Draft Test')
        );
      });
    });
  });

  describe('Retry Mechanism Verification', () => {
    it('should implement exponential backoff for retries', async () => {
      let attemptTimes = [];
      api.uploadPhoto.mockImplementation(() => {
        attemptTimes.push(Date.now());
        return Promise.reject(new Error('Request timeout'));
      });

      const { getByTestId, getByText } = renderWithAuth(
        <RecordScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Setup photo and form
      fireEvent(getByTestId('photo-capture'), 'onPhotoTaken', 'file://test.jpg');
      fireEvent.changeText(getByTestId('manual-name-input'), 'Test');
      fireEvent.changeText(getByTestId('manual-height-input'), '72');
      fireEvent.changeText(getByTestId('manual-weight-input'), '180');
      fireEvent.press(getByTestId('skin-color-Light'));

      // Trigger save with retries
      fireEvent.press(getByText('Save Individual'));

      await waitFor(() => {
        expect(api.uploadPhoto).toHaveBeenCalledTimes(3);
      });

      // Verify exponential backoff
      const delays = [];
      for (let i = 1; i < attemptTimes.length; i++) {
        delays.push(attemptTimes[i] - attemptTimes[i-1]);
      }

      // Each retry should have increasing delay
      expect(delays[1]).toBeGreaterThan(delays[0]);
    });

    it('should not retry non-retryable errors', async () => {
      api.saveIndividual.mockRejectedValue(new Error('API request failed: 403 Forbidden'));

      ErrorHandler.handleError.mockReturnValue({
        code: 'FORBIDDEN',
        message: 'Access denied',
        userMessage: 'You don\'t have permission to perform this action.',
        retryable: false,
        severity: 'high'
      });

      const { getByTestId, getByText } = renderWithAuth(
        <RecordScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Fill and save
      fireEvent.changeText(getByTestId('manual-name-input'), 'Test');
      fireEvent.changeText(getByTestId('manual-height-input'), '72');
      fireEvent.changeText(getByTestId('manual-weight-input'), '180');
      fireEvent.press(getByTestId('skin-color-Light'));
      fireEvent.press(getByText('Save Individual'));

      await waitFor(() => {
        expect(api.saveIndividual).toHaveBeenCalledTimes(1); // Should not retry
        expect(ErrorHandler.showError).toHaveBeenCalled();
      });
    });
  });
});