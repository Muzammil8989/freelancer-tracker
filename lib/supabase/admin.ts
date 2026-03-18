import { createClient } from '@supabase/supabase-js'

// Uses secret key — bypasses RLS. Only use in server-side API routes.
// Always manually filter by user_id from Clerk.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)
