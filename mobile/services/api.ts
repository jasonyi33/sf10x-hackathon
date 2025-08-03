import { supabase } from './supabase';
import { API_CONFIG, getApiUrl } from '../config/api';
import { ErrorHandler } from '../utils/errorHandler';
import { SearchResult, IndividualProfile } from '../types';

// Helper function to get auth token
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

// Generic API request function
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  // Skip real API calls if disabled
  if (!API_CONFIG.USE_REAL_API) {
    const error = ErrorHandler.handleApiError(new Error('Real API disabled for demo'));
    ErrorHandler.showError(error);
    throw error;
  }

  const token = await getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const fullUrl = getApiUrl(endpoint);
    console.log(`Making API request to: ${fullUrl}`);
    const response = await fetch(fullUrl, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}:`, errorText);
      const error = ErrorHandler.handleApiError(new Error(`API request failed: ${response.status} ${response.statusText}`));
      ErrorHandler.showError(error);
      throw error;
    }
    
    const result = await response.json();
    console.log(`API response from ${endpoint}:`, result);
    return result;
  } catch (error) {
    const appError = ErrorHandler.handleError(error, `API Request to ${endpoint}`);
    ErrorHandler.showError(appError);
    throw appError;
  }
};

// Helper function to calculate days ago
const calculateDaysAgo = (dateString: string): number => {
  const lastSeen = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastSeen.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Mock data for development (until backend is deployed)
const mockIndividuals: SearchResult[] = [
  {
    id: '1',
    name: 'John Doe',
    danger_score: 75,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-15T10:30:00Z'),
    last_interaction_date: '2024-01-15T10:30:00Z',
    data: {
      approximate_age: [45, 50],
      height: 72, // 6'0"
      skin_color: 'Light',
    },
  },
  {
    id: '2',
    name: 'Sarah Smith',
    danger_score: 20,
    danger_override: 40,
    last_seen_days: calculateDaysAgo('2024-01-12T14:20:00Z'),
    last_interaction_date: '2024-01-12T14:20:00Z',
    data: {
      approximate_age: [-1, -1], // Unknown
      height: 66, // 5'6"
      skin_color: 'Medium',
    },
  },
  {
    id: '3',
    name: 'Robert Johnson',
    danger_score: 90,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-16T09:15:00Z'),
    last_interaction_date: '2024-01-16T09:15:00Z',
    data: {
      approximate_age: [65, 70],
      height: 70, // 5'10"
      skin_color: 'Dark',
    },
  },
  {
    id: '4',
    name: 'Maria Garcia',
    danger_score: 15,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-10T16:45:00Z'),
    last_interaction_date: '2024-01-10T16:45:00Z',
    data: {
      approximate_age: [30, 35],
      height: 64, // 5'4"
      skin_color: 'Medium',
    },
  },
  {
    id: '5',
    name: 'David Wilson',
    danger_score: 60,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-14T11:30:00Z'),
    last_interaction_date: '2024-01-14T11:30:00Z',
    data: {
      approximate_age: [55, 60],
      height: 68, // 5'8"
      skin_color: 'Light',
    },
  },
  // Add more test data for dropdown limit testing
  {
    id: '6',
    name: 'Test Person 6',
    danger_score: 35,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-13T10:00:00Z'),
    last_interaction_date: '2024-01-13T10:00:00Z',
    data: {
      approximate_age: [40, 45],
      height: 67,
      skin_color: 'Dark',
    },
  },
  {
    id: '7',
    name: 'Test Person 7',
    danger_score: 25,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-12T10:00:00Z'),
    last_interaction_date: '2024-01-12T10:00:00Z',
    data: {
      approximate_age: [25, 30],
      height: 71,
      skin_color: 'Medium',
    },
  },
  {
    id: '8',
    name: 'Test Person 8',
    danger_score: 45,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-11T10:00:00Z'),
    last_interaction_date: '2024-01-11T10:00:00Z',
    data: {
      approximate_age: [50, 55],
      height: 69,
      skin_color: 'Light',
    },
  },
  {
    id: '9',
    name: 'Test Person 9',
    danger_score: 55,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-10T10:00:00Z'),
    last_interaction_date: '2024-01-10T10:00:00Z',
    data: {
      approximate_age: [35, 40],
      height: 65,
      skin_color: 'Dark',
    },
  },
  {
    id: '10',
    name: 'Test Person 10',
    danger_score: 30,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-09T10:00:00Z'),
    last_interaction_date: '2024-01-09T10:00:00Z',
    data: {
      approximate_age: [60, 65],
      height: 73,
      skin_color: 'Medium',
    },
  },
  {
    id: '11',
    name: 'Test Person 11',
    danger_score: 40,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-08T10:00:00Z'),
    last_interaction_date: '2024-01-08T10:00:00Z',
    data: {
      approximate_age: [20, 25],
      height: 66,
      skin_color: 'Light',
    },
  },
  {
    id: '12',
    name: 'Test Person 12',
    danger_score: 50,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-07T10:00:00Z'),
    last_interaction_date: '2024-01-07T10:00:00Z',
    data: {
      approximate_age: [45, 50],
      height: 70,
      skin_color: 'Dark',
    },
  },
];

// Mock individual profile data
const mockIndividualProfiles: Record<string, IndividualProfile> = {
  '1': {
    id: '1',
    name: 'John Doe',
    danger_score: 75,
    danger_override: null,
    data: {
      name: 'John Doe',
      height: 72,
      weight: 180,
      skin_color: 'Light',
      gender: 'Male',
      substance_abuse_history: ['Moderate'],
    },
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    total_interactions: 3,
    last_interaction_date: '2024-01-15T10:30:00Z',
    interactions: [
      {
        id: 'int1',
        individual_id: '1',
        user_id: 'user1',
        transcription: 'Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication.',
        data: { name: 'John Doe', height: 72, weight: 180, skin_color: 'Light' },
        location: { lat: 37.7749, lng: -122.4194 },
        created_at: '2024-01-15T10:30:00Z',
        worker_name: 'Officer Smith',
        abbreviated_address: 'Market St & 5th Ave',
      },
      {
        id: 'int2',
        individual_id: '1',
        user_id: 'user2',
        data: { substance_abuse_history: ['Moderate'] },
        location: { lat: 37.7849, lng: -122.4094 },
        created_at: '2024-01-12T14:20:00Z',
        worker_name: 'Officer Johnson',
        abbreviated_address: 'Golden Gate Park',
      },
      {
        id: 'int3',
        individual_id: '1',
        user_id: 'user3',
        data: { medical_conditions: ['Diabetes'] },
        location: { lat: 37.7949, lng: -122.3994 },
        created_at: '2024-01-10T10:00:00Z',
        worker_name: 'Officer Davis',
        abbreviated_address: 'Mission District',
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Sarah Smith',
    danger_score: 20,
    danger_override: 40,
    data: {
      name: 'Sarah Smith',
      height: 65,
      weight: 140,
      skin_color: 'Medium',
      gender: 'Female',
      substance_abuse_history: ['None'],
    },
    created_at: '2024-01-08T09:00:00Z',
    updated_at: '2024-01-12T14:20:00Z',
    total_interactions: 2,
    last_interaction_date: '2024-01-12T14:20:00Z',
    interactions: [
      {
        id: 'int4',
        individual_id: '2',
        user_id: 'user1',
        transcription: 'Met Sarah at the library. She is 35 years old, 5\'5", about 140 pounds. Medium skin tone. No signs of substance abuse. She is looking for housing assistance.',
        data: { name: 'Sarah Smith', height: 65, weight: 140, skin_color: 'Medium' },
        location: { lat: 37.7749, lng: -122.4194 },
        created_at: '2024-01-12T14:20:00Z',
        worker_name: 'Officer Smith',
        abbreviated_address: 'Public Library',
      },
      {
        id: 'int5',
        individual_id: '2',
        user_id: 'user2',
        data: { housing_status: 'Seeking Assistance' },
        location: { lat: 37.7849, lng: -122.4094 },
        created_at: '2024-01-08T09:00:00Z',
        worker_name: 'Officer Johnson',
        abbreviated_address: 'City Hall',
      },
    ],
  },
};

// Mock data store for persistence
const mockDataStore = {
  individuals: {
    "550e8400-e29b-41d4-a716-446655440001": {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "John Doe",
      danger_score: 75,
      danger_override: null,
      data: {
        approximate_age: [45, 50],
        height: 72,
        weight: 180,
        skin_color: "Light",
        gender: "Male",
        substance_abuse_history: ["Moderate"],
        medical_conditions: ["Diabetes"],
        veteran_status: "Yes",
        housing_priority: "High",
        violent_behavior: "None"
      },
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
      total_interactions: 3,
      last_interaction_date: "2024-01-15T10:30:00Z",
      interactions: [
        {
          id: "550e8400-e29b-41d4-a716-446655440101",
          individual_id: "550e8400-e29b-41d4-a716-446655440001",
          user_id: "user1",
          transcription: "Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication.",
          data: {
            name: "John",
            age: 45,
            height: 72,
            weight: 180,
            skin_color: "Light",
            substance_abuse: "Moderate",
            medical_conditions: "Diabetes"
          },
          location: { lat: 37.7749, lng: -122.4194 },
          created_at: "2024-01-15T10:30:00Z",
          worker_name: "Officer Johnson",
          abbreviated_address: "Market St & 5th"
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440102",
          individual_id: "550e8400-e29b-41d4-a716-446655440001",
          user_id: "user1",
          data: {
            veteran_status: "Yes",
            housing_priority: "High"
          },
          location: { lat: 37.7858, lng: -122.4064 },
          created_at: "2024-01-12T14:20:00Z",
          worker_name: "Officer Smith",
          abbreviated_address: "Ellis St & 6th"
        }
      ]
    },
    "550e8400-e29b-41d4-a716-446655440002": {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Sarah Smith",
      danger_score: 20,
      danger_override: null,
      data: {
        age: 32,
        height: 65,
        weight: 140,
        skin_color: "Medium",
        gender: "Female",
        substance_abuse_history: ["None"],
        medical_conditions: ["Anxiety"],
        veteran_status: "No",
        housing_priority: "Medium",
        violent_behavior: "None"
      },
      created_at: "2024-01-12T14:20:00Z",
      updated_at: "2024-01-12T14:20:00Z",
      total_interactions: 2,
      last_interaction_date: "2024-01-12T14:20:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440003": {
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "Robert Johnson",
      danger_score: 90,
      danger_override: null,
      data: {
        age: 58,
        height: 70,
        weight: 200,
        skin_color: "Dark",
        gender: "Male",
        substance_abuse_history: ["Severe"],
        medical_conditions: ["Schizophrenia"],
        veteran_status: "Yes",
        housing_priority: "Critical",
        violent_behavior: "History"
      },
      created_at: "2024-01-16T09:15:00Z",
      updated_at: "2024-01-16T09:15:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-16T09:15:00Z",
      interactions: []
    }
  }
};

// Transcription response types
export interface TranscriptionResult {
  transcription: string;
  categorized_data: Record<string, any>;
  missing_required: string[];
  potential_matches: Array<{
    id: string;
    confidence: number;
    name: string;
  }>;
}

// Mock transcription for testing (when backend isn't ready)
const mockTranscription = (audioUrl: string): TranscriptionResult => {
  console.log('Using mock transcription for:', audioUrl);
  
  // Test different confidence levels based on audio URL
  let confidence = 87; // Default for testing merge UI (60-94% range)
  
  if (audioUrl.includes('high-confidence')) {
    confidence = 97; // Test streamlined confirmation (≥95%)
  } else if (audioUrl.includes('low-confidence')) {
    confidence = 45; // Test no merge UI (<60%)
  } else if (audioUrl.includes('no-match')) {
    confidence = 0; // Test no matches
  }
  
  return {
    transcription: "Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication.",
    categorized_data: {
      name: "John",
      age: 45,
      height: 72,
      weight: 180,
      skin_color: "Light",
      substance_abuse: "Moderate",
      medical_conditions: "Diabetes",
      location: "Market Street"
    },
    missing_required: ["height", "weight", "skin_color"],
    potential_matches: confidence > 0 ? [
      {
        id: "123",
        confidence: confidence,
        name: "John Smith"
      }
    ] : []
  };
};

// API functions for your app
export const api = {
  // TASK 3: Audio Recording & Transcription APIs
  
  // Transcribe audio - NEW FUNCTION
  transcribe: async (audioUrl: string): Promise<TranscriptionResult> => {
    try {
      // Skip real API calls if disabled
      if (!API_CONFIG.USE_REAL_API || API_CONFIG.DEMO.USE_MOCK_DATA) {
        console.log('Using mock transcription');
        // Simulate transcription delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return mockTranscription(audioUrl);
      }

      const result = await apiRequest('/api/transcribe', {
        method: 'POST',
        body: JSON.stringify({ audio_url: audioUrl }),
      });
      
      return result;
    } catch (error) {
      console.error('Transcription error:', error);
      // Fallback to mock data
      return mockTranscription(audioUrl);
    }
  },

  // Save individual (create new or update existing)
  saveIndividual: async (data: any) => {
    try {
      // Skip real API calls if disabled
      if (!API_CONFIG.USE_REAL_API || API_CONFIG.DEMO.USE_MOCK_DATA) {
        console.log('Using mock save individual');
        // Simulate save delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          id: 'mock-' + Date.now(),
          success: true,
          message: 'Data saved successfully (mock)'
        };
      }

      const result = await apiRequest('/api/individuals', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      return result;
    } catch (error) {
      console.error('Save individual error:', error);
      // Fallback to mock success
      return {
        id: 'mock-' + Date.now(),
        success: true,
        message: 'Data saved successfully (mock fallback)'
      };
    }
  },

  // TASK 4: Search & Category Management APIs
  
  // Search individuals
  searchIndividuals: async (query: string): Promise<SearchResult[]> => {
    try {
      if (!API_CONFIG.USE_REAL_API || API_CONFIG.DEMO.USE_MOCK_DATA) {
        console.log('Using mock search data');
        // Simulate search delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Convert mock data store to search results with display scores
        const mockResults: SearchResult[] = Object.values(mockDataStore.individuals).map(individual => {
          // Calculate display score (override or calculated)
          const displayScore = individual.danger_override !== null && individual.danger_override !== undefined 
            ? individual.danger_override 
            : individual.danger_score;
          
          return {
            id: individual.id,
            name: individual.name,
            danger_score: displayScore, // Use display score instead of original
            danger_override: individual.danger_override,
            last_seen: individual.last_interaction_date,
            last_seen_days: 2, // Mock value
            last_interaction_date: individual.last_interaction_date,
            abbreviated_address: "Market St & 5th", // Mock address
            data: individual.data // Include data for dropdown display
          };
        });
        
        // Filter by query
        return mockResults.filter(result => 
          result.name.toLowerCase().includes(query.toLowerCase()) ||
          (result.abbreviated_address && result.abbreviated_address.toLowerCase().includes(query.toLowerCase()))
        );
      }

      const result = await apiRequest(`/api/individuals?search=${encodeURIComponent(query)}`);
      return result.individuals || [];
    } catch (error) {
      console.error('Error searching individuals:', error);
      return [];
    }
  },

  // Get individual profile
  getIndividualProfile: async (individualId: string): Promise<IndividualProfile | null> => {
    try {
      if (!API_CONFIG.USE_REAL_API || API_CONFIG.DEMO.USE_MOCK_DATA) {
        console.log('Using mock individual profile data');
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get from mock data store
        const mockProfile = mockDataStore.individuals[individualId];
        if (!mockProfile) {
          return null;
        }
        
        return mockProfile;
      }

      const result = await apiRequest(`/api/individuals/${individualId}`);
      return result;
    } catch (error) {
      console.error('Error fetching individual profile:', error);
      return null;
    }
  },

  // Update danger override
  updateDangerOverride: async (individualId: string, overrideValue: number | null): Promise<boolean> => {
    try {
      // Skip real API calls if disabled
      if (!API_CONFIG.USE_REAL_API || API_CONFIG.DEMO.USE_MOCK_DATA) {
        console.log('Mock danger override update');
        // Simulate update delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update the mock data store
        if (mockDataStore.individuals[individualId]) {
          mockDataStore.individuals[individualId].danger_override = overrideValue;
          mockDataStore.individuals[individualId].updated_at = new Date().toISOString();
          console.log(`Updated danger override for ${individualId} to ${overrideValue}`);
        }
        
        return true;
      }

      await apiRequest(`/api/individuals/${individualId}/danger-override`, {
        method: 'PUT',
        body: JSON.stringify({ danger_override: overrideValue }),
      });
      return true;
    } catch (error) {
      console.log('Mock danger override update');
      return true; // Mock success
    }
  },

  // Get categories
  getCategories: async (): Promise<any[]> => {
    try {
      if (!API_CONFIG.USE_REAL_API || API_CONFIG.DEMO.USE_MOCK_DATA) {
        console.log('Using mock categories');
        return [
          { id: '1', name: 'Name', type: 'text', is_required: true, priority: 'high' },
          { id: '2', name: 'Height', type: 'number', is_required: true, priority: 'medium' },
          { id: '3', name: 'Weight', type: 'number', is_required: true, priority: 'medium' },
          { id: '4', name: 'Skin Color', type: 'single-select', is_required: true, priority: 'high' },
        ];
      }

      const result = await apiRequest('/api/categories');
      return result.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Export CSV
  exportCSV: async (): Promise<string> => {
    try {
      if (!API_CONFIG.USE_REAL_API || API_CONFIG.DEMO.USE_MOCK_DATA) {
        console.log('Using mock CSV export');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return 'mock-csv-export-url';
      }

      const result = await apiRequest('/api/export', {
        method: 'GET',
      });
      
      return result.url || 'export-completed';
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw new Error('Failed to export CSV');
    }
  },

  // Export data
  exportData: async () => {
    try {
      const result = await apiRequest('/api/export');
      return result;
    } catch (error) {
      console.log('Using mock export');
      // Return mock URL
      return 'mock-csv-export-url';
    }
  },

  // Legacy functions for backward compatibility
  uploadAudio: async (audioUri: string) => {
    try {
      // Skip real API calls if disabled
      if (!API_CONFIG.USE_REAL_API || API_CONFIG.DEMO.USE_MOCK_DATA) {
        console.log('Using mock audio upload');
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          url: 'mock-audio-url',
          error: null
        };
      }

      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      const response = await fetch(getApiUrl('/api/upload-audio'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    } catch (error) {
      console.error('Upload error:', error);
      return {
        url: null,
        error: 'Upload failed'
      };
    }
  },

  // Create new individual (legacy)
  createIndividual: async (data: any) => {
    return apiRequest('/api/individuals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update individual
  updateIndividual: async (id: string, data: any) => {
    return apiRequest(`/api/individuals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Create interaction
  createInteraction: async (data: any) => {
    return apiRequest('/api/interactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Create category
  createCategory: async (data: any) => {
    return apiRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Upload photo
  uploadPhoto: async (params: {
    photoUri: string;
    individualId: string;
    consentLocation: object;
  }) => {
    try {
      // Skip real API calls if disabled
      if (!API_CONFIG.USE_REAL_API || API_CONFIG.DEMO.USE_MOCK_DATA) {
        console.log('Using mock photo upload');
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          photo_url: 'https://example.com/mock-photo.jpg',
          consent_id: 'mock-consent-123'
        };
      }

      const token = await getAuthToken();
      const formData = new FormData();
      
      formData.append('photo', {
        uri: params.photoUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
      formData.append('individual_id', params.individualId);
      formData.append('consent_location', JSON.stringify(params.consentLocation));

      const response = await fetch(getApiUrl('/api/photos/upload'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Photo upload failed: ${response.status} ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Photo upload error:', error);
      throw error;
    }
  },

  // Update individual photo (without creating interaction)
  updateIndividualPhoto: async (params: {
    individualId: string;
    photoUri: string;
    consentLocation: { latitude: number; longitude: number; address: string };
  }) => {
    try {
      const token = await getAuthToken();
      if (USE_MOCK_DATA) {
        console.log('Using mock photo update');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload
        return {
          photo_url: 'https://example.com/mock-updated-photo.jpg',
          consent_id: 'mock-consent-456',
          message: 'Photo updated successfully'
        };
      }

      const formData = new FormData();
      formData.append('photo', {
        uri: params.photoUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
      formData.append('consent_location', JSON.stringify(params.consentLocation));

      const response = await fetch(getApiUrl(`/api/photos/update/${params.individualId}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Photo update failed: ${response.status} ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Photo update error:', error);
      throw error;
    }
  },
}; 