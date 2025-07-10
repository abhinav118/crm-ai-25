
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mejqdssovjnhzjsskdek.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lanFkc3NvdmpuaHpqc3NrZGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTI2MjIsImV4cCI6MjA2Njk2ODYyMn0.1EFwuLQcsirKc-V5TNzChAkkaWrBvU3V1QFaDByjy8o";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
