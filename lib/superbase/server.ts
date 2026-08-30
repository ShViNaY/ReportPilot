// lib/supabase/server.ts

import { createClient } from '@supabase/supabase-js';

// This is for SERVER-SIDE (backend API routes) - uses service role key
// Service role key has full access, bypasses RLS
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabaseServer;