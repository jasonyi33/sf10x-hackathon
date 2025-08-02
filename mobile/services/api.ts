import { SearchResult, IndividualProfile } from '../types';

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
        user_id: 'user1',
        data: { },
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
        data: { substance_abuse_history: ['In Recovery'] },
        location: { lat: 37.7849, lng: -122.4094 },
        created_at: '2024-01-08T16:30:00Z',
        worker_name: 'Officer Johnson',
        abbreviated_address: 'Mission District',
      },
    ],
  },
};

// Mock API functions (until backend is deployed)
export const searchIndividuals = async (query: string): Promise<SearchResult[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (!query.trim()) {
    return [];
  }
  
  // Search across multiple fields (name, data fields, etc.)
  const filtered = mockIndividuals.filter(individual => {
    const searchTerm = query.toLowerCase();
    
    // Search in name
    if (individual.name.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // Search in profile data fields (when backend is connected, this will be more comprehensive)
    const profile = mockIndividualProfiles[individual.id];
    if (profile && profile.data) {
      // Search in data fields like height, weight, skin_color, etc.
      const dataString = JSON.stringify(profile.data).toLowerCase();
      if (dataString.includes(searchTerm)) {
        return true;
      }
    }
    
    return false;
  });
  
  return filtered;
};



export const getIndividualProfile = async (individualId: string): Promise<IndividualProfile | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const profile = mockIndividualProfiles[individualId];
  return profile || null;
};

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

// Mock function to get categories
export const getCategories = async (): Promise<any[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return [
    { id: '1', name: 'Name', type: 'text', required: true, priority: 'high', active: true },
    { id: '2', name: 'Gender', type: 'single-select', required: false, priority: 'medium', danger_weight: 0, auto_trigger: false, active: true },
    { id: '3', name: 'Height', type: 'number', required: true, priority: 'medium', danger_weight: 0, auto_trigger: false, active: true },
    { id: '4', name: 'Weight', type: 'number', required: true, priority: 'medium', danger_weight: 0, auto_trigger: false, active: true },
    { id: '5', name: 'Skin Color', type: 'single-select', required: true, priority: 'high', danger_weight: 0, auto_trigger: false, active: true },
    { id: '6', name: 'Substance Abuse History', type: 'multi-select', required: false, priority: 'low', active: true },
  ];
};

// Mock function to export CSV
export const exportCSV = async (): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return mock URL
  return 'mock-csv-export-url';
}; 