// hooks/useAuth.ts
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { useSupabase } from './useSupabase';

// Define the User interface
interface User {
  id: string;
  email: string | null;
}

// Define the return type of the hook
interface AuthHookResult {
  user: {
    id: string;
    email: string | null;
  } | null;
  loading: boolean;
  error: string | null;
}

export function useAuth(): AuthHookResult {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[useAuth] Setting up auth state listener...");
    
    // Manually check the session first
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("[useAuth] Initial session check:", { session, error });
      if (session) {
        console.log("[useAuth] Found initial session, user:", session.user);
        setUser({ 
          id: session.user.id, 
          email: session.user.email ?? null // Ensure email is either string or null
        });
      } else {
        console.log("[useAuth] No initial session found");
        setUser(null);
      }
      setLoading(false);
    });

    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[useAuth] Auth state changed: ${event}`, { session });
        
        // Log the current auth state for debugging
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('[useAuth] Current session from getSession():', currentSession);
        
        // Update the user state based on the session
        const currentUser = session?.user || currentSession?.user;
        console.log('[useAuth] Setting user state:', currentUser ? { id: currentUser.id, email: currentUser.email } : null);
        
        setUser(currentUser ? { id: currentUser.id, email: currentUser.email ?? null } : null);
        setLoading(false);
      }
    );

    // Clean up the subscription on component unmount
    return () => {
      console.log("[useAuth] Cleaning up auth listener");
      subscription?.unsubscribe();
    };
  }, []);

  // Memoize the returned object to prevent unnecessary re-renders in consuming components
  return useMemo(() => ({
    user,
    loading,
    error,
  }), [user, loading, error]);
}
