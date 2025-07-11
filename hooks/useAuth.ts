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
    // Manually check the session first
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session) {
        setUser({ 
          id: session.user.id, 
          email: session.user.email ?? null // Ensure email is either string or null
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Update the user state based on the session
        const currentUser = session?.user;
        setUser(currentUser ? { id: currentUser.id, email: currentUser.email ?? null } : null);
        setLoading(false);
      }
    );

    // Clean up the subscription on component unmount
    return () => {
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
