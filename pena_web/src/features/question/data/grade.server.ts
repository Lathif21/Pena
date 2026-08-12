import { supabaseAdmin } from '$lib/supabase/admin.server'

/**
 * Scoring lives here, on the server, and never in the browser. A client that can
 * compute its own nilai can also POST any nilai it likes.
 *
 * Score is (benar / total) * 100 rounded UP — 2 of 3 is 67, not 66.
 */
export function hitungNilai(benar: number, total: number) {
  if (total <= 0) return 0
  return Math.ceil((benar / total) * 100)
}

/** Every soal belonging to an attempt's parent (materi for try out, sub materi for latihan). */
async function soalIdsForAttempt(attempt: { try_out_id: string | null; sub_materi_id: string | null }) {
  if (attempt.try_out_id) {
    const { data } = await supabaseAdmin
      .from('soal')
      .select('id')
      .eq('try_out_id', attempt.try_out_id)
      .is('deleted_at', null)

    return (data ?? []).map((s) => s.id)
  }

  const { data } = await supabaseAdmin
    .from('soal')
    .select('id')
    .eq('sub_materi_id', attempt.sub_materi_id)
    .is('deleted_at', null)

  return (data ?? []).map((s) => s.id)
}

/**
 * Grades an attempt from the answers already stored, and stamps submitted_at.
 * Idempotent: an attempt that is already submitted keeps its original nilai, so a
 * late auto-submit can never overwrite a real submission.
 */
export async function gradeAttempt(attemptId: string) {
  const { data: attempt } = await supabaseAdmin
    .from('attempt')
    .select('id, try_out_id, sub_materi_id, submitted_at, nilai')
    .eq('id', attemptId)
    .single()

  if (!attempt) throw new Error('Attempt tidak ditemukan')
  if (attempt.submitted_at) return attempt.nilai ?? 0

  const soalIds = await soalIdsForAttempt(attempt)
  if (soalIds.length === 0) throw new Error('Tidak ada soal untuk dinilai')

  const { data: kunci } = await supabaseAdmin
    .from('pilihan_jawaban')
    .select('id, soal_id')
    .in('soal_id', soalIds)
    .eq('is_benar', true)
    .is('deleted_at', null)

  const kunciPerSoal = new Map((kunci ?? []).map((k) => [k.soal_id, k.id]))

  const { data: jawaban } = await supabaseAdmin
    .from('jawaban_siswa')
    .select('soal_id, pilihan_jawaban_id')
    .eq('attempt_id', attemptId)

  // Only count answers to soal that still belong to this attempt — a soal deleted
  // mid-attempt must not inflate the score.
  const valid = new Set(soalIds)
  let benar = 0
  for (const j of jawaban ?? []) {
    if (!valid.has(j.soal_id)) continue
    if (j.pilihan_jawaban_id && kunciPerSoal.get(j.soal_id) === j.pilihan_jawaban_id) benar++
  }

  const nilai = hitungNilai(benar, soalIds.length)

  const { error } = await supabaseAdmin
    .from('attempt')
    .update({ submitted_at: new Date().toISOString(), nilai })
    .eq('id', attemptId)
    .is('submitted_at', null)

  if (error) throw new Error(error.message)

  return nilai
}

/**
 * Closes out attempts whose window has passed. Called whenever try out state is read,
 * which is what makes "student closed the browser" still end in a graded attempt
 * without needing a scheduled job.
 */
export async function autoSubmitExpired(tryOutId: string) {
  const { data: tryOut } = await supabaseAdmin
    .from('try_out')
    .select('waktu_buka, durasi_menit')
    .eq('id', tryOutId)
    .single()

  if (!tryOut) return

  const { data: stale } = await supabaseAdmin
    .from('attempt')
    .select('id, started_at')
    .eq('try_out_id', tryOutId)
    .eq('is_active', true)
    .is('submitted_at', null)
    .is('deleted_at', null)

  const tutupTryOut = new Date(tryOut.waktu_buka).getTime() + tryOut.durasi_menit * 60000
  const now = Date.now()

  for (const attempt of stale ?? []) {
    // The deadline is whichever comes first: the student's own timer, or the
    // try out window closing.
    const deadline = Math.min(
      new Date(attempt.started_at).getTime() + tryOut.durasi_menit * 60000,
      tutupTryOut
    )
    if (now >= deadline) await gradeAttempt(attempt.id).catch(() => {})
  }
}

/**
 * A student who never attempted a closed try out scores 0, not null — a missing
 * attempt is a real outcome and null would quietly drop them from averages.
 */
export async function nilaiTryOut(tryOutId: string, siswaDetailId: string) {
  const { data: attempt } = await supabaseAdmin
    .from('attempt')
    .select('nilai, submitted_at')
    .eq('try_out_id', tryOutId)
    .eq('siswa_detail_id', siswaDetailId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (attempt?.submitted_at) return attempt.nilai ?? 0

  const { data: tryOut } = await supabaseAdmin
    .from('try_out')
    .select('waktu_buka, durasi_menit')
    .eq('id', tryOutId)
    .single()

  if (!tryOut) return null

  const tutup = new Date(tryOut.waktu_buka).getTime() + tryOut.durasi_menit * 60000
  return Date.now() > tutup ? 0 : null
}
