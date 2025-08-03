/**
 * ==================================================================================
 * API Service - HTTP Client Utility
 * ==================================================================================
 *
 * @fileoverview Centralized API service using axios for HTTP requests
 * @description Provides configured axios instance with interceptors, error handling,
 *              and base configuration for the PulsePoint SF frontend
 *
 * @author PulsePoint SF Team
 * @version 1.0.0
 * @since 2025-01-08
 *
 * @dependencies
 * - axios: HTTP client for making API requests
 *
 * @features
 * - Configured base URL and timeout
 * - Request/response interceptors
 * - Centralized error handling
 * - Request/response logging
 * - Authentication header management
 * ==================================================================================
 */

import axios from 'axios';

// ================================================================================
// API CONFIGURATION
// ================================================================================

/** @type {string} Base API URL from environment or fallback to local */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/** @type {number} Request timeout in milliseconds */
const TIMEOUT = 10000; // 10 seconds

// ================================================================================
// AXIOS INSTANCE CREATION
// ================================================================================

/**
 * Pre-configured axios instance for API requests
 * @type {import('axios').AxiosInstance}
 */
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ================================================================================
// REQUEST INTERCEPTOR
// ================================================================================

/**
 * Request interceptor to add authentication and logging
 */
apiClient.interceptors.request.use(
  (config) => {
    // Log outgoing requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    // Add authentication token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add timestamp to requests
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// ================================================================================
// RESPONSE INTERCEPTOR
// ================================================================================

/**
 * Response interceptor for logging and error handling
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      const duration = new Date() - response.config.metadata?.startTime;
      console.log(`[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        duration: `${duration}ms`,
        data: response.data,
      });
    }

    return response;
  },
  (error) => {
    // Enhanced error logging
    if (error.response) {
      // Server responded with error status
      console.error('[API Error - Server Response]', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API Error - No Response]', {
        url: error.config?.url,
        method: error.config?.method,
        message: 'Network error or timeout',
      });
    } else {
      // Something else happened
      console.error('[API Error - Request Setup]', error.message);
    }

    return Promise.reject(error);
  }
);

// ================================================================================
// API SERVICE METHODS
// ================================================================================

/**
 * API service object with common HTTP methods
 */
const api = {
  /**
   * Make a GET request
   * @param {string} url - Endpoint URL
   * @param {object} params - Query parameters
   * @param {object} config - Additional axios config
   * @returns {Promise} Axios response promise
   */
  get: (url, params = {}, config = {}) => {
    return apiClient.get(url, { params, ...config });
  },

  /**
   * Make a POST request
   * @param {string} url - Endpoint URL
   * @param {object} data - Request body data
   * @param {object} config - Additional axios config
   * @returns {Promise} Axios response promise
   */
  post: (url, data = {}, config = {}) => {
    return apiClient.post(url, data, config);
  },

  /**
   * Make a PUT request
   * @param {string} url - Endpoint URL
   * @param {object} data - Request body data
   * @param {object} config - Additional axios config
   * @returns {Promise} Axios response promise
   */
  put: (url, data = {}, config = {}) => {
    return apiClient.put(url, data, config);
  },

  /**
   * Make a PATCH request
   * @param {string} url - Endpoint URL
   * @param {object} data - Request body data
   * @param {object} config - Additional axios config
   * @returns {Promise} Axios response promise
   */
  patch: (url, data = {}, config = {}) => {
    return apiClient.patch(url, data, config);
  },

  /**
   * Make a DELETE request
   * @param {string} url - Endpoint URL
   * @param {object} config - Additional axios config
   * @returns {Promise} Axios response promise
   */
  delete: (url, config = {}) => {
    return apiClient.delete(url, config);
  },

  /**
   * Upload file with progress tracking
   * @param {string} url - Upload endpoint URL
   * @param {FormData} formData - File data
   * @param {function} onProgress - Progress callback
   * @returns {Promise} Axios response promise
   */
  upload: (url, formData, onProgress = null) => {
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },

  /**
   * Download file
   * @param {string} url - Download endpoint URL
   * @param {string} filename - Target filename
   * @returns {Promise} Axios response promise
   */
  download: (url, filename) => {
    return apiClient.get(url, {
      responseType: 'blob',
    }).then((response) => {
      // Create download link
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      return response;
    });
  },
};

// ================================================================================
// DOMAIN-SPECIFIC API METHODS
// ================================================================================

/**
 * PulsePoint SF specific API methods
 */
export const pulsePointAPI = {
  // ============================================================================
  // INDIVIDUALS ENDPOINTS
  // ============================================================================

  /**
   * Get all individuals with optional filtering
   * @param {object} filters - Query filters (search, category, location, etc.)
   * @returns {Promise} List of individuals
   */
  getIndividuals: (filters = {}) => {
    return api.get('/api/individuals', filters);
  },

  /**
   * Get individual by ID
   * @param {string} id - Individual ID
   * @returns {Promise} Individual details
   */
  getIndividual: (id) => {
    return api.get(`/api/individuals/${id}`);
  },

  /**
   * Create new individual
   * @param {object} data - Individual data
   * @returns {Promise} Created individual
   */
  createIndividual: (data) => {
    return api.post('/api/individuals', data);
  },

  /**
   * Update individual
   * @param {string} id - Individual ID
   * @param {object} data - Updated data
   * @returns {Promise} Updated individual
   */
  updateIndividual: (id, data) => {
    return api.put(`/api/individuals/${id}`, data);
  },

  /**
   * Delete individual
   * @param {string} id - Individual ID
   * @returns {Promise} Deletion confirmation
   */
  deleteIndividual: (id) => {
    return api.delete(`/api/individuals/${id}`);
  },

  // ============================================================================
  // TRANSCRIPTION ENDPOINTS
  // ============================================================================

  /**
   * Upload audio for transcription
   * @param {File} audioFile - Audio file
   * @param {function} onProgress - Upload progress callback
   * @returns {Promise} Transcription result
   */
  transcribeAudio: (audioFile, onProgress = null) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    return api.upload('/api/transcription', formData, onProgress);
  },

  /**
   * Get transcription by ID
   * @param {string} id - Transcription ID
   * @returns {Promise} Transcription details
   */
  getTranscription: (id) => {
    return api.get(`/api/transcription/${id}`);
  },

  // ============================================================================
  // CATEGORIES ENDPOINTS
  // ============================================================================

  /**
   * Get all categories
   * @returns {Promise} List of categories
   */
  getCategories: () => {
    return api.get('/api/categories');
  },

  /**
   * Create new category
   * @param {object} data - Category data
   * @returns {Promise} Created category
   */
  createCategory: (data) => {
    return api.post('/api/categories', data);
  },

  /**
   * Update category
   * @param {string} id - Category ID
   * @param {object} data - Updated data
   * @returns {Promise} Updated category
   */
  updateCategory: (id, data) => {
    return api.put(`/api/categories/${id}`, data);
  },

  /**
   * Delete category
   * @param {string} id - Category ID
   * @returns {Promise} Deletion confirmation
   */
  deleteCategory: (id) => {
    return api.delete(`/api/categories/${id}`);
  },

  // ============================================================================
  // EXPORT ENDPOINTS
  // ============================================================================

  /**
   * Export data as CSV
   * @param {object} filters - Export filters
   * @returns {Promise} CSV download
   */
  exportCSV: (filters = {}) => {
    return api.download('/api/export/csv', 'pulsepoint-data.csv');
  },

  /**
   * Export data as JSON
   * @param {object} filters - Export filters
   * @returns {Promise} JSON data
   */
  exportJSON: (filters = {}) => {
    return api.get('/api/export/json', filters);
  },

  // ============================================================================
  // SF CRIME DATA ENDPOINTS
  // ============================================================================

  /**
   * Get recent SF crime data from DataSF API
   * @param {number} hours - Number of hours back to fetch (default: 24)
   * @param {number} limit - Maximum number of records (default: 500)
   * @returns {Promise} Crime incident data
   */
  getRecentCrimeData: async (hours = 24, limit = 500) => {
    try {
      // Calculate the timestamp for X hours ago
      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
      const isoTimestamp = hoursAgo.toISOString();

      // Build SoQL query for SF Open Data API
      const query = new URLSearchParams({
        '$where': `incident_datetime >= '${isoTimestamp}'`,
        '$limit': limit.toString(),
        '$order': 'incident_datetime DESC'
      });

      // Use axios directly for external API
      const response = await axios.get(`https://data.sfgov.org/resource/wg3w-h783.json?${query}`);

      return response;
    } catch (error) {
      console.error('Error fetching SF crime data:', error);
      throw error;
    }
  },
};

// ================================================================================
// UTILITY METHODS
// ================================================================================

/**
 * Set authentication token
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

/**
 * Clear authentication token
 */
export const clearAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('auth_token');
  }
  return false;
};

// ================================================================================
// EXPORTS
// ================================================================================

export default api;
export { apiClient };

/**
 * ==================================================================================
 * USAGE EXAMPLES
 * ==================================================================================
 *
 * Basic API Usage:
 * ```javascript
 * import api, { pulsePointAPI } from '@/lib/api';
 *
 * // Generic requests
 * const response = await api.get('/api/users');
 * const user = await api.post('/api/users', { name: 'John' });
 *
 * // PulsePoint specific requests
 * const individuals = await pulsePointAPI.getIndividuals({ search: 'john' });
 * const transcription = await pulsePointAPI.transcribeAudio(audioFile);
 * ```
 *
 * Error Handling:
 * ```javascript
 * try {
 *   const data = await pulsePointAPI.getIndividuals();
 *   console.log(data);
 * } catch (error) {
 *   if (error.response?.status === 404) {
 *     console.log('No individuals found');
 *   } else {
 *     console.error('API error:', error.message);
 *   }
 * }
 * ```
 *
 * Authentication:
 * ```javascript
 * import { setAuthToken, isAuthenticated } from '@/lib/api';
 *
 * // Set token after login
 * setAuthToken('your-jwt-token');
 *
 * // Check authentication status
 * if (isAuthenticated()) {
 *   // User is logged in
 * }
 * ```
 * ==================================================================================
 */
