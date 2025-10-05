// Centralized IP Configuration
// Change this IP address to update it everywhere in the project

export const IP_CONFIG = {
  // Your computer's IP address - change this to update everywhere
  LOCAL_IP: '192.168.1.3',
  
  // Port for backend API
  API_PORT: '8001',
  
  // Generate full API URL
  get API_URL() {
    return `http://${this.LOCAL_IP}:${this.API_PORT}`;
  },
  
  // Generate localhost URL for same-machine testing
  get LOCALHOST_URL() {
    return `http://localhost:${this.API_PORT}`;
  }
};

// Centralized Location Configuration
// Change these coordinates to update default location everywhere in the project
export const LOCATION_CONFIG = {
  DEFAULT_LATITUDE: 37.80808794862037,
  DEFAULT_LONGITUDE: -122.43016054168524,
  
  // Generate location dictionary for API calls
  get DEFAULT_LOCATION() {
    return {
      latitude: this.DEFAULT_LATITUDE,
      longitude: this.DEFAULT_LONGITUDE
    };
  },
  
  // Generate location for Supabase format (lat/lng)
  get DEFAULT_LOCATION_SUPABASE() {
    return {
      lat: this.DEFAULT_LATITUDE,
      lng: this.DEFAULT_LONGITUDE
    };
  }
};

// Export individual values for convenience
export const { LOCAL_IP, API_PORT, API_URL, LOCALHOST_URL } = IP_CONFIG;
export const { DEFAULT_LATITUDE, DEFAULT_LONGITUDE, DEFAULT_LOCATION, DEFAULT_LOCATION_SUPABASE } = LOCATION_CONFIG;
