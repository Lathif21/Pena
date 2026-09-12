import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { signedModuleUrl } from '$features/module/data/module.server'

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

  // Same check as the mapel page: without it a student could read another kelas's
  // modul by typing the ids into the URL.
  const { data: siswaDetail } = await supabase
    .from('siswa_detail')
    .select('id')
    .eq('profile_id', parentData.user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!siswaDetail) throw svelteError(403, 'Data siswa tidak ditemukan')

  const { data: kelasSiswa } = await supabase
    .from('siswa_kelas')
    .select('kelas_id')
    .eq('siswa_detail_id', siswaDetail.id)
    .is('deleted_at', null)

  const kelasIds = (kelasSiswa ?? []).map((k) => k.kelas_id)

  const { data: linked } = kelasIds.length
    ? await supabase
        .from('mapel_kelas')
        .select('kelas_id')
        .eq('mapel_id', params.mapelId)
        .in('kelas_id', kelasIds)
        .limit(1)
    : { data: [] }

  if ((linked ?? []).length === 0) {
    throw svelteError(403, 'Mata pelajaran ini bukan untuk kelas Anda')
  }

  // Siswa hanya boleh melihat modul yang sudah published
  const { data: modul } = await supabase
    .from('module')
    .select('id, storage_path, status')
    .eq('sub_materi_id', params.subId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle()

  if (!modul) throw svelteError(404, 'Modul belum tersedia')

  // PDF ada di filesystem (static/uploads/pdfs), bukan di Supabase Storage.
  const fileUrl = await signedModuleUrl(modul.storage_path)

  const { data: soal } = await supabase
    .from('soal')
    .select('id')
    .eq('sub_materi_id', params.subId)
    .is('deleted_at', null)
    .limit(1)

  return {
    ...parentData,
    subMateri,
    signedUrl: fileUrl,
    hasLatihan: (soal ?? []).length > 0,
    mapelId: params.mapelId,
    materiId: params.materiId
  }
}
