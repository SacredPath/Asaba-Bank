// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

// Debug: Log environment variables to ensure they are loaded
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing');

// Create a singleton Supabase client instance
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: true,
      storage: {
        getItem: (key: string) => {
          console.log(`[Supabase] Getting item: ${key}`);
          return localStorage.getItem(key);
        },
        setItem: (key: string, value: string) => {
          console.log(`[Supabase] Setting item: ${key}`);
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          console.log(`[Supabase] Removing item: ${key}`);
          localStorage.removeItem(key);
        },
      },
      storageKey: 'sb-jykafoyljnhhemisxwse-auth-token',
    },
  }
);

// Debug: Log client initialization
console.log('Supabase client initialized:', supabase ? '✅ Success' : '❌ Failed');

export default supabase;