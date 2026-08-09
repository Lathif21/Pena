import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, params, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  const { data: subMateri, error: subMateriError } = await supabase
    .from('sub_materi')
    .select('id, nama, materi_id')
    .eq('id', params.subId)
    .is('deleted_at', null)
    .single()

  if (subMateriError || !subMateri) throw subMateriError || new Error('Sub materi not found')

  const { data: soalData, error: soalError } = await supabase
    .from('soal')
    .select('id, pertanyaan, nomor_urut')
    .eq('sub_materi_id', params.subId)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (soalError) throw soalError

  if (!soalData || soalData.length === 0) {
    return { ...parentData, subMateri, soal: [], attempt: null }
  }

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
      .eq('sub_materi_id', params.subId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()
    attempt = attemptData
  }

  return { ...parentData, subMateri, soal, attempt, siswaDetailId: siswaDetail?.id }
}
