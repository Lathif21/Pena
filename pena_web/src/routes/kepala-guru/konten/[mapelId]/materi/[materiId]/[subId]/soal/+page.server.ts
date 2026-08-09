import { error as svelteError } from '@sveltejs/kit'
import { createSupabaseServerClient } from '$lib/supabase/server'

export async function load({ cookies, params, parent }) {
  const supabase = createSupabaseServerClient(cookies)
  const parentData = await parent()

  const { data: subMateri, error: subMateriError } = await supabase
    .from('sub_materi')
    .select('id, nama, nomor_urut, materi_id')
    .eq('id', params.subId)
    .is('deleted_at', null)
    .single()

  if (subMateriError || !subMateri) throw subMateriError || new Error('Sub materi not found')

  const { data: materi, error: materiError } = await supabase
    .from('materi')
    .select('id, nama, mapel_id')
    .eq('id', subMateri.materi_id)
    .is('deleted_at', null)
    .single()

  if (materiError || !materi) throw materiError || new Error('Materi not found')

  const { data: mapel, error: mapelError } = await supabase
    .from('mapel')
    .select('id, nama')
    .eq('id', materi.mapel_id)
    .is('deleted_at', null)
    .single()

  if (mapelError || !mapel) throw mapelError || new Error('Mapel not found')

  const { data: soalData, error: soalError } = await supabase
    .from('soal')
    .select('id, pertanyaan, nomor_urut')
    .eq('sub_materi_id', params.subId)
    .is('deleted_at', null)
    .order('nomor_urut')

  if (soalError) throw soalError

  const soalIds = soalData?.map(s => s.id) || []
  let pilihanData: any[] = []

  if (soalIds.length > 0) {
    const { data, error } = await supabase
      .from('pilihan_jawaban')
      .select('id, soal_id, teks, is_benar, nomor_urut')
      .in('soal_id', soalIds)
      .is('deleted_at', null)
      .order('nomor_urut')

    if (error) throw svelteError(500, error.message)
    pilihanData = data || []
  }

  const pilihanByQuestionId = new Map<string, any[]>()
  pilihanData.forEach(p => {
    if (!pilihanByQuestionId.has(p.soal_id)) {
      pilihanByQuestionId.set(p.soal_id, [])
    }
    pilihanByQuestionId.get(p.soal_id)?.push({
      id: p.id,
      teks: p.teks,
      is_benar: p.is_benar,
      nomor_urut: p.nomor_urut
    })
  })

  const soal = (soalData || []).map(s => ({
    id: s.id,
    pertanyaan: s.pertanyaan,
    nomor_urut: s.nomor_urut,
    pilihan: pilihanByQuestionId.get(s.id) || []
  }))

  return {
    ...parentData,
    mapel,
    materi,
    subMateri,
    soal
  }
}
