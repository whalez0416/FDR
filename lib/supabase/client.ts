import { createClient } from '@supabase/supabase-js';
// Database types will be added later via Supabase CLI

// Placeholders keep createClient from throwing during `next build`; real values
// are present at runtime in the browser/server environment.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
