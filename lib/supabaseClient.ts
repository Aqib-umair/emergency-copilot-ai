import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl.startsWith('https://')) {
  throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: Must be a valid HTTPS URL. Got: ${supabaseUrl}`);
}
console.log(`Supabase URL loaded: ${supabaseUrl}`);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
