import { createClient } from '@supabase/supabase-js'
let instance = null
export function getSupabase() {
  if (!instance) instance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  return instance
}
