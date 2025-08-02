// API Configuration
export const API_CONFIG = {
  // Set to false to use mock data, true to use real API
  USE_REAL_API: false,
  
  // Update this with your actual Railway deployment URL
  BASE_URL: 'https://your-railway-app.railway.app',
  
  // Supabase Configuration (for direct frontend access if needed)
  SUPABASE: {
    URL: 'https://vhfyquescrbwbbvvhxdg.supabase.co/', // TODO: Replace with your Supabase URL
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZnlxdWVzY3Jid2JidnZoeGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMjQ5NDksImV4cCI6MjA2OTcwMDk0OX0.3grO_YeaqeM73db9jzvBV0WyLBwuD_ynW9lH3Z4Os4g', // TODO: Replace with your anon key
  },
  
  // API Endpoints
  ENDPOINTS: {
    INDIVIDUALS: '/api/individuals',
    CATEGORIES: '/api/categories',
    EXPORT: '/api/export',
    UPLOAD_AUDIO: '/api/upload-audio',
    TRANSCRIBE: '/api/transcribe',
  },
  
  // Request timeout (in milliseconds)
  TIMEOUT: 10000,
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 