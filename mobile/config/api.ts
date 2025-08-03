// API Configuration
// Update these values when backend becomes available

export const API_CONFIG = {
  // Backend API URL - using your computer's IP for iOS simulator
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.15.85:8001',
  
  // Enable real API calls (set to true to use real transcription)
  USE_REAL_API: true, // Set to true to use real transcription
  
  // Supabase Configuration (for direct frontend access if needed)
  SUPABASE: {
    URL: 'https://vhfyquescrbwbbvvhxdg.supabase.co/', // TODO: Replace with your Supabase URL
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZnlxdWVzY3Jid2JidnZoeGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMjQ5NDksImV4cCI6MjA2OTcwMDk0OX0.3grO_YeaqeM73db9jzvBV0WyLBwuD_ynW9lH3Z4Os4g', // TODO: Replace with your anon key
  },
  
  // API Endpoints (PRD Section 3.2, 4.3, 4.4, 4.5)
  ENDPOINTS: {
    // Task 3: AI Transcription & Categorization
    TRANSCRIBE: '/api/transcribe',
    UPLOAD_AUDIO: '/api/upload-audio',
    
    // Task 4: Search & Category Management
    INDIVIDUALS: '/api/individuals',
    CATEGORIES: '/api/categories',
    EXPORT: '/api/export',
  },
  
  // Request timeout (in milliseconds)
  TIMEOUT: 10000,
  
  // Demo configuration
  DEMO: {
    // Use mock data for demo (set to false to use real API)
    USE_MOCK_DATA: false, // Set to false to use real transcription
    
    // Mock response delays (ms)
    MOCK_DELAY: 1000,
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to check if real API should be used
export const shouldUseRealApi = (): boolean => {
  return API_CONFIG.USE_REAL_API && !API_CONFIG.DEMO.USE_MOCK_DATA;
}; 