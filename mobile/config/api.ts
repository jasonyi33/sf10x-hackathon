// API Configuration
// Update these values when backend becomes available

export const API_CONFIG = {
  // Demo configuration - multiple backend options
  DEMO_BACKEND_OPTIONS: {
    // Option 1: Local development (requires local backend running)
    LOCAL: 'http://localhost:8001',

    // Option 2: Railway deployment (stable public URL)
    RAILWAY: 'https://sf10x-demo-test-production.up.railway.app',

    // Option 3: Mock mode (no backend required - great for demos)
    MOCK: 'mock://demo',
  },

  // Current demo mode - change this for different demo scenarios
  DEMO_MODE: 'RAILWAY', // Options: 'LOCAL', 'RAILWAY', 'MOCK'

  // Backend API URL - automatically selected based on demo mode
  BASE_URL: (() => {
    const mode = process.env.EXPO_PUBLIC_DEMO_MODE || 'RAILWAY';
    const options = {
      LOCAL: 'http://localhost:8001',
      RAILWAY: 'https://sf10x-demo-test-production.up.railway.app',
      MOCK: 'mock://demo',
    };
    return process.env.EXPO_PUBLIC_API_BASE_URL || options[mode as keyof typeof options] || options.LOCAL;
  })(),

  // Enable real API calls (always use real API, never mock)
  USE_REAL_API: true,

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
    // Never use mock data - always use real API
    USE_MOCK_DATA: false,

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