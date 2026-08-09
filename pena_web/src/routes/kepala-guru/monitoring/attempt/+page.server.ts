import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  const { data: tryOut } = await supabase
    .from('try_out')
    .select('id, judul, materi_id, status')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('judul')

  // nama_lengkap ada di profiles, bukan di siswa_detail — embed lewat profile_id
  const { data: attemptData } = await supabase
    .from('attempt')
    .select(`
      id,
      siswa_detail_id,
      try_out_id,
      started_at,
      submitted_at,
      nilai,
      is_active,
      siswa_detail:siswa_detail_id(id, profiles:profile_id(nama_lengkap))
    `)
    .not('try_out_id', 'is', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const attempt = (attemptData ?? []).map((a: any) => ({
    ...a,
    siswa_detail: { nama_lengkap: a.siswa_detail?.profiles?.nama_lengkap ?? '(tanpa nama)' }
  }))

  return {
    ...parentData,
    tryOut: tryOut || [],
    attempt
  }
}
