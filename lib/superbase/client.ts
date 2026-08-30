// lib/supabase/client.ts

import { createClient } from '@supabase/supabase-js';

// This is for CLIENT-SIDE (browser) - uses anon key
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default supabaseClient;