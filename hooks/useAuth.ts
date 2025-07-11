// hooks/useAuth.ts
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSupabase } from './useSupabase';
import { User } from '@supabase/supabase-js';

interface AuthHookResult {
  user: User | null;
  loading: boolean;
  error: string | null;
  isSessionExpired: boolean;
}

// Session timeout duration (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export function useAuth(): AuthHookResult {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Update last activity on user interaction
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // Check session timeout
  useEffect(() => {
    const checkSessionTimeout = () => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      if (timeSinceLastActivity > SESSION_TIMEOUT && user) {
        setIsSessionExpired(true);
        // Auto-logout after timeout
        supabase.auth.signOut();
      }
    };

    const timeoutCheck = setInterval(checkSessionTimeout, 60000); // Check every minute
    return () => clearInterval(timeoutCheck);
  }, [lastActivity, user, supabase]);

  useEffect(() => {
    // Manually check the session first
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session) {
        setUser(session.user);
        setLastActivity(Date.now()); // Reset activity timer
      } else {
        setUser(null);
        setIsSessionExpired(false);
      }
      setLoading(false);
    });

    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Update the user state based on the session
        setUser(session?.user || null);
        setLastActivity(Date.now()); // Reset activity timer
        setLoading(false);
        
        // Log security events
        if (event === 'SIGNED_IN') {
          console.log(`User signed in: ${session?.user?.email}`);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
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
    isSessionExpired,
  }), [user, loading, error, isSessionExpired]);
}
