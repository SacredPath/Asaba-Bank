// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

// Create a singleton Supabase client instance with security-focused configuration
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: false, // Disable debug in production
      storage: {
        getItem: (key: string) => {
          return localStorage.getItem(key);
        },
        setItem: (key: string, value: string) => {
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          localStorage.removeItem(key);
        },
      },
      storageKey: 'sb-jykafoyljnhhemisxwse-auth-token',
    },
  }
);

export default supabase;