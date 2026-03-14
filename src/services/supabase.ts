import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xcfsqlttkfdvezzmirmh.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZnNxbHR0a2ZkdmV6em1pcm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDc0ODcsImV4cCI6MjA4ODY4MzQ4N30.z_WOUMgmcZUpwMGNlekGF-Ko9FjgMQwbjeiRMXisn2s';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
