import { supabase } from './supabase';

// Replace with your actual backend URL (Dev 1 will provide this)
const API_BASE_URL = 'http://localhost:8000'; // or your Railway URL

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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
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
    potential_matches: [
      {
        id: "123",
        confidence: 87,
        name: "John Smith"
      }
    ]
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

    const response = await fetch(`${API_BASE_URL}/api/upload-audio`, {
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
      return result;
    } catch (error) {
      console.log('Backend not available, using mock transcription');
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

  // Create new individual
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