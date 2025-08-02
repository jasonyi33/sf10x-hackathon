import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

// Demo credentials (hardcoded for hackathon)
const DEMO_EMAIL = 'demo@sfgov.org';
const DEMO_PASSWORD = 'demo123456';

// Create Supabase client with configuration from API config
export const supabase = createClient(
  API_CONFIG.SUPABASE.URL,
  API_CONFIG.SUPABASE.ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

// Auto-login function
export const autoLogin = async () => {
  try {
    // First check if already logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('Already logged in:', session.user.email);
      return { user: session.user, session };
    }
    
    // Auto sign in with demo credentials
    console.log('Attempting auto-login with demo credentials...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    
    if (error) {
      console.error('Auto-login failed:', error.message);
      return { error };
    }
    
    if (data.session) {
      console.log('Auto-login successful:', data.user.email);
      return { user: data.user, session: data.session };
    }
    
    return { error: new Error('No session created') };
  } catch (error) {
    console.error('Auto-login error:', error);
    return { error };
  }
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Test Supabase connection and storage
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test auth
    const user = await getCurrentUser();
    if (!user) {
      console.log('No user found, attempting auto-login...');
      const loginResult = await autoLogin();
      if (loginResult.error) {
        return { error: 'Authentication failed: ' + loginResult.error };
      }
    }
    
    // Test storage bucket access
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      return { error: 'Storage access failed: ' + bucketError.message };
    }
    
    console.log('Available buckets:', buckets?.map(b => b.name));
    
    // Check if 'audio' bucket exists
    const audioBucket = buckets?.find(b => b.name === 'audio');
    if (!audioBucket) {
      return { error: 'Audio bucket not found. Please create an "audio" bucket in Supabase.' };
    }
    
    return { success: true, message: 'Supabase connection and storage working!' };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { error: 'Connection test failed: ' + error };
  }
};

// Upload audio file to Supabase Storage
export const uploadAudio = async (audioUri: string): Promise<{ url?: string; error?: string }> => {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}.m4a`;
    const filePath = `audio/${user.id}/${filename}`;

    console.log('Uploading audio to:', filePath);

    // Convert file URI to blob for upload
    const response = await fetch(audioUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('audio')
      .upload(filePath, blob, {
        contentType: 'audio/m4a',
        cacheControl: '3600',
      });

    if (error) {
      console.error('Upload error:', error);
      return { error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl(filePath);

    console.log('Upload successful, URL:', urlData.publicUrl);
    return { url: urlData.publicUrl };
  } catch (error) {
    console.error('Upload failed:', error);
    return { error: 'Upload failed' };
  }
};

// Helper functions for direct Supabase access (Task 4 - Search & Category Management)
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

  // Search individuals
  async searchIndividuals(query: string) {
    const { data, error } = await supabase
      .from('individuals')
      .select('*')
      .or(`name.ilike.%${query}%,data->>'name'.ilike.%${query}%`);
    
    if (error) throw error;
    return data;
  },

  // Get categories
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('priority', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create category
  async createCategory(category: any) {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update category
  async updateCategory(id: string, updates: any) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete category
  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },
}; 