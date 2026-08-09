import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      nama_lengkap,
      email,
      created_at,
      deleted_at,
      siswa_detail:siswa_detail(id, nis, paket)
    `)
    .eq('role', 'siswa')
    .is('deleted_at', null)
    .order('nama_lengkap')

  if (error) throw svelteError(500, error.message)

  const siswa = (data ?? []).map((profile: any) => ({
    id: profile.id,
    siswa_detail_id: profile.siswa_detail?.[0]?.id || '',
    nama_lengkap: profile.nama_lengkap,
    email: profile.email,
    nis: profile.siswa_detail?.[0]?.nis || '',
    paket: profile.siswa_detail?.[0]?.paket || 'regular',
    created_at: profile.created_at,
    deleted_at: profile.deleted_at
  }))

  return { ...parentData, siswa }
}
