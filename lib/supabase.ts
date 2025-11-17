import { createClient } from '@supabase/supabase-js';

// IMPORTANT: The following are placeholder credentials. 
// Replace with your own Supabase project URL and Anon Key.
const supabaseUrl = process.env.SUPABASE_URL || 'https://sfpvftorhbuaovcdsnvs.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmcHZmdG9yaGJ1YW92Y2RzbnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDE3NzgsImV4cCI6MjA3ODkxNzc3OH0.HHB0rGofobCMjZynS87qv2OQKyMHo6p1UW1Mi-Ozo4w';

if (supabaseUrl === 'https://sfpvftorhbuaovcdsnvs.supabase.co') {
    console.warn(`Supabase is using placeholder credentials. Please update them in lib/supabase.ts to connect to your own project.`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);