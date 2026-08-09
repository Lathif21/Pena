import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, params, parent }) {
  const parentData = await parent()
  const supabase = createSupabaseServerClient(cookies)

  const { data: subMateri } = await supabase
    .from('sub_materi')
    .select('id, nama, materi_id')
    .eq('id', params.subId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!subMateri) throw svelteError(404, 'Sub materi tidak ditemukan')

  // Tentor melihat konten yang sama dengan siswa: hanya yang published
  const { data: modul } = await supabase
    .from('module')
    .select('id, storage_path, status')
    .eq('sub_materi_id', params.subId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle()

  if (!modul) throw svelteError(404, 'Modul belum tersedia')

  const { data: signed } = await supabase.storage
    .from('modul-pdf')
    .createSignedUrl(modul.storage_path, 3600)

  return {
    ...parentData,
    subMateri,
    signedUrl: signed?.signedUrl ?? ''
  }
}
