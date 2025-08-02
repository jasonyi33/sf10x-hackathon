// API Configuration
// Update these values when backend becomes available

export const API_CONFIG = {
  // Backend API URL - replace with your Railway URL
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8001',
  
  // Enable real API calls (set to false to use mock data only)
  USE_REAL_API: process.env.EXPO_PUBLIC_USE_REAL_API !== 'false',
  
  // API Endpoints
  ENDPOINTS: {
    TRANSCRIBE: '/api/transcribe',
    INDIVIDUALS: '/api/individuals',
    CATEGORIES: '/api/categories',
    EXPORT: '/api/export',
  },
  
  // Demo configuration
  DEMO: {
    // Use mock data for demo
    USE_MOCK_DATA: true,
    
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