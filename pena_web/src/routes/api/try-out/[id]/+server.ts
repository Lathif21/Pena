import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { getSessionProfile } from '$lib/supabase/guard.server'

/**
 * Edits a try out's judul, tipe_test, schedule, and target kelas.
 *
 * Same lock as the soal: only while draft. A published try out is visible to
 * students, so moving its schedule or retargeting its kelas underneath them would
 * change the exam they are about to sit — KG unpublishes first. Once the window has
 * closed the lock is permanent, because the results are real.
 */
export async function PATCH({ request, cookies, params }) {
  const profile = await getSessionProfile(cookies)
  if (profile?.role !== 'kepala_guru') throw svelteError(403, 'Tidak diizinkan')

  const { data: tryOut } = await supabaseAdmin
    .from('try_out')
    .select('id, materi_id, status, tipe_test, waktu_buka, durasi_menit, tahun_ajaran_id')
    .eq('id', params.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!tryOut) throw svelteError(404, 'Try out tidak ditemukan')

  const tutup = new Date(tryOut.waktu_buka).getTime() + tryOut.durasi_menit * 60000
  if (tryOut.status === 'published' && Date.now() > tutup) {
    throw svelteError(409, 'Try out sudah selesai — tidak bisa diubah lagi')
  }
  if (tryOut.status === 'published') {
    throw svelteError(409, 'Batalkan publish try out dulu sebelum mengubah jadwal')
  }

  const { judul, tipeTest, waktuBuka, durasiMenit, kelasIds } = await request.json().catch(() => ({}))

  if (!judul?.trim()) throw svelteError(400, 'Judul wajib diisi')
  if (!['biasa', 'pre_test', 'post_test'].includes(tipeTest)) {
    throw svelteError(400, 'Tipe test tidak valid')
  }
  if (!waktuBuka) throw svelteError(400, 'Waktu buka wajib diisi')
  if (!Number.isInteger(durasiMenit) || durasiMenit < 1) {
    throw svelteError(400, 'Durasi minimal 1 menit')
  }
  if (!Array.isArray(kelasIds) || kelasIds.length === 0) {
    throw svelteError(400, 'Pilih minimal satu kelas')
  }

  // One pre_test per mapel — re-checked on edit, ignoring this try out itself.
  if (tipeTest === 'pre_test' && tryOut.tipe_test !== 'pre_test') {
    const { data: materi } = await supabaseAdmin
      .from('materi')
      .select('mapel_id')
      .eq('id', tryOut.materi_id)
      .single()

    const { data: materiSemapel } = await supabaseAdmin
      .from('materi')
      .select('id')
      .eq('mapel_id', materi?.mapel_id)
      .is('deleted_at', null)

    const { data: existing } = await supabaseAdmin
      .from('try_out')
      .select('id')
      .in('materi_id', (materiSemapel ?? []).map((m) => m.id))
      .eq('tipe_test', 'pre_test')
      .eq('tahun_ajaran_id', tryOut.tahun_ajaran_id)
      .neq('id', params.id)
      .is('deleted_at', null)
      .limit(1)

    if ((existing ?? []).length > 0) {
      throw svelteError(409, 'Sudah ada pre-test untuk mapel ini')
    }
  }

  const { error } = await supabaseAdmin
    .from('try_out')
    .update({
      judul: judul.trim(),
      tipe_test: tipeTest,
      waktu_buka: waktuBuka,
      durasi_menit: durasiMenit
    })
    .eq('id', params.id)

  if (error) throw svelteError(400, error.message)

  // Targets are replaced wholesale — simpler than diffing, and the table is a
  // plain join with no history worth keeping.
  const { error: clearError } = await supabaseAdmin
    .from('try_out_kelas')
    .delete()
    .eq('try_out_id', params.id)

  if (clearError) throw svelteError(400, clearError.message)

  const { error: insertError } = await supabaseAdmin
    .from('try_out_kelas')
    .insert(kelasIds.map((kelas_id: string) => ({ try_out_id: params.id, kelas_id })))

  if (insertError) throw svelteError(400, insertError.message)

  return json({ updated: true })
}
