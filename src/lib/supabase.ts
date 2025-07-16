import { createClient } from '@supabase/supabase-js';

// Create Supabase client for frontend (read-only operations)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Domain interface
export interface Domain {
  id?: number;
  name: string;
  owner: string;
  expiry: string;
  paid: boolean;
  created_at?: string;
}