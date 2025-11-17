import { createClient } from '@supabase/supabase-js';

// IMPORTANT: The following are placeholder credentials. 
// Replace with your own Supabase project URL and Anon Key.
const supabaseUrl = process.env.SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTU1NjA5NCwiZXhwIjoxOTYxMTMyMDk0fQ.c8P2wK8fVcF9s0a_PA_2z-j3G22I93sB_34Y-4z-5gA';

if (supabaseUrl === 'https://xyzcompany.supabase.co') {
    console.warn(`Supabase is using placeholder credentials. Please update them in lib/supabase.ts to connect to your own project.`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);