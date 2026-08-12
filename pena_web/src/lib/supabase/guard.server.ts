import type { Cookies } from '@sveltejs/kit'
import { createSupabaseServerClient } from './server'

/**
 * Re-checks the caller's role against the database. Form actions are reachable
 * directly, so the layout guard on the page is not authorization on its own —
 * and with no RLS on these tables this check is the only thing enforcing it.
 */
export interface SessionProfile {
  id: string
  role: 'kepala_guru' | 'tentor' | 'siswa' | 'wali_murid'
  tahun_ajaran_id: string
}

/** The authenticated caller's profile, or null. Never trust a role sent by the client. */
export async function getSessionProfile(cookies: Cookies): Promise<SessionProfile | null> {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, tahun_ajaran_id')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  return (profile as SessionProfile) ?? null
}

export async function isKepalaGuru(cookies: Cookies) {
  const profile = await getSessionProfile(cookies)
  return profile?.role === 'kepala_guru'
}

/** Resolves the siswa_detail row for the caller — the identity all attempts hang off. */
export async function getSiswaDetail(cookies: Cookies) {
  const profile = await getSessionProfile(cookies)
  if (profile?.role !== 'siswa') return null

  const supabase = createSupabaseServerClient(cookies)
  const { data } = await supabase
    .from('siswa_detail')
    .select('id, paket')
    .eq('profile_id', profile.id)
    .is('deleted_at', null)
    .maybeSingle()

  return data ? { ...data, tahun_ajaran_id: profile.tahun_ajaran_id } : null
}
