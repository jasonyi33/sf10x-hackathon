import { SearchResult, IndividualProfile } from '../types';

// Helper function to calculate days ago
const calculateDaysAgo = (dateString: string): number => {
  const lastSeen = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastSeen.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Mock data for development
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
      age: 45,
      veteran_status: 'Yes',
      medical_conditions: ['Diabetes'],
      housing_priority: 'High',
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
        data: { substance_abuse_history: ['Moderate'], veteran_status: 'Yes' },
        location: { lat: 37.7849, lng: -122.4094 },
        created_at: '2024-01-12T14:20:00Z',
        worker_name: 'Officer Johnson',
        abbreviated_address: 'Golden Gate Park',
      },
      {
        id: 'int3',
        individual_id: '1',
        user_id: 'user1',
        data: { medical_conditions: ['Diabetes'], housing_priority: 'High' },
        location: { lat: 37.7649, lng: -122.4294 },
        created_at: '2024-01-10T16:45:00Z',
        worker_name: 'Officer Smith',
        abbreviated_address: 'Civic Center',
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
      height: 64,
      weight: 120,
      skin_color: 'Dark',
      gender: 'Female',
      substance_abuse_history: ['In Recovery'],
      age: 35,
      veteran_status: 'No',
      medical_conditions: [],
      housing_priority: 'Medium',
    },
    created_at: '2024-01-08T09:00:00Z',
    updated_at: '2024-01-12T14:20:00Z',
    total_interactions: 2,
    last_interaction_date: '2024-01-12T14:20:00Z',
    interactions: [
      {
        id: 'int4',
        individual_id: '2',
        user_id: 'user3',
        transcription: 'Sarah by the library, approximately 35, 5 foot 4, 120 pounds, dark skin. Says she\'s in recovery, looking for shelter. Has two children staying with relatives.',
        data: { name: 'Sarah Smith', height: 64, weight: 120, skin_color: 'Dark' },
        location: { lat: 37.7749, lng: -122.4194 },
        created_at: '2024-01-12T14:20:00Z',
        worker_name: 'Officer Davis',
        abbreviated_address: 'Public Library',
      },
      {
        id: 'int5',
        individual_id: '2',
        user_id: 'user2',
        data: { substance_abuse_history: ['In Recovery'], housing_priority: 'Medium' },
        location: { lat: 37.7849, lng: -122.4094 },
        created_at: '2024-01-08T16:30:00Z',
        worker_name: 'Officer Johnson',
        abbreviated_address: 'Mission District',
      },
    ],
  },
};

export const searchIndividuals = async (query: string): Promise<SearchResult[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (!query.trim()) {
    return [];
  }
  
  const filtered = mockIndividuals.filter(individual =>
    individual.name.toLowerCase().includes(query.toLowerCase())
  );
  
  return filtered;
};

export const getRecentIndividuals = async (): Promise<SearchResult[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Return last 10 viewed (for now, just return all mock data)
  return mockIndividuals.slice(0, 10);
};

// New function to get individual profile
export const getIndividualProfile = async (individualId: string): Promise<IndividualProfile | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const profile = mockIndividualProfiles[individualId];
  return profile || null;
};

// Function to update danger override
export const updateDangerOverride = async (individualId: string, overrideValue: number | null): Promise<boolean> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const profile = mockIndividualProfiles[individualId];
  if (profile) {
    profile.danger_override = overrideValue;
    return true;
  }
  
  return false;
}; 