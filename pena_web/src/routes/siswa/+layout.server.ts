import { redirect } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies }) {
  const supabase = createSupabaseServerClient(cookies)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw redirect(303, '/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nama_lengkap, tahun_ajaran_id')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (!profile) throw redirect(303, '/auth/login')

  // Only siswa can access the siswa dashboard
  if (profile.role !== 'siswa') {
    const dashboardMap: Record<string, string> = {
      kepala_guru: '/kepala-guru/dashboard',
      tentor: '/tentor/dashboard',
      wali_murid: '/wali/dashboard'
    }
    throw redirect(303, dashboardMap[profile.role] || '/auth/login')
  }

  return { user: { ...user, ...profile }, profile }
}
