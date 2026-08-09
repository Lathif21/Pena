import { redirect } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies }) {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw redirect(303, '/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nama_lengkap')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (profile?.role !== 'tentor' && profile?.role !== 'kepala_guru') throw redirect(303, '/login')

  return { user, profile }
}
