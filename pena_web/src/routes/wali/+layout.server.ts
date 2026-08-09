import { redirect } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies }) {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw redirect(303, '/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nama_lengkap')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!profile) throw redirect(303, '/auth/login')

  // Only wali_murid can access wali dashboard
  if (profile.role !== 'wali_murid') {
    const dashboardMap: Record<string, string> = {
      kepala_guru: '/kepala-guru/dashboard',
      tentor: '/tentor/dashboard',
      siswa: '/siswa/dashboard'
    }
    throw redirect(303, dashboardMap[profile.role] || '/auth/login')
  }

  return { user, profile }
}
