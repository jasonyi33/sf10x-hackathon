import { supabase } from './supabase';
import { API_CONFIG, getApiUrl, shouldUseRealApi } from '../config/api';
import { ErrorHandler } from '../utils/errorHandler';

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
  if (!shouldUseRealApi()) {
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
  // Upload audio file
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

  // Get individuals (search)
  getIndividuals: async (searchQuery?: string) => {
    const params = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
    return apiRequest(`/api/individuals${params}`);
  },

  // Get individual by ID
  getIndividual: async (id: string) => {
    return apiRequest(`/api/individuals/${id}`);
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

  // Get categories
  getCategories: async () => {
    return apiRequest('/api/categories');
  },

  // Create category
  createCategory: async (data: any) => {
    return apiRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Export data
  exportData: async () => {
    return apiRequest('/api/export');
  },
}; 