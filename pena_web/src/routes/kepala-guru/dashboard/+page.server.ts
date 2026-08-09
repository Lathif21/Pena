import { redirect } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  const counts = await Promise.all([
    supabase.from('mapel').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('kelas').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('siswa_detail').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'tentor').is('deleted_at', null)
  ])

  const [mapel, kelas, siswa, tentor] = counts.map(r => r.count ?? 0)

  return { ...parentData, stats: { mapel, kelas, siswa, tentor } }
}

export const actions = {
  logout: async ({ cookies }) => {
    const supabase = createSupabaseServerClient(cookies)
    await supabase.auth.signOut()
    redirect(303, '/auth/login')
  }
}
