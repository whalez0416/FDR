import { createClient } from '@supabase/supabase-js';

// Fall back to placeholders so the module can be imported during `next build`
// page-data collection even when env vars aren't injected. Real requests at
// runtime use the real values from the environment.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || 'placeholder-key-for-build',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail.');
}
