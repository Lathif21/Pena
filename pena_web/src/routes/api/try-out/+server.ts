import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { getSessionProfile } from '$lib/supabase/guard.server'

/**
 * Creates a try out. Kepala guru only.
 *
 * The pre_test rule is "one pre_test per mapel", but a try out hangs off a *materi*,
 * so the check has to walk materi -> mapel -> all materi of that mapel. The previous
 * version compared `materi_id` against a `mapel_id`, which never matched anything and
 * silently allowed duplicates.
 */
export async function POST({ request, cookies }) {
  const profile = await getSessionProfile(cookies)
  if (profile?.role !== 'kepala_guru') throw svelteError(403, 'Tidak diizinkan')

  const { materiId, judul, tipeTest, waktuBuka, durasiMenit, kelasIds } =
    await request.json().catch(() => ({}))

  if (!materiId) throw svelteError(400, 'Materi wajib diisi')
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

  const { data: materi } = await supabaseAdmin
    .from('materi')
    .select('id, mapel_id')
    .eq('id', materiId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!materi) throw svelteError(404, 'Materi tidak ditemukan')

  if (tipeTest === 'pre_test') {
    const { data: materiSemapel } = await supabaseAdmin
      .from('materi')
      .select('id')
      .eq('mapel_id', materi.mapel_id)
      .is('deleted_at', null)

    const materiIds = (materiSemapel ?? []).map((m) => m.id)

    const { data: existing } = await supabaseAdmin
      .from('try_out')
      .select('id')
      .in('materi_id', materiIds)
      .eq('tipe_test', 'pre_test')
      .eq('tahun_ajaran_id', profile.tahun_ajaran_id)
      .is('deleted_at', null)
      .limit(1)

    if ((existing ?? []).length > 0) {
      throw svelteError(409, 'Sudah ada pre-test untuk mapel ini')
    }
  }

  const { data: tryOut, error } = await supabaseAdmin
    .from('try_out')
    .insert({
      materi_id: materiId,
      judul: judul.trim(),
      tipe_test: tipeTest,
      waktu_buka: waktuBuka,
      durasi_menit: durasiMenit,
      tahun_ajaran_id: profile.tahun_ajaran_id,
      status: 'draft'
    })
    .select()
    .single()

  if (error) throw svelteError(400, error.message)

  const { error: kelasError } = await supabaseAdmin
    .from('try_out_kelas')
    .insert(kelasIds.map((kelas_id: string) => ({ try_out_id: tryOut.id, kelas_id })))

  if (kelasError) {
    // Without target kelas nobody can sit it — don't leave a half-made try out.
    await supabaseAdmin.from('try_out').delete().eq('id', tryOut.id)
    throw svelteError(400, kelasError.message)
  }

  return json(tryOut)
}
