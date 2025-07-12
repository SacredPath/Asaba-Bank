// hooks/useSupabase.ts
'use client';

import supabase from '@/lib/supabase/client';

// This hook provides a Supabase client instance configured for client-side operations.
// It uses a singleton pattern to prevent multiple GoTrueClient instances.
export function useSupabase() {
  return supabase;
}
