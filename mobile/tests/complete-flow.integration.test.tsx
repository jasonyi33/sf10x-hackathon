import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RecordScreen } from '../screens/RecordScreen';
import SearchScreen from '../screens/SearchScreen';
import IndividualProfileScreen from '../screens/IndividualProfileScreen';
import { AuthProvider } from '../contexts/AuthContext';
import PhotoCapture from '../components/PhotoCapture';

// Mock all the dependencies
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    Recording: {
      createAsync: jest.fn(() => Promise.resolve({ 
        recording: {
          stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
          getURI: jest.fn(() => 'file://mock-audio.m4a'),
          getStatusAsync: jest.fn(() => Promise.resolve({ durationMillis: 30000 }))
        } 
      })),
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

jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    Constants: {
      Type: {
        back: 'back',
        front: 'front',
      },
    },
  },
  CameraType: {
    back: 'back',
    front: 'front',
  },
}));

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(() => Promise.resolve({
    cancelled: false,
    assets: [{
      uri: 'file://mock-photo.jpg',
      width: 1000,
      height: 1000,
    }]
  })),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn((uri) => Promise.resolve({
    uri: uri.replace('.jpg', '-compressed.jpg'),
    width: 800,
    height: 800,
  })),
  SaveFormat: {
    JPEG: 'jpeg',
  },
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
      transcription: "Met John Doe near Market Street. Male, about 45 to 50 years old, approximately 5 feet 10 inches tall, around 180 pounds. Medium skin color. Has been on the streets for about 3 months.",
      categorized_data: {
        name: "John Doe",
        approximate_age: [45, 50],
        gender: "Male",
        height: 70,
        weight: 180,
        skin_color: "Medium",
      },
      missing_required: [],
      potential_matches: []
    })),
    uploadPhoto: jest.fn(() => Promise.resolve({
      photo_url: 'https://mock-storage.com/photos/john-doe.jpg'
    })),
    saveIndividual: jest.fn(() => Promise.resolve({
      individual: {
        id: 'ind-123',
        name: 'John Doe',
        danger_score: 20,
        danger_override: null,
        photo_url: 'https://mock-storage.com/photos/john-doe.jpg',
        data: {
          name: "John Doe",
          approximate_age: [45, 50],
          gender: "Male",
          height: 70,
          weight: 180,
          skin_color: "Medium",
        },
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      interaction: {
        id: 'int-456',
        individual_id: 'ind-123',
        user_id: 'user-789',
        user_name: 'Demo User',
        created_at: '2024-01-15T10:00:00Z',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          address: 'Market Street, San Francisco, CA'
        }
      }
    })),
    searchIndividuals: jest.fn(() => Promise.resolve({
      individuals: [
        {
          id: 'ind-123',
          name: 'John Doe',
          danger_score: 20,
          danger_override: null,
          display_score: 20,
          last_seen: '2024-01-15T10:00:00Z',
          last_location: {
            latitude: 37.7749,
            longitude: -122.4194,
            address_abbreviated: 'Market St'
          }
        }
      ],
      total: 1,
      offset: 0,
      limit: 10
    })),
    getIndividual: jest.fn(() => Promise.resolve({
      individual: {
        id: 'ind-123',
        name: 'John Doe',
        danger_score: 20,
        danger_override: null,
        display_score: 20,
        data: {
          name: "John Doe",
          approximate_age: [45, 50],
          gender: "Male",
          height: 70,
          weight: 180,
          skin_color: "Medium",
        },
        photo_url: 'https://mock-storage.com/photos/john-doe.jpg',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      recent_interactions: [
        {
          id: 'int-456',
          created_at: '2024-01-15T10:00:00Z',
          user_name: 'Demo User',
          location: {
            latitude: 37.7749,
            longitude: -122.4194,
            address: 'Market Street, San Francisco, CA'
          },
          has_transcription: true
        }
      ]
    })),
    getFilterOptions: jest.fn(() => Promise.resolve({
      filters: {
        gender: ['Male', 'Female', 'Other', 'Unknown'],
        age_range: { min: 18, max: 85 },
        height_range: { min: 48, max: 84 },
        has_photo: [true, false],
        danger_score_range: { min: 0, max: 100 },
        skin_color: ['Light', 'Medium', 'Dark']
      },
      cached_at: '2024-01-15T10:00:00Z',
      expires_at: '2024-01-15T11:00:00Z'
    })),
  },
}));

// Mock Alert
const mockAlert = jest.fn();
global.Alert = {
  alert: mockAlert,
};

// Mock navigation
const Stack = createStackNavigator();

const TestNavigator = ({ initialRouteName = 'Record' }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen name="Record" component={RecordScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="IndividualProfile" component={IndividualProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe('Task 4.0.1: Complete Flow Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    );
  };

  describe('Test Scenario 1: Voice to Profile with Photo', () => {
    it('should complete full flow from recording to profile with photo', async () => {
      const { getByText, getByTestId, queryByText } = renderWithAuth(
        <TestNavigator />
      );

      // Step 1: Record 30-second audio about individual
      expect(getByText('Voice Recording')).toBeTruthy();
      
      const recordButton = getByText('🎤 Start Recording');
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(getByText('⏹️ Stop')).toBeTruthy();
      });

      // Simulate 30-second recording
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      const stopButton = getByText('⏹️ Stop');
      fireEvent.press(stopButton);

      // Step 2: Verify transcription includes all required fields
      await waitFor(() => {
        expect(getByText('Review Transcription')).toBeTruthy();
        expect(getByText(/Met John Doe near Market Street/)).toBeTruthy();
      });

      // Verify all required fields are present
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('45-50')).toBeTruthy(); // Age display
      expect(getByText('70')).toBeTruthy(); // Height
      expect(getByText('180')).toBeTruthy(); // Weight
      expect(getByText('Medium')).toBeTruthy(); // Skin color

      // Step 3: Add photo with consent
      const addPhotoButton = getByText('📷 Add Photo');
      fireEvent.press(addPhotoButton);

      await waitFor(() => {
        expect(getByText('Take Photo')).toBeTruthy();
      });

      // Simulate taking photo
      const takePhotoButton = getByText('Take Photo');
      fireEvent.press(takePhotoButton);

      await waitFor(() => {
        expect(getByText('Use Photo')).toBeTruthy();
      });

      // Consent checkbox
      const consentCheckbox = getByTestId('consent-checkbox');
      fireEvent.press(consentCheckbox);

      const usePhotoButton = getByText('Use Photo');
      fireEvent.press(usePhotoButton);

      // Step 4: Save individual
      await waitFor(() => {
        expect(getByText('Save')).toBeTruthy();
      });

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Save Successful',
          expect.any(String),
          expect.any(Array)
        );
      });

      // Step 5: Navigate to search
      // Simulate navigation to search screen
      const searchTab = getByText('Search');
      fireEvent.press(searchTab);

      // Step 6: Search for individual using filters
      await waitFor(() => {
        expect(getByTestId('search-input')).toBeTruthy();
      });

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'John');

      // Wait for debounce
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      // Click on the individual
      const individualItem = getByText('John Doe');
      fireEvent.press(individualItem);

      // Step 6: Verify profile shows all data and photo
      await waitFor(() => {
        expect(getByText('Individual Profile')).toBeTruthy();
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText('Male, 45-50 years')).toBeTruthy();
        expect(getByTestId('profile-photo')).toBeTruthy();
      });
    });
  });

  describe('Test Scenario 2: Search with Multiple Filters', () => {
    it('should search with multiple filters and sort results', async () => {
      const { getByText, getByTestId } = renderWithAuth(
        <TestNavigator initialRouteName="Search" />
      );

      // Step 1: Navigate to search screen (already there)
      expect(getByTestId('search-input')).toBeTruthy();

      // Step 2: Expand filters
      const filterToggle = getByText('Filters');
      fireEvent.press(filterToggle);

      await waitFor(() => {
        expect(getByTestId('filter-section')).toBeTruthy();
      });

      // Step 3: Set gender = Male
      const genderFilter = getByTestId('gender-filter-Male');
      fireEvent.press(genderFilter);

      // Step 4: Set age range 40-60
      const ageMinSlider = getByTestId('age-min-slider');
      const ageMaxSlider = getByTestId('age-max-slider');
      
      fireEvent(ageMinSlider, 'onValueChange', 40);
      fireEvent(ageMaxSlider, 'onValueChange', 60);

      // Step 5: Set has photo = Yes
      const hasPhotoYes = getByTestId('has-photo-yes');
      fireEvent.press(hasPhotoYes);

      // Step 6: Apply filters
      const applyButton = getByText('Apply Filters');
      fireEvent.press(applyButton);

      // Verify results match all criteria
      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
        // Verify filter tags are shown
        expect(getByText('Gender: Male')).toBeTruthy();
        expect(getByText('Age: 40-60')).toBeTruthy();
        expect(getByText('Has Photo')).toBeTruthy();
      });

      // Step 7: Sort by name A-Z
      const sortDropdown = getByTestId('sort-dropdown');
      fireEvent.press(sortDropdown);

      await waitFor(() => {
        expect(getByText('Name A-Z')).toBeTruthy();
      });

      const sortByName = getByText('Name A-Z');
      fireEvent.press(sortByName);

      // Step 8: Verify sort order correct
      await waitFor(() => {
        // The results should be sorted alphabetically
        const { api } = require('../services/api');
        expect(api.searchIndividuals).toHaveBeenCalledWith(
          expect.objectContaining({
            gender: 'Male',
            age_min: 40,
            age_max: 60,
            has_photo: true,
            sort_by: 'name',
            sort_order: 'asc'
          })
        );
      });
    });
  });

  describe('Test Scenario 3: Photo Update Flow', () => {
    it('should update photo on existing individual profile', async () => {
      // Mock individual with existing photo
      const { api } = require('../services/api');
      api.getIndividual.mockResolvedValue({
        individual: {
          id: 'ind-123',
          name: 'John Doe',
          danger_score: 20,
          danger_override: null,
          display_score: 20,
          data: {
            name: "John Doe",
            approximate_age: [45, 50],
            gender: "Male",
            height: 70,
            weight: 180,
            skin_color: "Medium",
          },
          photo_url: 'https://mock-storage.com/photos/john-doe-old.jpg',
          photo_history: [
            {
              url: 'https://mock-storage.com/photos/john-doe-older.jpg',
              added_at: '2024-01-10T10:00:00Z'
            }
          ],
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        recent_interactions: []
      });

      const { getByText, getByTestId } = renderWithAuth(
        <TestNavigator initialRouteName="Search" />
      );

      // Step 1: Find existing individual
      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'John Doe');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      const individualItem = getByText('John Doe');
      fireEvent.press(individualItem);

      // Navigate to profile
      await waitFor(() => {
        expect(getByText('Individual Profile')).toBeTruthy();
      });

      // Step 2: Update photo from profile
      const updatePhotoButton = getByTestId('update-photo-button');
      fireEvent.press(updatePhotoButton);

      await waitFor(() => {
        expect(getByText('Update Photo')).toBeTruthy();
      });

      // Take new photo
      const takePhotoButton = getByText('Take Photo');
      fireEvent.press(takePhotoButton);

      await waitFor(() => {
        expect(getByText('Use Photo')).toBeTruthy();
      });

      // Step 3: Verify consent required
      const usePhotoButton = getByText('Use Photo');
      expect(usePhotoButton.props.disabled).toBe(true);

      // Check consent
      const consentCheckbox = getByTestId('consent-checkbox');
      fireEvent.press(consentCheckbox);

      expect(usePhotoButton.props.disabled).toBe(false);
      fireEvent.press(usePhotoButton);

      // Mock photo update response
      api.uploadPhoto.mockResolvedValueOnce({
        photo_url: 'https://mock-storage.com/photos/john-doe-new.jpg'
      });

      api.saveIndividual.mockResolvedValueOnce({
        individual: {
          id: 'ind-123',
          name: 'John Doe',
          photo_url: 'https://mock-storage.com/photos/john-doe-new.jpg',
          photo_history: [
            {
              url: 'https://mock-storage.com/photos/john-doe-old.jpg',
              added_at: '2024-01-15T10:00:00Z'
            },
            {
              url: 'https://mock-storage.com/photos/john-doe-older.jpg',
              added_at: '2024-01-10T10:00:00Z'
            }
          ]
        },
        interaction: null // No new interaction for photo update
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Photo Updated',
          'Photo has been successfully updated.',
          expect.any(Array)
        );
      });

      // Step 4: Verify old photo in history
      await waitFor(() => {
        expect(getByTestId('photo-gallery')).toBeTruthy();
      });

      const photoGallery = getByTestId('photo-gallery');
      fireEvent.press(photoGallery);

      await waitFor(() => {
        expect(getByText('Photo History')).toBeTruthy();
        // Should show 2 historical photos
        expect(getByTestId('history-photo-0')).toBeTruthy();
        expect(getByTestId('history-photo-1')).toBeTruthy();
      });

      // Step 5: Verify no new interaction created
      const { api: apiMock } = require('../services/api');
      const saveCalls = apiMock.saveIndividual.mock.calls;
      const lastCall = saveCalls[saveCalls.length - 1];
      
      // Photo update should not create a new interaction
      expect(lastCall[0]).toMatchObject({
        merge_with_id: 'ind-123',
        photo_url: 'https://mock-storage.com/photos/john-doe-new.jpg',
        // No transcription or other interaction data
        transcription: undefined,
        location: undefined
      });
    });
  });

  // Additional edge case tests
  describe('Edge Cases', () => {
    it('should handle unknown age display correctly', async () => {
      const { api } = require('../services/api');
      api.transcribe.mockResolvedValueOnce({
        transcription: "Met someone near Market Street. Gender unknown, age unknown.",
        categorized_data: {
          name: "Unknown Person",
          approximate_age: [-1, -1], // Unknown age
          gender: "Unknown",
          height: 68,
          weight: 160,
          skin_color: "Medium",
        },
        missing_required: [],
        potential_matches: []
      });

      const { getByText } = renderWithAuth(<TestNavigator />);

      // Record and transcribe
      const recordButton = getByText('🎤 Start Recording');
      fireEvent.press(recordButton);

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      const stopButton = getByText('⏹️ Stop');
      fireEvent.press(stopButton);

      // Verify unknown age displays as "Unknown"
      await waitFor(() => {
        expect(getByText('Unknown')).toBeTruthy(); // Age should display as "Unknown"
      });
    });

    it('should handle network errors gracefully', async () => {
      const { api } = require('../services/api');
      api.searchIndividuals.mockRejectedValueOnce(new Error('Network error'));

      const { getByText, getByTestId } = renderWithAuth(
        <TestNavigator initialRouteName="Search" />
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'John');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(getByText('Failed to search. Please try again.')).toBeTruthy();
      });
    });
  });
});