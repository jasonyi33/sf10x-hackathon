import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, autoLogin, signOut } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialized = false;

    // Auto-login on app launch
    handleAutoLogin();

    // Listen for auth changes but filter out excessive TOKEN_REFRESHED events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only log significant events, not every token refresh
        if (event !== 'TOKEN_REFRESHED') {
          console.log('Auth state changed:', event, session?.user?.email);
        }

        // Only update state if session actually changed
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          if (!initialized) {
            initialized = true;
          }
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Only update session if it's different
          setSession(prev => {
            // Check if the session actually changed
            if (prev?.access_token !== session.access_token) {
              return session;
            }
            return prev;
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array - only run once on mount

  const handleAutoLogin = async () => {
    try {
      setLoading(true);
      const result = await autoLogin();
      
      if (result.error) {
        console.error('Auto-login failed:', result.error);
        // For hackathon, we'll continue without login for now
        setLoading(false);
      } else if (result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        setLoading(false);
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 