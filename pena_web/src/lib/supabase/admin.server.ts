import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

/**
 * Service-role client. Bypasses RLS and can create auth users, so it must never
 * reach the browser — the `.server.ts` suffix makes SvelteKit enforce that.
 * Only use it behind a verified `kepala_guru` check.
 */
export const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})
