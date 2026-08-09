import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, params, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  const { data: tryOut, error: tryOutError } = await supabase
    .from('try_out')
    .select('id, judul, materi_id, waktu_buka, durasi_menit, tipe_test')
    .eq('id', params.id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single()

  if (tryOutError || !tryOut) throw tryOutError || new Error('Try out not found')

  const now = new Date()
  const bukaDt = new Date(tryOut.waktu_buka)
  const tutupDt = new Date(bukaDt.getTime() + tryOut.durasi_menit * 60000)

  if (now < bukaDt) throw new Error('Try out belum dibuka')
  if (now > tutupDt) throw new Error('Try out sudah ditutup')

  const { data: soalData, error: soalError } = await supabase
    .from('soal')
    .select('id, pertanyaan, nomor_urut')
    .eq('materi_id', tryOut.materi_id)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (soalError) throw soalError
  if (!soalData || soalData.length === 0) throw new Error('Try out belum memiliki soal')

  const soalIds = soalData.map(s => s.id)
  const { data: pilihanData, error: pilihanError } = await supabase
    .from('pilihan_jawaban')
    .select('id, soal_id, teks, nomor_urut')
    .in('soal_id', soalIds)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (pilihanError) throw pilihanError

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

  return {
    ...parentData,
    tryOut: {
      ...tryOut,
      waktuBuka: bukaDt.getTime(),
      waktuTutup: tutupDt.getTime()
    },
    soal,
    attempt,
    siswaDetailId: siswaDetail?.id
  }
}
