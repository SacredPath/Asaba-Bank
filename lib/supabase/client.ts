// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

// Helper function to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Debug logs to check environment variables
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a fallback client if environment variables are not available
let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl,
    key: supabaseAnonKey ? 'present' : 'missing'
  });
  
  // Create a dummy client to prevent crashes
  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      insert: async () => ({ error: null }),
      update: async () => ({ error: null }),
      delete: async () => ({ error: null })
    })
  };
} else {
  // Create a singleton Supabase client instance with security-focused configuration
  supabase = createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: false, // Disable debug in production
        storage: {
          getItem: (key: string) => {
            if (!isBrowser) return null;
            try {
              return localStorage.getItem(key);
            } catch {
              return null;
            }
          },
          setItem: (key: string, value: string) => {
            if (!isBrowser) return;
            try {
              localStorage.setItem(key, value);
            } catch {
              // Ignore storage errors
            }
          },
          removeItem: (key: string) => {
            if (!isBrowser) return;
            try {
              localStorage.removeItem(key);
            } catch {
              // Ignore storage errors
            }
          },
        },
        storageKey: 'sb-jykafoyljnhhemisxwse-auth-token',
      },
    }
  );
}

export default supabase;