import { supabase } from '$lib/supabase/client'

export interface Attempt {
  id: string
  siswa_detail_id: string
  try_out_id: string | null
  sub_materi_id: string | null
  started_at: string
  submitted_at: string | null
  nilai: number | null
  is_active: boolean
}

export async function startAttempt(
  siswaDetailId: string,
  tryOutIdOrSubMateriId: string,
  isTryOut: boolean,
  tahunAjaranId: string
): Promise<Attempt> {
  if (isTryOut) {
    // Check jendela waktu try out
    const { data: tryOut, error: tryOutError } = await supabase
      .from('try_out')
      .select('waktu_buka, durasi_menit')
      .eq('id', tryOutIdOrSubMateriId)
      .single()

    if (tryOutError) throw tryOutError

    const now = new Date()
    const bukaDt = new Date(tryOut.waktu_buka)
    const tutupDt = new Date(bukaDt.getTime() + tryOut.durasi_menit * 60000)

    if (now < bukaDt || now > tutupDt) {
      throw new Error('Try out tidak dalam jendela waktu')
    }

    // Check sudah ada attempt aktif
    const { data: existing } = await supabase
      .from('attempt')
      .select('id')
      .eq('siswa_detail_id', siswaDetailId)
      .eq('try_out_id', tryOutIdOrSubMateriId)
      .eq('is_active', true)
      .is('deleted_at', null)

    if (existing && existing.length > 0) {
      throw new Error('Sudah pernah mengerjakan try out ini')
    }
  }

  const { data: attempt, error } = await supabase
    .from('attempt')
    .insert([{
      siswa_detail_id: siswaDetailId,
      try_out_id: isTryOut ? tryOutIdOrSubMateriId : null,
      sub_materi_id: !isTryOut ? tryOutIdOrSubMateriId : null,
      tahun_ajaran_id: tahunAjaranId,
      started_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) throw error
  return attempt
}

export async function saveJawaban(
  attemptId: string,
  soalId: string,
  pilihanJawabanId: string | null
) {
  const { error } = await supabase
    .from('jawaban_siswa')
    .upsert({
      attempt_id: attemptId,
      soal_id: soalId,
      pilihan_jawaban_id: pilihanJawabanId
    })

  if (error) throw error
}

export async function submitAttempt(attemptId: string): Promise<number> {
  // Get attempt data
  const { data: attempt, error: attemptError } = await supabase
    .from('attempt')
    .select('try_out_id, sub_materi_id')
    .eq('id', attemptId)
    .single()

  if (attemptError) throw attemptError

  // Get all soal for this attempt
  let soalIds: string[] = []
  if (attempt.try_out_id) {
    const { data: tryOut } = await supabase
      .from('try_out')
      .select('materi_id')
      .eq('id', attempt.try_out_id)
      .single()

    if (tryOut) {
      const { data: soal } = await supabase
        .from('soal')
        .select('id')
        .eq('materi_id', tryOut.materi_id)
        .is('deleted_at', null)

      soalIds = soal?.map(s => s.id) || []
    }
  } else if (attempt.sub_materi_id) {
    const { data: soal } = await supabase
      .from('soal')
      .select('id')
      .eq('sub_materi_id', attempt.sub_materi_id)
      .is('deleted_at', null)

    soalIds = soal?.map(s => s.id) || []
  }

  if (soalIds.length === 0) {
    throw new Error('Tidak ada soal')
  }

  // Count correct answers
  const { data: jawaban } = await supabase
    .from('jawaban_siswa')
    .select('soal_id, pilihan_jawaban_id')
    .eq('attempt_id', attemptId)

  if (!jawaban) {
    throw new Error('Gagal mengambil jawaban')
  }

  // Get correct answers
  const { data: pilihanBenar } = await supabase
    .from('pilihan_jawaban')
    .select('id, soal_id')
    .in('soal_id', soalIds)
    .eq('is_benar', true)

  const pilihanBenarMap = new Map<string, string>()
  pilihanBenar?.forEach(p => {
    pilihanBenarMap.set(p.soal_id, p.id)
  })

  let benarCount = 0
  jawaban.forEach(j => {
    if (j.pilihan_jawaban_id === pilihanBenarMap.get(j.soal_id)) {
      benarCount++
    }
  })

  const nilai = Math.ceil((benarCount / soalIds.length) * 100)

  const { error } = await supabase
    .from('attempt')
    .update({
      submitted_at: new Date().toISOString(),
      nilai
    })
    .eq('id', attemptId)

  if (error) throw error

  return nilai
}

export async function resetAttempt(attemptId: string, siswaDetailId: string, tryOutIdOrSubMateriId: string, isTryOut: boolean, tahunAjaranId: string) {
  // Mark old attempt as inactive
  const { error: updateError } = await supabase
    .from('attempt')
    .update({ is_active: false })
    .eq('id', attemptId)

  if (updateError) throw updateError

  // Create new attempt
  const { data: newAttempt, error: newError } = await supabase
    .from('attempt')
    .insert([{
      siswa_detail_id: siswaDetailId,
      try_out_id: isTryOut ? tryOutIdOrSubMateriId : null,
      sub_materi_id: !isTryOut ? tryOutIdOrSubMateriId : null,
      tahun_ajaran_id: tahunAjaranId,
      started_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (newError) throw newError
  return newAttempt
}

export async function getAttempt(attemptId: string): Promise<Attempt | null> {
  const { data, error } = await supabase
    .from('attempt')
    .select('*')
    .eq('id', attemptId)
    .single()

  if (error) throw error
  return data
}

export async function getActiveAttempt(siswaDetailId: string, tryOutIdOrSubMateriId: string, isTryOut: boolean): Promise<Attempt | null> {
  const query = isTryOut
    ? supabase.from('attempt').select('*').eq('siswa_detail_id', siswaDetailId).eq('try_out_id', tryOutIdOrSubMateriId)
    : supabase.from('attempt').select('*').eq('siswa_detail_id', siswaDetailId).eq('sub_materi_id', tryOutIdOrSubMateriId)

  const { data, error } = await query.eq('is_active', true).is('deleted_at', null).single()

  if (error) return null
  return data
}
