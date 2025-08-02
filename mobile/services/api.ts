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
  },
  {
    id: '2',
    name: 'Sarah Smith',
    danger_score: 20,
    danger_override: 40,
    last_seen_days: calculateDaysAgo('2024-01-12T14:20:00Z'),
    last_interaction_date: '2024-01-12T14:20:00Z',
  },
  {
    id: '3',
    name: 'Robert Johnson',
    danger_score: 90,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-16T09:15:00Z'),
    last_interaction_date: '2024-01-16T09:15:00Z',
  },
  {
    id: '4',
    name: 'Maria Garcia',
    danger_score: 15,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-10T16:45:00Z'),
    last_interaction_date: '2024-01-10T16:45:00Z',
  },
  {
    id: '5',
    name: 'David Wilson',
    danger_score: 60,
    danger_override: null,
    last_seen_days: calculateDaysAgo('2024-01-14T11:30:00Z'),
    last_interaction_date: '2024-01-14T11:30:00Z',
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
    console.log('Sending audio URL for transcription:', audioUrl);
    
    try {
      // Try real API first
      const result = await apiRequest('/api/transcribe', {
        method: 'POST',
        body: JSON.stringify({ audio_url: audioUrl }),
      });
      
      console.log('Transcription result:', result);
      ErrorHandler.showSuccess('Transcription completed successfully');
      return result;
    } catch (error) {
      console.log('Backend not available, using mock transcription');
      ErrorHandler.showInfo('Using mock transcription for demo');
      // If backend fails, use mock for testing
      return mockTranscription(audioUrl);
    }
  },

  // Save individual (create new or update existing)
  saveIndividual: async (data: any) => {
    console.log('Saving individual data:', data);
    
    try {
      // Try real API first
      const result = await apiRequest('/api/individuals', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      console.log('Save result:', result);
      ErrorHandler.showSuccess('Data saved successfully');
      return result.data;
    } catch (error) {
      console.log('Backend not available, using mock save');
      ErrorHandler.showInfo('Using mock save for demo');
      // Mock successful save for demo
      return {
        id: 'mock-' + Date.now(),
        success: true,
        message: 'Data saved successfully (mock)'
      };
    }
  },

  // TASK 4: Search & Category Management APIs
  
  // Search individuals
  searchIndividuals: async (query: string): Promise<SearchResult[]> => {
    try {
      const result = await apiRequest(`/api/individuals?search=${encodeURIComponent(query)}`);
      return result.individuals || [];
    } catch (error) {
      console.log('Using mock search data');
      // Filter mock data based on query
      return mockIndividuals.filter(individual =>
        individual.name.toLowerCase().includes(query.toLowerCase())
      );
    }
  },

  // Get individual profile
  getIndividualProfile: async (individualId: string): Promise<IndividualProfile | null> => {
    try {
      const result = await apiRequest(`/api/individuals/${individualId}`);
      return result;
    } catch (error) {
      console.log('Using mock individual profile data');
      return mockIndividualProfiles[individualId] || null;
    }
  },

  // Update danger override
  updateDangerOverride: async (individualId: string, overrideValue: number | null): Promise<boolean> => {
    try {
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
      const result = await apiRequest('/api/categories');
      return result.categories || [];
    } catch (error) {
      console.log('Using mock categories');
      return [
        {
          id: '1',
          name: 'name',
          type: 'text',
          is_required: true,
          is_preset: true,
          priority: 'high',
          danger_weight: 0,
          auto_trigger: false,
          options: null
        },
        {
          id: '2',
          name: 'height',
          type: 'number',
          is_required: true,
          is_preset: true,
          priority: 'medium',
          danger_weight: 0,
          auto_trigger: false,
          options: null
        },
        {
          id: '3',
          name: 'weight',
          type: 'number',
          is_required: true,
          is_preset: true,
          priority: 'medium',
          danger_weight: 0,
          auto_trigger: false,
          options: null
        },
        {
          id: '4',
          name: 'skin_color',
          type: 'single_select',
          is_required: true,
          is_preset: true,
          priority: 'medium',
          danger_weight: 0,
          auto_trigger: false,
          options: [
            { label: 'Light', value: 0 },
            { label: 'Medium', value: 0 },
            { label: 'Dark', value: 0 }
          ]
        },
        {
          id: '5',
          name: 'substance_abuse_history',
          type: 'multi_select',
          is_required: false,
          is_preset: true,
          priority: 'high',
          danger_weight: 0,
          auto_trigger: false,
          options: ['None', 'Mild', 'Moderate', 'Severe', 'In Recovery']
        }
      ];
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
}; 