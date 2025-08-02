import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Demo credentials (hardcoded for hackathon)
const DEMO_EMAIL = 'demo@sfgov.org';
const DEMO_PASSWORD = 'demo123456';

// You'll need to replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://vhfyquescrbwbbvvhxdg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZnlxdWVzY3Jid2JidnZoeGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMjQ5NDksImV4cCI6MjA2OTcwMDk0OX0.3grO_YeaqeM73db9jzvBV0WyLBwuD_ynW9lH3Z4Os4g'; 

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});

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