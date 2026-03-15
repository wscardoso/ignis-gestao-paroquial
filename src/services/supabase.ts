import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://spnfllbjjsamrpshjbbd.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbmZsbGJqanNhbXJwc2hqYmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNDgwOTYsImV4cCI6MjA4NjYyNDA5Nn0.UdAyx16kRLI4UhmXmQI7ErC11j-joplwcqynt1D3uew';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
