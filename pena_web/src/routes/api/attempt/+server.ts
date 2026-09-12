import { pesanRamah } from '$lib/utils/pesan'
import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { getSiswaDetail } from '$lib/supabase/guard.server'
import { autoSubmitExpired } from '$features/question/data/grade.server'

/**
 * Starts an attempt. The window check, the single-attempt rule, and the kelas
 * targeting all run here — the client is never asked and never trusted.
 *
 * Body: { tryOutId } for a try out, or { subMateriId } for latihan.
 */
export async function POST({ request, cookies }) {
  const siswa = await getSiswaDetail(cookies)
  if (!siswa) throw svelteError(403, 'Hanya siswa yang bisa mengerjakan')

  const { tryOutId, subMateriId } = await request.json().catch(() => ({}))
  if (!tryOutId === !subMateriId) {
    throw svelteError(400, 'Kirim salah satu: tryOutId atau subMateriId')
  }

  if (subMateriId) {
    // Latihan: unlimited retries by design, so every start is simply a new attempt.
    const { data: sub } = await supabaseAdmin
      .from('sub_materi')
      .select('id')
      .eq('id', subMateriId)
      .is('deleted_at', null)
      .maybeSingle()

    if (!sub) throw svelteError(404, 'Sub materi tidak ditemukan')

    const { data, error } = await supabaseAdmin
      .from('attempt')
      .insert({
        siswa_detail_id: siswa.id,
        sub_materi_id: subMateriId,
        tahun_ajaran_id: siswa.tahun_ajaran_id,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw svelteError(400, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))
    return json(data)
  }

  await autoSubmitExpired(tryOutId)

  const { data: tryOut } = await supabaseAdmin
    .from('try_out')
    .select('id, waktu_buka, durasi_menit, status')
    .eq('id', tryOutId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .maybeSingle()

  if (!tryOut) throw svelteError(404, 'Try out tidak ditemukan')

  const now = Date.now()
  const buka = new Date(tryOut.waktu_buka).getTime()
  const tutup = buka + tryOut.durasi_menit * 60000

  if (now < buka) throw svelteError(403, 'Try out belum dibuka')
  if (now > tutup) throw svelteError(403, 'Try out sudah ditutup')

  // Targeting: the student's kelas must be among the try out's target kelas.
  const { data: target } = await supabaseAdmin
    .from('try_out_kelas')
    .select('kelas_id')
    .eq('try_out_id', tryOutId)

  const targetIds = (target ?? []).map((t) => t.kelas_id)
  if (targetIds.length > 0) {
    const { data: kelasSiswa } = await supabaseAdmin
      .from('siswa_kelas')
      .select('kelas_id')
      .eq('siswa_detail_id', siswa.id)
      .is('deleted_at', null)

    const punya = (kelasSiswa ?? []).some((k) => targetIds.includes(k.kelas_id))
    if (!punya) throw svelteError(403, 'Try out ini bukan untuk kelas Anda')
  }

  // Single attempt: any active attempt, submitted or not, blocks a second one.
  const { data: existing } = await supabaseAdmin
    .from('attempt')
    .select('id, submitted_at')
    .eq('siswa_detail_id', siswa.id)
    .eq('try_out_id', tryOutId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    if (existing.submitted_at) throw svelteError(409, 'Sudah pernah mengerjakan try out ini')
    return json(existing) // resume the attempt already in progress
  }

  const { data, error } = await supabaseAdmin
    .from('attempt')
    .insert({
      siswa_detail_id: siswa.id,
      try_out_id: tryOutId,
      tahun_ajaran_id: siswa.tahun_ajaran_id,
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw svelteError(400, pesanRamah(error, 'Gagal menyimpan. Coba lagi sebentar.'))
  return json(data)
}
