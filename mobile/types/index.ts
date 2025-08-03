export interface Individual {
  id: string;
  name: string;
  danger_score: number;
  danger_override?: number | null;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_interaction_date?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  danger_score: number;
  danger_override?: number | null;
  last_seen_days: number;
  last_interaction_date: string;
  last_seen?: string;
  abbreviated_address?: string;
  data?: {
    approximate_age?: [number, number];
    height?: number;
    skin_color?: string;
    [key: string]: any;
  };
}

export interface SearchScreenProps {
  navigation: any;
}

// New interfaces for IndividualProfileScreen
export interface Interaction {
  id: string;
  individual_id: string;
  user_id: string;
  transcription?: string; // NULL for manual entries
  data: Record<string, any>; // Only changed fields
  location?: { lat: number; lng: number };
  created_at: string;
  worker_name?: string; // We'll add this for display
  abbreviated_address?: string; // We'll add this for display
}

export interface IndividualProfile {
  id: string;
  name: string;
  danger_score: number;
  danger_override?: number | null;
  data: Record<string, any>; // All current field values
  created_at: string;
  updated_at: string;
  interactions: Interaction[];
  total_interactions: number;
  last_interaction_date?: string;
  photo_url?: string | null;
  photo_history?: Array<{
    url: string;
    timestamp: string;
  }>;
}

export interface IndividualProfileScreenProps {
  navigation: any;
  route: {
    params: {
      individualId: string;
    };
  };
}

// For React Navigation compatibility
export type RootStackParamList = {
  SearchMain: undefined;
  IndividualProfile: { individualId: string };
}; 