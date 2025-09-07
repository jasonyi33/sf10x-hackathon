import { supabase } from './supabase';
import { API_CONFIG, getApiUrl } from '../config/api';
import { ErrorHandler } from '../utils/errorHandler';
import { SearchResult, IndividualProfile } from '../types';

// Generate a proper UUID v4 format
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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

// Mock data store for persistence - All 20 individuals from demo data
const mockDataStore = {
  individuals: {
    "550e8400-e29b-41d4-a716-446655440001": {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Sarah Smith",
      urgency_score: 15,
      urgency_override: null,
      data: { age: 32, height: 65, weight: 140, skin_color: "Light", gender: "Female", substance_abuse_history: ["None"], veteran_status: "No", medical_conditions: ["None"], housing_priority: "Low" },
      created_at: "2024-01-10T09:00:00Z",
      updated_at: "2024-01-15T14:30:00Z",
      total_interactions: 2,
      last_interaction_date: "2024-01-15T14:30:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440002": {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Michael Chen",
      urgency_score: 25,
      urgency_override: null,
      data: { age: 28, height: 68, weight: 155, skin_color: "Medium", gender: "Male", substance_abuse_history: ["None"], veteran_status: "No", medical_conditions: ["None"], housing_priority: "Medium" },
      created_at: "2024-01-11T10:15:00Z",
      updated_at: "2024-01-16T11:45:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-16T11:45:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440003": {
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "Emily Rodriguez",
      danger_score: 30,
      danger_override: null,
      data: { age: 35, height: 62, weight: 130, skin_color: "Medium", gender: "Female", substance_abuse_history: ["Mild"], veteran_status: "No", medical_conditions: ["Mental Health"], housing_priority: "Medium" },
      created_at: "2024-01-12T08:30:00Z",
      updated_at: "2024-01-17T16:20:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-17T16:20:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440004": {
      id: "550e8400-e29b-41d4-a716-446655440004",
      name: "David Wilson",
      danger_score: 20,
      danger_override: null,
      data: { age: 45, height: 70, weight: 175, skin_color: "Light", gender: "Male", substance_abuse_history: ["None"], veteran_status: "Yes", medical_conditions: ["None"], housing_priority: "High" },
      created_at: "2024-01-13T12:00:00Z",
      updated_at: "2024-01-18T09:15:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-18T09:15:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440005": {
      id: "550e8400-e29b-41d4-a716-446655440005",
      name: "Lisa Thompson",
      danger_score: 18,
      danger_override: null,
      data: { age: 29, height: 64, weight: 145, skin_color: "Light", gender: "Female", substance_abuse_history: ["Mild"], veteran_status: "No", medical_conditions: ["None"], housing_priority: "Low" },
      created_at: "2024-01-14T14:45:00Z",
      updated_at: "2024-01-19T13:30:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-19T13:30:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440006": {
      id: "550e8400-e29b-41d4-a716-446655440006",
      name: "James Brown",
      danger_score: 32,
      danger_override: null,
      data: { age: 52, height: 72, weight: 185, skin_color: "Dark", gender: "Male", substance_abuse_history: ["None"], veteran_status: "Yes", medical_conditions: ["Heart Disease"], housing_priority: "High" },
      created_at: "2024-01-15T11:20:00Z",
      updated_at: "2024-01-20T10:45:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-20T10:45:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440007": {
      id: "550e8400-e29b-41d4-a716-446655440007",
      name: "John Doe",
      danger_score: 75,
      danger_override: null,
      data: { age: 45, height: 72, weight: 180, skin_color: "Light", gender: "Male", substance_abuse_history: ["Moderate"], veteran_status: "No", medical_conditions: ["Diabetes"], housing_priority: "High" },
      created_at: "2024-01-10T08:00:00Z",
      updated_at: "2024-01-15T15:30:00Z",
      total_interactions: 2,
      last_interaction_date: "2024-01-15T15:30:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440008": {
      id: "550e8400-e29b-41d4-a716-446655440008",
      name: "Maria Garcia",
      danger_score: 55,
      danger_override: null,
      data: { age: 38, height: 63, weight: 150, skin_color: "Medium", gender: "Female", substance_abuse_history: ["Moderate"], veteran_status: "No", medical_conditions: ["Mental Health"], housing_priority: "Critical" },
      created_at: "2024-01-11T09:30:00Z",
      updated_at: "2024-01-16T12:15:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-16T12:15:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440009": {
      id: "550e8400-e29b-41d4-a716-446655440009",
      name: "Robert Johnson",
      danger_score: 90,
      danger_override: null,
      data: { age: 58, height: 70, weight: 200, skin_color: "Medium", gender: "Male", substance_abuse_history: ["Severe"], veteran_status: "Yes", medical_conditions: ["Chronic Pain"], housing_priority: "Critical" },
      created_at: "2024-01-12T10:45:00Z",
      updated_at: "2024-01-17T14:20:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-17T14:20:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440010": {
      id: "550e8400-e29b-41d4-a716-446655440010",
      name: "Jennifer Lee",
      danger_score: 45,
      danger_override: null,
      data: { age: 42, height: 66, weight: 160, skin_color: "Light", gender: "Female", substance_abuse_history: ["Mild"], veteran_status: "No", medical_conditions: ["Mobility Issues"], housing_priority: "High" },
      created_at: "2024-01-13T13:15:00Z",
      updated_at: "2024-01-18T11:45:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-18T11:45:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440011": {
      id: "550e8400-e29b-41d4-a716-446655440011",
      name: "Thomas Anderson",
      danger_score: 60,
      danger_override: null,
      data: { age: 49, height: 71, weight: 190, skin_color: "Dark", gender: "Male", substance_abuse_history: ["Moderate"], veteran_status: "Yes", medical_conditions: ["Heart Disease"], housing_priority: "High" },
      created_at: "2024-01-14T15:00:00Z",
      updated_at: "2024-01-19T16:30:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-19T16:30:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440012": {
      id: "550e8400-e29b-41d4-a716-446655440012",
      name: "Amanda White",
      danger_score: 50,
      danger_override: null,
      data: { age: 33, height: 65, weight: 145, skin_color: "Light", gender: "Female", substance_abuse_history: ["Severe"], veteran_status: "No", medical_conditions: ["Mental Health"], housing_priority: "Critical" },
      created_at: "2024-01-15T12:30:00Z",
      updated_at: "2024-01-20T13:15:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-20T13:15:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440013": {
      id: "550e8400-e29b-41d4-a716-446655440013",
      name: "Christopher Davis",
      danger_score: 40,
      danger_override: null,
      data: { age: 47, height: 69, weight: 175, skin_color: "Medium", gender: "Male", substance_abuse_history: ["Moderate"], veteran_status: "No", medical_conditions: ["Diabetes"], housing_priority: "High" },
      created_at: "2024-01-16T09:45:00Z",
      updated_at: "2024-01-21T10:20:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-21T10:20:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440014": {
      id: "550e8400-e29b-41d4-a716-446655440014",
      name: "Jessica Martinez",
      danger_score: 35,
      danger_override: null,
      data: { age: 36, height: 64, weight: 155, skin_color: "Medium", gender: "Female", substance_abuse_history: ["Mild"], veteran_status: "No", medical_conditions: ["None"], housing_priority: "Medium" },
      created_at: "2024-01-17T11:00:00Z",
      updated_at: "2024-01-22T14:45:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-22T14:45:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440015": {
      id: "550e8400-e29b-41d4-a716-446655440015",
      name: "Daniel Taylor",
      danger_score: 100,
      danger_override: null,
      data: { age: 55, height: 73, weight: 210, skin_color: "Dark", gender: "Male", substance_abuse_history: ["Severe"], veteran_status: "Yes", medical_conditions: ["Chronic Pain"], housing_priority: "Critical", violent_behavior: "Physical" },
      created_at: "2024-01-10T07:30:00Z",
      updated_at: "2024-01-15T16:45:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-15T16:45:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440016": {
      id: "550e8400-e29b-41d4-a716-446655440016",
      name: "Nicole Clark",
      danger_score: 100,
      danger_override: null,
      data: { age: 41, height: 67, weight: 170, skin_color: "Light", gender: "Female", substance_abuse_history: ["Severe"], veteran_status: "No", medical_conditions: ["Mental Health"], housing_priority: "Critical", violent_behavior: "Physical" },
      created_at: "2024-01-11T08:45:00Z",
      updated_at: "2024-01-16T17:20:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-16T17:20:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440017": {
      id: "550e8400-e29b-41d4-a716-446655440017",
      name: "Kevin Lewis",
      danger_score: 100,
      danger_override: null,
      data: { age: 44, height: 70, weight: 185, skin_color: "Medium", gender: "Male", substance_abuse_history: ["Moderate"], veteran_status: "Yes", medical_conditions: ["Heart Disease"], housing_priority: "Critical", violent_behavior: "Physical" },
      created_at: "2024-01-12T10:15:00Z",
      updated_at: "2024-01-17T18:30:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-17T18:30:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440018": {
      id: "550e8400-e29b-41d4-a716-446655440018",
      name: "Rachel Green",
      danger_score: 85,
      danger_override: null,
      data: { age: 39, height: 65, weight: 160, skin_color: "Light", gender: "Female", substance_abuse_history: ["Severe"], veteran_status: "No", medical_conditions: ["Mental Health"], housing_priority: "Critical" },
      created_at: "2024-01-13T12:45:00Z",
      updated_at: "2024-01-18T19:15:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-18T19:15:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440019": {
      id: "550e8400-e29b-41d4-a716-446655440019",
      name: "Steven Hall",
      danger_score: 80,
      danger_override: null,
      data: { age: 51, height: 71, weight: 195, skin_color: "Dark", gender: "Male", substance_abuse_history: ["Severe"], veteran_status: "Yes", medical_conditions: ["Chronic Pain"], housing_priority: "Critical" },
      created_at: "2024-01-14T14:00:00Z",
      updated_at: "2024-01-19T20:45:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-19T20:45:00Z",
      interactions: []
    },
    "550e8400-e29b-41d4-a716-446655440020": {
      id: "550e8400-e29b-41d4-a716-446655440020",
      name: "Michelle Adams",
      danger_score: 70,
      danger_override: null,
      data: { age: 37, height: 66, weight: 165, skin_color: "Medium", gender: "Female", substance_abuse_history: ["Moderate"], veteran_status: "No", medical_conditions: ["Mobility Issues"], housing_priority: "High" },
      created_at: "2024-01-15T15:30:00Z",
      updated_at: "2024-01-20T21:30:00Z",
      total_interactions: 1,
      last_interaction_date: "2024-01-20T21:30:00Z",
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
      console.log('🎤 Starting real OpenAI Whisper transcription...');
      
      // Convert audio file to base64 for sending
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      console.log('📤 Sending audio to OpenAI Whisper...');
      
      // Send to backend
      const result = await apiRequest('/api/transcribe', {
        method: 'POST',
        body: JSON.stringify({ 
          audio_data: base64Audio,
          location: { latitude: 37.7749, longitude: -122.4194 } // Default SF location
        }),
      });
      
      console.log('✅ Real transcription completed by OpenAI Whisper');
      console.log('📝 Transcription:', result.transcription);
      console.log('🏷️  Categorized data:', result.categorized_data);
      return result;
    } catch (error) {
      console.error('❌ Transcription error:', error);
      throw error; // Don't fallback to mock - show real error
    }
  },

  // Save individual (create new or update existing)
  saveIndividual: async (data: any) => {
    try {
      console.log('💾 Saving individual to database...');
      console.log('Data to save:', data);
      
      // Extract categorized data (age, height, weight, etc.) from the data
      const { Name, name, id, danger_score, danger_override, data: existingData, ...categorizedData } = data;
      
      // Convert categorized data field names to lowercase for profile display
      const processedData: Record<string, any> = {};
      Object.entries(categorizedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          processedData[key.toLowerCase()] = value;
        }
      });
      
      console.log('📊 Processed categorized data:', processedData);
      
      // Use direct Supabase insert for real database
      const { data: result, error } = await supabase
        .from('individuals')
        .insert({
          id: id || generateUUID(),
          name: Name || name || 'Unknown Individual',
          data: existingData || processedData || {},
          danger_score: danger_score || 0,
          danger_override: danger_override || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Save error:', error);
        return {
          id: 'error-' + Date.now(),
          success: false,
          message: 'Failed to save: ' + error.message
        };
      }

      console.log('✅ Successfully saved individual:', result);
      return {
        id: result.id,
        success: true,
        message: 'Data saved successfully to database'
      };
    } catch (error) {
      console.error('❌ Save individual error:', error);
      return {
        id: 'error-' + Date.now(),
        success: false,
        message: 'Save failed: ' + error
      };
    }
  },

  // TASK 4: Search & Category Management APIs
  
  // Search individuals
  searchIndividuals: async (query: string): Promise<SearchResult[]> => {
    try {
      console.log('🔍 Searching individuals in database...');
      console.log('Query:', query);
      console.log('Query trimmed:', query.trim());
      console.log('Query length:', query.length);
      
      // Use direct Supabase query for real database
      let supabaseQuery = supabase
        .from('individuals')
        .select('*')
        .order('created_at', { ascending: false });

      // Only apply search filter if query is not empty
      if (query.trim()) {
        console.log('🔍 Applying search filter for query:', query);
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,data->>'Name'.ilike.%${query}%`);
      } else {
        console.log('🔍 No search query, fetching all individuals');
      }

      console.log('🔍 Executing Supabase query...');
      const { data: individuals, error } = await supabaseQuery;

      if (error) {
        console.error('❌ Search error:', error);
        return [];
      }

      console.log('✅ Found individuals:', individuals);
      console.log('✅ Number of individuals found:', individuals?.length || 0);
      
      // Convert to SearchResult format
      const searchResults: SearchResult[] = individuals.map(individual => {
        // Calculate display score (override or calculated)
                const displayScore = individual.danger_override !== null && individual.danger_override !== undefined
          ? individual.danger_override
          : individual.danger_score;
        
        return {
          id: individual.id,
          name: individual.name,
          danger_score: displayScore,
          last_seen: individual.updated_at,
          last_seen_days: calculateDaysAgo(individual.updated_at),
          last_interaction_date: individual.updated_at,
          abbreviated_address: "Market St & 5th" // Mock address for now
        };
      });

      console.log('📋 Search results:', searchResults);
      console.log('📋 Final results count:', searchResults.length);
      return searchResults;
    } catch (error) {
      console.error('❌ Search individuals error:', error);
      return [];
    }
  },

  // Semantic search using embeddings
  semanticSearchIndividuals: async (query: string): Promise<SearchResult[]> => {
    try {
      console.log('🧠 Performing semantic search with embeddings...');
      console.log('Query:', query);
      
      // Call the embedding search endpoint
              const result = await apiRequest('/api/embeddings/search', {
          method: 'POST',
          body: JSON.stringify({ 
            query: query,
            top_k: 20,
            similarity_threshold: 0.15  // Lower threshold for better semantic matching
          }),
        });
      
      console.log('✅ Semantic search results:', result);
      
      if (!result.results || !Array.isArray(result.results)) {
        console.log('⚠️ No semantic search results, falling back to regular search');
        return api.searchIndividuals(query);
      }
      
      // Convert hybrid search results to SearchResult format
      const searchResults: SearchResult[] = result.results.map((item: any) => {
        // Calculate display score (override or calculated)
        const displayScore = item.danger_override !== null && item.danger_override !== undefined
          ? item.danger_override
          : item.danger_score;
        
        return {
          id: item.id,
          name: item.name,
          danger_score: displayScore,
          last_seen: new Date().toISOString(), // We don't have this in embedding results
          last_seen_days: 0, // We don't have this in embedding results
          last_interaction_date: new Date().toISOString(), // We don't have this in embedding results
          abbreviated_address: "Market St & 5th", // Mock address for now
          similarity_score: item.similarity_score, // Add similarity score for display
          search_type: item.search_type // Add search type (exact/semantic)
        };
      });
      
      console.log('📋 Hybrid search results converted:', searchResults);
      console.log(`📊 Found ${result.normal_results || 0} exact matches and ${result.semantic_results || 0} semantic matches`);
      return searchResults;
      
    } catch (error) {
      console.error('❌ Semantic search error:', error);
      console.log('🔄 Falling back to regular search...');
      // Fall back to regular search if embedding search fails
      return api.searchIndividuals(query);
    }
  },

  // Get individual profile
  getIndividualProfile: async (individualId: string): Promise<IndividualProfile | null> => {
    try {
      console.log('👤 Fetching individual profile from database...');
      console.log('Individual ID:', individualId);
      
      // Use direct Supabase query for real database
      const { data: individual, error } = await supabase
        .from('individuals')
        .select('*')
        .eq('id', individualId)
        .single();

      if (error) {
        console.error('❌ Profile fetch error:', error);
        return null;
      }

      console.log('✅ Found individual profile:', individual);
      
      // Convert to IndividualProfile format
      const profile: IndividualProfile = {
        id: individual.id,
        name: individual.name,
        danger_score: individual.danger_score,
        danger_override: individual.danger_override,
        data: individual.data || {},
        created_at: individual.created_at,
        updated_at: individual.updated_at,
        interactions: [], // TODO: Add interactions when that table is set up
        total_interactions: 0 // TODO: Add interactions when that table is set up
      };

      return profile;
    } catch (error) {
      console.error('❌ Get individual profile error:', error);
      return null;
    }
  },

  // Update urgency override
  updateDangerOverride: async (individualId: string, overrideValue: number | null): Promise<boolean> => {
    try {
      console.log('⚠️ Updating urgency override in database...');
      console.log('Individual ID:', individualId);
      console.log('Override value:', overrideValue);
      
      // Use direct Supabase update for real database
      const { data, error } = await supabase
        .from('individuals')
        .update({ 
          danger_override: overrideValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', individualId)
        .select()
        .single();

      if (error) {
        console.error('❌ Danger override update error:', error);
        return false;
      }

      console.log('✅ Successfully updated urgency override:', data);
      return true;
    } catch (error) {
      console.error('❌ Update urgency override error:', error);
      return false;
    }
  },

  // Delete individual
  deleteIndividual: async (individualId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deleting individual from database...');
      console.log('Individual ID:', individualId);

      const { error } = await supabase
        .from('individuals')
        .delete()
        .eq('id', individualId);

      if (error) {
        console.error('❌ Delete individual error:', error);
        return false;
      }

      console.log('✅ Successfully deleted individual');
      return true;
    } catch (error) {
      console.error('❌ Delete individual exception:', error);
      return false;
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

  // Get all individuals (NEW METHOD)
  getAllIndividuals: async (): Promise<SearchResult[]> => {
    try {
      console.log('📋 Fetching all individuals from database...');
      
      // Use direct Supabase query for real database
      const { data: individuals, error } = await supabase
        .from('individuals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Get all individuals error:', error);
        return [];
      }

      console.log('✅ Found individuals:', individuals);
      
      // Convert to SearchResult format
      const searchResults: SearchResult[] = individuals.map(individual => {
        // Calculate display score (override or calculated)
        const displayScore = individual.danger_override !== null && individual.danger_override !== undefined
          ? individual.danger_override
          : individual.danger_score;
        
        return {
          id: individual.id,
          name: individual.name,
          danger_score: displayScore,
          last_seen: individual.updated_at,
          last_seen_days: calculateDaysAgo(individual.updated_at),
          last_interaction_date: individual.updated_at,
          abbreviated_address: "Market St & 5th" // Mock address for now
        };
      });

      console.log('📋 All individuals results:', searchResults);
      return searchResults;
    } catch (error) {
      console.error('❌ Get all individuals error:', error);
      return [];
    }
  },
}; 
