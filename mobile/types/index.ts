export interface Individual {
  id: string;
  name: string;
  urgency_score: number;
  urgency_override?: number | null;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_interaction_date?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  urgency_score: number;
  urgency_override?: number | null;
  last_seen_days: number;
  last_interaction_date: string;
  last_seen?: string;
  abbreviated_address?: string;
  photo_url?: string;
  data?: Record<string, any>;
}

export interface SearchScreenProps {
  navigation: any;
}

// New interfaces for IndividualProfileScreen
export interface Interaction {
  id: string;
  individual_id: string;
  user_id: string;
  user_name?: string;
  transcription?: string; // NULL for manual entries
  changes: Record<string, any>; // Only changed fields (backend uses 'changes')
  location?: { 
    latitude: number; 
    longitude: number; 
    address?: string;
  };
  audio_url?: string;
  created_at: string;
}

export interface IndividualProfile {
  id: string;
  name: string;
  urgency_score: number;
  urgency_override?: number | null;
  data: Record<string, any>; // All current field values
  created_at: string;
  updated_at: string;
  interactions: Interaction[];
  total_interactions: number;
  last_interaction_date?: string;
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