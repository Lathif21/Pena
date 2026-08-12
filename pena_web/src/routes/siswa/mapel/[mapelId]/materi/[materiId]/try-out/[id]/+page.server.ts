import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'
import { autoSubmitExpired } from '$features/question/data/grade.server'

export async function load({ cookies, params, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  // Close out anyone whose timer ran out while the browser was shut.
  await autoSubmitExpired(params.id).catch(() => {})

  const { data: tryOut, error: tryOutError } = await supabase
    .from('try_out')
    .select('id, judul, materi_id, waktu_buka, durasi_menit, tipe_test')
    .eq('id', params.id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single()

  if (tryOutError || !tryOut) throw svelteError(404, 'Try out tidak ditemukan')

  const now = new Date()
  const bukaDt = new Date(tryOut.waktu_buka)
  const tutupDt = new Date(bukaDt.getTime() + tryOut.durasi_menit * 60000)

  const { data: siswaDetailAwal } = await supabase
    .from('siswa_detail')
    .select('id')
    .eq('profile_id', parentData.user.id)
    .is('deleted_at', null)
    .maybeSingle()

  const { data: attemptAwal } = siswaDetailAwal
    ? await supabase
        .from('attempt')
        .select('id, started_at, submitted_at, nilai')
        .eq('siswa_detail_id', siswaDetailAwal.id)
        .eq('try_out_id', params.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle()
    : { data: null }

  const sudahSelesai = !!attemptAwal?.submitted_at
  const belumBuka = now < bukaDt
  const sudahTutup = now > tutupDt

  // The page is reachable in every state so a student can see the schedule, but the
  // soal are only ever queried once the window is open (or after they submitted, for
  // review). Before the start time they are never fetched, so they cannot leak — a
  // client-side hide would have shipped them in the payload.
  if (belumBuka || (sudahTutup && !sudahSelesai)) {
    return {
      ...parentData,
      tryOut: {
        ...tryOut,
        waktuBuka: bukaDt.getTime(),
        waktuTutup: tutupDt.getTime()
      },
      status: belumBuka ? 'belum_buka' : 'terlewat',
      soal: [],
      attempt: null,
      review: null,
      siswaDetailId: siswaDetailAwal?.id
    }
  }

  const { data: soalData, error: soalError } = await supabase
    .from('soal')
    .select('id, pertanyaan, nomor_urut')
    .eq('try_out_id', tryOut.id)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (soalError) throw svelteError(500, soalError.message)
  if (!soalData || soalData.length === 0) throw svelteError(404, 'Try out belum memiliki soal')

  const soalIds = soalData.map(s => s.id)
  const { data: pilihanData, error: pilihanError } = await supabase
    .from('pilihan_jawaban')
    .select('id, soal_id, teks, nomor_urut')
    .in('soal_id', soalIds)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (pilihanError) throw svelteError(500, pilihanError.message)

  const pilihanByQuestionId = new Map<string, any[]>()
  pilihanData?.forEach(p => {
    if (!pilihanByQuestionId.has(p.soal_id)) {
      pilihanByQuestionId.set(p.soal_id, [])
    }
    pilihanByQuestionId.get(p.soal_id)?.push({ id: p.id, teks: p.teks, nomor_urut: p.nomor_urut })
  })

  const soal = soalData.map(s => ({
    id: s.id,
    pertanyaan: s.pertanyaan,
    nomor_urut: s.nomor_urut,
    pilihan: pilihanByQuestionId.get(s.id) || []
  }))

  const { data: siswaDetail } = await supabase
    .from('siswa_detail')
    .select('id')
    .eq('profile_id', parentData.user.id)
    .single()

  let attempt = null
  if (siswaDetail) {
    const { data: attemptData } = await supabase
      .from('attempt')
      .select('id, started_at, submitted_at, nilai')
      .eq('siswa_detail_id', siswaDetail.id)
      .eq('try_out_id', params.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()
    attempt = attemptData
  }

  // Review is only possible after submitting. The key and the student's own answers
  // are fetched only then — sending them earlier would hand over the answers mid-exam.
  let review: { kunciPerSoal: Record<string, string>; jawabanPerSoal: Record<string, string> } | null =
    null

  if (attempt?.submitted_at) {
    const [{ data: kunci }, { data: jawaban }] = await Promise.all([
      supabase
        .from('pilihan_jawaban')
        .select('id, soal_id')
        .in('soal_id', soalIds)
        .eq('is_benar', true)
        .is('deleted_at', null),
      supabase
        .from('jawaban_siswa')
        .select('soal_id, pilihan_jawaban_id')
        .eq('attempt_id', attempt.id)
    ])

    review = {
      kunciPerSoal: Object.fromEntries((kunci ?? []).map((k) => [k.soal_id, k.id])),
      jawabanPerSoal: Object.fromEntries(
        (jawaban ?? [])
          .filter((j) => j.pilihan_jawaban_id)
          .map((j) => [j.soal_id, j.pilihan_jawaban_id as string])
      )
    }
  }

  return {
    ...parentData,
    tryOut: {
      ...tryOut,
      waktuBuka: bukaDt.getTime(),
      waktuTutup: tutupDt.getTime()
    },
    status: 'terbuka',
    soal,
    attempt,
    review,
    siswaDetailId: siswaDetail?.id
  }
}
