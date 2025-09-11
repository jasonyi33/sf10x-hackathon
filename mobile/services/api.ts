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
  
  // Test different confidence levels based on audio URL or generate random for variety
  let confidence = 87; // Default for testing merge UI (60-94% range)
  let matchName = "John Smith";
  
  if (audioUrl.includes('high-confidence')) {
    confidence = 97; // Test streamlined confirmation (≥95%)
    matchName = "John Doe"; // Closer match
  } else if (audioUrl.includes('low-confidence')) {
    confidence = 45; // Test no merge UI (<60%)
    matchName = "James Johnson"; // Less similar
  } else if (audioUrl.includes('no-match')) {
    confidence = 0; // Test no matches
  } else {
    // Generate varying confidence levels for more realistic testing
    const randomFactor = Math.random();
    if (randomFactor > 0.7) {
      confidence = 95 + Math.floor(Math.random() * 5); // 95-99% (high confidence)
      matchName = "John Doe";
    } else if (randomFactor > 0.3) {
      confidence = 60 + Math.floor(Math.random() * 35); // 60-94% (medium confidence) 
      matchName = "John Smith";
    } else {
      confidence = 30 + Math.floor(Math.random() * 30); // 30-59% (low confidence)
      matchName = "Johnny Williams";
    }
  }
  
  return {
    transcription: "Met John near Market Street. About 45 years old, 6 feet tall, maybe 180 pounds. Light skin. Shows signs of moderate substance abuse, been on streets 3 months. Needs diabetes medication.",
    categorized_data: {
      name: "John",
      age: 45,
      height: "6'0\"",
      weight: 180,
      skin_color: "Light",
      substance_abuse_history: "Moderate",
      medical_conditions: "Diabetes",
      additional_information: "Found near Market Street, needs medical attention"
    },
    missing_required: [],
    potential_matches: confidence > 0 ? [
      {
        id: "mock-individual-123",
        confidence: confidence,
        name: matchName
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
      
      // Check if this is a merge operation
      const mergeWithId = data.existing_individual_id || data.merge_with_id;
      
      // Extract categorized data (age, height, weight, etc.) from the data
      // Don't extract Name/name from categorizedData - keep them in the data
      const { id, danger_score, danger_override, data: existingData, existing_individual_id, merge_with_id, ...categorizedData } = data;
      
      // Convert categorized data field names to lowercase for profile display
      const processedData: Record<string, any> = {};
      console.log('📊 Raw categorized data entries:', Object.entries(categorizedData));
      
      const essentialFields = ['name', 'height', 'weight', 'age'];
      
      Object.entries(categorizedData).forEach(([key, value]) => {
        console.log(`📊 Processing field "${key}": "${value}" (type: ${typeof value})`);
        const lowercaseKey = key.toLowerCase();
        
        // Always include essential fields, even if empty
        if (essentialFields.includes(lowercaseKey)) {
          processedData[lowercaseKey] = value || '';
          console.log(`✅ Added essential field "${lowercaseKey}" = "${value || ''}"`);
        } else if (value !== null && value !== undefined && value !== '') {
          // Only include optional fields if they have a value
          processedData[lowercaseKey] = value;
          console.log(`✅ Added optional field "${lowercaseKey}" = "${value}"`);
        } else {
          console.log(`❌ Filtered out optional field "${key}" = "${value}" (empty/null/undefined)`);
        }
      });
      
      console.log('📊 Processed categorized data:', processedData);
      console.log('🔀 Merge with ID:', mergeWithId);
      console.log('🌍 API URL:', getApiUrl('/api/individuals'));
      
      // Validate required fields before sending to backend (based on backend API response)
      // According to backend: height and weight are required, name and skin_color are not
      const requiredFields = ['height', 'weight'];
      const missingFields = requiredFields.filter(field => 
        !processedData[field] || processedData[field] === '' || processedData[field] === null
      );
      
      // Additional validation: name should not be empty even if not technically required
      if (!processedData['name'] || processedData['name'] === '' || processedData['name'] === null) {
        missingFields.push('name');
      }
      
      if (missingFields.length > 0) {
        const errorMessage = `Missing required fields: ${missingFields.join(', ')}. Please ensure all required fields are filled.`;
        console.error('❌ Validation failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Check authentication token
      const authToken = await getAuthToken();
      console.log('🔐 Auth token available:', authToken ? 'Yes' : 'No');
      console.log('🔐 Auth token length:', authToken ? authToken.length : 0);
      
      if (mergeWithId) {
        console.log('🔄 Merging with existing individual:', mergeWithId);
        
        const requestBody = {
          data: processedData,
          merge_with_id: mergeWithId
        };
        console.log('📤 Merge request body:', JSON.stringify(requestBody, null, 2));
        
        // Use backend API for proper merge with danger score calculation
        const response = await fetch(getApiUrl('/api/individuals'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (parseError) {
            console.error('❌ Failed to parse error response:', parseError);
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('✅ Successfully merged individual:', result);
        return {
          id: result.individual.id,
          success: true,
          message: 'Data merged successfully'
        };
      } else {
        console.log('➕ Creating new individual');
        
        const requestBody = {
          data: processedData
        };
        console.log('📤 Create request body:', JSON.stringify(requestBody, null, 2));
        
        // Use backend API for proper danger score calculation
        const response = await fetch(getApiUrl('/api/individuals'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (parseError) {
            console.error('❌ Failed to parse error response:', parseError);
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('✅ Successfully saved new individual:', result);
        return {
          id: result.individual.id,
          success: true,
          message: 'Data saved successfully'
        };
      }
    } catch (error) {
      console.error('❌ Save individual error:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Try to extract error details from object
        errorMessage = error.detail || error.message || JSON.stringify(error);
      }
      
      return {
        id: 'error-' + Date.now(),
        success: false,
        message: 'Save failed: ' + errorMessage
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
      console.log('📍 Location data from database:', individual.last_location);
      console.log('📍 Location data type:', typeof individual.last_location);
      
      // Parse location data if it's a string
      let lastLocation = individual.last_location;
      if (typeof lastLocation === 'string') {
        try {
          lastLocation = JSON.parse(lastLocation);
          console.log('📍 Parsed location data:', lastLocation);
        } catch (e) {
          console.error('📍 Failed to parse location data:', e);
          lastLocation = null;
        }
      }
      
      // Convert to IndividualProfile format
      const profile: IndividualProfile = {
        id: individual.id,
        name: individual.name,
        danger_score: individual.danger_score,
        danger_override: individual.danger_override,
        data: individual.data || {},
        created_at: individual.created_at,
        updated_at: individual.updated_at,
        last_location: lastLocation, // Include parsed location data
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

      // First attempt: delete the individual directly
      let { error } = await supabase
        .from('individuals')
        .delete()
        .eq('id', individualId);

      // If there is a foreign key constraint (23503), delete dependent interactions then retry
      if (error && (error as any).code === '23503') {
        console.warn('⚠️ FK constraint, deleting dependent interactions first...');
        const { error: interactionsError } = await supabase
          .from('interactions')
          .delete()
          .eq('individual_id', individualId);

        if (interactionsError) {
          console.error('❌ Failed to delete dependent interactions:', interactionsError);
          return false;
        }

        // Retry deleting the individual
        const retry = await supabase
          .from('individuals')
          .delete()
          .eq('id', individualId);
        error = retry.error as any;
      }

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
      console.log('🔧 getCategories - USE_REAL_API:', API_CONFIG.USE_REAL_API);
      console.log('🔧 getCategories - USE_MOCK_DATA:', API_CONFIG.DEMO.USE_MOCK_DATA);
      
      if (!API_CONFIG.USE_REAL_API || API_CONFIG.DEMO.USE_MOCK_DATA) {
        console.log('📋 Using mock categories');
        return [
          { id: '1', name: 'Name', type: 'text', is_required: true, priority: 'high' },
          { id: '2', name: 'Height', type: 'number', is_required: true, priority: 'medium' },
          { id: '3', name: 'Weight', type: 'number', is_required: true, priority: 'medium' },
          { id: '4', name: 'Age', type: 'number', is_required: false, priority: 'medium' },
          { id: '5', name: 'Skin Color', type: 'single-select', is_required: true, priority: 'high' },
          { id: '6', name: 'Additional Information', type: 'text', is_required: false, priority: 'low' },
        ];
      }

      console.log('📋 Fetching categories from real API...');
      const result = await apiRequest('/api/categories');
      console.log('📋 Real API categories response:', result);
      console.log('📋 Categories count:', result?.categories?.length || 0);
      
      if (result?.categories && Array.isArray(result.categories)) {
        console.log('📋 Category names:', result.categories.map((c: any) => c.name));
        return result.categories;
      } else {
        console.warn('📋 No categories in API response, using fallback');
        return [];
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      console.log('Falling back to mock categories due to API error');
      // Fall back to mock data if real API fails
      return [
        { id: '1', name: 'Name', type: 'text', is_required: true, priority: 'high' },
        { id: '2', name: 'Height', type: 'number', is_required: true, priority: 'medium' },
        { id: '3', name: 'Weight', type: 'number', is_required: true, priority: 'medium' },
        { id: '4', name: 'Age', type: 'number', is_required: false, priority: 'medium' },
        { id: '5', name: 'Skin Color', type: 'single-select', is_required: true, priority: 'high' },
        { id: '6', name: 'Additional Information', type: 'text', is_required: false, priority: 'low' },
      ];
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

  // Get OpenAI API key for voice assistant
  getOpenAIApiKey: async (): Promise<string | null> => {
    try {
      console.log('🔑 Fetching OpenAI API key...');
      
      const response = await apiRequest('/api/voice-assistant/api-key', {
        method: 'GET',
      });
      
      console.log('✅ OpenAI API key retrieved');
      return response.api_key || null;
    } catch (error) {
      console.error('❌ Failed to get OpenAI API key:', error);
      return null;
    }
  },

  // Get local resources for voice assistant
  getLocalResources: async (lat?: number, lng?: number) => {
    try {
      console.log('🏠 Fetching local resources...');
      
      const params = new URLSearchParams();
      if (lat !== undefined) params.append('lat', lat.toString());
      if (lng !== undefined) params.append('lng', lng.toString());
      
      const response = await apiRequest(`/api/voice-assistant/resources?${params.toString()}`, {
        method: 'GET',
      });
      
      console.log('✅ Local resources retrieved');
      return response;
    } catch (error) {
      console.error('❌ Failed to get local resources:', error);
      throw error;
    }
  },

  // Get safety guidelines for voice assistant
  getSafetyGuidelines: async (category?: string) => {
    try {
      console.log('🛡️ Fetching safety guidelines...');
      
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      
      const response = await apiRequest(`/api/voice-assistant/guidelines?${params.toString()}`, {
        method: 'GET',
      });
      
      console.log('✅ Safety guidelines retrieved');
      return response;
    } catch (error) {
      console.error('❌ Failed to get safety guidelines:', error);
      throw error;
    }
  },

  // Transcribe audio for voice assistant
  transcribeAudio: async (audioUri: string) => {
    try {
      console.log('🎤 Transcribing audio for voice assistant...');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'voice_input.m4a',
      } as any);

      const token = await getAuthToken();
      const response = await fetch(getApiUrl('/api/voice-assistant/transcribe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Transcription response error:', errorText);
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Audio transcribed successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to transcribe audio:', error);
      throw error;
    }
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
