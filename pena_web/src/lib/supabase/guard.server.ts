import type { Cookies } from '@sveltejs/kit'
import { createSupabaseServerClient } from './server'

/**
 * Re-checks the caller's role against the database. Form actions are reachable
 * directly, so the layout guard on the page is not authorization on its own —
 * and with no RLS on these tables this check is the only thing enforcing it.
 */
export async function isKepalaGuru(cookies: Cookies) {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  return profile?.role === 'kepala_guru'
}
