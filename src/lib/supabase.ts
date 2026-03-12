import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * This file initializes the connection to the Supabase backend.
 * All database operations (SELECT, INSERT, UPDATE, DELETE) and RPC calls
 * flow through this singleton client instance.
 * 
 * Environment variables required:
 * - VITE_SUPABASE_URL: The unique project URL from Supabase dashboard.
 * - VITE_SUPABASE_ANON_KEY: The public anonymous key for client-side access.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are missing. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
