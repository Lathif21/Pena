import { json, error as svelteError } from '@sveltejs/kit'
import { supabaseAdmin } from '$lib/supabase/admin.server'
import { getSiswaDetail } from '$lib/supabase/guard.server'
import { gradeAttempt } from '$features/question/data/grade.server'

/** The attempt, plus its deadline, verified to belong to the calling student. */
async function loadOwnAttempt(cookies: Parameters<typeof getSiswaDetail>[0], attemptId: string) {
  const siswa = await getSiswaDetail(cookies)
  if (!siswa) throw svelteError(403, 'Hanya siswa yang bisa mengerjakan')

  const { data: attempt } = await supabaseAdmin
    .from('attempt')
    .select('id, siswa_detail_id, try_out_id, sub_materi_id, started_at, submitted_at, is_active')
    .eq('id', attemptId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!attempt) throw svelteError(404, 'Attempt tidak ditemukan')

  // Ownership, not just authentication — otherwise any student could grade another's.
  if (attempt.siswa_detail_id !== siswa.id) throw svelteError(403, 'Bukan attempt Anda')
  if (!attempt.is_active) throw svelteError(409, 'Attempt sudah tidak aktif')

  let deadline = Infinity
  if (attempt.try_out_id) {
    const { data: tryOut } = await supabaseAdmin
      .from('try_out')
      .select('waktu_buka, durasi_menit')
      .eq('id', attempt.try_out_id)
      .single()

    if (tryOut) {
      deadline = Math.min(
        new Date(attempt.started_at).getTime() + tryOut.durasi_menit * 60000,
        new Date(tryOut.waktu_buka).getTime() + tryOut.durasi_menit * 60000
      )
    }
  }

  return { attempt, deadline }
}

/** Saves one answer. Latihan is untimed; a try out past its deadline is refused. */
export async function PATCH({ request, cookies, params }) {
  const { attempt, deadline } = await loadOwnAttempt(cookies, params.id)

  if (attempt.submitted_at) throw svelteError(409, 'Attempt sudah disubmit')
  if (Date.now() > deadline) {
    // Grade what was saved before the deadline rather than silently dropping it.
    await gradeAttempt(attempt.id).catch(() => {})
    throw svelteError(409, 'Waktu sudah habis')
  }

  const { soalId, pilihanId } = await request.json().catch(() => ({}))
  if (!soalId) throw svelteError(400, 'soalId wajib diisi')

  // The soal must belong to this attempt's parent, and the pilihan to that soal.
  // Soal hang off try_out_id (not materi_id) since the soal-per-try-out migration.
  const parentColumn = attempt.try_out_id ? 'try_out_id' : 'sub_materi_id'
  const parentId = attempt.try_out_id ?? attempt.sub_materi_id

  const { data: soal, error: soalError } = await supabaseAdmin
    .from('soal')
    .select('id')
    .eq('id', soalId)
    .eq(parentColumn, parentId)
    .is('deleted_at', null)
    .maybeSingle()

  // Surface a real query failure as a 500 — treating it as "not part of this quiz"
  // is how a dropped column silently turned into every answer being discarded.
  if (soalError) throw svelteError(500, soalError.message)
  if (!soal) throw svelteError(400, 'Soal bukan bagian dari kuis ini')

  if (pilihanId) {
    const { data: pilihan } = await supabaseAdmin
      .from('pilihan_jawaban')
      .select('id')
      .eq('id', pilihanId)
      .eq('soal_id', soalId)
      .is('deleted_at', null)
      .maybeSingle()

    if (!pilihan) throw svelteError(400, 'Pilihan tidak valid untuk soal ini')
  }

  const { error } = await supabaseAdmin
    .from('jawaban_siswa')
    .upsert(
      { attempt_id: attempt.id, soal_id: soalId, pilihan_jawaban_id: pilihanId ?? null },
      { onConflict: 'attempt_id,soal_id' }
    )

  if (error) throw svelteError(400, error.message)
  return json({ saved: true })
}

/** Submits and grades. The nilai is computed here and never accepted from the client. */
export async function POST({ cookies, params }) {
  const { attempt } = await loadOwnAttempt(cookies, params.id)

  if (attempt.submitted_at) throw svelteError(409, 'Attempt sudah disubmit')

  const nilai = await gradeAttempt(attempt.id)
  return json({ nilai })
}
