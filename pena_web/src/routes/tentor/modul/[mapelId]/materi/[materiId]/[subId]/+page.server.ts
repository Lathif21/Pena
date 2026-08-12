import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { getModuleUrl } from '$features/module/data/module-url'

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

  // PDF ada di filesystem (static/uploads/pdfs), bukan di Supabase Storage.
  const fileUrl = getModuleUrl(modul.storage_path)

  return {
    ...parentData,
    subMateri,
    signedUrl: fileUrl
  }
}
