import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = supabaseUrl?.startsWith('https://');
const hasKey = supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

if (!isValidUrl || !hasKey) {
  console.warn(
    'Missing or invalid Supabase ENV variables. Check your .env file.'
  );
}

export const supabase =
  isValidUrl && hasKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
