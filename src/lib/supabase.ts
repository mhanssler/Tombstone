import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These will be set from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));
}

// Create a lazy-initialized client
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (isSupabaseConfigured()) {
      _supabase = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      // Create a dummy client that won't actually be used
      // This prevents crashes when code references supabase before checking isConfigured
      _supabase = createClient('https://dummy.supabase.co', 'dummy-key');
    }
  }
  return _supabase;
}

// For backward compatibility - but prefer using getSupabase()
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as unknown as SupabaseClient;
