// Supabase Client Configuration
// This file is for direct Supabase access from the frontend if needed
// Currently not used since we're going through the backend API

import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../config/api';

// Create Supabase client
export const supabase = createClient(
  API_CONFIG.SUPABASE.URL,
  API_CONFIG.SUPABASE.ANON_KEY
);

// Helper functions for direct Supabase access (if needed)
export const supabaseHelpers = {
  // Get all individuals
  async getIndividuals() {
    const { data, error } = await supabase
      .from('individuals')
      .select('*');
    
    if (error) throw error;
    return data;
  },

  // Get individual by ID
  async getIndividual(id: string) {
    const { data, error } = await supabase
      .from('individuals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update individual
  async updateIndividual(id: string, updates: any) {
    const { data, error } = await supabase
      .from('individuals')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    return data;
  },
}; 