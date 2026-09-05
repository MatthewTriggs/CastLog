import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hsshnmxdfwcpismrwjgy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EGokg4A8UsxFbSquYc0n6Q_y7yWavJF';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});